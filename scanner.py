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


TRAINING_IMAGES = [
    "IMG_1370.PNG",
    "IMG_1376.PNG",
    "IMG_1385.PNG",
    "IMG_1387.PNG",
    "IMG_1389.PNG",
]

IMAGE = 'IMG_1387.PNG'

START_X = 25
START_Y = 85

WIDTH = 615 - 25
HEIGHT = 675 - 85

END_X = START_X + WIDTH
END_Y = START_Y + HEIGHT

logger = logging.getLogger(__package__)


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
    cv2.imshow(title, img)
    if delay < 0:
        delay = 10
    cv2.waitKey(delay * 1000)

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

    def crop_image(self, startx=START_X, starty=START_Y, endx=END_X, endy=END_Y):
        # crop
        self.image = self.image[starty:endy, startx:endx]
        self.result = self.image.copy()
        self.hsv = cv2.cvtColor(self.image, cv2.COLOR_BGR2HSV)

    def set_debug(self, debug):
        self.debug = debug

    def scan(self):
        self.scan_for(ElementScannerForArtusi.AQUA_SQUARE_CROSS)
        self.scan_for(ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON)
        self.scan_for(ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON)
        self.scan_for(ElementScannerForArtusi.SENAPE_SQUARE_FORK)
        self.scan_for(ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT)


    PINK_SQUARE_BIG_SPOON = 1
    GREEN_SQUARE_SMALL_SPOON = 2
    AQUA_SQUARE_CROSS = 3
    SENAPE_SQUARE_FORK = 4
    UNKNOWN_SQUARE_ELEMENT = 9
    # don't go above 9. 10 and above are reserved for auto-discovery

    UNKNOWN_ELEMENT_LETTER = '?'

    def _scan_params_for(self, param):
        if param == ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON:
            lower = np.array([145, 50, 50])
            upper = np.array([165, 255, 255])
            letter = 'k'
        elif param == ElementScannerForArtusi.AQUA_SQUARE_CROSS:
            lower = np.array([90, 80, 80])
            upper = np.array([110, 255, 255])
            letter = 'x'
        elif param == ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON:
            # lower = np.array([110, 50, 50])
            # upper = np.array([130, 255, 255])
            lower = np.array([60, 50, 50])
            upper = np.array([80, 255, 255])
            letter = 'c'
        elif param == ElementScannerForArtusi.SENAPE_SQUARE_FORK:
            lower = np.array([20, 80, 80])
            upper = np.array([40, 255, 255])
            letter = 'f'
        elif param == ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT:
            lower = 0
            upper = 0
            letter = '?'
        elif param >= 10:
            lower = np.array([param - 10, 80, 80])
            upper = np.array([param + 10, 255, 255])
            letter = '?'
        else:
            raise ValueError("unkown param {} for _scanParamsFor!".format(param))

        return lower, upper, letter

    def _get_all_known_params(self):
        params = []
        params.append(self._scan_params_for(self.AQUA_SQUARE_CROSS))
        params.append(self._scan_params_for(self.PINK_SQUARE_BIG_SPOON))
        params.append(self._scan_params_for(self.GREEN_SQUARE_SMALL_SPOON))
        params.append(self._scan_params_for(self.SENAPE_SQUARE_FORK))
        # params.append(self._scan_params_for(self.AQUA_SQUARE_CROSS))
        return params

    def scan_for(self, scan_type, debug=False):
        # convert to hsv
        if scan_type == ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT:
            mat = self.scan_for_unknown(debug)
            for r in range(8):
                for c in range(8):
                    if mat[r][c] == self.UNKNOWN_ELEMENT_LETTER:
                        self.matrix[r][c] = self.UNKNOWN_ELEMENT_LETTER
            return

        (lower, upper, letter) = self._scan_params_for(scan_type)
        scan_image = cv2.inRange(self.hsv, lower, upper)
        if self.debug:
            showImage(scan_image, 0, 'Range {}'.format(scan_type))

        cnts = cv2.findContours(scan_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        ccnts = cnts[0] if imutils.is_cv2() else cnts[1]
        ratio = 1
        # ccnts = cnts[0]
        sd = ShapeDetector()
        # loop over the contours
        canvas = self.result
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
            cv2.drawContours(canvas, [c], -1, (0, 255, 0), 2)
            cv2.putText(canvas, "{} a:{}".format(shape, area), (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
                        0.5, (255, 255, 255), 2)

            # get center of image ..
            #average..
            square = WIDTH / 8
            c = int( cX / square)
            r = int(cY / square)
            if self.debug:
                logging.debug("Center of image is {} {} a:{}-> {} {}  ".format(cX, cY, area, r, c))
            self.matrix[r][c] = letter

        # self.result = canvas
        if self.debug:
            showImage(canvas, 0, 'Result {}'.format(scan_type))

    def scan_for_unknown(self, debug=False):
        step = 5
        unknown_matrix = create_matrix(numeric=True)
        good_iterations = 0
        max_hits = 0
        knwon_params = self._get_all_known_params()
        for i in range(int(360/step)):
            lower = np.array([i * step    ,  80, 80])
            upper = np.array([i * step +20, 255, 255])
            skip = False
            for (l, u, _) in knwon_params:
                if lower[0] >= l[0] and upper[0] <= u[0]:
                    #if testing interval is already coverd completely by a known parameter
                    skip = True
                    break

            if skip:
                continue

            letter = self.UNKNOWN_ELEMENT_LETTER

            scan_image = cv2.inRange(self.hsv, lower, upper)
            # if debug:
            #     showImage(scan_image, 0, 'Range {}'.format(lower))

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
                if area < 500 or area > 10000:
                    continue

                shape = sd.detect(c)

                c = c.astype("float")
                c *= ratio
                c = c.astype("int")
                cv2.drawContours(canvas, [c], -1, (0, 255, 0), 2)
                cv2.putText(canvas, "{}".format(shape), (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
                            0.5, (255, 255, 255), 2)

                #average..
                square = WIDTH / 8
                c = int( cX / square)
                r = int(cY / square)
                prev = self.matrix[r][c]
                if debug:
                    logging.debug("Center of image is {} {} a:{}-> {} {} ? {}  ".format(cX, cY, area, r, c, prev))
                if prev and prev != ' ':
                    overlapped += 1
                count += 1
                matrix[r][c] = letter
                # self.matrix[r][c] = letter

            # at the end of loop over shapes, add 1 to identified cell (we can have two or more path in cell!)

            if 2 < count < 50 and overlapped < 5:
                good_iterations += 1

                for r in range(8):
                    for c in range(8):
                        if matrix[r][c] == letter:
                            unknown_matrix[r][c] += 1
                            if unknown_matrix[r][c] > max_hits:
                                max_hits = unknown_matrix[r][c]
                # print_matrix(unknown_matrix, 'unkown for {}'.format(lower), numeric=True)
                if debug:
                    logging.debug("Scan for unknown with bounds {}:{} gives {}/{} shapes".format(lower, upper, count, overlapped))
                    print_matrix(unknown_matrix, 'unkown for {}'.format(lower), numeric=True)
                    print_matrix(matrix)

        if debug:
            logging.debug("Good iterations {}".format(good_iterations))
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
                if unknown_matrix[r][c] == max_hits:
                    matrix[r][c] = letter

        return matrix

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
        x = int(start_x + start_row * width)
        y = int(start_y + start_col * width)
        width = int(width)
        # get center
        cv2.rectangle(img, (x,y),(x+width, y+width),(0,255,0), 10)

        x = int(start_x + end_row * width)
        y = int(start_y + end_col * width)
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

    logging.debug("Images {}".format(files))

    for f in files:
        # detect
        img = cv2.imread(f)
        # crop
        image = img[START_Y:END_Y, START_X:END_X]

        scanner = ElementScannerForArtusi(image)
        if args.debug:
            scanner.set_debug(True)

        scanner.scan()
        scanner.scan_for(ElementScannerForArtusi.AQUA_SQUARE_CROSS)
        scanner.scan_for(ElementScannerForArtusi.GREEN_SQUARE_SMALL_SPOON)
        scanner.scan_for(ElementScannerForArtusi.PINK_SQUARE_BIG_SPOON)
        scanner.scan_for(ElementScannerForArtusi.SENAPE_SQUARE_FORK)
        scanner.scan_for(ElementScannerForArtusi.UNKNOWN_SQUARE_ELEMENT, debug=args.debug_unknown)
        # for r in range(36):
        #     param = (r + 1 ) * 10
        #     scanner.scan_for(param)

        print_matrix(scanner.matrix, "scan for image {}".format(f))
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