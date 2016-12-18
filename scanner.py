'''
Scan a Artusi Cooking time image

'''
import cv2
import numpy as np
import imutils
import sys
import cv2
import argparse
import logging
import os


TRAINING_IMAGES = [
    "IMG_1370.PNG",
    "IMG_1376.PNG",
    "IMG_1385.PNG",
    "IMG_1387.PNG",
    "IMG_1389.PNG",
]

ASSETS_DIR = 'assets'

IMAGE = 'IMG_1387.PNG'

START_X = 20
START_Y = 85

WIDTH = 595
HEIGHT = WIDTH

END_X = START_X + WIDTH
END_Y = START_Y + HEIGHT

logger = logging.getLogger(__package__)

def print_stack_trace(exception, msg="Exception"):
    logging.error("{}: {}".format(msg, str(exception)))
    import traceback, sys
    logging.error("-"*60)
    traceback.print_exc(file=sys.stdout)
    logging.error("-"*60)
# senape1 = np.uint8([[[70,185,194 ]]])
# hsv_senape1 = cv2.cvtColor(senape1,cv2.COLOR_BGR2HSV)
# senape2 = np.uint8([[[66,222,224 ]]])
# hsv_senape2 = cv2.cvtColor(senape2,cv2.COLOR_BGR2HSV)
# print(hsv_senape1, hsv_senape2)
#
# aqua1 = np.uint8([[[181,173,107]]])
# hsv_aqua1 = cv2.cvtColor(aqua1,cv2.COLOR_BGR2HSV)
# print("Aqua 1 {}".format(str(hsv_aqua1)))
#
# pink = np.uint8([[[215,124,243 ]]])
# hsv_pink = cv2.cvtColor(pink,cv2.COLOR_BGR2HSV)
# print(hsv_pink)
# sys.exti(1)


class ShapeDetector:
    def __init__(self):
        pass

    def detect(self, c):
        # initialize the shape name and approximate the contour
        shape = "unidentified"
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.04 * peri, True)
        # if the shape is a triangle, it will have 3 vertices
        if len(approx) == 3:
            shape = "triangle"

        # if the shape has 4 vertices, it is either a square or
        # a rectangle
        elif len(approx) == 4:
            # compute the bounding box of the contour and use the
            # bounding box to compute the aspect ratio
            (x, y, w, h) = cv2.boundingRect(approx)
            ar = w / float(h)

            # a square will have an aspect ratio that is approximately
            # equal to one, otherwise, the shape is a rectangle
            shape = "square" if ar >= 0.95 and ar <= 1.05 else "rectangle"

        # if the shape is a pentagon, it will have 5 vertices
        elif len(approx) == 5:
            shape = "pentagon"

        # otherwise, we assume the shape is a circle
        else:
            shape = "circle"

        # return the name of the shape
        return shape


def showImage(img, delay=0, title=''):
    try:
        cv2.imshow(title, img)
        if delay <0:
            delay = 10
        cv2.waitKey(delay * 1000)
        cv2.destroyAllWindows()
    except Exception as e:
        logger.error("Cannot display image {}: {}".format(title, e))


def showImages(imgs, delay=0, title=''):
    try:
        i = 0
        offset = 50
        for img in imgs:
            dims = img.shape
            # print("X={}".format(str(dims)))
            w = dims[1]
            window_name = "{}:{}".format(title, i)
            cv2.imshow(window_name, img)
            cv2.moveWindow(window_name, offset+w*i, 0)
            i += 1

        if delay < 0:
            delay = 10
        cv2.waitKey(delay * 1000)
        cv2.destroyAllWindows()

    except Exception as e:
        logger.error("Cannot display image {}: {}".format(title, e))
        print_stack_trace(e,"Error displaying images")

def create_matrix(numeric=False):
    matrix = []
    for i in range(8):
        row = []
        for j in range(8):
            if numeric:
                row.append(0)
            else:
                row.append(' ')
        matrix.append(row)

    return matrix

def print_matrix(matrix, header=None, numeric=False):
    print("")
    if header:
        print(" -- {} -- ".format(header))
    if numeric:
        print("     0  1  2  3  4  5  6  7 ")
        print("   -------------------------")
    else:
        print("  01234567 ")

    for r in range(8):
        if numeric:
            print("{} | ".format(r), end="")
        else:
            print("{} ".format(r), end="")
        for c in range(8):
            cell = matrix[r][c]
            if numeric:
                print("{:>2} ".format(cell), end='')
            else:
                if cell is None:
                    print('-', end='')
                elif cell == ' ':
                    print('.', end='')
                else:
                    print(cell, end='')
        print('')
    if numeric:
        print("   =========================\n")
    else:
        print("  ========\n")


class ElementScannerForArtusi:

    def __init__(self, image):
        self.image = image
        self.result = self.image.copy()
        self.hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)
        self.debug = False
        self.matrix = create_matrix()
        self.scaling = 1
        self.masked = None

    def crop_image(self, startx=START_X, starty=START_Y, endx=END_X, endy=END_Y):
        # crop
        self.image = self.image[starty:endy, startx:endx]
        self.result = self.image.copy()
        self.hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)

    def set_debug(self, debug):
        self.debug = debug

    def image_for_unkown(self):
        if self.masked is not None:
            return self.masked.copy()

        return self.hsv.copy()

    def scan(self):
        self.scan_for(ElementScannerForArtusi.AQUA_SQUARE_CROSS)
        self.scan_for(ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON)
        self.scan_for(ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON)
        self.scan_for(ElementScannerForArtusi.SENAPE_SQUARE_FORK)
        # self.scan_for(ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT)

        self.scan_for(ElementScannerForArtusi.BACKGROUND_SQUARE)
        self.fill_missing()


    PINK_SQUARE_BIG_SPOON = 1
    GREEN_SQUARE_SMALL_SPOON = 2
    AQUA_SQUARE_CROSS = 3
    SENAPE_SQUARE_FORK = 4
    _SQUARE_TRUE_ELEMENTS = 6 #upper bound
    UNKNOWN_SQUARE_ELEMENT = 7
    BACKGROUND_SQUARE  = 8

    # don't go above 9. 10 and above are reserved for auto-discovery

    UNKNOWN_ELEMENT_LETTER = '?'
    BACKGROUND_LETTER = '_'

    def _scan_params_for(self, param):
        if param == ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON:
            lower = np.array([145, 50, 50])
            upper = np.array([165, 255, 255])
            letter = 'k'
            template = 'spoon.png'
        elif param == ElementScannerForArtusi.AQUA_SQUARE_CROSS:
            lower = np.array([90, 80, 80])
            upper = np.array([110, 255, 255])
            letter = 'x'
            template = 'cross.png'
        elif param == ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON:
            # lower = np.array([110, 50, 50])
            # upper = np.array([130, 255, 255])
            lower = np.array([60, 50, 50])
            upper = np.array([80, 255, 255])
            letter = 'c'
            template = 'coffee_spoon.png'
        elif param == ElementScannerForArtusi.SENAPE_SQUARE_FORK:
            # lower = np.array([20, 80, 80])
            # upper = np.array([40, 255, 255])
            lower = np.array([24, 80, 80])
            upper = np.array([32, 255, 255])
            letter = 'f'
            template = 'fork.png'
        elif param == ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT:
            lower = 0
            upper = 0
            letter = ElementScannerForArtusi.UNKNOWN_ELEMENT_LETTER
            template = None
        elif param == ElementScannerForArtusi.BACKGROUND_SQUARE:
            lower = np.array([0, 20, 10])
            upper = np.array([20, 200, 220])
            letter = ' '
            template = None
        elif param >= 10:
            # background 36,47,84
            # background 33,65,80
            lower = np.array([param - 10, 20, 10])
            upper = np.array([param + 10, 200, 220])
            letter = ElementScannerForArtusi.UNKNOWN_ELEMENT_LETTER
            template = None
        else:
            raise ValueError("unknown param {} for _scanParamsFor!".format(param))

        return lower, upper, letter, template

    def _get_all_known_params(self):
        params = []
        params.append(self._scan_params_for(self.AQUA_SQUARE_CROSS))
        params.append(self._scan_params_for(self.PINK_SQUARE_BIG_SPOON))
        params.append(self._scan_params_for(self.GREEN_SQUARE_SMALL_SPOON))
        params.append(self._scan_params_for(self.SENAPE_SQUARE_FORK))
        # params.append(self._scan_params_for(self.AQUA_SQUARE_CROSS))
        return params

    def scan_for(self, scan_type, debug=False, debug_unknown=False):
        # convert to hsv
        if scan_type == ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT:
            mat = self.scan_for_unknown(debug, debug_unknown)
            for r in range(8):
                for c in range(8):
                    if mat[r][c] == self.UNKNOWN_ELEMENT_LETTER:
                        self.matrix[r][c] = self.UNKNOWN_ELEMENT_LETTER
            return

        (lower, upper, letter, template_file) = self._scan_params_for(scan_type)

        if scan_type < ElementScannerForArtusi._SQUARE_TRUE_ELEMENTS:
            template = cv2.imread(os.path.join(ASSETS_DIR, template_file), cv2.IMREAD_GRAYSCALE)

            self.scan_for_template(template,letter, False)
            if self.debug or debug:
                print_matrix(self.matrix,"Result for {}".format(scan_type))

            return

        # else do scan..

        # blurred = cv2.GaussianBlur(self.hsv, (13, 13), 0)

        scan_image = cv2.inRange(self.hsv, lower, upper)
        if self.debug:
            showImage(scan_image, 0, 'Range {}'.format(scan_type))

        # monte carlo scatter
        matrix = create_matrix()
        import random
        square = int(WIDTH / 8)
        for r in range(8):
            for c in range(8):
                # scatter 100 point
                hit = 0
                for i in range(100):
                    x = square * c + random.randint(0, square)
                    y = square * r + random.randint(0, square)
                    b = scan_image[y, x]
                    if b > 240:
                        hit += 1
                        # print(h,s,v)
                if hit > 60:
                    matrix[r][c] = ElementScannerForArtusi.BACKGROUND_LETTER
                    self.matrix[r][c] = ElementScannerForArtusi.BACKGROUND_LETTER

        print_matrix(matrix, 'SCATTER for lower {}'.format(lower))
        return


        cnts = cv2.findContours(scan_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        ccnts = cnts[0] if imutils.is_cv2() else cnts[1]
        ratio = 1
        # ccnts = cnts[0]
        sd = ShapeDetector()
        # loop over the contours
        canvas = self.result
        scratch = self.image.copy()
        for c in ccnts:
            # compute the center of the contour, then detect the name of the
            # shape using only the contour
            M = cv2.moments(c)
            try:
                cX = int((M["m10"] / M["m00"]) * ratio)
                cY = int((M["m01"] / M["m00"]) * ratio)
            except ZeroDivisionError:
                continue

            area = M["m00"]# .GetCentralMoment(moments, 0, 0)
            if area < 500:
                continue

            shape = sd.detect(c)

            # multiply the contour (x, y)-coordinates by the resize ratio,
            # then draw the contours and the name of the shape on the image
            c = c.astype("float")
            c *= ratio
            c = c.astype("int")
            cv2.drawContours(scratch, [c], -1, (0, 255, 0), 2)
            cv2.putText(scratch, "{} a:{}".format(shape, area), (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, (255, 255, 255), 2)

            # get center of image ..
            #average..
            square = WIDTH / 8
            c = int(cX / square)
            r = int(cY / square)
            if self.debug:
                logging.debug("Center of image is {} {} a:{}-> {} {}  ".format(cX, cY, area, r, c))
            self.matrix[r][c] = letter

        # self.result = canvas
        if self.debug:
            print_matrix(self.matrix,"Result for {}".format(scan_type))
            showImage(scratch, 0, 'Result {}'.format(scan_type))


    def scan_for_background(self, debug=False):
        step = 5
        showImage(self.hsv,0,'ss')
        for i in range(int(180/step)):
            self.scan_for(10+i*step, debug, True)


    def scan_for_unknown(self, debug=False, deep_debug=False):
        step = 5
        delta = 20
        unknown_matrix = create_matrix(numeric=True)
        good_iterations = 0
        max_hits = 0
        knwon_params = self._get_all_known_params()

        debug_images = deep_debug
        # debug_images = True

        for i in range(int(180/step)):
            lower = np.array([i * step       ,  80, 80])
            upper = np.array([i * step +delta, 255, 255])
            if debug:
                logging.debug("")
                logging.debug("Scanning in range HSV {}..{}".format(i*step,str( i* step +delta)))
            skip = False
            for (l, u, _, _) in knwon_params:
                if lower[0] >= l[0] and upper[0] <= u[0]:
                    #if testing interval is already coverd completely by a known parameter
                    skip = True
                    break

            if skip:
                continue

            letter = self.UNKNOWN_ELEMENT_LETTER

            debug_image = self.image_for_unkown() #self.hsv.copy()

            blurred = cv2.GaussianBlur(debug_image, (13,13), 0)

            # if lower[0] == 115:
            #     kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8,8))
            #     blurred = cv2.erode(blurred, kernel, iterations=1)
            #     blurred = cv2.dilate(blurred, kernel, iterations = 2)


            # scan_image = cv2.inRange(self.hsv, lower, upper)
            scan_image = cv2.inRange(blurred, lower, upper)
            # if debug_images:
            #     showImage(scan_image, 0, 'Range unknown {}'.format(lower))

            cnts = cv2.findContours(scan_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            ccnts = cnts[0] if imutils.is_cv2() else cnts[1]
            ratio = 1
            # ccnts = cnts[0]
            sd = ShapeDetector()
            # loop over the contours
            canvas = self.result.copy()
            count = 0
            overlapped = 0
            matrix = create_matrix(numeric=False)
            for c in ccnts:
                # compute the center of the contour, then detect the name of the
                # shape using only the contour
                M = cv2.moments(c)
                try:
                    cX = int((M["m10"] / M["m00"]) * ratio)
                    cY = int((M["m01"] / M["m00"]) * ratio)
                except ZeroDivisionError:
                    continue

                area = M["m00"]# .GetCentralMoment(moments, 0, 0)

                shape = sd.detect(c)

                #average..
                square = WIDTH / 8
                col = int(cX / square)
                row = int(cY / square)

                area_min = 2000
                area_max = 10000

                # if lower[0] == 115:
                #     area_min = 100

                if area < area_min or area > area_max:
                    # if debug_images:
                    #     logging.debug("Center of SKIPPED image is {} {} a:{}-> {} {}  ".format(cX, cY, area, row, col))
                    continue

                c = c.astype("float")
                c *= ratio
                c = c.astype("int")
                cv2.drawContours(debug_image, [c], -1, (0, 255, 0), 2)
                cv2.putText(debug_image, "{}".format(shape), (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (255, 255, 255), 2)

                prev = self.matrix[row][col]
                if debug_images:
                    logging.debug("Center of image is {} {} a:{}-> {} {} prev: {}  ".format(cX, cY, area, row, col, prev))
                if prev and prev != ' ':
                    overlapped += 1
                count += 1
                matrix[row][col] = letter

            # at the end of loop over shapes, add 1 to identified cell (we can have two or more path in cell!)

            if 0 < count < 55 and overlapped < 25:

                good_iterations += 1

                for r in range(8):
                    for c in range(8):
                        if matrix[r][c] == letter:
                            unknown_matrix[r][c] += 1
                            if unknown_matrix[r][c] > max_hits:
                                max_hits = unknown_matrix[r][c]
                # print_matrix(unknown_matrix, 'unkown for {}'.format(lower), numeric=True)
                if debug or debug_images:
                    logging.debug("Scan for unknown with bounds {}:{} gives {}/{} shapes".format(lower, upper, count, overlapped))
                    print_matrix(unknown_matrix, 'unknown for {}'.format(lower), numeric=True)
                    print_matrix(matrix)

                if debug_images:
                    # showImage(scan_image,  5, 'Range unknown {}'.format(lower))
                    # showImage(debug_image, 5, title="Step")
                    showImages((debug_image,scan_image, ),  0, 'Range unknown {}'.format(lower))

            else:
                logging.debug("Skipping debug because count={} and overlapped={}".format(count, overlapped))

        if debug:
            logging.debug("Good iterations {}".format(good_iterations))
            print_matrix(unknown_matrix, 'before thresholding')

    # clean up unknown matrix
        # threshold = int(good_iterations * 0.75)
        # for r in range(8):
        #     for c in range(8):
        #         cell = unknown_matrix[r][c]
        #         if cell > 0 and cell < threshold:
        #             unknown_matrix[r][c] = 0
        matrix = create_matrix()
        for r in range(8):
            for c in range(8):
                if unknown_matrix[r][c] >= 1: #== max_hits:
                    matrix[r][c] = letter

        return matrix

    def mask_out_known_squares(self):
        masked = self.hsv.copy()

        square = WIDTH / 8
        w = int(WIDTH / 8)

        for r in range(8):
            for c in range(8):
                l = self.matrix[r][c]
                if l and l != '.' and l != ' ':
                    # mask out
                    x = w * c
                    y = w * r
                    pt = (int(x), int(y))
                    cv2.rectangle(masked, pt, (pt[0] + w, pt[1] + w), (0, 0, 0), -2)

        #showImage(masked,0, 'masked')
        self.masked = masked
        return masked


    def fill_missing(self):

        for r in range(8):
            for c in range(8):
                l = self.matrix[r][c]
                if l is None or l == '.' or l == ' ':
                    self.matrix[r][c] = ElementScannerForArtusi.UNKNOWN_ELEMENT_LETTER

        for r in range(8):
            for c in range(8):
                if self.matrix[r][c] == ElementScannerForArtusi.BACKGROUND_LETTER:
                    self.matrix[r][c] = ' '


    def scan_for_template(self, template, letter, debug):
        img_gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        # template_Gray = cv2.cvtColor(template_image, cv2.COLOR_BGR2GRAY)
        w, h = template.shape[:2]

        # methods = ['cv2.TM_CCOEFF', 'cv2.TM_CCOEFF_NORMED', 'cv2.TM_CCORR',
        #            'cv2.TM_CCORR_NORMED', 'cv2.TM_SQDIFF', 'cv2.TM_SQDIFF_NORMED']
        # methods = ['cv2.TM_CCOEFF_NORMED']
        # for meth  in methods:

        scratch = self.image.copy()
        # method = eval(meth)
        res = cv2.matchTemplate(img_gray, template, cv2.TM_CCOEFF_NORMED)
        threshold = 0.5
        loc = np.where( res >= threshold)

        matrix = create_matrix()
        square = WIDTH / 8

        for pt in zip(*loc[::-1]):
            cv2.rectangle(scratch, pt, (pt[0] + w, pt[1] + h), (0,0,255), 8)
            x = pt[0] + w/2
            y = pt[1] + w/2

            col = int(x / square)
            row = int(y / square)
            # logging.debug("ASsiging template to row, col {} {}".format(row,col))
            matrix[row][col] = letter
            self.matrix[row][col] = letter

        if debug:
            print_matrix(matrix, 'template!')
            showImage(scratch, 0, 'For template')

        return matrix

        # return scratch


    def create_image(self, image, startx, starty, endx, endy, matrix):
        img = image.copy()
        # now draw
        width = ((endx - startx) / 8)
        overlay = image.copy()
        for r in range(8):
            for c in range(8):
                let = matrix[r][c]
                if not let or let == ' ':
                    continue
                x = int(startx + c * width)
                y = int(starty + r * width)
                # get center
                if let == ElementScannerForArtusi.UNKNOWN_ELEMENT_LETTER:
                    cv2.rectangle(overlay, (x, y), (int(x+width), int(y+width)), (0, 255, 0), -1)
                else:
                    cv2.rectangle(img, (x, y), (int(x+width), int(y+width)), (0, 255, 0), 2)
                    cv2.putText(img, "{}".format(let), (int(x+width/3-4), int(y+2*width/3)), cv2.FONT_HERSHEY_SIMPLEX,
                            2, (0, 0, 255), 2)

        cv2.addWeighted(overlay, 0.5, img, 1 - 0.5, 0, img)

        return img

    def superimpose_solution(self, image, start_row, start_col, end_row, end_col, start_x, start_y, width):
        img = image.copy()
        # now draw
        x = int(start_x + start_col * width)
        y = int(start_y + start_row * width)
        width = int(width)
        # get center
        cv2.rectangle(img, (x,y),(x+width, y+width),(0,255,0), 10)

        x = int(start_x + end_col * width)
        y = int(start_y + end_row * width)
        # get center
        cv2.rectangle(img, (x,y),(x+width, y+width),(0,255,0), 10)

        # cv2.putText(img, "{}".format(let), (int(x+width/3-4), int(y+2*width/3)), cv2.FONT_HERSHEY_SIMPLEX,
        #             2, (255, 255, 255), 2)

        return img

if __name__ == '__main__':

    log_level = logging.DEBUG

    # setup logger
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

    parser = argparse.ArgumentParser(formatter_class=argparse.RawTextHelpFormatter)

    parser.add_argument('--test', action='store_true', default=False, help="test")

    parser.add_argument('--debug', action='store_true', default=False, help="debug showing images")
    parser.add_argument('--debug-unknown', action='store_true', default=False, help="debug unkown auto-detection")

    parser.add_argument('--show', action='store_true', default=False, help="show final image")
    parser.add_argument('images', metavar='image_file', type=argparse.FileType('r'), nargs='*',
                        help='image files to scan for Artusi final touch')

    parser.add_argument('--template', metavar='template', type=argparse.FileType('r'),
                        help='template image file')

    match_template = False
    args = parser.parse_args()

    files = args.images
    if args.test:
        files = TRAINING_IMAGES
    else:
        ff = []
        for f in files:
            ff.append(f.name)
        files = ff

    if not files:
        parser.print_help()
        sys.exit(1)

    if args.template:
        match_template = True

    logging.debug("Images {}, debug={}, debug_unknown={}".format(files, args.debug, args.debug_unknown))

    for f in files:
        # detect
        img = cv2.imread(f)

        # check size
        (h, w, _) = img.shape
        sw, sh = (640,1136)
        ratio = h / w
        if w != sw:
            _h = int(ratio * sw)
            if _h != sh and abs(_h - sh) > 4:
                # if h != sh or w != sw:
                logging.error("Screen size is {},{} resized to {},{} different from {},{}. Ratio is {}".format(
                    w, h, sw, _h, sw, sh, ratio
                ))
                continue

        dim = (sw, sh)
        scaling = h / sh
        logging.debug("Scaling  {}".format(scaling))

        img = cv2.resize(img, dim, interpolation=cv2.INTER_CUBIC)

        # crop
        image = img[START_Y:END_Y, START_X:END_X]

        scanner = ElementScannerForArtusi(image)
        if args.debug:
            scanner.set_debug(True)
        if abs(scaling - 1) > 0.1:
            scanner.scaling = scaling

        # scanner.scan()
        scanner.scan_for(ElementScannerForArtusi.AQUA_SQUARE_CROSS)
        scanner.scan_for(ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON)
        scanner.scan_for(ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON)
        scanner.scan_for(ElementScannerForArtusi.SENAPE_SQUARE_FORK)
        # scanner.scan_for_background(True)
        scanner.scan_for(ElementScannerForArtusi.BACKGROUND_SQUARE)
        scanner.fill_missing()

        # sys.exit(0)
        # scanner.scan_for(ElementScannerForArtusi.BACKGROUND_SQUARE_1)
        if args.debug:
            print_matrix(scanner.matrix, "Scan befor unknown")

        sys.exit(0)
        masked = scanner.mask_out_known_squares()


        if match_template:
            img = cv2.imread(args.template.name, cv2.IMREAD_GRAYSCALE)
            # scele
            h,w = img.shape[:2]
            dim = (int(h/scaling), int(w/scaling))
            img = cv2.resize(img, dim, interpolation=cv2.INTER_CUBIC)

            # showImage(img,0,'template')
            scanner.scan_for_template(img, ElementScannerForArtusi.UNKNOWN_ELEMENT_LETTER, debug=args.debug_unknown)
        else:
            scanner.scan_for(ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT, debug=args.debug_unknown, debug_unknown=True)
        # for r in range(36):
        #     param = (r + 1 ) * 10
        #     scanner.scan_for(param)

        print_matrix(scanner.matrix, "scan for image {}".format(f))
        # save to file
        scanned_file = 'scanned_matrix.txt'
        text_file = open(scanned_file, "w")
        from solver import Matrix
        text_file.write(Matrix.matrix_to_string(scanner.matrix,bare=True))
        text_file.close()
        logging.info("Scanned file written to {}".format(scanned_file))

        if args.show:
            img = scanner.create_image(img, START_X, START_Y, END_X, END_Y, scanner.matrix)
            cv2.imshow("autoscan", img)
            cv2.waitKey(0)

'''
sys.exit(1)

# extract a square from x=25 to x=615, y-85 to y=675
img = cv2.imread(IMAGE)
print(img.shape)
image = img[START_Y:END_Y, START_X:END_X]
print(image.shape)

# cv2.imshow("cropeed", crop_img)
# cv2.waitKey(3000)
ratio = 1
# convert the resized image to grayscale, blur it slightly,
# and threshold it
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

# define range of blue color in HSV
lower_blue = np.array([110,50,50])
upper_blue = np.array([130,255,255])
# define range of blue color in HSV
lower_red = np.array([145,50,50])
upper_red = np.array([165,255,255])

#wrong senape 10 - 30
lower_senape = np.array([10, 80, 80])
upper_senape = np.array([30, 255, 255])

lower_aqua = np.array([90, 80, 80])
upper_aqua = np.array([110, 255, 255])

blurred = cv2.GaussianBlur(hsv, (15, 15), 0)

# for i in range(18):
#     range1 = np.array([i*20-10,80, 80])
#     range2 = np.array([i*20+10,255,255])
#     print("range 1 2 {} {} ".format(range1,range2))
#     filter_range= cv2.inRange(hsv, range1, range2)
#     showImage(filter_range)


#forchette
filter_aqua = cv2.inRange(hsv, lower_aqua, upper_aqua)
filter_image = filter_aqua

# pink, kucchiaoo
filter_pink = cv2.inRange(hsv, lower_red, upper_red)
# non basta, filtro

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8,8))
eroded = cv2.erode(filter_pink, kernel, iterations= 2)
showImage(eroded)
filter_pink = eroded

# end pink


filter_senape = cv2.inRange(hsv, lower_senape, upper_senape)
filter_blue = cv2.inRange(hsv, lower_blue, upper_blue)
filter_pink = cv2.inRange(hsv, lower_red, upper_red)
filter_aqua = cv2.inRange(hsv, lower_aqua, upper_aqua)
# showImage(filter_senape)
# showImage(filter_pink)
# showImage(filter_blue)
# showImage(filter_aqua)

kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (8,8))
eroded = cv2.erode(filter_aqua, kernel, iterations= 1)
dilated = cv2.dilate(eroded, kernel, iterations = 1)
# showImage(eroded)
# showImage(dilated,5)
# sys.exit(1)

# sys.exit(1)

# Bitwise-AND mask and original image
# res = cv2.bitwise_and(image,image, mask= filter_senape)
#
# # cv2.imshow('frame',image)
# # cv2.imshow('mask',filter_senape)
# # cv2.imshow('res',res)
# k = cv2.waitKey(0) & 0xFF
# if k == 27:
#     sys.exit(1)

filter_image = filter_aqua

# showImage(gray,0)
# blurred = cv2.GaussianBlur(gray, (5, 5), 0)
# showImage(blurred)
thresh = cv2.threshold(gray, 90, 255, cv2.THRESH_BINARY)[1]
# showImage(thresh, 0)
thresh2 = cv2.adaptiveThreshold(filter_image, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11,2)
thresh3 = cv2.adaptiveThreshold(filter_image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11,2)
# showImage(thresh2,0)
# showImage(thresh3,0)
# filter_image = thresh3

# sys.exit(1)
# find contours in the thresholded image and initialize the
# shape detector
cnts = cv2.findContours(filter_image.copy(), cv2.RETR_EXTERNAL,
                        cv2.CHAIN_APPROX_SIMPLE)
ccnts = cnts[0] if imutils.is_cv2() else cnts[1]
# ccnts = cnts[0]
sd = ShapeDetector()
# loop over the contours
print(len(ccnts))
for c in ccnts:
    # compute the center of the contour, then detect the name of the
    # shape using only the contour
    M = cv2.moments(c)
    try:
        cX = int((M["m10"] / M["m00"]) * ratio)
        cY = int((M["m01"] / M["m00"]) * ratio)
    except ZeroDivisionError:
        continue

    area = M["m00"]# .GetCentralMoment(moments, 0, 0)
    if area < 500:
        continue

    shape = sd.detect(c)

    # multiply the contour (x, y)-coordinates by the resize ratio,
    # then draw the contours and the name of the shape on the image
    c = c.astype("float")
    c *= ratio
    c = c.astype("int")
    cv2.drawContours(image, [c], -1, (0, 255, 0), 2)
    cv2.putText(image, "{} a:{}".format(shape, area), (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (255, 255, 255), 2)

    # get center of image ..
    #average..
    square = WIDTH / 8
    c = int( cX / square)
    r = int(cY / square)
    print("Center of image is {} {} -> {} {}  ".format(cX, cY, r, c))


# show the output image
cv2.imshow("Image", image)
cv2.waitKey(0)
'''