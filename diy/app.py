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
        result = ( yield tornado.gen.Task(users.find_one, {"name":name}) )[0][0]

        if not result:
            yield tornado.gen.Task(users.save, {"name":name, "password":password})
            self.set_secure_cookie("username", name)
            self.write(json.dumps({"result":1, "message": u"注册成功"}))
        else:
            self.write(json.dumps({"result":0, "message": u"注册失败：用户已存在"}))
        self.finish()

class LoginHandler(BaseHandler):
    def get(self):
        self.render('login.html')

    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        name = self.get_argument("name", "")
        password = self.get_argument("password", "")
        users = self.application.test3.users
        result = ( yield tornado.gen.Task(users.find_one, {"name":name, "password":password}) )[0][0]

        if result:
            self.set_secure_cookie("username", name)
            self.write(json.dumps({"result":1, "message": u"登陆成功"}))
        else:
            self.write(json.dumps({"result":0, "message": u"登陆失败：用户不存在或密码不匹配"}))
        self.finish()

class LogoutHandler(BaseHandler):
    def get(self):
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
            'debug' : True,
            'template_path' : os.path.dirname(os.path.realpath(__file__))+'/templates',
            'static_path' : os.path.dirname(os.path.realpath(__file__))+'/static',
            'cookie_secret' : base64.b64encode(uuid.uuid4().bytes+uuid.uuid4().bytes),
            'login_url' : '/login'
        }
        tornado.web.Application.__init__(self, handlers, **settings)

class ShareHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        online.append(self.callback)
        print 'someone comes to play!'

    def on_close(self):
        online.remove(self.callback)
        print 'someone leaved'

    def on_message(self, info):
        for i in online:
            if (i != self.callback):
                i(info)

    def callback(self, info):
        print info
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
