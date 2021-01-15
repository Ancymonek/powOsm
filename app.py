import json
import re
from datetime import date

from flask import Flask, render_template
from geojson import FeatureCollection
from pymongo import MongoClient

import settings
from functions import docache
from data_import import (
    export_date_to_html_file,
    geojson_do_mongodb,
    osm_tag_statistics,
    overpass_to_geojson,
    statistics_to_html_file,
)

client = MongoClient(settings.uri)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/feature/<filter>")
@docache(minutes=settings.CACHE_TIME, content_type="application/json")
def feature(filter: str):
    db = client[settings.database]
    collection = db[settings.POW_COLLECTION]

    if filter != 'all':
        return None

    result = collection.find({}, {"_id": False, "properties.tags": False})

    features = []
    for feature in list(result):
        feature_type = (
            feature["properties"]["type"][0].lower() + str(feature["properties"]["id"])
        )
        feature["properties"]["id"] = feature_type
        del feature["properties"]["type"]

        features.append(feature)

    features_collection = FeatureCollection(features)

    return json.dumps(features_collection, separators=(",", ":"))


@app.route("/stats")
def stats():
    db = client[settings.database]
    features_collection = db[settings.POW_COLLECTION]

    # Counting all objects
    all_documents = features_collection.count_documents({})
    religions = list(
        features_collection.aggregate(
            [
                {"$match": {"keywords": {"$not": {"$size": 0}}}},
                {"$unwind": "$properties.tags.religion"},
                {
                    "$group": {
                        "_id": {"$toLower": "$properties.tags.religion"},
                        "count": {"$sum": 1},
                    }
                },
                {"$match": {"count": {"$gte": 2}}},
                {"$sort": {"count": -1}},
                {"$limit": 100},
            ]
        )
    )
    not_empty_tag = sum(elem["count"] for elem in religions)
    empty_tag = all_documents - not_empty_tag
    religions.append({"_id": "all_docs", "count": all_documents})
    religions.append({"_id": "empty", "count": empty_tag})

    return religions


@app.route("/api/items/<item_id>")
def items(item_id: str):
    db = client[settings.database]
    pow = db[settings.POW_COLLECTION]
    item_type = item_id[0]

    # w261260517
    if item_type not in ["n", "w", "r"]:
        return None

    if item_type == "n":
        item_type = "node"
    elif item_type == "w":
        item_type = "way"
    elif item_type == "r":
        item_type = "relation"

    item_id = int(item_id[1:])

    return pow.find_one(
        {"$and": [{"properties.id": item_id, "properties.type": item_type}]},
        {"_id": 0},
    )


@app.route("/import/<import_key>/<int:force>")
def import_filename(import_key: str, force: int):

    if import_key != settings.import_key:
        return {"Result": "Fail. Check your key."}

    force = force == 1

    # 1
    execute = overpass_to_geojson(
        settings.input_file,
        3600049715,
        "amenity",
        "place_of_worship",
        force_download=force,
    )

    if execute:
        # 2. Geojson file to MongoDB export
        geojson_do_mongodb(
            settings.input_file,
            settings.database,
            settings.POW_COLLECTION,
            tag_filter=True,
        )

        # 4. Generate statistics of usage of some tags
        statistics_to_html_file(
            "wartość",
            osm_tag_statistics("religion", settings.database, settings.POW_COLLECTION),
            "templates/stats.html",
        )

        # 5. Set html with last update:
        export_date_to_html_file(date.today(), "templates/export.html")

    return {"Result": "Ok"}


if __name__ == "__main__":
    app.run(debug=settings.debug_mode)


""" 
# implementacja pobierania danych z api po bboxie - na przyszłość
@app.route("/api/features/<bbox>")
def features(bbox: str):
    db = client[settings.database]
    features_collection = db[settings.POW_COLLECTION]

    bbox = bbox.split(",")
    bbox = [float(x) for x in bbox]

    if len(bbox) != 4:
        return None

    result_geo = features_collection.find(
        {
            "geometry.coordinates": {
                "$geoWithin": {"$box": [[bbox[2], bbox[3]], [bbox[0], bbox[1]]]}
            }
        },
        {"_id": False, "properties.tags": False},
    )

    features = []
    for feature in list(result_geo):
        feature_type = (
            feature["properties"]["type"][0].lower()
            + ""
            + str(feature["properties"]["id"])
        )
        feature["properties"]["id"] = feature_type

        lat, long = float("%.5f" % feature["geometry"]["coordinates"][0]), float(
            "%.5f" % feature["geometry"]["coordinates"][1]
        )
        feature["geometry"]["coordinates"] = [lat, long]
        del feature["properties"]["type"]

        features.append(feature)

    features_collection = FeatureCollection(features)
    return features_collection
 """