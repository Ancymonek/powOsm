from datetime import datetime, timedelta
from functools import wraps
import time
from settings import logging
from flask import Response
import json


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

def diff(file_new, file_old):
    with open(file_new,'r') as file:
        file1 = json.load(file)

    with open(file_old,'r') as file:
        file2 = json.load(file)

    new_features = []
    new_tags = []
    for feature_new in file1["features"]:
        id = feature_new["properties"]["type"][0] + str(feature_new["properties"]["id"])
        tags = feature_new["properties"]["tags"]
        tags['id'] = id
        new_tags.append(tags)
        new_features.append(id)
    
    old_features = []
    old_tags = []
    for feature_old in file2["features"]:
        id = feature_old["properties"]["type"][0] + str(feature_old["properties"]["id"])
        tags = feature_old["properties"]["tags"]
        tags['id'] = id
        old_tags.append(tags)
        old_features.append(id)
    
    new_features_diff = set(new_features) - set(old_features)
    deleted_features_diff = set(old_features) - set(new_features)

    diff_items = []
    for elem_new in new_tags:
        for elem_old in old_tags:
            if elem_new['id'] == elem_old['id']:
                if set(elem_new.items()) != set(elem_old.items()):
                    diff_items.append(elem_new['id'])

    result = {
              'new_features': new_features_diff, 
              'deleted_features': deleted_features_diff,
              'modified_features': diff_items
              }

    return result