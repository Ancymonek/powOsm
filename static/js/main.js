// TO DO:
// parse multivalues (url)
// validate ALL urls (some containc multiple values (;))
// denomination: orthodox - different religions
// url to card - set active marker
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
}
const baseUrl = window.location.origin;
const wikimediaCommonsPrefix = 'https://commons.wikimedia.org/wiki/';
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
            let license = contributionInfo.license;
            let licenseUrl = contributionInfo.licenseUrl;

            if (licenseUrl) {
                licensePart = '<a href=' + licenseUrl + ' target="_blank">' + license + '</a>';
            } else {
                licensePart = license;
            }
            if (author.startsWith('No machine-readable')) {
                author = '<sup>?</sup>';
            }

            contributionDiv.innerHTML = author + (separator || '') + licensePart;
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

function showUrlTag(tagName, url, title, newTagLabel = undefined, postfix = undefined) {
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

        cardHeader.innerHTML = tagLabel.outerHTML + ': ' + tagValue.outerHTML + (postfix || ' <sup>🔗</sup>');

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

function showCardFooter(url1, label1, id1, url2, label2, id2)
{
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

    return firstElem.outerHTML + secondElem.outerHTML;
}

function showNumberOfFeatures(count)
{
    let countDiv = document.getElementById('featuresCount');
    countDiv.textContent = 'Elementy na mapie: ' + count + ' ∘ ';
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

function setZoomStyle(zoom) {
    let interactiveMode;
    let myRadius;

    if (zoom >= 14) {
        myRadius = zoom * 0.6;
        interactiveMode = true;
    } else {
        myRadius = zoom * 0.25;
        interactiveMode = false;
    }

    options = {
        radius: myRadius,
        interactive: interactiveMode
    };

    return options;
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

function getPoiOsmUrl(action, feature) {
    const osmUrl = "https://www.openstreetmap.org";
    let core;
    let featureId = feature.properties.id;
    let featureType = feature.properties.type;
    let postfix = '#map=19/' + getCoords(feature)[0] + '/' + getCoords(feature)[1];

    if (action == 'edit') {
        core = "/edit?" + featureType + "=" + featureId;
    } else {
        core = "/" + featureType + "/" + featureId;
    }
    return osmUrl + core + postfix;
}

function markerFilter(feature, layer) {
    if (feature.properties.n == 1) {
        return layer.addTo(wrongNameMarkers);
    } 

    if (feature.properties.n == 2) {
        return layer.addTo(wrongShortnameMarkers);
    } 
    
    if (feature.properties.r == 1) {
        return layer.addTo(missingReligionTagMarkers);
    }
    
    if (feature.properties.d == 1) {
        return layer.addTo(missingDenominationTagMarkers);
    }

    if (feature.properties.b == 1) {
        return layer.addTo(missingBuildingNameValueMarkers);
    }
}

//#endregion Values processing

//#region Wikimedia functions

function getWikimediaCommonsLicenseInfo(filename) {
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
                    if (license == 'Public domain') {
                        license = 'Domena publiczna';
                    }

                    //licenseUrl = json.query.pages[-1].imageinfo[0].extmetadata.LicenseUrl.value;
                    let contributionInfo = {
                        'author': author || '',
                        'license': license || '?',
                        'licenseUrl': '' //licenseUrl  || to fix
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
                    'licenseUrl': '' //licenseUrl  || 
                };
                showContribution(contributionInfo);
            });
    }
}

function getWikimediaCommonsUrl(imgName) {
    if (imgName) {
        imgName = imgName.split(' ').join('_');
        let size = 350;
        let urlBase = 'https://upload.wikimedia.org/wikipedia/commons/thumb';
        let md5 = CryptoJS.MD5(imgName).toString();
        let firstPart = "/" + md5[0];
        let secondPart = "/" + md5.slice(0, 2);
        let thirdPart = "/" + imgName;
        let fourthPart = '/' + size + 'px-' + imgName;
        let fullUrl = urlBase + firstPart + secondPart + thirdPart + fourthPart;
        return fullUrl;
    }
}

function getWikimediaCommonsImg(property) {
    return 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=240&format=json' +
        '&titles=' + encodeURIComponent(property);
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
    if (imageUrl.startsWith(wikimediaCommonsPrefix) || imageUrl.startsWith("File:")) {
        let shortFileName = imageUrl.replace(wikimediaCommonsPrefix, '').split(':'); // removes ['File', 'Plik' etc]
        let decodedFileName = decodeURIComponent(shortFileName[1]);
        let fullWikimediaUrl = getWikimediaCommonsUrl(decodedFileName);
        
        getWikimediaCommonsLicenseInfo(decodedFileName);
        cardNewImage = fullWikimediaUrl;
        return cardNewImage;
    }

    //Mapillary (direct url)
    else if (imageUrl.startsWith(mapillaryImagesPrefix)) {
        let targetImageSize = 640;
        let contributionInfo = {
            'author': '<a href="' + imageUrl + '" target="_blank" rel="noreferrer">Mapillary</a>',
            'license': 'CC BY-SA 4.0',
            'licenseUrl': 'https://creativecommons.org/licenses/by-sa/4.0/' //licenseUrl  || 
        };
        showContribution(contributionInfo);
        let newUrl = imageUrl.replace('thumb-2048', 'thumb-' + targetImageSize).replace('thumb-1024', 'thumb-' + targetImageSize);

        cardNewImage = newUrl;
        return cardNewImage;
    } else {
        return undefined;
    }
}
//#endregion images functions