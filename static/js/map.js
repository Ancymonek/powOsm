let tags = {};
let activeCard = 0;
let cardImage = 'static/img/christian_church.png';
let card;
let activeMarkers = [];
const dataFile = baseUrl + '/api/feature/all';
const filteredFile = baseUrl + '/api/feature/names';
const apiUrl = baseUrl + '/api/items/';
const title = 'Obiekty religijne w Polsce';
const locale = (navigator.languages || [])[0] || navigator.userLanguage || navigator.language || navigator.browserLanguage || 'pl';

// Marker groups
let poiMarkers = new L.FeatureGroup();
let wrongNameMarkers = new L.FeatureGroup();
let wrongShortnameMarkers = new L.FeatureGroup();
let missingReligionTagMarkers = new L.FeatureGroup();
let missingDenominationTagMarkers = new L.FeatureGroup();
let missingBuildingNameValueMarkers = new L.FeatureGroup();

let overlayMaps = {
    "Obiekty religijne": poiMarkers,
    "Obiekty z literówkami w nazwie (Kościoł, Kościol itp.)": wrongNameMarkers,
    "Obiekty ze skrótami do rozwinięcia/usunięcia (NMP, św. par., fil.) ": wrongShortnameMarkers,
    "Obiekty bez określonego tagu 'religion'": missingReligionTagMarkers,
    "Obiekty bez określonego tagu 'denomination'": missingDenominationTagMarkers,
    "Obiekty z ogólnym tagiem budynku (building=yes)": missingBuildingNameValueMarkers,
};

// Permalink init
let mapLoc = L.Permalink.getMapLocation();

// Map
let map = L.map('mapid', {
    preferCanvas: true,
    center: mapLoc.center,
    zoom: mapLoc.zoom,
    zoomControl: false,
    layers: [poiMarkers]
});
let geoUrl = dataFile + '/' + map.getBounds().toBBoxString();

// Permalink setup
L.Permalink.setup(map);

// Markers 
L.control.layers(overlayMaps).addTo(map);
let defaultMarkerColor = '#746044'; //#51412b
let circleMarkerStyle = {
    weight: 2,
    fillOpacity: 0.3,
    color: defaultMarkerColor,
};

function addActiveMarker(layer) {
    activeMarkers.push(layer);
    activeMarkers[0].setStyle({
        color: '#660033',
        interactive: false
    });
}

function clearActiveMarker(markerStyle) {
    if (activeMarkers.length >= 1) {
        // reset color 
        activeMarkers[0].setStyle(markerStyle);
        activeMarkers[0].setStyle({
            interactive: true
        });
        activeMarkers.length = 0; // Clear array
    }
}

// Map tileLayers
let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});
osm.addTo(map);

// Zoom and map interaction
let basicZoom = map.getZoom();

L.control.zoom({
    position: 'bottomright'
}).addTo(map);



map.on('zoomend', function () {
    let currentZoom = map.getZoom();

    poiMarkers.setStyle(setZoomStyle(currentZoom));
    wrongNameMarkers.setStyle(setZoomStyle(currentZoom));

});

map.on('moveend', function () {
    if (activeCard != 0) {
        setFeatureIdHash(activeCard);
    }
});


function generateCardTemplate(id, apiFeature) {
    if (apiFeature && id.substring(1) == apiFeature.properties.id) {

        let heritageSign, buildingSuperscript;
        tags = featureTags(apiFeature);

        // card sections
        let buildingDiv = document.createElement('div');
        let organizationDiv = document.createElement('div');
        let addressDiv = document.createElement('div');
        let contactDiv = document.createElement('div');
        let moreInfoDiv = document.createElement('div');

        // buttons
        let osmEditUrl = getPoiOsmUrl('edit', apiFeature);
        let osmShowUrl = getPoiOsmUrl('details', apiFeature);
        let missingTags = [];

        if (tags.heritage.value) {
            heritageSign =
                '<a href="#"><img src="static/img/zabytek.png" title="' + tags.heritageRef.value +
                '" alt="Zabytek - symbol" class="is-pulled-right m-3 heritage"></a>';
        } else {
            heritageSign = '';
        }
        // Order: 1. 'Image' 2. Wikidata main image (api request + img request), 3. Wikipedia main image (if exists), 4. Future (other images)

        if (tags.image.value) {
            cardImage = parseImageTag(tags.image.value);
        } else if (tags.wikidata.value) {
            getWikidataImg(tags.wikidata.value);
        } else {
            cardImage = 'static/img/christian_church.png';
            contribution = 'is-invisible';
        }
        if (apiFeature.properties.tags.building == 'yes') {
            buildingSuperscript = showHint('Wartość tagu jest zbyt ogólna, uzupełnij go odpowiednią wartością (np. dla kościoła building=church, dla kaplicy - building=chapel'); //' <sup>[ <a title="Wartość tagu jest zbyt ogólna, uzupełnij go odpowiednią wartością (np. dla kościoła building=church, dla kaplicy - building=chapel).">?</a> ]</sup>';
        }

        // Select OSM tags to show in sections
        buildingDiv.innerHTML = heritageSign +
            showTag('building', '', buildingSuperscript) +
            showTag('heritageRef') + showTag('startDate') + showTag('yearOfConstruction') +
            showTag('architect') + showTag('buildingArchitecture');


        organizationDiv.innerHTML = showTag('churchType') + showTag('operator') + showTag('diocese') + showTag('deanery') + showTag('serviceTimes') + showTag('openingHours');

        addressDiv.innerHTML = `${showSectionHeader('adres')}
        <p class="mb-1 ml-2">${tags.street.value} ${tags.houseNumber.value}, ${tags.postCode.value} ${tags.city.value || tags.place.value }</p>`;

        contactDiv.innerHTML = showUrlTag('website', tags.website.value, 'witryna') + showTag('email') + showTag('phone');

        moreInfoDiv.innerHTML = showUrlTag('wikipedia', getWikipediaUrl(tags.wikipedia.value), parseWikipediaTitle(tags.wikipedia.value)) + showUrlTag('wikidata', 'https://www.wikidata.org/wiki/' + tags.wikidata.value, tags.wikidata.value) +
            showUrlTag('mapillary', tags.mapillary.value, 'zdjęcie') + showUrlTag('url', tags.url.value, 'witryna') +
            showTag('description') + showTag('wheelchair', '', ' <sup>♿</sup>');

        // Setting visibility of particular sections
        if (!tags.building.value) {} else {
            buildingDiv.innerHTML = showSectionHeader('budynek') + buildingDiv.innerHTML;
        }
        if (!organizationDiv.innerHTML) {
            //organizationDiv = '';
            missingTags.push('organizacja');
        } else {
            organizationDiv.innerHTML = showSectionHeader('organizacja') + organizationDiv.innerHTML;
        }
        if (!tags.street.value && !tags.houseNumber.value && !tags.postCode.value && !tags.city.value && !tags.place.value) {
            addressDiv = '';
            missingTags.push('adres');
        }
        if (!contactDiv.innerHTML) {
            missingTags.push('kontakt');
        } else {
            contactDiv.innerHTML = showSectionHeader('kontakt') + contactDiv.innerHTML;
        }
        if (!moreInfoDiv.innerHTML) {
            missingTags.push('dodatkowe informacje (wikidata, image, url)');
        } else {
            moreInfoDiv.innerHTML = showSectionHeader('dodatkowe informacje') + moreInfoDiv.innerHTML;
        }

        let religion = (tags.religion.value || showHint('Brak tagu określającego religię (np. religion = roman_catholic) - uzupełnij'));
        let denomination = (tags.denomination.value || showHint('Brak tagu określającego wyznanie religijne - np. denomination = roman_cat'));

        // Fix
        if (religion == 'judaizm' && denomination == 'prawosławie') {
            denomination = 'ortodoksyjny';
        }


        let cardContent = (buildingDiv.outerHTML || '') + (organizationDiv.outerHTML || '') + (addressDiv.outerHTML || '') + (contactDiv.outerHTML || '') + (moreInfoDiv.outerHTML || '');
        let title = tags.name.value;
        let subtitle = religion + ' ∘ ' + denomination;
        let footer = showCardFooter(osmShowUrl, '🔍 Pokaż w OSM', 'details', osmEditUrl, '📝 Uzupełnij dane', 'edit');

        card = L.control.card(cardContent, title, subtitle, cardImage, footer, {
            position: 'topleft'
        });

        return card;
    }
}

function getFeatureInfo(feature, urlId) {
    if (feature || urlId) {
        let id = urlId || feature.properties.id;
        setFeatureIdHash(id);

        let queryUrl = apiUrl + id;
        var req = new XMLHttpRequest();
        req.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                let apiFeature = JSON.parse(req.responseText);
                if (apiFeature.properties.id) {
                    generateCardTemplate(id, apiFeature).addTo(map);
                    activeCard = id;
                } else {
                    console.warn('OpenStreetMap object not found.');
                }
            }
        };
        req.open("GET", queryUrl, true);
        req.send();

    } else {
        console.log('Error when showing card.');
    }
}

// Show info about map features
function onEachFeature(feature, layer) {
    markerFilter(feature, layer);
    layer.on('click',
        function (e) {
            let id = feature.properties.id;
            clearActiveMarker(circleMarkerStyle);

            if (activeCard != id) {
                const elements = document.getElementsByClassName("poi-card");
                if (typeof elements !== 'undefined') {
                    while (elements.length > 0) elements[0].remove();
                }
                getFeatureInfo(feature);
                // To do - setting marker active when refreshing site with open card
                addActiveMarker(layer);
            }
        });

}

let geojsonLayer = new L.GeoJSON.AJAX(dataFile, {
    pointToLayer: function (feature, latlng) {
        let marker = L.circleMarker(getCoords(feature)).setStyle(circleMarkerStyle);
        //activeMarkers[feature.properties.id] = marker;        
        marker.setStyle(setZoomStyle(basicZoom));

        //active marker (open card)
        if (feature.properties.id == getFeatureIdFromHash(window.location.href)) {
            addActiveMarker(marker);
        }

        // stupid fix - to refactor
        marker.on('mouseover', function () {
            if (feature.properties.id == getFeatureIdFromHash(window.location.href)) {
                addActiveMarker(marker);
            }
        });

        marker.addTo(poiMarkers);
        return marker;
    },
    onEachFeature: onEachFeature,
});

geojsonLayer.on('data:loaded', function () {
    layerObjects = geojsonLayer.getLayers().length;
    if (layerObjects) {
        showNumberOfFeatures(layerObjects);
    }

});

// Show card if url has valid id
if (activeCard == 0 && getFeatureIdFromHash(window.location.href) != null) {
    let id = getFeatureIdFromHash(window.location.href);
    getFeatureInfo('', id);
}