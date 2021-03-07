// TO DO:
// parse multivalues (url)
// validate ALL urls (some may contain multiple values (;))
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}
const baseUrl = window.location.origin;
const wikimediaCommonsPrefix = 'https://commons.wikimedia.org/wiki/';
const wikimediaCommonsShortPrefix = 'File:';
const mapillaryImagesPrefix = 'https://images.mapillary.com/';

//#region DOM functions
document.addEventListener('DOMContentLoaded', () => {
    const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
    if ($navbarBurgers.length > 0) {
        $navbarBurgers.forEach(el => {
            el.addEventListener('click', () => {
                const target = el.dataset.target;
                const $target = document.getElementById(target);
                el.classList.toggle('is-active');
                $target.classList.toggle('is-active');
            });
        });
    }
});

function toggleModal(modal) {
    var Modal = document.querySelector(`#${modal}`);
    Modal.classList.toggle('is-active');
}

const checkElement = async selector => {
    while (document.querySelector(selector) === null) {
        await new Promise(resolve => requestAnimationFrame(resolve));
    }
    return document.querySelector(selector);
};

function showSectionHeader(headerText) {
    let cardHeader = document.createElement('p');
    cardHeader.setAttribute("class", 'has-text-weight-medium mt-3 mb-1 p-1 has-text-brown tag-group is-uppercase is-size-7');
    cardHeader.textContent = headerText;
    return cardHeader.outerHTML;
}

function showBulmaNotification(level, text, light) {
    const levelsClasses = ['primary', 'link', 'info', 'success', 'warning', 'danger'];
    const lightClass = 'is-light';

    if (typeof light === true) {
        light = 'is-light';
    } else {
        light = lightClass;
    }

    if (levelsClasses.includes(level) === true) {
        level = level;
    } else {
        level = 'info';
    }

    let div = document.createElement('div');
    div.setAttribute('class', 'ml-2 mr-2 notification is-' + level + ' ' + light);
    div.setAttribute('style', 'z-index: 9999 !important;');
    div.textContent = text || '';
    return div.outerHTML;
}

function setCardImage(url) {
    let headerImg = document.getElementById('poi-card-image');

    if (typeof headerImg !== 'undefined' && headerImg !== null) {
        headerImg.src = cardImage;
        headerImg.onload = function () {};
        headerImg.src = url;
    }
}

function showContribution(contributionInfo) {
    //let contributionDiv = document.getElementById('contribution');

    checkElement('#contribution').then((selector) => {
        let contributionDiv = selector;
        if (contributionInfo) {
            let licensePart;
            let separator = ' | ';
            let author = contributionInfo.author;
            let authorPart = document.createElement('span');
            authorPart.setAttribute('class', 'contribution-author');
            authorPart.innerHTML = author;
            authorText = authorPart.textContent || authorPart.innerText || "";

            let license = contributionInfo.license;
            let licenseUrl = contributionInfo.licenseUrl;

            if (licenseUrl) {
                licensePart = '<a href=' + licenseUrl + ' target="_blank">' + license + '</a>';
            } else {
                licensePart = license;
            }

            if (authorText.length > 30) {
                let anchor = document.createElement('a');
                anchor.setAttribute('title', authorText);
                anchor.textContent = '[?]';
                authorText = anchor.outerHTML;
            }

            contributionDiv.innerHTML = authorText + (separator || '') + licensePart;
            contributionDiv.classList.remove("is-hidden");
        }

    });
}

function showTag(tagName, newTagLabel = undefined, postfix = undefined) {
    if (tags[tagName].value) {
        let cardHeader = document.createElement('p');
        cardHeader.setAttribute("class", "mb-1 ml-2");

        //label
        let tagLabel = document.createElement('span');
        tagLabel.setAttribute("class", "has-text-weight-light");
        tagLabel.textContent = newTagLabel || showProperty('', tags[tagName].label, '');

        //value
        let tagValue = document.createElement('span');
        tagValue.setAttribute("class", "has-text-weight-normal");
        tagValue.textContent = showProperty('', tags[tagName].value, '');

        cardHeader.innerHTML = tagLabel.outerHTML + ': ' + tagValue.outerHTML + (postfix || '');

        return cardHeader.outerHTML;
    }
    return '';
}

function showUrlTag(tagName, url, title, newTagLabel = undefined, postfix = undefined, icon = undefined) {
    if (tags[tagName].value) {
        let cardHeader = document.createElement('p');
        cardHeader.setAttribute("class", "mb-1 ml-2");

        //label
        let tagLabel = document.createElement('span');
        tagLabel.setAttribute("class", "has-text-weight-light");
        tagLabel.textContent = newTagLabel || showProperty('', tags[tagName].label, '');

        //value
        let tagValue = document.createElement('span');
        tagValue.setAttribute("class", "has-text-weight-normal");
        tagValue.innerHTML = showProperty('<a href="', url, '" rel="noopener" target="_blank">' + title + '</a>');
        let iconSup = document.createElement('sup');

        if (!icon) {
            iconSup.innerHTML = '🔗';
            icon = iconSup;
        }
        cardHeader.innerHTML = tagLabel.outerHTML + ': ' + tagValue.outerHTML + (postfix || icon.outerHTML);

        return cardHeader.outerHTML;
    }
    return '';
}

function showHint(text) {
    let superScript = document.createElement('sup');
    let superHint = document.createElement('a');
    superHint.setAttribute('title', text);
    superHint.textContent = ' [?]';
    superScript.appendChild(superHint);

    return superScript.outerHTML;
}

function showCardFooter(url1, label1, id1, url2, label2, id2, url3, label3, id3) {
    let firstElem = document.createElement('a');
    firstElem.setAttribute('target', '_blank');
    firstElem.setAttribute('class', 'card-footer-item');
    firstElem.setAttribute('id', id1);
    firstElem.setAttribute('href', url1);
    firstElem.setAttribute('rel', 'noreferrer');
    firstElem.innerText = label1;

    let secondElem = document.createElement('a');
    secondElem.setAttribute('target', '_blank');
    secondElem.setAttribute('class', 'card-footer-item');
    secondElem.setAttribute('id', id2);
    secondElem.setAttribute('href', url2);
    secondElem.setAttribute('rel', 'noreferrer');
    secondElem.innerText = label2;

    let thirdElem = document.createElement('a');
    thirdElem.setAttribute('target', '_blank');
    thirdElem.setAttribute('class', 'card-footer-item');
    thirdElem.setAttribute('id', id3);
    thirdElem.setAttribute('href', url3);
    thirdElem.setAttribute('rel', 'noreferrer');
    thirdElem.innerText = label3;

    return firstElem.outerHTML + secondElem.outerHTML + thirdElem.outerHTML;
}

function showNumberOfFeatures(count) {
    let countDiv = document.getElementById('featuresCount');
    countDiv.textContent = 'Obiekty na mapie: ' + count + ' ∘ ';
    return countDiv.outerHTML;
}

//#endregion DOM

//#region Geo+Map functions
function getCoords(feature) {
    if (feature) {
        let lat = feature.geometry.coordinates[1];
        let lon = feature.geometry.coordinates[0];
        return [parseFloat(lat), parseFloat(lon)];
    }
}

function getBbox(lat, long)
{
    let top = lat + 0.001144;
    let bottom = lat - 0.001144;
    let left = long - 0.00074;
    let right = long + 0.00074;
    let bbox = [left, top, right, bottom];
    return bbox;
}

function setZoomStyle(zoom) {
    let interactiveMode;
    let myRadius;

    if (zoom >= 14) {
        myRadius = zoom * 0.6;
        interactiveMode = true;
    } else {
        myRadius = zoom * 0.4;
        interactiveMode = false;
    }

    options = {
        radius: myRadius,
        interactive: interactiveMode
    };

    return options;
}

function setLabelZoomVisibility(zoom, zoomLevel, layer, layerLabel)
{
    if (zoom > zoomLevel) {
        if (map.hasLayer(layer)) {
            if (!map.hasLayer(layerLabel)) {
                layerLabel.addTo(map);
            }
        }
    } else {
        if (map.hasLayer(layerLabel)) {
            map.removeLayer(layerLabel);
        }
    }
}

function addActiveMarker(layer) {
    activeMarkers.push(layer);
    activeMarkers[0].setStyle({
        color: defaultMarkerBorderColor,
        fillColor: '#800000',
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
//#endregion Geo+Map functions

//#region Window functions
function getFeatureIdFromHash(url) {
    // To do - case with url without '#' part
    let match = url.match(/#.*[,][NnWwRr][0-9]+/);
    if (match) {
        let splittedUrl = match[0].split(',');
        let idFromUrl = splittedUrl[1];

        return idFromUrl;
    } else {}
}

function setFeatureIdHash(id, replace) {
    let url = window.location.href;
    let oldValue, newValue;

    if (getFeatureIdFromHash(url) == id && !replace) {

    } else if (getFeatureIdFromHash(url) && getFeatureIdFromHash(url) != id && !replace) {
        oldValue = getFeatureIdFromHash(url);
        newValue = id;
        window.location.href = window.location.href.replace(oldValue, newValue);
    } else if (replace) {
        oldValue = getFeatureIdFromHash(url);
        newValue = '';
        window.location.href = window.location.href.replace(',' + oldValue, newValue);
    } else if (!url.includes('#')) {
        window.location.href = window.location.href + '#' + id;
    } else {
        window.location.href = window.location.href + ',' + id;
    }
}
//#endregion Window functions

//#region OSM Data processing

function translateValue(dict, tagName, property) {
    let translated = '';
    if (dict[tagName + ':' + property]) {
        translated = dict[tagName + ':' + property][locale.slice(0, 2)] || property;
    } else {
        translated = property;
    }
    return translated;
}

function tag(feature, tagName, replaceUndefined) {
    //to do: obsługa wielu wartości w tagu
    if (feature) {
        if (tagName) {
            let property = feature.properties.tags[tagName];
            if (property) {
                return translateValue(valuesDictionary, tagName, property);
            } else {
                return replaceUndefined || undefined;
            }
        } else {
            return undefined;
        }
    } else {
        return undefined;
    }
}

function label(tagName) {
    if (typeof tagName) {
        try {
            let dict = tagsDictionary[tagName];
            return dict[locale.slice(0, 2)] || dict.pl || tagName;
        } catch (error) {
            return undefined;
        }
    }
}

function showProperty(caption, property, postfix) {
    if (property && property !== '') {
        return (caption || '') + '' + property + '' + (postfix || '');
    } else
        return '';
}

function parseOpeningHours(property) {
    if (property) {
        let hoursPrettified;
        try {
            let hours = property.toString();
            let oh = new opening_hours(hours, undefined, 2);
            hoursPrettified = oh.prettifyValue({
                conf: {
                    locale: locale
                },
            });
        } catch (error) {
            return undefined;
        }

        return hoursPrettified || '';
    }
}

function getPoiOsmUrl(action, feature, editType) {
    const osmUrl = "https://www.openstreetmap.org";
    let core;
    let featureId = feature.properties.id;
    let featureType = feature.properties.type;
    let postfix = '#map=19/' + getCoords(feature)[0] + '/' + getCoords(feature)[1];

    if (action == 'edit') {
        core = "/edit?" + 'editor=' + editType + '&' + featureType + "=" + featureId;
    } else {
        core = "/" + featureType + "/" + featureId;
    }
    return osmUrl + core + postfix;
}

function getJosmEditUrl(feature)
{
    const JosmEditUrl = 'http://127.0.0.1:8111/';
    let featureId = feature.properties.id;
    let featureType = feature.properties.type;
    let bbox = getBbox(getCoords(feature)[0], getCoords(feature)[1]);
    let params = `load_and_zoom?left=${bbox[0]}&top=${bbox[1]}&right=${bbox[2]}&bottom=${bbox[3]}&select=${featureType}${featureId}&changeset_hashtags=MappingPOWInPoland`;
    return JosmEditUrl + params;
}

function markerFilter(feature, layer) {
    // categories kept short to not make .geojson too big
    if (feature.properties.n == 1) {
        layer.addTo(wrongNameMarkers);
    }

    if (feature.properties.s === 1) {
        layer.addTo(wrongShortnameMarkers);
    }

    if (feature.properties.d == 1) {
        layer.addTo(missingDenominationTagMarkers);
    }

    if (feature.properties.b == 1) {
        layer.addTo(missingBuildingNameValueMarkers);
    }

    if (feature.properties.o == 1) {
        layer.addTo(wrongServiceHoursValueMarkers);
    }

    if (feature.properties.e == 1) {
        layer.addTo(missingDeaneryTagMarkers);
    }

    if (feature.properties.i == 1) {
        layer.addTo(missingDioceseTagMarkers);
    }

    if (feature.properties.r) {
        layer.addTo(religions[feature.properties.r]);
    }
}
//#endregion Values processing

//#region Wikimedia functions

function getWikimediaCommonsLicenseInfo(filename) {
    let wikiLicenseUrl;
    // refactoring needed (catching error`)
    if (filename) {
        let author, license, contributionInfo;

        var wikidataUrl = 'https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&titles=File%3A' + encodeURIComponent(filename) + '&format=json&origin=*';
        return fetch(wikidataUrl, {
                method: "GET",
            })
            .then(response => response.json())
            .then(json => {
                if (json) {
                    author = json.query.pages[-1].imageinfo[0].extmetadata.Artist.value;
                    license = json.query.pages[-1].imageinfo[0].extmetadata.LicenseShortName.value;

                    if (json.query.pages[-1].imageinfo[0].extmetadata.LicenseUrl.value) {
                        wikiLicenseUrl = json.query.pages[-1].imageinfo[0].extmetadata.LicenseUrl.value;
                    }

                    let contributionInfo = {
                        'author': author || '',
                        'license': license || '?',
                        'licenseUrl': wikiLicenseUrl || ''
                    };
                    showContribution(contributionInfo);
                }
            })
            .catch(error => {
                author = '<a href="https://commons.wikimedia.org/wiki/Strona_g%C5%82%C3%B3wna?uselang=pl" target="_blank" rel="noopener">Wikimedia Commons</a>';
                license = 'Domena publiczna';
                contributionInfo = {
                    'author': author,
                    'license': license,
                    'licenseUrl': 'https://pl.wikipedia.org/wiki/Domena_publiczna' //licenseUrl  || 
                };
                showContribution(contributionInfo);
            });
    }
}

function getWikimediaCommonsUrl(imgName) {
    if (imgName) {
        imgName = imgName.split(' ').join('_');
        let WikimediaUrlBase = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
        let size = 350;
        let md5_part = md5(imgName).toString();
        let firstPart = "/" + md5_part[0];
        let secondPart = "/" + md5_part.slice(0, 2);
        let thirdPart = "/" + imgName;
        let fourthPart = '/' + size + 'px-' + imgName;
        let fullUrl = WikimediaUrlBase + firstPart + secondPart + thirdPart + fourthPart;
        return fullUrl;
    }
}

function getWikipediaUrl(property) {
    if (property && property.includes(":")) {
        let wikipediaUrl = property.split(':');
        return 'https://' + wikipediaUrl[0] + '.wikipedia.org/wiki/' + encodeURIComponent(wikipediaUrl[1]);
    }
}

function parseWikipediaTitle(property) {
    if (typeof property !== 'undefined' && property.includes(":")) {
        let wikipediaUrl = property.split(':');
        return wikipediaUrl[1];
    }
}

function getWikidataImg(property) {
    if (typeof property !== 'undefined' && property.startsWith('Q')) {
        var wikidataUrl =
            'https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&origin=*&property=P18&entity=' +
            encodeURIComponent(property);
        return fetch(wikidataUrl, {
                method: "GET",
            })
            .then(response => response.json())
            .then(json => {
                if (json.claims.P18) {
                    let wikimediaCommonsFile = json.claims.P18[0].mainsnak.datavalue.value;
                    getWikimediaCommonsLicenseInfo(wikimediaCommonsFile);
                    return setCardImage(getWikimediaCommonsUrl(wikimediaCommonsFile));
                }
            })
            .catch(error => {
                console.warn(error.message);
            });
    }
}
//#endregion Wikimedia functions

//#region images functions
function parseImageTag(imageUrl) {
    let cardNewImage = '';
    imageUrl = imageUrl.replace('http://', 'https://');

    // Wikimedia
    if (imageUrl.startsWith(wikimediaCommonsPrefix) || imageUrl.startsWith(wikimediaCommonsShortPrefix)) {
        let shortFileName = imageUrl.replace(wikimediaCommonsPrefix, '').split(':'); // removes ['File', 'Plik' etc]
        cardNewImage = decodeURIComponent(shortFileName[1]);
        return cardNewImage;
    }
    //Mapillary (direct url)
    else if (imageUrl.startsWith(mapillaryImagesPrefix)) {
        let targetImageSize = 640;
        let cardNewImage = imageUrl.replace('thumb-2048', 'thumb-' + targetImageSize).replace('thumb-1024', 'thumb-' + targetImageSize);
        return cardNewImage;
    } else {
        return undefined;
    }
}
//#endregion images functions