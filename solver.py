
import os
import sys
import logging
import argparse
import scanner
import cv2

logger = logging.getLogger(__package__)

'''
file format is 8 lines
 spaces are spaces
   0 1 2 3 4 5 6 7 8
 0
 1
 2
 3
 4
 5
 6
 7
 8
'''
# from __future__ import print_function


class Matrix:

    @staticmethod
    def create_matrix():
        newm = []
        for r in range(8):
            newm.append([])
            for c in range(8):
                newm[r].append(' ')
        return newm

    @staticmethod
    def read_from_file(file):
        f = open(file, 'r')
        matrix = []
        for line in f:
            matrix.append(list(line))
        for r in range(8):
            for c in range(8):
                if matrix[r][c] == '.':
                    matrix[r][c] = ' '

        return matrix

    @staticmethod
    def count_items(matrix, item):
        count =0
        non_null = 0
        for r in range(8):
            for c in range(8):
                it = matrix[r][c]
                if it == item:
                    count += 1
                if it and it != ' ':
                    non_null += 1
        return (count, non_null,)

    @staticmethod
    def matrix_copy(m):
        newm = []
        for r in range(8):
            newm.append([])
            for c in range(8):
                newm[r].append(m[r][c])
        return newm

    @staticmethod
    def print_matrix(m, header=None, numeric=False):
        print("")
        if header:
            print(" -- {} -- ".format(header))
        print("  01234568 ")
        for r in range(8):
            print("{} ".format(r), end="")
            for c in range(8):
                if m[r][c] is None:
                    print('-', end='')
                else:
                    print(m[r][c], end='')
            print('')
        print("  ========\n")

    @staticmethod
    def matrix_to_string(m, header=None, numeric=False):
        string_buffer = []
        string_buffer.append("")
        if header:
            string_buffer.append(" -- {} -- ".format(header))
        string_buffer.append("  01234568 ")
        for r in range(8):
            line_buffer= []
            line_buffer.append("{} ".format(r) )
            for c in range(8):
                if m[r][c] is None:
                    line_buffer.append('-' )
                else:
                    line_buffer.append(m[r][c])
            string_buffer.append("".join(line_buffer))
        string_buffer.append("  ========")
        return "\n".join(string_buffer)

    @staticmethod
    def compact_matrix(mm):
        '''compact by gravity'''
        mmm = Matrix.matrix_copy(mm)
        for rc in range(8):
            c = 7 - rc # from 7 to 0
            for r in range(8):
                cell = mmm[r][c]
                if cell is None:
                    # drop row above it.. or introduce ' '
                    for x in range(r, 0, -1):
                        mmm[x][c]=mmm[x-1][c]
                    mmm[0][c]=' '
        return mmm


class Solution:

    def __init__(self):
        self.start_row = -1
        self.start_col = -1
        self.end_row = -1
        self.end_col = -1
        self.remaining_ingredient = -1
        self.remaining_items = -1

    def __str__(self):
        return "{}:{} <-> {}:{} = remainig {} over {}".format(self.start_row, self.start_col, self.end_row, self.end_col,
                                                              self.remaining_ingredient, self.remaining_items)

class ArtusiSolver:

    def __init__(self, matrix):
        self.matrix = matrix
        self.working_matrix = Matrix.create_matrix()
        self.starting_point = []
        self.ingredient = '?'
        self.threshold = 5
        self.best_solutions = []

    def solve(self, ingredient=None, threshold=5):

        if ingredient:
            self.ingredient = ingredient
        self.threshold = threshold

        for xc in range(8):
            for xr in range(8):
                cell = self.matrix[xr][xc]
                if cell == ' ' or not cell:
                    continue
                #now swap for every 4 directions.. ignore if another cell is the same
                if xr > 0:
                    self.swap_cell_solve(xr, xc, -1, 0)
                if xr < 7:
                    self.swap_cell_solve(xr, xc, 1, 0)
                if xc > 0:
                    self.swap_cell_solve(xr, xc, 0, -1)
                if xc < 7:
                    self.swap_cell_solve(xr, xc, 0, 1)

    def test_swap(self, row, col, direction, ingredient=None, ):
        if ingredient:
            self.ingredient = ingredient

        direction = direction.lower()
        dr = 0
        dc = 0
        if direction == 'u' or direction == 'up':
            dr = -1
        elif direction == 'd' or direction == 'down':
            dr = 1
        elif direction == 'l' or direction == 'left':
            dc = -1
        elif direction == 'r' or direction == 'right':
            dc = 1

        rr = row + dr
        rc = col + dc

        #sanity check
        if rr < 0 or rr > 7 or rc < 0 or rc > 7:
            logging.error("Cannot move beyond matrix boundary")
            return

        self.swap_cell_solve(row, col, dr, dc)

    def get_best_solutions(self):
        return sorted(self.best_solutions, key=lambda sol: sol.remaining_ingredient)

    def __solve(self, m, debug=False, deleting=False):
        '''
        see if there are 3 or more in a row or column of same, and drom (increment) one line
        :param m:
        :return:
        '''
        deleted_at_least_one = False

        if debug:
            Matrix.print_matrix(m, "solving")

        list_delenda_row=[]
        list_delenda_col = []
        for kk in range(8):
            r = kk
            c = kk
            # for c in range(8):
            cell = m[r][c]

            #see if there are 3 in row
            acc = 0
            temp_list_delenda=[]
            # if r == 2:
            #     print("")
            deleted = False

            #test row
            cell = None
            for tc in range(8):
                xc = m[r][tc]

                if xc != cell:
                    if acc >= 3:
                        #copy temp list in list
                        if acc == 3:
                            list_delenda_row.extend(temp_list_delenda[:])
                        elif temp_list_delenda and xc != ' ':
                            list_delenda_row.append((r, -1)) #all the row
                    temp_list_delenda=[]
                    if xc != ' ':
                        temp_list_delenda.append((r, tc,))
                    acc = 1
                    cell = xc
                    continue

                if xc == cell:
                    acc += 1
                    if xc != ' ':
                        temp_list_delenda.append((r, tc,))

            if acc >= 3:
                if acc == 3:
                    list_delenda_row.extend(temp_list_delenda[:])
                elif xc != ' ':
                    # delelte all row
                    list_delenda_row.append((r, -1)) #all the row

            #test col
            acc = 0
            cell = None
            temp_list_delenda=[]
            for tr in range(8):
                xc = m[tr][c]
                if xc == ' ':
                    temp_list_delenda=[]
                    temp_list_delenda.append((r, tc,))
                    acc = 1
                    cell = xc
                    continue
                if xc != cell:
                    if acc >= 3:
                        if acc == 3:
                            list_delenda_col.extend(temp_list_delenda[:])
                        elif temp_list_delenda and xc != ' ':
                            # delelte all row
                            list_delenda_col.append((-1, c)) #all the row
                    temp_list_delenda=[]
                    if xc !=' ':
                        temp_list_delenda.append((tr, c,))
                    acc = 1
                    cell = xc
                    continue

                if xc == cell:
                    acc += 1
                    if xc !=' ':
                        temp_list_delenda.append((tr, c,))

            if acc >= 3:
                #copy temp list in list
                if acc == 3:
                    list_delenda_col.extend(temp_list_delenda[:])
                elif xc != ' ':
                    # delelte all row
                    list_delenda_col.append((-1, c)) #all the row

                    # if list_delenda_col or list_delenda_row:
                    #     print("!")

        if list_delenda_row and list_delenda_col:
            # have to cancel... check for CROSS!
            for i in list_delenda_col:
                for j in list_delenda_row:
                    if i[0] == j[0] and i[1] == j[1]:
                        # delete entire row and column. NOT CORRECT.. ?
                        if debug:
                            print("\ndeleting X row col {} {}".format(i[0], i[1]))
                        list_delenda_row.append((i[0], -1))
                        list_delenda_col.append((-1, i[1]))
                        break
        deleted = False
        for (dr, dc) in list_delenda_row:
            if dc == -1:
                #delete all row
                for x in range(8):
                    m[dr][x] = None
            else:
                m[dr][dc] = None
            deleted = True

        for (dr, dc) in list_delenda_col:
            if dr == -1:
                #delete all col
                for x in range(8):
                    m[x][dc] = None
            else:
                m[dr][dc] = None
            deleted = True

        if deleted:
            deleted_at_least_one = True
            if debug:
                Matrix.print_matrix(m, " to clean")
            cm = Matrix.compact_matrix(m)
            # print("compacted")
            if debug:
                Matrix.print_matrix(cm, "cleaned")
            self.working_matrix = Matrix.matrix_copy(cm)

            return self.__solve(cm, debug, True)
            # sys.exit(1)

        # (c, t) = count_items(m, INGREDIENT)
        # (c, t) = count_items(global_matrix, INGREDIENT)

        # print("FINISH!!! {}/{}".format(c,t))
        return False

    def swap_cell_solve(self, row, col, deltarow, deltacol, _debug=False):
        #first test if pair already done
        newcol = col + deltacol
        newrow = row + deltarow
        # _debug = True

        if self.matrix[newrow][newcol] == ' ' or not self.matrix[newrow][newcol] \
                or self.matrix[row][col] == ' ' or not self.matrix[row][col]:
            return

        # if _debug:
        #     print("solving swap {} {} - {} {}".format(row, col, newrow, newcol), end='')
        for (r, c, nr, nc) in self.starting_point:
            # print("evaluating {},{} {},{} with {},{} {},{}".format(r,c,nr,nc, row,col,newrow,newcol))
            if (r == row and c == col and nc == newcol and nr == newrow) or \
                    (r == newrow and c == newcol and nc == col and nr == row):
                if _debug:
                    logging.debug(" skipping swap {} {} - {} {}".format(row, col, newrow, newcol))
                    # if _debug:
                    #     print("")
                return

        if self.matrix[newrow][newcol] == self.matrix[row][col]:
            if _debug:
                logging.debug(" skipping same swap: {} {} - {} {} : {}".format(row, col, newrow, newcol, matrix[row][col]))
            return

        # print("")
        #$store
        self.starting_point.append((row, col, newrow, newcol,))

        newmatrix = Matrix.matrix_copy(self.matrix)

        # swap
        cellstart = newmatrix[row][col]
        cellsend= newmatrix[newrow][newcol]

        newmatrix[row][col] = cellsend
        newmatrix[newrow][newcol] = cellstart
        # now solve
        # print_matrix(newmatrix, "swapped")
        self.working_matrix = Matrix.matrix_copy(newmatrix)
        # _debug = False
        ret = self.__solve(newmatrix, _debug)

        (c, t) = Matrix.count_items(self.working_matrix, self.ingredient)
        if c < self.threshold:
            logging.info("solving swap {} {} - {} {} -> {} / {}".format(row, col, newrow, newcol, c, t) )
            sol = Solution()
            sol.start_row = row
            sol.start_col = col
            sol.end_row = newrow
            sol.end_col = newcol
            sol.remaining_ingredient = c
            sol.remaining_items = t
            self.best_solutions.append(sol)

        # if _debug:
        #     print("")


def solve_artusi(image_data, show=False, show_step=False, ingredient='?'):
    scan = scanner.ElementScannerForArtusi(image_data)
    scan.crop_image(scanner.START_X, scanner.START_Y, scanner.END_X, scanner.END_Y)
    scan.scan()
    logging.debug("Image scanned:\n")
    logging.debug("Matrix is\n{}".format(Matrix.matrix_to_string(scan.matrix)))

    Matrix.print_matrix(scan.matrix, "scanned")
    if show:
        iamge_gray = cv2.cvtColor(image_data, cv2.COLOR_BGR2GRAY)
        # now convert back to color
        image_data = cv2.cvtColor(iamge_gray, cv2.COLOR_GRAY2BGR)
        img = scan.create_image(image_data, scanner.START_X, scanner.START_Y, scanner.END_X, scanner.END_Y, scan.matrix)
        if show_step:
            return img

        cv2.imshow("autoscan", img)
        cv2.waitKey(0)

    # now pass image to scann
    solver = ArtusiSolver(scan.matrix)
    logging.debug("Now solving from resulting matrix")
    solver.solve(ingredient=ingredient)

    sols = solver.get_best_solutions()
    logging.debug("Solved")
    for sol in sols:
        logging.debug("Solution:{}".format(sol))

    img = scan.superimpose_solution(image, sol.start_row, sol.start_col, sol.end_row, sol.end_col,
                                    scanner.START_X, scanner.START_Y, (scanner.END_X - scanner.START_X) / 8 )
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

    parser.add_argument('--image', metavar='image', type=argparse.FileType('r'),
                        help='image file')
    parser.add_argument('--show', action='store_true', default=False, help="show scanned image")

    parser.add_argument('matrix_file', metavar='matrix_file', default=None, type=argparse.FileType('r'), nargs='?',
                        help='text file with matrix to solve for Artusi final touch')

    parser.add_argument('ingredient', metavar='ingredient', default='?', help='ingredient to collect', nargs='?')

    args = parser.parse_args()

    if args.image:
        # do scanner
        logging.debug("Image {}".format(args.image.name))
        image = cv2.imread(args.image.name)
        scan = scanner.ElementScannerForArtusi(image)
        scan.crop_image(scanner.START_X, scanner.START_Y, scanner.END_X, scanner.END_Y)
        scan.scan()

        Matrix.print_matrix(scan.matrix, "scanned")
        if args.show:
            img = scan.create_image(image, scanner.START_X, scanner.START_Y, scanner.END_X, scanner.END_Y, scan.matrix)
            cv2.imshow("autoscan", img)
            cv2.waitKey(0)

        # now pass image to scann
        solver = ArtusiSolver(scan.matrix)
        solver.solve(ingredient=args.ingredient)
        sols = solver.get_best_solutions()
        for sol in sols:
            print("Solution:{}".format(sol))

        img = scan.superimpose_solution(image, sol.start_row, sol.start_col, sol.end_row, sol.end_col,
                                        scanner.START_X, scanner.START_Y, (scanner.END_X - scanner.START_X) / 8 )
        # img = scan.superimpose_solution(image, 0,0,1,0,
        #                                 scanner.START_X, scanner.START_Y, (scanner.END_X - scanner.START_X ) / 8 )
        if args.show:
            # img = scan.create_image(image, scanner.START_X, scanner.START_Y, scanner.END_X, scanner.END_Y, scan.matrix)
            cv2.imshow("result", img)
            cv2.waitKey(0)
    else:
        file = args.matrix_file.name

        logging.debug("File {}".format(file))
        matrix = Matrix.read_from_file(file)
        Matrix.print_matrix(matrix)

        solver = ArtusiSolver(matrix)
        solver.solve(ingredient=args.ingredient)


    sys.exit(1)

'''
# swap_cell_solve(6, 4, -1, 0, True)
# swap_cell_solve(0,0, 1, 0, True)
# swap_cell_solve(4, 1, 1, 0, True)
# swap_cell_solve(3, 2, -1, 0, False)
#
# swap_cell_solve(2,3, 1, 0, True)
# #
# sys.exit(1)

for xc in range(8):
    for xr in range(8):
        cell = matrix[xr][xc]
        if cell == ' ':
            continue
        #now swap for every 4 directions.. ignore if another cell is the same
        if xr > 0:
            swap_cell_solve(xr, xc, -1, 0)
        if xr < 7:
            swap_cell_solve(xr, xc, 1, 0)
        if xc > 0:
            swap_cell_solve(xr, xc, 0, -1)
        if xc < 7:
            swap_cell_solve(xr, xc, 0, 1)




def print_matrix(m, header=None):
    print("")
    if header:
        print(" -- {} -- ".format(header))
    print("  01234568 ")
    for r in range(8):
        print("{} ".format(r), end="")
        for c in range(8):
            if m[r][c] is None:
                print('-', end='')
            else:
                print(m[r][c], end='')
        print('')
    print("  ========\n")

def compact_matrix(mm):
    mmm = matrix_copy(mm)
    for rc in range(8):
        c = 7 - rc # from 7 to 0
        for r in range(8):
            cell = mmm[r][c]
            if cell is None:
                # drop row above it.. or introduce ' '
                for x in range(r, 0, -1):
                    mmm[x][c]=mmm[x-1][c]
                mmm[0][c]=' '
    return mmm

def solve(m, debug=False, deleting=False):

    #see if there are 3 or more in a row or column of same, and drom (increment) one line

    deleted_at_least_one = False

    if debug:
        print_matrix(m, "solving")

    list_delenda_row=[]
    list_delenda_col = []
    for kk in range(8):
        r = kk
        c = kk
        # for c in range(8):
        cell = m[r][c]

        #see if there are 3 in row
        acc = 0
        temp_list_delenda=[]
        # if r == 2:
        #     print("")
        deleted = False

        #test row
        cell = None
        for tc in range(8):
            xc = m[r][tc]

            if xc != cell:
                if acc >= 3:
                    #copy temp list in list
                    if acc == 3:
                        list_delenda_row.extend(temp_list_delenda[:])
                    elif temp_list_delenda and xc != ' ':
                        list_delenda_row.append((r, -1)) #all the row
                temp_list_delenda=[]
                if xc != ' ':
                    temp_list_delenda.append((r, tc,))
                acc = 1
                cell = xc
                continue

            if xc == cell:
                acc += 1
                if xc != ' ':
                    temp_list_delenda.append((r, tc,))

        if acc >= 3:
            if acc == 3:
                list_delenda_row.extend(temp_list_delenda[:])
            elif xc != ' ':
                # delelte all row
                list_delenda_row.append((r, -1)) #all the row

        #test col
        acc = 0
        cell = None
        temp_list_delenda=[]
        for tr in range(8):
            xc = m[tr][c]
            if xc == ' ':
                temp_list_delenda=[]
                temp_list_delenda.append((r, tc,))
                acc = 1
                cell = xc
                continue
            if xc != cell:
                if acc >= 3:
                    if acc == 3:
                        list_delenda_col.extend(temp_list_delenda[:])
                    elif temp_list_delenda and xc != ' ':
                        # delelte all row
                        list_delenda_col.append((-1, c)) #all the row
                temp_list_delenda=[]
                if xc !=' ':
                    temp_list_delenda.append((tr, c,))
                acc = 1
                cell = xc
                continue

            if xc == cell:
                acc += 1
                if xc !=' ':
                    temp_list_delenda.append((tr, c,))

        if acc >= 3:
            #copy temp list in list
            if acc == 3:
                list_delenda_col.extend(temp_list_delenda[:])
            elif xc != ' ':
                # delelte all row
                list_delenda_col.append((-1, c)) #all the row

                # if list_delenda_col or list_delenda_row:
                #     print("!")


    if list_delenda_row and list_delenda_col:
        # have to cancel... check for CROSS!
        for i in list_delenda_col:
            for j in list_delenda_row:
                if i[0] == j[0] and i[1] == j[1]:
                    # delete entire row and column. NOT CORRECT.. ?
                    if debug:
                        print("\ndeleting X row col {} {}".format(i[0], i[1]))
                    list_delenda_row.append((i[0], -1))
                    list_delenda_col.append((-1, i[1]))
                    # for x in range(8):
                    #     m[x][c] = None
                    #     m[r][x] = None
                    # deleted - True
                    break
    deleted = False
    for (dr, dc) in list_delenda_row:
        if dc == -1:
            #delete all row
            for x in range(8):
                m[dr][x] = None
        else:
            m[dr][dc] = None
        deleted = True

    for (dr, dc) in list_delenda_col:
        if dr == -1:
            #delete all col
            for x in range(8):
                m[x][dc] = None
        else:
            m[dr][dc] = None
        deleted = True

    if deleted:
        deleted_at_least_one = True
        if debug:
            print_matrix(m, " to clean")
        cm = compact_matrix(m)
        # print("compacted")
        if debug:
            print_matrix(cm, "cleaned")
        global global_matrix
        global_matrix = matrix_copy(cm)

        return solve(cm, debug, True)
        # sys.exit(1)

    (c, t) = count_items(m, INGREDIENT)
    (c, t) = count_items(global_matrix, INGREDIENT)

    # print("FINISH!!! {}/{}".format(c,t))
    return False



FILE='pepe2.txt'
# FILE='parmigiano.txt'

INGREDIENT = '?'
# INGREDIENT='O'
MIN_NUMBER = 5

matrix = []
starting_point = []

global_matrix = []

def read_file(file):
    file = open(file, 'r')
    global matrix
    global starting_point
    starting_point = []
    matrix = []
    for line in file:
        matrix.append(list(line))
    for r in range(8):
        for c in range(8):
            if matrix[r][c] == '.':
                matrix[r][c] = ' '

    print_matrix(matrix)
    # sys.exit(1)
    # for r in range(8):
    #     for c in range(8):
    #         print(matrix[r][c], end='')
    #     print("\n")

def count_items(matrix, item):
    count =0
    non_null = 0
    for r in range(8):
        for c in range(8):
            it = matrix[r][c]
            if it == item:
                count += 1
            if it and it != ' ':
                non_null += 1
    return (count, non_null,)

def matrix_copy(m):
    newm = []
    for r in range(8):
        newm.append([])
        for c in range(8):
            newm[r].append(m[r][c])
    return newm

#         print(matrix[r][c], end='')

def swap_cell_solve(row, col, deltarow, deltacol, _debug=False):
    #first test if couple already done
    newcol = col + deltacol
    newrow = row + deltarow
    # _debug = True

    global starting_point
    if matrix[newrow][newcol] == ' ' or not matrix[newrow][newcol] or  matrix[row][col] == ' ' or not matrix[row][col]:
        return

    # if _debug:
    #     print("solving swap {} {} - {} {}".format(row, col, newrow, newcol), end='')
    for (r, c, nr, nc) in starting_point:
        # print("evaluating {},{} {},{} with {},{} {},{}".format(r,c,nr,nc, row,col,newrow,newcol))
        if (r == row and c == col and nc == newcol and nr == newrow) or \
            (r == newrow and c == newcol and nc == col and nr == row):
            if _debug:
                print(" skipping swap {} {} - {} {}".format(row, col, newrow, newcol))
                # if _debug:
                #     print("")
                return

    if matrix[newrow][newcol] == matrix[row][col]:
        if _debug:
            print(" skipping same swap: {} {} - {} {} : {}".format(row, col, newrow, newcol, matrix[row][col]))
        return

    # print("")
    #$store
    starting_point.append((row, col, newrow, newcol,))

    newmatrix = matrix_copy(matrix)

    # swap
    cellstart = newmatrix[row][col]
    cellsend= newmatrix[newrow][newcol]

    newmatrix[row][col] = cellsend
    newmatrix[newrow][newcol] = cellstart
     # now solve
    # print_matrix(newmatrix, "swapped")
    global global_matrix
    global_matrix = matrix_copy(newmatrix)
    # _debug = False
    ret = solve(newmatrix, _debug)

    (c, t) = count_items(global_matrix, INGREDIENT)
    if c < MIN_NUMBER:
        print("solving swap {} {} - {} {} -> {} / {}".format(row, col, newrow, newcol, c, t) )

    # if _debug:
    #     print("")

def print_matrix(m, header=None):
    print("")
    if header:
        print(" -- {} -- ".format(header))
    print("  01234568 ")
    for r in range(8):
        print("{} ".format(r), end="")
        for c in range(8):
            if m[r][c] is None:
                print('-', end='')
            else:
                print(m[r][c], end='')
        print('')
    print("  ========\n")

def compact_matrix(mm):
    mmm = matrix_copy(mm)
    for rc in range(8):
        c = 7 - rc # from 7 to 0
        for r in range(8):
            cell = mmm[r][c]
            if cell is None:
                # drop row above it.. or introduce ' '
                for x in range(r, 0, -1):
                    mmm[x][c]=mmm[x-1][c]
                mmm[0][c]=' '
    return mmm

def solve(m, debug=False, deleting=False):
    #see if there are 3 or more in a row or column of same, and drom (increment) one line

    deleted_at_least_one = False

    if debug:
        print_matrix(m, "solving")

    list_delenda_row=[]
    list_delenda_col = []
    for kk in range(8):
        r = kk
        c = kk
        # for c in range(8):
        cell = m[r][c]

        #see if there are 3 in row
        acc = 0
        temp_list_delenda=[]
        # if r == 2:
        #     print("")
        deleted = False

        #test row
        cell = None
        for tc in range(8):
            xc = m[r][tc]

            if xc != cell:
                if acc >= 3:
                    #copy temp list in list
                    if acc == 3:
                        list_delenda_row.extend(temp_list_delenda[:])
                    elif temp_list_delenda and xc != ' ':
                        list_delenda_row.append((r, -1)) #all the row
                temp_list_delenda=[]
                if xc != ' ':
                    temp_list_delenda.append((r, tc,))
                acc = 1
                cell = xc
                continue

            if xc == cell:
                acc += 1
                if xc != ' ':
                    temp_list_delenda.append((r, tc,))

        if acc >= 3:
            if acc == 3:
                list_delenda_row.extend(temp_list_delenda[:])
            elif xc != ' ':
                # delelte all row
                list_delenda_row.append((r, -1)) #all the row

        #test col
        acc = 0
        cell = None
        temp_list_delenda=[]
        for tr in range(8):
            xc = m[tr][c]
            if xc == ' ':
                temp_list_delenda=[]
                temp_list_delenda.append((r, tc,))
                acc = 1
                cell = xc
                continue
            if xc != cell:
                if acc >= 3:
                    if acc == 3:
                        list_delenda_col.extend(temp_list_delenda[:])
                    elif temp_list_delenda and xc != ' ':
                        # delelte all row
                        list_delenda_col.append((-1, c)) #all the row
                temp_list_delenda=[]
                if xc !=' ':
                    temp_list_delenda.append((tr, c,))
                acc = 1
                cell = xc
                continue

            if xc == cell:
                acc += 1
                if xc !=' ':
                    temp_list_delenda.append((tr, c,))

        if acc >= 3:
            #copy temp list in list
            if acc == 3:
                list_delenda_col.extend(temp_list_delenda[:])
            elif xc != ' ':
                # delelte all row
                list_delenda_col.append((-1, c)) #all the row

        # if list_delenda_col or list_delenda_row:
        #     print("!")


    if list_delenda_row and list_delenda_col:
        # have to cancel... check for CROSS!
        for i in list_delenda_col:
            for j in list_delenda_row:
                if i[0] == j[0] and i[1] == j[1]:
                    # delete entire row and column. NOT CORRECT.. ?
                    if debug:
                        print("\ndeleting X row col {} {}".format(i[0], i[1]))
                    list_delenda_row.append((i[0], -1))
                    list_delenda_col.append((-1, i[1]))
                    # for x in range(8):
                    #     m[x][c] = None
                    #     m[r][x] = None
                    # deleted - True
                    break
    deleted = False
    for (dr, dc) in list_delenda_row:
        if dc == -1:
            #delete all row
            for x in range(8):
                m[dr][x] = None
        else:
            m[dr][dc] = None
        deleted = True

    for (dr, dc) in list_delenda_col:
        if dr == -1:
            #delete all col
            for x in range(8):
                m[x][dc] = None
        else:
            m[dr][dc] = None
        deleted = True

    if deleted:
        deleted_at_least_one = True
        if debug:
            print_matrix(m, " to clean")
        cm = compact_matrix(m)
        # print("compacted")
        if debug:
            print_matrix(cm, "cleaned")
        global global_matrix
        global_matrix = matrix_copy(cm)

        return solve(cm, debug, True)
        # sys.exit(1)

    (c, t) = count_items(m, INGREDIENT)
    (c, t) = count_items(global_matrix, INGREDIENT)

    # print("FINISH!!! {}/{}".format(c,t))
    return False


read_file(FILE)

# swap_cell_solve(6, 4, -1, 0, True)
# swap_cell_solve(0,0, 1, 0, True)
# swap_cell_solve(4, 1, 1, 0, True)
# swap_cell_solve(3, 2, -1, 0, False)
#
# swap_cell_solve(2,3, 1, 0, True)
# #
# sys.exit(1)

for xc in range(8):
    for xr in range(8):
        cell = matrix[xr][xc]
        if cell == ' ':
            continue
        #now swap for every 4 directions.. ignore if another cell is the same
        if xr > 0:
            swap_cell_solve(xr, xc, -1, 0)
        if xr < 7:
            swap_cell_solve(xr, xc, 1, 0)
        if xc > 0:
            swap_cell_solve(xr, xc, 0, -1)
        if xc < 7:
            swap_cell_solve(xr, xc, 0, 1)


'''
