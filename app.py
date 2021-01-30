import json
from datetime import date

from flask import Flask, render_template
from geojson import FeatureCollection
from pymongo import MongoClient
from pathlib import Path

import settings
from functions import docache
from data_import import (
    export_date_to_html_file,
    geojson_to_mongodb,
    filter_osm_geojson,
    osm_tag_statistics,
    overpass_to_geojson,
    statistics_to_html_file,
)

client = MongoClient(settings.uri)

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/<feature>/<filter>")
@docache(minutes=settings.CACHE_TIME, content_type="application/json")
def feature(feature: str, filter: str):
    db = client[settings.database]

    if filter != "all":
        return None

    if feature == "pow":
        collection = db[settings.POW_COLLECTION]
    elif feature == "office":
        collection = db[settings.OFFICE_COLLECTION]
    else:
        return None

    result = collection.find({}, {"_id": False, "properties.tags": False})

    features = []
    for feature in list(result):
        feature_type = feature["properties"]["type"][0].lower() + str(
            feature["properties"]["id"]
        )
        feature["properties"]["id"] = feature_type
        del feature["properties"]["type"]

        features.append(feature)

    features_collection = FeatureCollection(features)

    return json.dumps(features_collection, separators=(",", ":"))


@app.route("/api/items/<feature>/<item_id>")
def items(feature: str, item_id: str):
    db = client[settings.database]

    if feature == "pow":
        collection = db[settings.POW_COLLECTION]
    elif feature == "office":
        collection = db[settings.OFFICE_COLLECTION]
    else:
        return None

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

    return collection.find_one(
        {"$and": [{"properties.id": item_id, "properties.type": item_type}]},
        {"_id": 0},
    )


@app.route("/import/<import_key>/<int:force>")
def import_pow_geojson(import_key: str, force: int):

    geojson_output_file = settings.input_file_pow

    if import_key != settings.import_key:
        return {"Result": 0, "Reason": "Incorrect key."}

    force = force == 1

    # 1
    execute = overpass_to_geojson(
            geojson_output_file,
            3600049715,
            "amenity",
            "place_of_worship",
            force_download=force,
        )

    if execute:
        # 1. Filter Geojson:
        geojson_file_processed = filter_osm_geojson(geojson_output_file)

        # 2. Geojson file to MongoDB export
        if geojson_file_processed:
            geojson_to_mongodb(
                geojson_file_processed, settings.database, settings.POW_COLLECTION
            )

            # 3. Generate statistics of usage of some tags
            statistics_to_html_file(
                "religion",
                osm_tag_statistics("religion", settings.database, settings.POW_COLLECTION),
                "templates/religion_stats.html",
            )
            statistics_to_html_file(
                "denomination",
                osm_tag_statistics(
                    "denomination", settings.database, settings.POW_COLLECTION
                ),
                "templates/denomination_stats.html",
            )
            statistics_to_html_file(
                "church:type",
                osm_tag_statistics(
                    "church:type", settings.database, settings.POW_COLLECTION
                ),
                "templates/churchtype_stats.html",
            )
            statistics_to_html_file(
                "building",
                osm_tag_statistics("building", settings.database, settings.POW_COLLECTION),
                "templates/building_stats.html",
            )
            export_date_to_html_file(date.today(), "templates/export.html")

            return {"Result": 1}
        else:
            return {"Result": 0, "Reason": "Error, incorrect processed file"}

    return {"Result": 0, "Reason": "No changes"}


@app.route("/import_office/<import_key>/<int:force>")
def import_office_geojson(import_key: str, force: int):

    geojson_output_file = settings.input_file_office

    if import_key != settings.import_key:
        return {"Result": 0, "Reason": "Incorrect key."}

    force = force == 1

    execute = overpass_to_geojson(
        geojson_output_file, 3600049715, "office", "religion", force_download=force
    )

    if execute:
        # 1. Format .geojson file
        geojson_output_file = filter_osm_geojson(
            geojson_output_file, tags=False, coords=True
        )

        # 2. Geojson file to MongoDB export
        geojson_to_mongodb(
            geojson_output_file, settings.database, settings.OFFICE_COLLECTION
        )

        return {"Result": 1}

    return {"Result": 0, "Reason": "No changes"}


if __name__ == "__main__":
    app.run(debug=settings.debug_mode, host=settings.host)


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