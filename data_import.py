import json
from builtins import FileNotFoundError
from datetime import date, datetime
import geopy.distance
import geojson
import requests
import visvalingamwyatt as vw
from osm2geojson import json2geojson
from osm2geojson.main import xml2geojson
from pymongo import GEOSPHERE, TEXT, MongoClient
from pymongo.errors import BulkWriteError
import urllib.parse

from settings import (
    OVERPASS_ENDPOINTS,
    DATA_FOLDER,
    Path,
    hours_filter_values,
    logging,
    missing_tags_mapping,
    pow_filter_short_values,
    pow_filter_values,
    religion_mapping,
    uri,
)


def format_coordinates(lat, long, fp: int = 5):
    if not lat and long:
        return None

    output_lat, output_long = float(f"%.{fp}f" % lat), float(f"%.{fp}f" % long)
    return [output_lat, output_long]


def simplify_geojson(file: str, simplify_ratio=0.3):
    file_path = Path(file)

    with open(file_path, "r", encoding="utf-8") as json_file:
        try:
            data = json.load(json_file)

            for feature in data["features"]:
                geo = feature["geometry"]
                feature["geometry"] = vw.simplify_geometry(geo, ratio=simplify_ratio)

        except ValueError as e:
            logging.error(f"Value Error: {e}")
            return None

    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file)

    return file


def simplify_geojson_geometry(file: str, fp: int = 5):
    file_path = Path(file)

    with open(file_path, "r", encoding="utf-8") as json_file:
        try:
            data = json.load(json_file)

            for feature in data["features"]:
                feature["geometry"]["coordinates"] = format_coordinates(
                    feature["geometry"]["coordinates"][0],
                    feature["geometry"]["coordinates"][1],
                    fp,
                )
        except ValueError as e:
            logging.error(f"Value Error: {e}")
            return None

        with open(file_path, "w", encoding="utf-8") as json_file:
            json.dump(data, json_file)

    return file


def get_wikidata():
    wikidata_file = f"{DATA_FOLDER}/wikidata_query.json"
    with open(wikidata_file, "r", encoding="utf-8") as json_file:
        data = json.load(json_file)

        wikidata_items = {}

        for item in data["results"]["bindings"]:
            coordinates = (
                item["coordinates"]["value"]
                .replace("Point(", "")
                .replace(")", "")
                .split(" ")
            )

            coordinates = [float(loc) for loc in coordinates]

            wikidata_id = item["item"]["value"].replace(
                "http://www.wikidata.org/entity/", ""
            )
            wikidata_name = item["itemLabel"]["value"]

            wikidata_items[wikidata_id] = {
                "coordinates": coordinates,
                "name": wikidata_name,
            }

    return wikidata_items


def filter_osm_geojson(file: str) -> str:
    file_path = Path(file)

    with open(file_path, "r", encoding="utf-8") as json_file:
        try:
            data = json.load(json_file)

            for feature in data["features"]:
                # Format other values
                for key, value in list(feature["properties"]["tags"].items()):
                    prop = feature["properties"]
                    if key == "name":
                        if (
                            validate_input(
                                value,
                                pow_filter_values,
                                ("kościoła", "Kościoła", "Apostolat", "świetlica"),
                            )
                            or value.isupper()
                        ):
                            prop["n"] = 1
                        if validate_input(value, pow_filter_short_values, ("kościoła")):
                            prop["s"] = 1

                    if key == "religion":
                        try:
                            prop["r"] = religion_mapping[value]
                        except KeyError:
                            prop["r"] = 9

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


def compare_osm_wikidata(file: str) -> str:
    file_path = Path(file)

    with open(file_path, "r", encoding="utf-8") as json_file:
        try:
            data = json.load(json_file)
            wikidata_items = get_wikidata()

            for feature in data["features"]:
                osm_coords = feature["geometry"]["coordinates"]
                prop = feature["properties"]

                for key, value in wikidata_items.items():
                    wikidata_item = value["coordinates"]
                    distance = round(
                        geopy.distance.great_circle(osm_coords, wikidata_item).meters, 2
                    )

                    if distance < 10:
                        keys = [key]
                        names = [value["name"]]
                        prop["wid"] = keys
                        prop["wn"] = names
        except ValueError as e:
            logging.error(f"Value Error: {e}")
            return None
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file)

    return file


def validate_input(
    input_value: str,
    filter_set: set,
    excluded_value: set = {},
    ignore_sensivity=True,
):
    words = input_value.split(sep=" ")
    matches = []

    for elem in filter_set:
        for word in words:
            if ignore_sensivity and (
                elem in word and word not in list(map(str.lower, excluded_value))
            ):
                matches.append(word)
            elif ignore_sensivity is False and (
                elem in word and word not in excluded_value
            ):
                matches.append(word)

    if matches:
        return True
    else:
        return None


def overpass_to_geojson(
    output_file: str,
    area_id: int,
    out: str = "center",  # center, body, geom
    response_type: str = "json",
    overpass_endpoint: list[str] = OVERPASS_ENDPOINTS[0],
    force_download=False,
    **kwargs,
):
    today = date.today()
    output_file_path = Path(output_file)
    tags_to_download = "".join(f'["{key}"="{value}"]' for key, value in kwargs.items())

    if response_type not in ["json", "xml"]:
        return None

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
        compact_query = f"[out:{response_type}][timeout:20005];area({area_id})->.searchArea;(node{tags_to_download}(area.searchArea);way{tags_to_download}(area.searchArea);relation{tags_to_download}(area.searchArea););out {out};"
        query = overpass_endpoint + "?data=" + compact_query
        logging.info(f"Start: Connecting to Overpass server: {overpass_endpoint}")
        try:
            response = requests.get(query)
            response.raise_for_status()
            pass
        except requests.exceptions.HTTPError as err:
            raise SystemExit(err)
        if response.status_code != 200:
            logging.error("End: Server response other than 200")
            return None
        try:
            logging.info("Start: Getting data and extracting to .geojson object..")
            if response_type == "json":
                geojson_response = json2geojson(response.text, log_level="ERROR")
            else:
                geojson_response = xml2geojson(response.text, log_level="ERROR")
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
            logging.error(f"JSON file {import_file} is invalid. Reason: {e}")
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
                {"$match": {"count": {"$gte": 1}}},
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


def export_date_to_html_file(import_date: datetime, export_html: str):
    export_folder = Path(export_html)
    paragraph = f"🗓️ Ostatnia aktualizacja danych: {import_date}"

    with open(export_folder, "w", encoding="utf-8") as f:
        f.write(paragraph)

    logging.info(f"Finish: Statistics saved to .html file: {export_folder}.")


def suggest_tags(feature):
    props = feature["properties"]
    tags = props["tags"]

    suggested_tags = []
    if tags.get("building") == "yes" and tags.get("name"):
        if any(
            x in tags.get("name") for x in ["kościół", "Kościół", "cerkiew", "Cerkiew"]
        ):
            suggested_tags.append("building=church")
        if any(x in tags.get("name") for x in ["kaplica", "Kaplica"]):
            suggested_tags.append("building=chapel")
    if tags.get("church:type") is None and tags.get("name"):
        if any(x in tags.get("name").lower() for x in ["fil.", "filialny", "filialna"]):
            suggested_tags.append("church:type=filial")
        if (
            any(
                x in tags.get("name").lower()
                for x in ["par.", "parafialny", "parafialna"]
            )
            and tags.get("name") != "Salka parafialna"
        ):
            suggested_tags.append("church:type=parish")
        if any(
            x in tags.get("name").lower() for x in ["pom.", "pomocniczy", "pomocnicza"]
        ):
            suggested_tags.append("church:type=rectoral")
        if any(x in tags.get("name").lower() for x in ["garnizonowy"]):
            suggested_tags.append("church:type=garrison")
        if any(x in tags.get("name").lower() for x in ["szpitalny", "szpitalna"]):
            suggested_tags.append("church:type=hospital")
        if any(x in tags.get("name").lower() for x in ["więzienny", "więzienna"]):
            suggested_tags.append("church:type=prison")
        if any(
            x in tags.get("name").lower()
            for x in ["kościół klasztorny", "kaplica klasztorna"]
        ):
            suggested_tags.append("church:type=monastic")
    if props.get("wid") is not None:
        suggested_tags.append(f"wikidata={props.get('wid')[0]}")

    return "|".join(suggested_tags)


def coords_to_bbox(coords):
    lat = coords[0]
    lon = coords[1]
    return [lat + 0.001144, lat - 0.001144, lon - 0.00074, lon + 0.00074]


def generate_josm_url(coords, item_type, item_id, addtags):

    bbox = coords_to_bbox(coords)

    return f"http://127.0.0.1:8111/load_and_zoom?left={bbox[1]}&top={bbox[3]}&right={bbox[0]}&bottom={bbox[2]}&select={item_type}{item_id}&addtags={urllib.parse.quote_plus(addtags)}"
