# powOsm

Pobieranie obiektów z bazy OpenStreetMap do bazy MongoDB za pośrednictwem Overpassa i prezentacja przy użyciu Flaska. Na przykładzie obiektów religijnych (amenity = 'place_of_worship'), po odpowiednich zmianach można dostosować do innych obiektów.

Wersja online: https://plname.usermd.net/

Backend: Flask
Baza danych: MongoDB
Framework CSS: Bulma
Mapa - Leaflet.js
Python: 3.9.1.

Developement przy użyciu VSCode.


Aby uruchomić należy:
- do katalogu root dodać plik .ENV ze zmiennymi (DEBUG = True/False, DBNAME, DBUSER, DBPASSWORD, DBHOST, DBPORT, IMPORT_KEY (używany do zdalnego uruchamiania skryptu aktualizacyjnego)
- pobrać brakujące paczki node (/static/package-lock.json)
- zainstalować wszystkie pakiety z requirements.txt.
