import json
from datetime import date
from pathlib import Path

from flask import Flask, render_template
from flask_assets import Bundle, Environment
from geojson import FeatureCollection
from osm2geojson import json2geojson
from osm2geojson.main import json2geojson, json2shapes
from pymongo import MongoClient

import settings
from data_import import (
    export_date_to_html_file,
    simplify_geojson,
    filter_osm_geojson,
    geojson_to_mongodb,
    osm_tag_statistics,
    overpass_to_geojson,
    statistics_to_html_file,
)
from functions import docache

app = Flask(__name__)
js_head = Bundle(
    "node_modules/leaflet/dist/leaflet.js",
    "node_modules/leaflet-ajax/dist/leaflet.ajax.min.js",
    "node_modules/leaflet.control.layers.tree/L.Control.Layers.Tree.js",
    "js/leaflet.permalink.min.js",
    output="assets/head.js",
    filters="jsmin",
)
js_head_defer = Bundle(
    "js/leaflet.card.js",
    "js/dictionaries.js",
    "js/opening_hours_deps.min.js",
    "node_modules/blueimp-md5/js/md5.min.js",
    output="assets/head_def.js",
    filters="jsmin",
)
js_footer = Bundle(
    "js/main.js", "js/map.js", output="assets/footer.js", filters="jsmin"
)
css = Bundle(
    "node_modules/bulma/css/bulma.css",
    "node_modules/leaflet/dist/leaflet.css",
    "node_modules/leaflet.control.layers.tree/L.Control.Layers.Tree.css",
    "css/style.css",
    output="assets/main.css",
    filters="cssmin",
)

assets = Environment(app)
client = MongoClient(settings.uri)

assets.register("head_js", js_head)
assets.register("head_def_js", js_head_defer)
assets.register("footer_js", js_footer)
assets.register("main_css", css)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/<item_type>/<filter>")
@docache(minutes=settings.CACHE_TIME, content_type="application/json")
def feature(item_type: str, filter: str):
    db = client[settings.database]

    if filter == "empty":
        emptyJson = {"type": "FeatureCollection", "features": []}
        return json.dumps(emptyJson)

    elif filter == "all":
        collections = {
            "pow": [db[settings.POW_COLLECTION], False],
            "office": [db[settings.OFFICE_COLLECTION], False],
            "boundaries": [
                db[settings.BOUNDARIES_COLLECTION],
                True,
            ],  # True = keep osm tags
        }

        try:
            collection = collections[item_type][0]
        except KeyError:
            return {"Result": 0, "Reason": "404. Collection not found"}

        query_settings = {"_id": False}

        if not collections[item_type][1]:
            query_settings["properties.tags"] = False

        result = collection.find({}, query_settings)

        # BBOX Example
        """ "geometry.coordinates": {
                    "$geoWithin": {"$box": [[bbox[2], bbox[3]], [bbox[0], bbox[1]]]}
                } """

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
    else:
        return None


@app.route("/api/items/<item_type>/<item_id>")
def items(item_type: str, item_id: str):
    db = client[settings.database]

    collections = {
        "pow": db[settings.POW_COLLECTION],
        "office": db[settings.OFFICE_COLLECTION],
        "boundaries": db[settings.BOUNDARIES_COLLECTION],
    }

    try:
        collection = collections[item_type]
    except KeyError:
        return {"Result": 0, "Reason": "404. Collection not found"}

    feature_type = item_id[0]

    if feature_type == "n":
        feature_type = "node"
    elif feature_type == "w":
        feature_type = "way"
    elif feature_type == "r":
        feature_type = "relation"
    else:
        return None

    item_id = int(item_id[1:])

    return collection.find_one(
        {"$and": [{"properties.id": item_id, "properties.type": feature_type}]},
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
        output_file=geojson_output_file,
        area_id=3600049715,
        force_download=force,
        amenity="place_of_worship",
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
                osm_tag_statistics(
                    "religion", settings.database, settings.POW_COLLECTION
                ),
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
                osm_tag_statistics(
                    "building", settings.database, settings.POW_COLLECTION
                ),
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
        output_file=geojson_output_file,
        area_id=3600049715,
        force_download=force,
        office="religion",
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


@app.route("/import_boundary/<import_key>/<int:force>")
def import_boundary_geojson(import_key: str, force: int):

    geojson_output_file = settings.input_file_boundary

    if import_key != settings.import_key:
        return {"Result": 0, "Reason": "Incorrect key."}

    force = force == 1

    # 2. Geojson file to MongoDB export
    execute = overpass_to_geojson(
        output_file=geojson_output_file,
        area_id=3600049715,
        force_download=force,
        response_type="xml",
        out="geom",
        boundary="religious_administration",
        admin_level="8",
    )

    if execute:
        # 1. Format .geojson file
        geojson_output_file = simplify_geojson(geojson_output_file)

        # 2. Geojson file to MongoDB export
        geojson_to_mongodb(
            geojson_output_file, settings.database, settings.BOUNDARIES_COLLECTION
        )

    return {"Result": 1}


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
