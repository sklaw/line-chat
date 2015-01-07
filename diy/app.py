import tornado.ioloop
import tornado.web
import tornado.httpserver
import pymongo
import os



class Application(tornado.web.Application):
    def __init__(self):
        handlers = [(r"/(\w+)", WordHandler)]
        conn = pymongo.Connection(os.environ['OPENSHIFT_MONGODB_DB_URL'])
        self.test3 = conn.test3
        self.cl_1 = self.test3.cl_1
        self.cl_1.insert({"name":"fuck", "def":"have sex with"})
        tornado.web.Application.__init__(self, handlers)


class WordHandler(tornado.web.RequestHandler):
    def get(self, word):
        tmp = self.application.cl_1.find_one({"name":"fuck"})
        del tmp["_id"]
        self.write(tmp)

def main(address):
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(8080, address)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    address = "127.0.0.1"
    main(address)
