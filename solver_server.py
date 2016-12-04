from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
import threading
import argparse
import re
import json
import cgi
import cv2
import numpy as np
import base64
import logging
import tempfile
from tornado import web, ioloop

from static_files import StaticFileHandler, IndexHandler, NoCacheMixin
from config import *

import solver
import scanner

class ArtusiUploadHandler(web.RequestHandler, NoCacheMixin):


    def _add_cors_headers(self):
        # CORS header
        self.set_header('Access-Control-Allow-Origin', '*')

    #@gen.coroutine
    def post(self):
        try:
            as_url = self.get_argument('as_url', False) == 'true'
            img_data = self.request.files['image_file'][0]['body']
            if not img_data:
                imgfile_b64 = self.get_json_argument('img_data', required=True)
                img_data = base64.b64decode(imgfile_b64)

            if not img_data or len(img_data) == 0:
                self.set_status(412)
                self._add_cors_headers()

                response = {
                    'returnValue': 'ERR',
                    'errorCode': 'error decoding img',
                }
                logging.error("HTTP Error 412: image null ")
                self.write(response)
                return

            # now do solving.. if image is of the correct size.
            nparr = np.fromstring(img_data, np.uint8)
            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            logging.info("Read image {}".format(img_np.shape))

            # now do solve..
            image = solver.solve_artusi(img_np, True, show_step=True)

            retval, buf = img_data = cv2.imencode('.jpg', image)
            if not retval:
                raise Exception("Error encoding image")
            img_data = buf.tostring()

            if as_url:
                # save to temporary file
                filename = tempfile.NamedTemporaryFile(dir=TEMP_DIR, suffix=".jpg", delete=False)
                cv2.imwrite(filename.name, image)
                logging.info("File written as temp to {}".format(filename.name))
                response = {
                    'url': '/static/tmp/{}'.format(os.path.basename(filename.name)),
                }
                self.set_header("Content-type", "application/json")
                self.write(response)
                #delete after X minutes
                loop = ioloop.IOLoop.current()
                loop.call_later(5, self.delete_temp_file, filename)
            else:
                self.set_header("Content-type", "image/jpeg")
                self.set_header("Content-Disposition", "attachment; filename=artusi_solution.jpg")
                self.set_status(200)
                self._add_cors_headers()

                self.write(img_data)
            return

        except Exception as e:
            response = {
                'returnValue': 'ERR',
                'errorCode': 'error decoding img:{}'.format(e),
            }
            logging.error("HTTP Error 412:  exception {}".format(e))
            self.write(response)

    def delete_temp_file(self, file):
        logging.info("deleting {}".format(file.name))
        os.unlink(file.name)

url_patterns = [
    (r'/', IndexHandler),
    (r'/static/(.*)', StaticFileHandler, {'path': STATIC_DIR}),
    #(r'/ws', WSHandler),
    (r'/artusi/upload', ArtusiUploadHandler)

    #(r'/api/system/start', StartHandler),
]


if __name__=='__main__':
    parser = argparse.ArgumentParser(description='HTTP Server')
    parser.add_argument('port', type=int, help='Listening port for HTTP Server')
    parser.add_argument('ip', help='HTTP Server IP')
    args = parser.parse_args()


    settings = {
        'template_path': STATIC_DIR,
        # 'er_tcp_port': int(options.tcp_port),
        'er_http_port': int(args.port),
        # 'autoreload': True
        'debug': True
    }
    # http server for api
    application = web.Application(url_patterns, **settings)
    #application.listen(options.http_port)
    from tornado.httpserver import HTTPServer
    httpserver = HTTPServer(application)
    httpserver.listen(args.port, args.ip)

    loop = ioloop.IOLoop.current()
    # loop.spawn_callback(poller)
    loop.start()

    # server = SimpleHttpServer(args.ip, args.port)
    # print('HTTP Server Running...........')
    # server.start()
    # server.waitForThread()