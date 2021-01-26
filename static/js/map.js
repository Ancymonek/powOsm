let tags = {};
let activeCard = 0;
let cardImage = 'static/img/christian_church.png';
let card;
let activeMarkers = [];
let defaultMarkerBorderColor = '#FFFFFF';
let defaultMarkerFillColor = '#746044'; //#51412b
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
let wrongServiceHoursValueMarkers = new L.FeatureGroup();

let overlayLayers = {
    "Obiekty religijne": poiMarkers,
    "Obiekty z literówkami w nazwie (Kościoł, Kościol itp.)": wrongNameMarkers,
    "Obiekty ze skrótami do rozwinięcia/usunięcia (NMP, św. par., fil.) ": wrongShortnameMarkers,
    "Obiekty bez określonego tagu 'religion'": missingReligionTagMarkers,
    "Obiekty bez określonego tagu 'denomination'": missingDenominationTagMarkers,
    "Obiekty z ogólnym tagiem budynku (building=yes)": missingBuildingNameValueMarkers,
    "Obiekty z błędnymi tagami service_times i opening_hours": wrongServiceHoursValueMarkers
};

// Permalink init
let mapLoc = L.Permalink.getMapLocation();

// Map
let map = L.map('mapid', {
    preferCanvas: true,
    center: mapLoc.center,
    minZoom: 7,
    zoom: mapLoc.zoom,
    zoomControl: false,
    layers: [poiMarkers]
});
let geoUrl = dataFile + '/' + map.getBounds().toBBoxString();

// Permalink setup
L.Permalink.setup(map);

// Markers 
L.control.layers(false, overlayLayers).addTo(map);

let circleMarkerStyle = {
    weight: 1,
    fillOpacity: 0.9,
    color: defaultMarkerBorderColor,
    fillColor: defaultMarkerFillColor,
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

});

map.on('moveend', function () {
    if (activeCard != 0) {
        setFeatureIdHash(activeCard);
    }
});


function generateCardTemplate(id, apiFeature) {
    if (apiFeature && id.substring(1) == apiFeature.properties.id) {
        let heritageSign, buildingSuperscript, headerImage;
        tags = featureTags(apiFeature);

        // card sections
        let buildingDiv = document.createElement('div');
        let organizationDiv = document.createElement('div');
        let addressDiv = document.createElement('div');
        let contactDiv = document.createElement('div');
        let moreInfoDiv = document.createElement('div');

        // buttons
        let osmEditUrlId = getPoiOsmUrl('edit', apiFeature, 'id');
        let osmEditUrlRemote = getPoiOsmUrl('edit', apiFeature, 'remote');
        let osmShowUrl = getPoiOsmUrl('details', apiFeature);
        let missingTags = [];

        if (tags.heritage.value && tags.heritageRef.value) {
            let anchorImg = document.createElement('a');
            let heritageImg = new Image();
            heritageImg.src = 'static/img/zabytek.png';
            heritageImg.setAttribute('class', "is-pulled-right m-2 heritage");
            heritageImg.setAttribute('title', tags.heritageRef.value);
            anchorImg.innerHTML = heritageImg.outerHTML;
            heritageSign = anchorImg.outerHTML;
        } else {
            heritageSign = '';
        }

        // Order: 
        // 1. 'Image' tag (works for Wikimedia Commons url and valid 'File:XXXX.jpg' format, and Mapillary) - synchronous
        // 2. Wikidata main image (api request + img request) - asynchronous,
        // To do: 1. Wikimedia Commons category parse and get first image, 2. Get image if only Wikipedia article is provided (it's not so easy*)

        if (tags.image.value && (tags.image.value.startsWith(mapillaryImagesPrefix) || tags.image.value.startsWith(wikimediaCommonsPrefix) || tags.image.value.startsWith(wikimediaCommonsShortPrefix))) {
            let image = tags.image.value;
            if (image.startsWith(mapillaryImagesPrefix)) {
                headerImage = parseImageTag(image);
                let contributionInfo = {
                    'author': '<a href="' + image + '" target="_blank" rel="noreferrer">Mapillary</a>',
                    'license': 'CC BY-SA 4.0',
                    'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/'
                };
                showContribution(contributionInfo);
            } else if (image.startsWith(wikimediaCommonsPrefix) || image.startsWith(wikimediaCommonsShortPrefix)) {
                let imageDecodedName = parseImageTag(image)
                let fullWikimediaUrl = getWikimediaCommonsUrl(imageDecodedName);
                getWikimediaCommonsLicenseInfo(imageDecodedName);
                headerImage = fullWikimediaUrl;
            }
        } else if (tags.wikidata.value) {
            getWikidataImg(tags.wikidata.value);
        } else {
            headerImage = cardImage;
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

        addressDiv.innerHTML = `${showSectionHeader('adres')}<p class="mb-1 ml-2">${tags.street.value} ${tags.houseNumber.value}, ${tags.postCode.value} ${tags.city.value || tags.place.value }</p>`;

        contactDiv.innerHTML = showUrlTag('website', tags.website.value, 'witryna') + showTag('email') + showTag('phone');

        moreInfoDiv.innerHTML = showUrlTag('wikipedia', getWikipediaUrl(tags.wikipedia.value), parseWikipediaTitle(tags.wikipedia.value)) + showUrlTag('wikidata', 'https://www.wikidata.org/wiki/' + tags.wikidata.value, tags.wikidata.value, '', '<a href="https://reasonator.toolforge.org/?q=' + tags.wikidata.value + '" rel="noopener" target="_blank" title="Reasonator"><img src="../static/img/reasonator.png" height="20" width="20" alt="Reasonator" class="pl-1"></a>') +
            showUrlTag('mapillary', tags.mapillary.value, 'zdjęcie') + showUrlTag('url', tags.url.value, 'witryna') +
            showTag('description') + showTag('wheelchair', '', ' <sup>♿</sup>');

        // Setting visibility of particular sections - refactoring needed
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

        // Fix - to refactor
        if (religion == 'judaizm' && denomination == 'prawosławie') {
            denomination = 'ortodoksyjny';
        }


        let cardContent = (buildingDiv.outerHTML || '') + (organizationDiv.outerHTML || '') + (addressDiv.outerHTML || '') + (contactDiv.outerHTML || '') + (moreInfoDiv.outerHTML || '');
        let title = tags.name.value;
        let subtitle = religion + ' ∘ ' + denomination;
        let footer = showCardFooter(osmShowUrl, '🔍 w OSM', 'details', osmEditUrlId, '📝 Edytuj (iD)', 'edit', osmEditUrlRemote, '🔌 Edytuj (JOSM)', 'edit');

        card = L.control.card(cardContent, title, subtitle, headerImage, footer, {
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
    layerObjects = poiMarkers.getLayers().length;
    if (layerObjects) {
        showNumberOfFeatures(layerObjects);
    }
});

// Show card if url has valid id
if (activeCard == 0 && getFeatureIdFromHash(window.location.href) != null) {
    let id = getFeatureIdFromHash(window.location.href);
    getFeatureInfo('', id);
}