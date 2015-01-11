# -*- coding: utf-8 -*-
import tornado.ioloop
import tornado.web
import tornado.httpserver
import tornado.websocket
import pymongo
import os
import asyncmongo
import tornado.gen
import time
import base64, uuid
import json

online = []
publicPaint = []

class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("username")

class WelcomeHandler(BaseHandler):
    @tornado.web.authenticated
    @tornado.web.asynchronous
    @tornado.gen.engine
    def get(self):
        self.render("welcome.html", name=self.get_secure_cookie("username"))
        return;

class SignupHandler(BaseHandler):
    
    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        name = self.get_argument("name", "")
        password = self.get_argument("password", "")
        users = self.application.test3.users
        dbtalk = yield tornado.gen.Task(users.find_one, {"name":name})

        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":0, "message": u"注册:find_one:数据库对话出错！我也不知道为什么！不要慌！打电话给我！18814091187"}))
            self.finish()
        
        result = dbtalk.args[0]
        
        if not result:
            dbtalk = yield tornado.gen.Task(users.save, {"name":name, "password":password})
            if dbtalk.kwargs['error']:
                self.write(json.dumps({"result":0, "message": u"注册:save:数据库对话出错！我也不知道为什么！不要慌！打电话给我！18814091187"}))
                self.finish()
            self.set_secure_cookie("username", name)
            self.write(json.dumps({"result":1, "message": u"注册成功"}))
            online.append(name)
        else:
            self.write(json.dumps({"result":0, "message": u"注册失败：用户已存在"}))
        self.finish()

class LoginHandler(BaseHandler):
    def get(self):
        self.render('login.html')
        #print "login.html"

    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        name = self.get_argument("name", "")
        password = self.get_argument("password", "")
        users = self.application.test3.users
        dbtalk = yield tornado.gen.Task(users.find_one, {"name":name, "password":password})

        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":0, "message": u"登陆:数据库对话出错！我也不知道为什么！不要慌！打电话给我！18814091187"}))
        else:
            result = dbtalk.args[0]
            if result:
                if name in online:
                    self.write(json.dumps({"result":0, "message": u"在线中"}))
                else:
                    online.append(name)
                    self.set_secure_cookie("username", name)
                    self.write(json.dumps({"result":1, "message": u"登陆成功"}))
            else:
                self.write(json.dumps({"result":0, "message": u"登陆失败：用户不存在或密码不匹配"}))
        
        self.finish()

class LogoutHandler(BaseHandler):
    def get(self):
        online.remove(self.get_secure_cookie("username"))
        self.clear_cookie("username")
        self.redirect('/')


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [(r"/", WelcomeHandler),
                    (r"/login", LoginHandler),
                    (r'/logout', LogoutHandler),
                    (r'/signup', SignupHandler),
                    (r'/share', ShareHandler)]
        
        self.test3 = asyncmongo.Client(pool_id="mydb",
                                       host=os.environ['OPENSHIFT_MONGODB_DB_HOST'],
                                        port=int(os.environ['OPENSHIFT_MONGODB_DB_PORT']),
       	                                dbname='test3', 
                                        dbuser=os.environ['OPENSHIFT_MONGODB_DB_USERNAME'], 
                                        dbpass=os.environ['OPENSHIFT_MONGODB_DB_PASSWORD'])

        

        
        settings = {
            'template_path' : os.path.dirname(os.path.realpath(__file__))+'/templates',
            'static_path' : os.path.dirname(os.path.realpath(__file__))+'/static',
            'cookie_secret' : base64.b64encode(uuid.uuid4().bytes+uuid.uuid4().bytes),
            'login_url' : '/login'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

class ShareHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
        publicPaint.append(self.callback)
        print 'someone comes to play!'

    def on_close(self):
        publicPaint.remove(self.callback)
        print 'someone leaved'

    @tornado.web.asynchronous
    @tornado.gen.engine
    def on_message(self, info):
        #print info
        infoParsed = json.loads(info)

        if infoParsed["type"] == "lines":
            self.doc["lines"] += infoParsed["data"]
            dbtalk = yield tornado.gen.Task(self.users.update, {"_id":self.doc["_id"]}, self.doc, True)
            #print dbtalk
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:cant save lines:数据库对话出错！打电话给我好吗！18814091187", 'type': "message"}))
            

            for i in publicPaint:
                if i != self.callback:
                    i(info)
        elif infoParsed["type"] == "name":
            print "data type: name, value: "+infoParsed["data"]
            
            self.users = self.application.test3.users
            dbtalk = yield tornado.gen.Task(self.users.find_one, {"name":infoParsed["data"]})
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:get self doc:数据库对话出错！打电话给我好吗！18814091187", 'type': "message"}))
                self.close()
            else:
                self.doc = dbtalk.args[0]
                if "lines" in self.doc:
                    print "this users have lines, gonna send them"
                    #print self.doc["lines"]
                    self.write_message(json.dumps({'data': self.doc["lines"], 'type':"lines"}))
                else:
                    self.doc["lines"] = []
        elif infoParsed["type"] == "action":
            if infoParsed["data"] == "clear":
                self.doc["lines"] = []
                dbtalk = yield tornado.gen.Task(self.users.update, {"_id":self.doc["_id"]}, self.doc, True)
                #print dbtalk
                if dbtalk.kwargs['error']:
                    self.write_message(json.dumps({'data': "shareHandler:on_message:cant clear lines:数据库对话出错！打电话给我好吗！18814091187", 'type': "message"}))
                else:
                    self.write_message(json.dumps({'data':"clear", 'type':"action"}))

    def callback(self, info):
        self.write_message(info)
    

def main(address):
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(8080, address)
    #tfloat = ioIns.time()
    #tfloat += 3600
    #ioIns.call_at(tfloat, call_back)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    address = "127.0.0.1"
    main(address)
