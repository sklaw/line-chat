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
import uuid

import sys

f = open(os.environ['OPENSHIFT_LOG_DIR']+'mylog.log', 'w')


class Unbuffered(object):
   def __init__(self, stream):
       self.stream = stream
   def write(self, data):
       self.stream.write(data)
       self.stream.flush()
   def __getattr__(self, attr):
       return getattr(self.stream, attr)

sys.stdout = Unbuffered(f)

online = []
callbackpool = {}


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
            dbtalk = yield tornado.gen.Task(users.insert, {"name":name, "password":password})
            if dbtalk.kwargs['error']:
                self.write(json.dumps({"result":0, "message": u"注册:insert:数据库对话出错！我也不知道为什么！不要慌！打电话给我！18814091187"}))
                self.finish()
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
        dbtalk = yield tornado.gen.Task(users.find_one, {"name":name, "password":password})

        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":0, "message": u"登陆:数据库对话出错！我也不知道为什么！不要慌！打电话给我！18814091187"}))
        else:
            result = dbtalk.args[0]
            if result:
                self.set_secure_cookie("username", name)
                self.write(json.dumps({"result":1, "message": u"登陆成功"}))
            else:
                self.write(json.dumps({"result":0, "message": u"登陆失败：用户不存在或密码不匹配"}))
        
        self.finish()

class LogoutHandler(BaseHandler):
    def get(self):
        
        self.clear_cookie("username")

class UserExistHandler(BaseHandler):
    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        name = self.get_argument("name", "")
        users = self.application.test3.users
        dbtalk = yield tornado.gen.Task(users.find_one, {"name":name})
        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":-1}))
        else:
            result = dbtalk.args[0]
            if result:
                self.write(json.dumps({"result":1}))
            else:
                self.write(json.dumps({"result":0}))
        
        self.finish()






@tornado.web.asynchronous
@tornado.gen.engine
def namecookieHandler(self, info, infoParsed):
    begin = infoParsed['data'].index('"')
    cookie = infoParsed['data'][begin+1:-1]
    name = tornado.web.decode_signed_value(self.application.settings["cookie_secret"], 'username', cookie)
    self.name = name;
    if not name:
        print "the name cookie cant be decoded."
        self.callback(json.dumps({'data': "closeConnection", 'type': "action"}))
        self.close()
        return

    self.users = self.application.test3.users
    dbtalk = yield tornado.gen.Task(self.users.find_one, {"name":name})
    if dbtalk.kwargs['error']:
        self.write_message(json.dumps({'data': "shareHandler:on_message:get self doc:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
        self.close()
        return
    


    self.doc = dbtalk.args[0]
    self.canvasname = ""
    print name+' comes to play!'


    if name not in callbackpool:
        print name+" come clean!"
        callbackpool[name] = self
    else:
        print name+" come dirty! now clear the former login-er."
        callbackpool[name].callback(json.dumps({'data': "closeConnection", 'type': "action"}))
        callbackpool[name] = self





    

    if 'canvasimin' not in  self.doc:
        self.doc['canvasimin'] = []
    if 'canvasicreate' not in self.doc:
        self.doc['canvasicreate'] = []
    obj = {}
    obj['imin'] = self.doc['canvasimin']
    obj['icreate'] = self.doc['canvasicreate']
    
    self.write_message(json.dumps({'data': obj, 'type':"canvaslist"}))





    

class ShareHandler(tornado.websocket.WebSocketHandler):
    def check_origin(self, origin):
        return True

    def open(self):
       	self.handlerId = uuid.uuid4()
        self.name = ""
        print "wb open:"
        print self.handlerId

    def on_close(self):
        

        print "wb close:"
        if callbackpool[self.name] == self:
            print self.name+" leaved decently"
            del callbackpool[self.name]
        else:
            print self.name+" leaved ugly"
        

    @tornado.web.asynchronous
    @tornado.gen.engine
    def on_message(self, info):
        infoParsed = json.loads(info)

        print "on_message----type:"+infoParsed["type"]
        if infoParsed["type"] == "namecookie":
            namecookieHandler(self, info, infoParsed)
        elif infoParsed["type"] == "lines":
            print "received a lines from user:"+self.name+" in canvas:"+self.canvasname

            #pack the line to linepatch
            linepatch = {}
            linepatch['data'] = infoParsed["data"]
            linepatch['owner'] = self.name
            linepatch['canvasname'] = self.canvasname


            self.canvaspool = self.application.test3.canvaspool
            dbtalk = yield tornado.gen.Task(self.canvaspool.find_one, {"canvasname":self.canvasname})
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:save a linepatch:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                self.close()
                return
        
            result = dbtalk.args[0]
            if not result:
                self.write_message(json.dumps({'data': "this canvas has been deleted. refresh the page please", 'type': "errormessage"}))
                self.write_message(json.dumps({'data': "gotoslash", 'type': "action"}))
                return
            #print linepatch

            self.linepool = self.application.test3.linepool
            dbtalk = yield tornado.gen.Task(self.linepool.insert, linepatch)
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:save a linepatch:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                self.close()
                return

            
            peopleToNotify = self.canvasinfo['members'][:]
            peopleToNotify.append(self.canvasinfo['creator'])

            print peopleToNotify

            for i in peopleToNotify:
                if i == self.name:
                    continue
                if i in callbackpool:
                    if callbackpool[i].canvasname == self.canvasname:
                        print "this linepatch is dispatching to:"+i
                        callbackpool[i].callback(json.dumps({'data':linepatch ,'type':"linepatch"}))



        elif infoParsed["type"] == "action":
            if infoParsed["data"] == "clear":
                print "clear request from "+self.name+", we will clear this person's lines in canvas:"+self.canvasname
                self.linepool = self.application.test3.linepool
                dbtalk = yield tornado.gen.Task(self.linepool.remove, {"canvasname":self.canvasname, "owner":self.name})
                if dbtalk.kwargs['error']:
                    self.write_message(json.dumps({'data': "shareHandler:on_message:cant clear one's lines:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                    self.close()
                    return

                peopleToNotify = self.canvasinfo['members'][:]
                peopleToNotify.append(self.canvasinfo['creator'])
                print peopleToNotify
                for i in peopleToNotify:
                    if i in callbackpool:
                        if callbackpool[i].canvasname == self.canvasname:
                            print "this clear order is dispatching to:"+i
                            callbackpool[i].callback(json.dumps({'data':self.name ,'type':"clearsomeone"}))
            elif infoParsed['data'] == "deleteCanvas":
                creator = self.canvasinfo['creator']
                print self.name+' is trying to delete a canvas named '+self.canvasname+' belonging to '+creator
                if (self.name != creator):
                    return
                peopleToNotify = self.canvasinfo['members'][:]
                peopleToNotify.append(self.canvasinfo['creator'])
                print peopleToNotify
                self.users = self.application.test3.users
                for i in peopleToNotify:
                    dbtalk = yield tornado.gen.Task(self.users.find_one, {"name":i})
                    if dbtalk.kwargs['error']:
                        print "FALTAL ERROR: when deleting a canvas, tring to notify a user, the dbtalk failed 1. the user may still have the canvas in the canvaslist. this is fatal."
                    else:
                        pdoc = dbtalk.args[0]
                        print pdoc

                        if i == creator:
                            pdoc["canvasamount"] = pdoc["canvasamount"]-1
                            pdoc["canvasicreate"].remove(self.canvasname)
                        else:
                            pdoc['canvasimin'].remove(self.canvasname)
                        
                        print pdoc
                        dbtalk = yield tornado.gen.Task(self.users.update, {"_id":pdoc["_id"]}, pdoc, True)
                        if dbtalk.kwargs['error']:
                            print "FALTAL ERROR: when deleting a canvas, tring to notify a user, the dbtalk failed 2. the user may still have the canvas in the canvaslist. this is fatal."
                
                self.canvaspool = self.application.test3.canvaspool
                dbtalk = yield tornado.gen.Task(self.canvaspool.remove, {"canvasname":self.canvasname})
                if dbtalk.kwargs['error']:
                    print "FALTAL ERROR: when deleting a canvas, tring to delete it in the canvaspool, the dbtalk failed . the canvaspool may still have the canvas. this is fatal."
                    return

                self.linepool = self.application.test3.linepool
                dbtalk = yield tornado.gen.Task(self.linepool.remove, {"canvasname":self.canvasname})
                if dbtalk.kwargs['error']:
                    print "FALTAL ERROR: when deleting a canvas, tring to delete all the lines, the dbtalk failed . the lines may still be in the linepool. this is fatal."
                    return
                self.write_message(json.dumps({'data':"gotoslash", 'type': "action"}))

        elif infoParsed['type'] == 'notifynewcanvas':
            self.canvasname = infoParsed['data']
            self.canvaspool = self.application.test3.canvaspool
            dbtalk = yield tornado.gen.Task(self.canvaspool.find_one, {"canvasname":self.canvasname})
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:get info of a canvas:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                self.close()
                return
            self.canvasinfo = dbtalk.args[0]
            peopleToNotify = self.canvasinfo['members'][:]
            peopleToNotify.append(self.canvasinfo['creator'])
            print peopleToNotify
            for i in peopleToNotify:
                if i in callbackpool:
                    if callbackpool[i].canvasname == "":
                        print "this canvaslist update order is dispatching to:"+i
                        callbackpool[i].callback(json.dumps({'data': self.canvasname, 'type':"addcanvasoption"}))

        elif infoParsed['type'] == 'entercanvas':
            self.canvasname = infoParsed['data']
            print self.name+" request canvas : "+ self.canvasname

            self.linepool = self.application.test3.linepool
            dbtalk = yield tornado.gen.Task(self.linepool.find, {"canvasname":self.canvasname})
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:get all lines of a canvas:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                self.close()
                return
            linespack = dbtalk.args[0]
            

            

            self.canvaspool = self.application.test3.canvaspool
            dbtalk = yield tornado.gen.Task(self.canvaspool.find_one, {"canvasname":self.canvasname})
            if dbtalk.kwargs['error']:
                self.write_message(json.dumps({'data': "shareHandler:on_message:get info of a canvas:数据库对话出错！打电话给我好吗！18814091187", 'type': "errormessage"}))
                self.close()
                return
            self.canvasinfo = dbtalk.args[0]

            if not self.canvasinfo:
            	self.write_message(json.dumps({'data': "this canvas has been deleted. refresh the page please", 'type': "errormessage"}))
                return
            
            del self.canvasinfo['_id']
            
            for i in linespack:
                del i['_id']

            self.write_message(json.dumps({'canvasinfo':self.canvasinfo ,'linespack':linespack, 'type':"canvaspack"}))

    def callback(self, info):
        self.write_message(info)
    


class qualifyCanvasCreationHandler(BaseHandler):
    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        name = self.get_argument("name", "")
        users = self.application.test3.users
        dbtalk = yield tornado.gen.Task(users.find_one, {"name":name})
        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":-1}))
            self.finish()
            return;

        result = dbtalk.args[0]
        print "checking "+name+"'s canvasamount:"
        if 'canvasamount' not in result:
            print "this user has never created a canvas."
            result['canvasamount'] = 0
            dbtalk = yield tornado.gen.Task(users.update, {"_id":result["_id"]}, result, True)
            if dbtalk.kwargs['error']:
                print "qualifyCanvasCreationHandler:add canvasamount to user data failed."
                self.write_message(json.dumps({"result":-1}))
            else:
                self.write(json.dumps({"result":1}))
            
        elif result['canvasamount'] < 5:
            print "this user now have "+str(result['canvasamount'])+" canvases. it's cool"
            self.write(json.dumps({"result":1}))
        else:
            print "this user now have "+str(result['canvasamount'])+" canvases. not cool"
            self.write(json.dumps({"result":0}))
        
        self.finish()


class createCanvasHandler(BaseHandler):
    @tornado.web.asynchronous
    @tornado.gen.engine
    def post(self):
        creator = self.get_argument("creator", "")
        canvasname = self.get_argument("canvasname", "")
        invitedList = json.loads(self.get_argument("invitedList", ""))
        print "creator:"+creator
        print "invitedList:",invitedList
        print "canvasname:",canvasname

        self.canvaspool = self.application.test3.canvaspool
        dbtalk = yield tornado.gen.Task(self.canvaspool.find_one, {"canvasname":canvasname})
        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":-1}))
            self.finish()
            return
        
        result = dbtalk.args[0]
        if result:
            print "this canvas name has been used."
            self.write(json.dumps({"result":0}))
            self.finish()
            return

        canvas = {}
        canvas["canvasname"] = canvasname
        canvas["creator"] = creator
        canvas["members"] = invitedList
        dbtalk = yield tornado.gen.Task(self.canvaspool.insert, canvas)
        if dbtalk.kwargs['error']:
            self.write(json.dumps({"result":-1}))
            self.finish()
            return
        print "the canvas has been in the canvaspool."
        peopleToNotify = canvas["members"]
        peopleToNotify.append(canvas["creator"])
        print "people to notify:", peopleToNotify


        users = self.application.test3.users
        
        for p in peopleToNotify:
            dbtalk = yield tornado.gen.Task(users.find_one, {"name":p})
            if dbtalk.kwargs['error']:
                self.write(json.dumps({"result":-1}))
                self.finish()
                return
            doc = dbtalk.args[0]
            #print doc
            if p == creator:
                if "canvasicreate" not in doc:
                    doc['canvasicreate'] = []
                doc['canvasicreate'].append(canvasname)
                if 'canvasamount' not in doc:
                    doc['canvasamount'] = 0
                doc['canvasamount'] = doc['canvasamount']+1
            else:
                if "canvasimin" not in doc:
                    doc['canvasimin'] = []
                doc['canvasimin'].append(canvasname)

                

            dbtalk = yield tornado.gen.Task(users.update, {"_id":doc["_id"]}, doc, True)
            if dbtalk.kwargs['error']:
                self.write(json.dumps({"result":-1}))
                self.finish()
                return


        
        self.write(json.dumps({"result":1}))
        self.finish()



class Application(tornado.web.Application):
    def __init__(self):
        handlers = [(r"/", WelcomeHandler),
                    (r"/login", LoginHandler),
                    (r'/logout', LogoutHandler),
                    (r'/signup', SignupHandler),
                    (r'/share', ShareHandler),
                    (r'/userexist', UserExistHandler),
                    (r'/qualifyCanvasCreation', qualifyCanvasCreationHandler),
                    (r'/createCanvas', createCanvasHandler)]
        
        self.test3 = asyncmongo.Client(pool_id="mydb",
                                       host=os.environ['OPENSHIFT_MONGODB_DB_HOST'],
                                        port=int(os.environ['OPENSHIFT_MONGODB_DB_PORT']),
                                        dbname='test3', 
                                        dbuser=os.environ['OPENSHIFT_MONGODB_DB_USERNAME'], 
                                        dbpass=os.environ['OPENSHIFT_MONGODB_DB_PASSWORD'])

        self.test3 = asyncmongo.Client(pool_id="mydb",
                                        host="localhost",
                                        port=27017,
                                        dbname='test3')
  
        
        settings = {
            'debug' : True,
            'template_path' : os.path.dirname(os.path.realpath(__file__))+'/templates',
            'static_path' : os.path.dirname(os.path.realpath(__file__))+'/static',
            'cookie_secret' : base64.b64encode(uuid.uuid4().bytes+uuid.uuid4().bytes),
            'login_url' : '/login'
        }
        tornado.web.Application.__init__(self, handlers, **settings)


def main(address):


    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(8080, address)
    #http_server.listen(8080)
    #tfloat = ioIns.time()
    #tfloat += 3600
    #ioIns.call_at(tfloat, call_back)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    address = "127.0.0.1"
    main(address)


