
import argparse
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

SCREENSHOT_SIZES = {
    'iphone5': (640, 1136)
}

def print_stack_trace(exception, msg="Exception"):
    logging.error("{}: {}".format(msg, str(exception)))
    import traceback, sys
    logging.error("-"*60)
    traceback.print_exc(file=sys.stdout)
    logging.error("-"*60)


class ArtusiUploadHandler(web.RequestHandler, NoCacheMixin):


    def _add_cors_headers(self):
        # CORS header
        self.set_header('Access-Control-Allow-Origin', '*')

    def create_error_response(self, msg):
        self.set_status(412)
        self._add_cors_headers()
        response = {
            'returnValue': 'ERR',
            'errorCode': msg,
        }
        logging.error("HTTP Error 412: {}".format(msg))
        return response

    #@gen.coroutine
    def post(self):
        try:
            logging.debug("Handling upload of Artusi image")
            as_url = self.get_argument('as_url', False) == 'true'
            img_data = self.request.files['image_file'][0]['body']
            show_step = self.get_argument('show_step', False) == 'true'

            if not img_data:
                imgfile_b64 = self.get_json_argument('img_data', required=True)
                img_data = base64.b64decode(imgfile_b64)

            if not img_data or len(img_data) == 0:
                self.write(self.create_error_response('no image found'))
                return

            # now do solving.. if image is of the correct size.
            nparr = np.fromstring(img_data, np.uint8)
            logging.debug("Image on server, now scanning")

            #
            filename = tempfile.NamedTemporaryFile(dir=TEMP_DIR, suffix=".jpg", delete=False)
            text_file = open(filename.name, "wb")
            text_file.write(img_data)
            text_file.close()
            logging.info("File downloaded written to {}".format(filename.name))


            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            logging.info("Read image {}".format(img_np.shape))

            (h, w, _) = img_np.shape
            sw, sh = SCREENSHOT_SIZES['iphone5']
            ratio = h / w
            if w != sw:
                _h = int(ratio * sw)
                if _h != sh and abs(_h - sh) > 4:
                # if h != sh or w != sw:
                    logging.error("Screen size is {},{} resized to {},{} different from {},{}. Ratio is {}".format(
                        w, h, sw, _h, sw, sh, ratio
                    ))
                    self.write(self.create_error_response('screenshot of wrong size '))
                    return

            dim = (sw, sh)
            img_np = cv2.resize(img_np, dim, interpolation=cv2.INTER_CUBIC)

            import time
            # time.sleep(2)

            # now do solve..
            image = solver.solve_artusi(img_np, True, show_step=show_step, no_console=True)

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
                loop.call_later(15, self.delete_temp_file, filename)
            else:
                self.set_header("Content-type", "image/jpeg")
                self.set_header("Content-Disposition", "attachment; filename=artusi_solution.jpg")
                self.set_status(200)
                self._add_cors_headers()

                self.write(img_data)
            return

        except Exception as e:
            print_stack_trace(e,'Generic error solving')
            self.write(self.create_error_response("Generic error: {}".format(e)))

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

logger = logging.getLogger(__package__)

if __name__=='__main__':
    parser = argparse.ArgumentParser(description='HTTP Server')
    parser.add_argument('port', type=int, help='Listening port for HTTP Server')
    parser.add_argument('ip', help='HTTP Server IP')
    args = parser.parse_args()

    # setup logger
    log_level = logging.DEBUG
    logger.setLevel(log_level)

    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)

    formatter = None
    try:
        # noinspection PyUnresolvedReferences
        import colorlog
        formatter = colorlog.ColoredFormatter(
            "%(log_color)s%(levelname)-6s%(reset)s %(cyan)s%(name)-10s %(white)s%(message)s",
            log_colors={
                'DEBUG': 'blue',
                'INFO': 'green',
                'WARNING': 'yellow',
                'ERROR': 'red',
                'CRITICAL': 'red',
                'EXCEPTION': 'red',
            }
        )
    except ImportError:
        formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(name)s - %(message)s",
        )
    finally:
        console_handler.setFormatter(formatter)

    logger.addHandler(console_handler)

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