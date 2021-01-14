import logging
import urllib
from pathlib import Path

from decouple import config

# Constants values
POW_COLLECTION = "place_of_worship"
OVERPASS_ENDPOINTS = [
    r"https://overpass-api.de/api/interpreter",
    r"https://overpass.kumi.systems/api/interpreter",
]
LOG_FILE = Path("data/logs/import.log")

# Logging set up
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)-12s %(levelname)-8s %(message)s",
    datefmt="%m-%d %H:%M",
    filename=LOG_FILE,
    filemode="a",
)
console = logging.StreamHandler()
console.setLevel(logging.INFO)
logging.getLogger("").addHandler(console)

# Files and db set up
input_file, pow_file_min, output_json_file = (
    Path("data/export_poland_new.json"),
    Path("data/export_poland_min.json"),
    Path("data/export_poland_json.json"),
)
database = config("DBNAME")
server = config("DBHOST")
port = config("DBPORT")
user = urllib.parse.quote_plus(config("DBUSER"))
password = urllib.parse.quote_plus(config("DBPASSWORD"))
uri = "mongodb://" + user + ":" + password + "@" + server + ":" + port + "/" + database
import_key = config("IMPORT_KEY")
debug_mode = config("DEBUG")

pow_filter_values = (
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
    "Jana Pawła 2"
)

pow_filter_short_values = (
    "NMP",
    "św.",
    "bł.",
    "fil.",
    "par.",
    "p.w."
)