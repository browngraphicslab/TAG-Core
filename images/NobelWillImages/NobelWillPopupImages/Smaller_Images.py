# -*- coding: cp1252 -*-
import codecs
import urllib2 as URL
import Image
from HTMLParser import HTMLParser
import copy
import os
import re
import math
from Tkinter import Tk
from tkFileDialog import askopenfilename
from tkFileDialog import askopenfilenames
import glob




def getFile():
    Tk().withdraw() 
    filenames = askopenfilenames()
    return filenames


if(__name__=="__main__"):
    files = getFile()
    for path in files:
        image = Image.open(path)

        w = float(image.size[0])
        h = float(image.size[1])

        if h>w:
            ratio = (h/w)        
            sized = image.resize((900,int(900*ratio)), Image.ANTIALIAS)
        else:
            ratio = (w/h)
            sized = image.resize((int(ratio*900),900), Image.ANTIALIAS)
            
        last = path.rfind("\\")
        newpath = path
        sized.save(newpath)
