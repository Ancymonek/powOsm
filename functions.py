from datetime import datetime, timedelta
from functools import wraps
import time
from settings import logging

from flask import Response


def docache(minutes=1440, content_type="application/json; charset=utf-8"):
    """ Flask decorator that allow to set Expire and Cache headers. """

    def fwrap(f):
        @wraps(f)
        def wrapped_f(*args, **kwargs):
            r = f(*args, **kwargs)
            then = datetime.now() + timedelta(minutes=minutes)
            rsp = Response(r, content_type=content_type)
            rsp.headers.add("Expires", then.strftime("%a, %d %b %Y %H:%M:%S GMT"))
            rsp.headers.add("Cache-Control", "public,max-age=%d" % int(60 * minutes))
            return rsp

        return wrapped_f

    return fwrap

def timeit(func):
    @wraps(func)
    def newfunc(*args, **kwargs):
        startTime = time.time()
        func(*args, **kwargs)
        elapsedTime = time.time() - startTime
        logging.info(func.__name__, int(elapsedTime * 1000))
    return newfunc
