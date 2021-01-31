//Create new l.Control - for Card Infobox purposes
L.Control.Card = L.Control.extend({
    options: {
        position: 'topright'
    },

    initialize: function (innerHTML, title, subtitle, image, footer, options) {
        this._innerHTML = innerHTML;
        this._title = title;
        this._subtitle = subtitle;
        this._image = image;
        this._footer = footer;
        L.Util.setOptions(this, options);
    },

    onAdd: function (map) {
        // add reference to mapinstance
        map.card = this;
        document.title = this._title + ' - ' + title;
        this._defaultImage = 'static/img/christian_church.png';

        this._container = L.DomUtil.create('div', 'card poi-card');
        L.DomEvent.disableClickPropagation(this._container);
        this._imageDiv = L.DomUtil.create('div', 'card-image', this._container);

        this._imageContribution = L.DomUtil.create('div', 'contribution px-2 has-background-dark-brown-transparent has-text-white is-relative is-pulled-left is-size-7 has-text-weight-light is-hidden', this._imageDiv);
        this._imageContribution.id = 'contribution';
        this._imageContribution.innerHTML = ' ';
        this._cardRemoveButton = L.DomUtil.create('button', 'delete is-medium is-pulled-right close-button m-3', this._imageDiv);
        this._cardRemoveButton.setAttribute('onclick', 'map.removeControl(card);');
        this._cardRemoveButton.setAttribute('aria-label', 'Close button');

        // Card image object
        this._cardImage = new Image();
        this._cardImage.alt = ' Loading image...';
        this._cardImage.id = 'poi-card-image';
        this._cardImage.onload = function () {};
        this._cardImage.setAttribute('onerror', "this.src='" + this._defaultImage + "'");
        this._cardImage.setAttribute('class', "poi-image");
        this._cardImage.src = this._image || this._defaultImage;

        this._figureImageDiv = L.DomUtil.create('figure', 'image is-2by1', this._imageDiv);

        // Figure and media
        this._figureImageDiv.appendChild(this._cardImage);
        this._mediaContent = L.DomUtil.create('div', 'media-content mb-2 p-4 is-relative has-background-dark-brown-transparent', this._figureImageDiv);
        this._cardTitle = L.DomUtil.create('p', 'title is-4 has-text-white', this._mediaContent);
        this._cardSubtitle = L.DomUtil.create('p', 'subtitle is-6 has-text-weight-light has-text-light pt-2', this._mediaContent);

        this._cardTitle.innerHTML = this._title;
        this._cardSubtitle.innerHTML = this._subtitle;
        this._contentDiv = L.DomUtil.create('div', 'content has-text-weight-light m-4 is-size-6', this._container);
        this._contentDiv.innerHTML = this._innerHTML;

        this._footerDiv = L.DomUtil.create('footer', 'card-footer has-background-white-ter', this._container);
        this._footerDiv.innerHTML = this._footer;

        return this._container;
    },

    onRemove: function (map) {
        document.title = title;
        setFeatureIdHash(activeCard, true);
        activeCard = 0;
        clearActiveMarker(circleMarkerStyle);
        L.DomUtil.remove(this._container);
    }

});
L.control.card = function (innerHTML, title, subtitle, image, footer, options) {
    return new L.Control.Card(innerHTML, title, subtitle, image, footer, options);
};