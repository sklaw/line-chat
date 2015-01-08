import tornado.ioloop
import tornado.web
import tornado.httpserver
import pymongo
import os
import asyncmongo
import tornado.gen
import time

s = ""
ioIns = tornado.ioloop.IOLoop.instance()

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [(r"/.*", WordHandler)]
        self.test3 = asyncmongo.Client(pool_id="mydb",
                                        host=os.environ['OPENSHIFT_MONGODB_DB_HOST'],
                                        port=int(os.environ['OPENSHIFT_MONGODB_DB_PORT']),
                                        dbname='test3', 
                                        dbuser=os.environ['OPENSHIFT_MONGODB_DB_USERNAME'], 
                                        dbpass=os.environ['OPENSHIFT_MONGODB_DB_PASSWORD'])
        tornado.web.Application.__init__(self, handlers)

class WordHandler(tornado.web.RequestHandler):

    @tornado.web.asynchronous
    @tornado.gen.engine
    def get(self):
        self.cl_1 = self.application.test3.cl_1
        ( yield tornado.gen.Task(self.cl_1.insert, {"name":"fuck", "def":"have sex with"}) )
        tmp = ( yield tornado.gen.Task(self.cl_1.find_one, {"name":"fuck"}) )[0][0]
        del tmp["_id"]
        self.write(tmp)
        self.write(s)
        self.finish()

def call_back():
    global s
    global ioIns

    tfloat = ioIns.time()

    h = time.gmtime(tfloat)
    s += "\n"
    s += str(h)

    tfloat += 10
    ioIns.call_at(tfloat, call_back)

def main(address):
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(8080, address)
    tfloat = ioIns.time()
    tfloat += 10
    ioIns.call_at(tfloat, call_back)
    ioIns.start()

if __name__ == "__main__":
    address = "127.0.0.1"
    main(address)
