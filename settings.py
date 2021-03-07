import logging
import urllib
from pathlib import Path

from decouple import config

# Constants values
DATA_FOLDER = "data"
POW_COLLECTION = "place_of_worship"
OFFICE_COLLECTION = "office_religion"
MONASTERY_COLLECTION = "monastery_religion"
DEANERY_COLLECTION = "deanery_boundaries"
PARISH_COLLECTION = "parish_boundaries"
OVERPASS_ENDPOINTS = [
    r"https://overpass-api.de/api/interpreter",
    r"https://overpass.kumi.systems/api/interpreter",
]
CACHE_TIME = 1440

# Paths
LOG_FILE = f"{DATA_FOLDER}/logs/import.log"

# Nodes
output_place_of_worship = f"{DATA_FOLDER}/export_place_of_worship.json"
output_office = f"{DATA_FOLDER}/export_office.json"
output_monastery = f"{DATA_FOLDER}/export_monastery.json"

# Polygons
output_deanery = f"{DATA_FOLDER}/export_deanery.json"
output_parish = f"{DATA_FOLDER}/export_parish.json"

# Logging set up
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)-12s %(levelname)-8s %(message)s",
    datefmt="%m-%d %H:%M",
    filename=Path(LOG_FILE),
    filemode="a",
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger("").addHandler(console)

# DB setup
database = config("DBNAME")
server = config("DBHOST")
port = config("DBPORT")
user = urllib.parse.quote_plus(config("DBUSER"))
password = urllib.parse.quote_plus(config("DBPASSWORD"))
host = config("HOST", default="127.0.0.1")

uri = "mongodb://" + user + ":" + password + "@" + server + ":" + port + "/" + database

# Other
import_key = config("IMPORT_KEY")
debug_mode = config("DEBUG")

# Dicts
pow_filter_values = {
    "stajac",
    "świędsz",
    "Kościuł",
    "Wawrzyńa",
    "Warzyńca",
    "Męczennioków",
    "Cmętarz",
    "czecia",
    "kapilca",
    "kapilczka",
    "kosciół",
    "kościól",
    "kosciół",
    "kościoł",
    "kośćiół",
    "Kościółi",
    "Koścół",
    "krzyzo",
    "Maryji",
    "Papierz",
    "Naśw",
    "świętrz",
    "wziecia",
    "Piora",
    "Pawla",
    "trojcy",
    "krol",
    "Mikolaja",
    "świet",
    "śwęte",
    "swiatkowy",
    "Misyny",
    "Krzyź",
    "krzyz",
    "Święrego",
    "Zielonoświatkowy",
    "osci",
    "Swiętych",
    "cmrntarna",
    "Pogżeb",
    "Joźefa",
    "Wszytkich",
    "Apostała",
    "apostola",
    "Božej",
    "Boźej",
    "bozej",
    "bozeg",
    "Swiętego",
    "Swietego",
    "Świetego",
    "Niepokalnego",
    "Niepokolanego",
    "Malgo",
    "Różancowej",
    "Rożancowej",
    "Rózancowej",
    "Najświętszewj",
    "Wszsytkich",
    "Wniebowzięia",
    "ędszego",
    "Sankturaium",
    "Oltar",
    "Franczisz",
    "prawoslaw",
    "Zmartwychst",
    "meczen",
    "stanislaw",
    "Milosier",
    "czestochow",
    "nieustajacej",
    "panski",
    "wszytk",
    "p.w.",
    "Stansiława",
    "Archnioła",
    "archaniola",
    "michala",
    "Cerkiwe",
    "Miłośi",
}
pow_filter_sensitive_values = "jezus"

pow_filter_short_values = {"NMP", "MB", "M.B.", "św.", "bł.", "fil.", "par.", "kapl."}

hours_filter_values = {
    "niedziela",
    "lub",
    "miesi�ca",
    "�wi�ta",
    "Dni",
    "święta",
    "miesiąca",
    "http",
    "www",
    "dzia�a",
    "działa",
    "św",
    "�w",
    "powszednie",
    "service_times",
    "pn",
    "pt",
    "śr",
    "wt",
    "czw",
    "sob",
    "�r",
    "nd",
}

religion_mapping = {
    "none": 1,
    "christian": 2,
    "jewish": 3,
    "buddhist": 4,
    "muslim": 5,
    "hindu": 6,
    "multifaith": 7,
    "pagan": 8,
    "other": 9,
}

missing_tags_mapping = {
    "religion": "r",
    "denomination": "d",
    "diocese": "i",
    "deanery": "e",
}
