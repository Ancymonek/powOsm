let tags = {};
let activeCard = 0;
let cardImage = 'static/img/christian_church.png';
let card;
let activeMarkers = [];
let defaultMarkerBorderColor = '#FFFFFF';
let defaultMarkerFillColor = '#363636';
const dataFilePow = baseUrl + '/api/pow/all';
const dataFileOffice = baseUrl + '/api/office/all';

// Boundaries
const dataFileDeaneries = baseUrl + '/api/deanery/all';
const dataFileDeaneriesEmpty = baseUrl + '/api/deanery/empty';
const dataFileParishes = baseUrl + '/api/parish/all';
const dataFileParishesEmpty = baseUrl + '/api/parish/empty';

// Items
const apiUrlPow = baseUrl + '/api/items/pow/';
const apiUrlOffice = baseUrl + '/api/items/office/';
const title = 'Obiekty religijne w Polsce';
const locale = (navigator.languages || [])[0] || navigator.userLanguage || navigator.language || navigator.browserLanguage || 'pl';

// Marker groups
let wrongNameMarkers = new L.FeatureGroup();
let wrongShortnameMarkers = new L.FeatureGroup();
let missingReligionTagMarkers = new L.FeatureGroup();
let missingDenominationTagMarkers = new L.FeatureGroup();
let missingDioceseTagMarkers = new L.FeatureGroup();
let missingDeaneryTagMarkers = new L.FeatureGroup();
let missingBuildingNameValueMarkers = new L.FeatureGroup();
let wrongServiceHoursValueMarkers = new L.FeatureGroup();

// religion markers
let christianMarkers = new L.FeatureGroup();
let jewishMarkers = new L.FeatureGroup();
let multifaithMarkers = new L.FeatureGroup();
let buddhismMarkers = new L.FeatureGroup();
let muslimMarkers = new L.FeatureGroup();
let hinduMarkers = new L.FeatureGroup();
let paganMarkers = new L.FeatureGroup();
let otherReligonMarkers = new L.FeatureGroup();

// POI's
let poiMarkers = new L.FeatureGroup();
let officeMarkers = new L.FeatureGroup();

// Boundaries
let deaneriesMarkers = new L.FeatureGroup();
let deaneriesLabels = new L.FeatureGroup();
let parishesMarkers = new L.FeatureGroup();
let parishesLabels = new L.FeatureGroup();

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
let geoUrl = dataFilePow + '/' + map.getBounds().toBBoxString();

L.Permalink.setup(map);

let circleMarkerStyle = {
    weight: 1,
    fillOpacity: 0.9,
    color: defaultMarkerBorderColor,
    fillColor: defaultMarkerFillColor,
};

// Map tileLayers
let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

let osmHumanitarian = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
});

var osmBw = L.tileLayer(
    'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }
);

osm.addTo(map);

var baseTree = {
    label: 'Podkład mapowy 🗺️',
    collapsed: true,
    children: [{
            label: 'OpenStreetMap',
            layer: osm
        },
        {
            label: 'OpenStreetMap Humanitarian',
            layer: osmHumanitarian
        },
        {
            label: 'Czarno-biała',
            layer: osmBw
        },
    ]
};

var overlaysTree = {
    label: 'Obiekty religijne',
    collapsed: false,
    layer: poiMarkers,
    children: [{
            label: 'Obiekty według religii 🛐',
            collapsed: true,
            selectAllCheckbox: 'Zaznacz/odznacz wszystkie',
            children: [{
                    label: "✝️ chrześcijaństwo",
                    layer: christianMarkers
                },
                {
                    label: "✡️ judaizm",
                    layer: jewishMarkers
                },
                {
                    label: "🕉️ buddyzm",
                    layer: buddhismMarkers
                },
                {
                    label: "☪️ islam",
                    layer: muslimMarkers
                },
                {
                    label: "☸️ hinduizm",
                    layer: hinduMarkers
                },
                {
                    label: "🛐 neopogaństwo",
                    layer: paganMarkers
                },
                {
                    label: "🛐 wiele wyznań",
                    layer: multifaithMarkers
                },
                {
                    label: "🛐 inne",
                    layer: otherReligonMarkers
                },
            ]
        },
        {
            label: 'Obiekty do poprawy/uzupełnienia ✏️',
            collapsed: true,
            selectAllCheckbox: 'Zaznacz/odznacz wszystkie',
            children: [{
                    label: "Literówki w nazwie (Kościoł, Kościol itp.)",
                    layer: wrongNameMarkers
                },
                {
                    label: "Skróty do rozwinięcia/usunięcia (NMP, św. par., fil.) ",
                    layer: wrongShortnameMarkers
                },
                {
                    label: "Brak tagu 'religion'",
                    layer: missingReligionTagMarkers
                },
                {
                    label: "Brak tagu 'denomination'",
                    layer: missingDenominationTagMarkers
                },
                {
                    label: "Brak tagu 'diocese'",
                    layer: missingDioceseTagMarkers
                },
                {
                    label: "Brak tagu 'deanery'",
                    layer: missingDeaneryTagMarkers
                },
                {
                    label: "Ogólna wartość tagu budynku (building=yes)",
                    layer: missingBuildingNameValueMarkers
                },
                {
                    label: "Błędne wartości 'service_times'/'opening_hours'",
                    layer: wrongServiceHoursValueMarkers
                },
            ],
        },
        {
            label: 'Kancelarie parafialne, biura 💼',
            collapsed: true,
            layer: officeMarkers,
            children: []
        },

        {
            label: 'Podział religijny',
            collapsed: true,
            selectAllCheckbox: 'Zaznacz/odznacz wszystkie',
            children: [{
                    label: 'Dekanaty',
                    layer: deaneriesMarkers,
                },
                {
                    label: 'Parafie',
                    layer: parishesMarkers,
                }
            ]
        },
    ]
};

controlLayersOptions = {closedSymbol: '<span class="has-text-weight-bold">+</span>', openedSymbol: '<span class="has-text-weight-bold">-</span>'};
var controlLayer = new L.control.layers.tree(baseTree, overlaysTree, controlLayersOptions).addTo(map);

// Zoom and map interaction
let basicZoom = map.getZoom();
L.control.zoom({
    position: 'bottomright'
}).addTo(map);

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
        let osmEditUrlRemote = getJosmEditUrl(apiFeature);
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
                let imageDecodedName = parseImageTag(image);
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

        addressDiv.innerHTML = `${showSectionHeader('adres')}<p class="mb-1 ml-2">${tags.street.value}&nbsp;${tags.houseNumber.value},&nbsp;${tags.postCode.value}&nbsp;${tags.city.value || tags.place.value }</p>`;

        contactDiv.innerHTML = showUrlTag('website', tags.website.value, 'witryna') + showTag('email') + showTag('phone');

        moreInfoDiv.innerHTML = showUrlTag('wikipedia', getWikipediaUrl(tags.wikipedia.value), parseWikipediaTitle(tags.wikipedia.value)) + showUrlTag('wikidata', 'https://www.wikidata.org/wiki/' + tags.wikidata.value, tags.wikidata.value, '', '<a href="https://reasonator.toolforge.org/?q=' + tags.wikidata.value + '" rel="noopener" target="_blank" title="Reasonator"><img src="../static/img/reasonator.png" height="20" width="20" alt="Reasonator" class="pl-1"></a>') +
            showUrlTag('mapillary', tags.mapillary.value, 'zdjęcie') + showUrlTag('url', tags.url.value, 'witryna') +
            showTag('description') + showTag('wheelchair', '', ' <sup>♿</sup>');

        // Setting visibility of particular sections - refactoring needed
        if (!tags.building.value) {
            missingTags.push('budynek');
        } 
        else 
        {
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

        if (missingTags.length == 5)
        {
            var notification = showBulmaNotification('warning', 'Niestety obiekt nie posiada szczegółowych tagów (<a href="https://wiki.openstreetmap.org/wiki/Pl:Tag:amenity%3Dplace_of_worship#U.C5.BCycie" target="_blank" rel="noopener">Zobacz przykład użycia na Wiki</a>). Użyj przycisków edycji do uzupełnienia danych o obiekcie.', true);
        }

        let religion = (tags.religion.value || showHint('Brak tagu określającego religię (np. religion = roman_catholic) - uzupełnij'));
        let denomination = (tags.denomination.value || showHint('Brak tagu określającego wyznanie religijne - np. denomination = roman_cat'));

        // Fix - to refactor
        if (religion == 'judaizm' && denomination == 'prawosławie') {
            denomination = 'ortodoksyjny';
        }

        let actionButtons = '<div class="is-pulled-right"><span class="tag is-link is-light"><a href="' + osmShowUrl + '" target="blank" rel="noopener">🔍 w OSM</a></span> <span class="tag is-link is-light"><a href="'+ osmEditUrlId +'" rel="noopener" target="_blank">📝 Edytuj (iD)</a></span> <span class="tag is-link is-light"><a href="#" onclick="editInJosm(\'' + osmEditUrlRemote + '\')">🔌 Edytuj (JOSM)</a></span></div>';
        let cardContent = actionButtons + (notification || '') + (buildingDiv.outerHTML || '') + (organizationDiv.outerHTML || '') + (addressDiv.outerHTML || '') + (contactDiv.outerHTML || '') + (moreInfoDiv.outerHTML || '');
        let title = tags.name.value;
        let subtitle = religion + ' ∘ ' + denomination;
        let footer = ''; //showCardFooter(osmShowUrl, '🔍 w OSM', 'details', osmEditUrlId, '📝 Edytuj (iD)', 'edit', osmEditUrlRemote, '🔌 Edytuj (JOSM)', 'edit'); - bottom panel removed due to feedback
        

        card = L.control.card(cardContent, title, subtitle, headerImage, footer, {
            position: 'topleft'
        });

        return card;
    }
}

function getFeatureInfo(feature, urlId, apiEndpoint) {
    if (feature || urlId) {
        let id = urlId || feature.properties.id;
        setFeatureIdHash(id);

        let queryUrl = apiEndpoint + id;
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
function onEachFeatureClosure(apiEndpoint) {
    return function onEachFeature(feature, layer) {
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
                    getFeatureInfo(feature, '', apiEndpoint);
                    // To do - setting marker active when refreshing site with open card
                    addActiveMarker(layer);
                }
            });
    };
}

let geojsonLayer = new L.GeoJSON.AJAX(dataFilePow, {
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
    onEachFeature: onEachFeatureClosure(apiUrlPow),
});

let officeLayer = new L.GeoJSON.AJAX(dataFileOffice, {
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

        marker.addTo(officeMarkers);
        return marker;
    },
    onEachFeature: onEachFeatureClosure(apiUrlOffice),
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
    getFeatureInfo('', id, apiUrlPow) || getFeatureInfo('', id, apiUrlOffice);
}

// Setting multipolygon layer and its label (label 'markers')
var boundaryStyle = {
    "stroke": true,
    "weight": 2,
    "opacity": 1,
    "color": "#363636",
    "fill": false,
    "interactive": false,
};


deaneriesLayer = new L.GeoJSON.AJAX(dataFileDeaneriesEmpty, {
    style: boundaryStyle,
    onEachFeature: function (feature, layer) {
        let label = L.marker(layer.getBounds().getCenter(), {
            icon: L.divIcon({
                opacity: 0.01,
                className: 'has-text-weight-normal label has-text-centered has-text-white',
                html: '<p style="font-size: 11px">' + feature.properties.tags.name + '</p>',
                iconSize: [140, 20]
            })
        });
        label.addTo(deaneriesLabels);
    }
});

parishesLayer = new L.GeoJSON.AJAX(dataFileParishesEmpty, {
    style: boundaryStyle,
    onEachFeature: function (feature, layer) {
        let label = L.marker(layer.getBounds().getCenter(), {
            icon: L.divIcon({
                opacity: 0.01,
                className: 'has-text-weight-normal label has-text-centered has-text-white',
                html: '<p style="font-size: 11px">' + feature.properties.tags.name + '</p>',
                iconSize: [140, 20]
            })
        });
        label.addTo(parishesLabels);
    }
});

deaneriesLayer.addTo(deaneriesMarkers);
parishesLayer.addTo(parishesMarkers);

// Map changes
map.on('zoomend', function () {
    let currentZoom = map.getZoom();
    poiMarkers.setStyle(setZoomStyle(currentZoom));
    officeMarkers.setStyle(setZoomStyle(currentZoom));
    setLabelZoomVisibility(currentZoom, 12, parishesLayer, parishesLabels);
});
map.on('moveend', function () {
    if (activeCard != 0) {
        setFeatureIdHash(activeCard);
    }
});
map.on('overlayadd', onOverlayAdd);
map.on('layerremove', onOverlayRemove);

function onOverlayAdd(e) {
    if (map.hasLayer(deaneriesLayer)) {
        if (deaneriesLayer.getLayers().length == 0) {
            deaneriesLayer.refresh(dataFileDeaneries);
        }

        if (!map.hasLayer(deaneriesLabels)) {
            deaneriesLabels.addTo(map);
        }
    }
    if (map.hasLayer(parishesLayer)) {
        if (parishesLayer.getLayers().length == 0) {
            parishesLayer.refresh(dataFileParishes);
        }

        /*  if (!map.hasLayer(parishesLabels)) {
             parishesLabels.addTo(map);
         } */
    }
}

if (map.hasLayer(parishesLayer)) {
    if (!map.hasLayer(parishesLabels)) {
        parishesLabels.addTo(map);
    }
}

function onOverlayRemove(e) {
    if (!map.hasLayer(deaneriesLayer)) {
        map.removeLayer(deaneriesLabels);
    }

    /* if (!map.hasLayer(parishesLayer)) {
        map.removeLayer(parishesLabels);
    } */
}
setLabelZoomVisibility(basicZoom, 12, parishesLayer, parishesLabels);

//localStorage.setItem('layers', ['a', 'b', 'b']);
//const layers = localStorage.getItem('layers');
//localStorage.clear();
//console.log(layers);
