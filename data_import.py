import json
from builtins import FileNotFoundError
from datetime import date, datetime

import geojson
import requests
from osm2geojson import json2geojson
from pymongo import GEOSPHERE, TEXT, MongoClient
from pymongo.errors import BulkWriteError

from settings import (
    OVERPASS_ENDPOINTS,
    Path,
    input_file,
    logging,
    pow_filter_short_values,
    pow_filter_sensitive_values,
    pow_filter_values,
    hours_filter_values,
    uri,
)


def filter_osm_geojson(file):
    # keep new geojson properties short to keep .geojson file small
    with open(file, encoding="utf-8") as json_file:
        data = json.load(json_file)

        for feature in data["features"]:
            # Format coordinates
            lat, long = float("%.5f" % feature["geometry"]["coordinates"][0]), float(
                "%.5f" % feature["geometry"]["coordinates"][1]
            )
            feature["geometry"]["coordinates"] = [lat, long]

            # Format other values
            for key, value in list(feature["properties"]["tags"].items()):
                if key == 'name':
                    if validate_input(value, pow_filter_values, ["kościoła"]) or value.isupper():
                        feature["properties"]["n"] = 1
                    if validate_input(value, pow_filter_short_values, ["kościoła"]):
                        feature["properties"]["s"] = 1

                if "religion" not in feature["properties"]["tags"]:
                    feature["properties"]["r"] = 1

                if "denomination" not in feature["properties"]["tags"]:
                    feature["properties"]["d"] = 1

                if key == "building" and value == "yes":
                    feature["properties"]["b"] = 1

                # It's hard to find working Python opening_hours parser so it's a validator based on manually checked incorrect values, should contain about 80% cases
                if key in ["opening_hours", "service_times"] and validate_input(
                    value, hours_filter_values
                ):
                    feature["properties"]["o"] = 1

    return data


def validate_input(
    input_value: str,
    filter_list: list,
    excluded_value: list = [],
    ignore_sensivity=True,
):
    words = input_value.split(sep=" ")
    matches = []

    for filter in filter_list:
        for word in words:
            if ignore_sensivity and (
                filter.lower() in word.lower()
                and word.lower() not in map(str.lower, excluded_value)
            ):
                matches.append(word)
            elif ignore_sensivity is False and (filter in word and word not in excluded_value):
                matches.append(word)

    if matches:
        return True
    else:
        return None


def overpass_to_geojson(
    output_file: Path,
    area_id: int,
    tag_name: str,
    tag_value: str,
    out: str = "center",  # center, body
    overpass_endpoint: list[str] = OVERPASS_ENDPOINTS[0],
    force_download=False,
):
    today = date.today()

    try:
        file_last_mod_date = datetime.fromtimestamp(output_file.stat().st_mtime).date()
    except FileNotFoundError:
        file_last_mod_date = date(1900, 1, 1)

    if (
        output_file.is_file()
        and file_last_mod_date == today
        and force_download is False
    ):
        logging.info(f"Finish: File is up to date. (generated: {file_last_mod_date})")
        return None

    # 2. Step 2 - connecting and getting data from Overpass
    else:
        logging.info(
            f"Info: Export .geojson file last modification date: {file_last_mod_date}"
        )

        # Overpass Query
        compact_query = f'[out:json][timeout:20005];area({area_id})->.searchArea;(node["{tag_name}"="{tag_value}"](area.searchArea);way["{tag_name}"="{tag_value}"](area.searchArea);relation["{tag_name}"="{tag_value}"](area.searchArea););out {out};'
        query = overpass_endpoint + "?data=" + compact_query
        logging.info(f"Start: Connecting to Overpass server: {overpass_endpoint}")

        try:
            response = requests.get(query)
            response.raise_for_status()
        except requests.exceptions.HTTPError as err:
            raise SystemExit(err)
        if response.status_code != 200:
            logging.info("End: Server response other than 200")
            return None

        try:
            logging.info("Start: Getting data and extracted to .geojson object..")
            geojson_response = json2geojson(response.text, log_level="INFO")
        except:
            logging.error("Finish: Error when converting response .json to .geojson")
            return None

        with open(output_file, mode="w", encoding="utf-8") as f:
            geojson.dump(geojson_response, f)
            logging.info("Finish: GeoJSON object successfully dumped to .geojson file")
            return True


def geojson_do_mongodb(
    import_file: Path, target_db: str, target_col: str, osm=True, tag_filter=False
):
    # Based on: https://github.com/rtbigdata/geojson-mongo-import.py | MIT License
    client = MongoClient(uri)
    db = client[target_db]
    collection = db[target_col]

    if not import_file.is_file():
        logging.error(f"Finish: Import file does not exist.")
        return None

    if tag_filter is True:
        logging.info(f"Start: Opening and filtering GeoJSON file {input_file}.")
        geojson_file = filter_osm_geojson(import_file)
    else:
        with open(import_file, "r") as f:
            logging.info(f"Start: Opening GeoJSON file {input_file}.")
            geojson_file = json.loads(f.read())

    if target_col in db.list_collection_names():
        logging.info(f"Start: Dropping existing collection {target_col}.")
        collection.drop()

    # create 2dsphere index and text indexes
    logging.info("Start: Creating indexes.")
    collection.create_index([("geometry", GEOSPHERE)])

    if osm:
        collection.create_index([("properties.type", TEXT), ("properties.id", TEXT)])

    logging.info("Start: Loading features to object.")
    bulk = collection.initialize_unordered_bulk_op()

    for feature in geojson_file["features"]:
        bulk.insert(feature)

    logging.info("Finish: Features loaded to object.")
    try:
        logging.info(f"Start: Loading features to collection {target_col}.")
        result = bulk.execute()
        logging.info(
            f'Finish: Number of Features successully inserted: {result["nInserted"]} '
        )
    except BulkWriteError as bwe:
        n_inserted = bwe.details["nInserted"]
        err_msg = bwe.details["writeErrors"]
        logging.info("Errors encountered inserting features")
        logging.info(f"Number of Features successully inserted: {n_inserted} ")
        logging.info("The following errors were found:")
        for item in err_msg:
            print(f'Index of feature: {item["index"]}')
            print(f'Error code: {item["code"]}')
            logging.info(
                f'Message(truncated due to data length): {item["errmsg"][0:120]}'
            )


def osm_tag_statistics(tag: str, source_db: str, col: str) -> list:
    client = MongoClient(uri)
    db = client[source_db]
    features = db[col]

    all_documents = features.count_documents({})
    query_aggregate = list(
        features.aggregate(
            [
                {"$match": {"keywords": {"$not": {"$size": 0}}}},
                {"$unwind": f"$properties.tags.{tag}"},
                {
                    "$group": {
                        "_id": {"$toLower": f"$properties.tags.{tag}"},
                        "count": {"$sum": 1},
                    }
                },
                {"$match": {"count": {"$gte": 2}}},
                {"$sort": {"count": -1}},
                {"$limit": 100},
            ]
        )
    )
    not_empty_tag = sum(elem["count"] for elem in query_aggregate)
    empty_tag = all_documents - not_empty_tag
    query_aggregate.append({"_id": "brak", "count": empty_tag})
    query_aggregate.append({"_id": "<strong>suma</strong>", "count": all_documents})
    logging.info(f"Finish: Statistics for tag: {tag} generated.")
    return query_aggregate


def statistics_to_html_file(tag_label: str, query_result: list, export_stats: str):
    export_folder = Path(export_stats)
    body = ""
    header = f'<h2 class="is-4 is-5-touch has-text-brown has-text-weight-semibold">Tag <strong>{tag_label}</strong></h2><div class="table-container"><table class="table">'
    table_header = (
        f"<thead><tr><th>{tag_label}</th><th>wystąpienia</th></tr></thead><thbody>"
    )
    elems = [
        f"<tr><td>{elem['_id']}</td><td>{elem['count']}</td></tr>"
        for elem in query_result
    ]
    elems_str = "".join(elems)
    footer = "</tbody></table></div>"
    body = header + table_header + elems_str + footer

    with open(export_folder, "w", encoding="utf-8") as f:
        f.write(body)

    logging.info(f"Finish: Statistics saved to .html file: {export_folder}.")


def export_date_to_html_file(import_date: date, export_html: str):
    export_folder = Path(export_html)
    paragraph = f"Ostatnia aktualizacja danych: {import_date}"

    with open(export_folder, "w", encoding="utf-8") as f:
        f.write(paragraph)

    logging.info(f"Finish: Statistics saved to .html file: {export_folder}.")


""" Currently not used
def geojson_minify(input_file: Path, output_file: Path, keep_tags: list = []):
    if not input_file.is_file():
        return None

    with open(input_file, encoding="utf-8") as json_file:
        input_size = input_file.stat().st_size
        logging.info(f"Start: Opening .json file {input_file}, size: {input_size} B")
        data = json.load(json_file)

        for feature in data["features"]:
            # simplify coordinates (works only with geojson Node geometry)
            lat = float("%.5f" % feature["geometry"]["coordinates"][0])
            long = float("%.5f" % feature["geometry"]["coordinates"][1])
            feature["geometry"]["coordinates"] = [lat, long]

            # trim osm id and type to single id (i.e. type = 'way', id = '298110952' to w298110952)
            if feature["properties"]["type"] and feature["properties"]["id"]:
                feature_type = (
                    feature["properties"]["type"][0].lower()
                    + ""
                    + str(feature["properties"]["id"])
                )
                feature["properties"]["id"] = feature_type
                del feature["properties"]["type"]

            if keep_tags:
                for key, value in list(feature["properties"]["tags"].items()):
                    if key not in keep_tags:
                        del feature["properties"]["tags"][key]
            else:
                del feature["properties"]["tags"]

        logging.info(
            f"Info: Number of features in feature collection: {len(data['features'])}"
        )

        with open(output_file, mode="w", encoding="utf-8") as f:
            logging.info(f"Start: Dumping .geojson object to file {output_file}")
            geojson.dump(data, f, separators=(",", ":"))

        output_size = output_file.stat().st_size
        diff = round((output_size / input_size) * 100, 3)
        logging.info(
            f"Finish: GeoJSON object successfully dumped to .geojson file {output_file}, size: {output_size} B, % of the original file: {diff}%"
        )
"""
