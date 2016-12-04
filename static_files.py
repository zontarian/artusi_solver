from tornado import web
import sys
import os
import logging

class NoCacheMixin(object):
    def set_extra_headers(self, path):
        self.set_header("Cache-control", "no-cache")


class StaticFileHandler(web.StaticFileHandler, NoCacheMixin):

    def clear(self):
        """Resets all headers and content for this response."""
        web.StaticFileHandler.clear(self)
        self.set_header("Server", 'EasysycServer2')

    '''
    this is needed by py_Freeze
    '''
    def initialize(self, path, default_filename=None):
        web.StaticFileHandler.initialize(self, path, default_filename)
        self.root = path
        self.default_filename = default_filename
        #  logging.info("NEW INITIALIZE: root is {}".format(self.root))

        #  IF WE ARE RUNNING AS FREEZED, do some dirty hack
        if getattr(sys, 'frozen', False):
            datadir = os.path.dirname(sys.executable)
            #  logging.info("DATA DIR = {}".format(datadir))
            #  assume all static resources are in subdir static of current dir
            #  these files MUST be copied there by an external process
            #  as well as index.html MUST be copied by hand to datadir
            self.root = os.path.join(datadir, 'static')

            # logging.info("POST NEW INITIALIZE: root is {}".format(self.root))


class IndexHandler(web.RequestHandler, NoCacheMixin):
    def get(self):
        self.render("index_angular.html")


