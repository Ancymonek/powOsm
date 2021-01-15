# powOsm

Obiekty religijne (amenity = place_of_worship) z bazy OpenStreetMap.


Backend: Flask

Baza danych: MongoDB

Framework CSS: Bulma

Mapa - Leaflet.js

Wersja Pythona: 3.9.1.


Developement przy użyciu VSCode.


Aby uruchomić należy:
- do katalogu root dodać plik .ENV ze zmiennymi (DEBUG = True/False, DBNAME, DBUSER, DBPASSWORD, DBHOST, DBPORT, IMPORT_KEY (używany do zdalnego uruchamiania skryptu aktualizacyjnego)
- do katalogu root dodać folder data, w którym umieścić pusty plik export_poland_new.json i przerobić warunek sprawdzający czy plik został utworzony dzisiaj - funkcja (overpass_to_geojson()).
- pobrać brakujące paczki node (/static/package-lock.json)
- zainstalować wszystkie pakiety z requirements.txt.
