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
    logging,
    pow_filter_short_values,
    pow_filter_values,
    hours_filter_values,
    uri,
    religion_mapping
)


def format_coordinates(lat, long, fp: int = 5):
    if not lat and long:
        return None

    output_lat, output_long = float(f"%.{fp}f" % lat), float(f"%.{fp}f" % long)
    return [output_lat, output_long]


def filter_osm_geojson(file: str, tags: bool = True, coords: bool = True) -> str:
    file_path = Path(file)

    with open(file_path, "r", encoding="utf-8") as json_file:
        try:
            data = json.load(json_file)

            for feature in data["features"]:
                if coords:
                    feature["geometry"]["coordinates"] = format_coordinates(
                        feature["geometry"]["coordinates"][0],
                        feature["geometry"]["coordinates"][1],
                    )

                if tags:
                    # Format other values
                    for key, value in list(feature["properties"]["tags"].items()):
                        prop = feature["properties"]
                        if key == "name":
                            if (
                                validate_input(value, pow_filter_values, ["kościoła"])
                                or value.isupper()
                            ):
                                prop["n"] = 1
                            if validate_input(
                                value, pow_filter_short_values, ["kościoła"]
                            ):
                                prop["s"] = 1

                        if key == "religion":
                            prop["r"] = religion_mapping[value]

                        if key == "building" and value == "yes":
                            prop["b"] = 1

                        if key in ["opening_hours", "service_times"] and validate_input(
                            value, hours_filter_values
                        ):
                            prop["o"] = 1

                        if "religion" not in prop["tags"]:
                            prop["r"] = 1
                        if "denomination" not in prop["tags"]:
                            prop["d"] = 1

                        if "diocese" not in prop["tags"]:
                            prop["i"] = 1

                        if "deanery" not in prop["tags"]:
                            prop["e"] = 1

        except ValueError as e:
            logging.error(f"Value Error: {e}")
            return None
    
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file) 

    return file


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
            elif ignore_sensivity is False and (
                filter in word and word not in excluded_value
            ):
                matches.append(word)

    if matches:
        return True
    else:
        return None


def overpass_to_geojson(
    output_file: str,
    area_id: int,
    tag_name: str,
    tag_value: str,
    out: str = "center",  # center, body
    overpass_endpoint: list[str] = OVERPASS_ENDPOINTS[0],
    force_download=False,
):
    today = date.today()

    output_file_path = Path(output_file)

    try:
        file_last_mod_date = datetime.fromtimestamp(
            output_file_path.stat().st_mtime
        ).date()
    except FileNotFoundError:
        file_last_mod_date = date(1900, 1, 1)

    if (
        output_file_path.is_file()
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

        with open(output_file_path, mode="w", encoding="utf-8") as f:
            geojson.dump(geojson_response, f)
            logging.info("Finish: GeoJSON object successfully dumped to .geojson file")
            return True

def geojson_to_mongodb(import_file: str, target_db: str, target_col: str, osm=True):
    # Based on: https://github.com/rtbigdata/geojson-mongo-import.py | MIT License
    client = MongoClient(uri)
    db = client[target_db]
    collection = db[target_col]

    import_file_path = Path(import_file)

    if not import_file_path.is_file():
        logging.error(f"Finish: Import file {import_file} does not exist.")
        return None
        
    with open(import_file_path, "r") as f:
        logging.info(f"Start: Opening GeoJSON file {import_file}.")
        try:
            geojson_file = json.loads(f.read())
        except ValueError as e:
            logging.error(f'JSON file {import_file} is invalid. Reason: {e}')
            return None

    if target_col in db.list_collection_names():
        logging.info(f"Start: Dropping existing collection {target_col}.")
        collection.drop()

    # create 2dsphere index and text indexes
    collection.create_index([("geometry", GEOSPHERE)])

    if osm:
        collection.create_index([("properties.type", TEXT), ("properties.id", TEXT)])

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