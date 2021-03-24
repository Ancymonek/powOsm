const valuesDictionary = {
    //religion:
    'religion:christian': {
        'en': 'christian',
        'pl': 'chrześcijaństwo'
    },
    'religion:jewish': {
        'en': 'jewish',
        'pl': 'judaizm'
    },
    'religion:muslim': {
        'en': 'muslim',
        'pl': 'islam'
    },
    'religion:multifaith': {
        'pl': 'wiele religii'
    },
    'religion:buddhist': {
        'en': 'buddhist',
        'pl': 'buddyzm'
    },
    'religion:hindu': {
        'en': 'hindu',
        'pl': 'hinduizm'
    },
    'religion:pagan': {
        'en': 'pagan',
        'pl': 'pogaństwo'
    },

    //denomination
    'denomination:roman_catholic': {
        'en': 'roman catholic',
        'pl': 'katolicyzm'
    },
    'denomination:catholic': {
        'en': 'roman catholic',
        'pl': 'katolicyzm'
    },
    'denomination:orthodox': {
        'pl': 'prawosławie',
        'en': 'orthodox'
    },
    'denomination:sunni': {
        'en': 'sunni',
        'pl': 'sunnizm'
    },
    'denomination:shia': {
        'en': 'shia',
        'pl': 'szyizm'
    },
    'denomination:lutheran': {
        'en': 'lutheran',
        'pl': 'luteranizm'
    },
    'denomination:methodist': {
        'en': 'methodist',
        'pl': 'metodyzm'
    },
    'denomination:baptist': {
        'en': 'baptist',
        'pl': 'baptyzm'
    },
    'denomination:evangelical': {
        'en': 'evangelical',
        'pl': 'ewangelicyzm'
    },
    'denomination:presbyterianism': {
        'en': 'presbyterianism',
        'pl': 'prezbiterianizm'
    },
    'denomination:seventh_day_adventist': {
        'en': 'Seventh Day Adventist',
        'pl': 'Kościół Adwentystów Dnia Siódmego'
    },
    'denomination:polish_catholic': {
        'pl': 'polskokatolicyzm'
    },
    'denomination:pentecostal': {
        'pl': 'pentekostalizm'
    },
    'denomination:jehovahs_witness': {
        'pl': 'Świadkowie Jehowy'
    },
    'denomination:protestant': {
        'pl': 'protestantyzm',
        'en': 'protestant'
    },
    'denomination:mariavite': {
        'pl': 'mariawityzm'
    },
    'denomination:greek_catholic': {
        'pl': 'Kościół greckokatolicki'
    },
    'denomination:greek_orthodox': {
        'pl': 'prawosławie'
    },
    'denomination:old_catholic': {
        'pl': 'starokatolicyzm'
    },
    'denomination:nondenominational': {
        'pl': 'bezwyznaniowe',
        'en': 'non-denominational'
    },
    'denomination:hare_krishna': {
        'pl': 'Hare Kryszna',
        'en': 'Hare Krishna'
    },
    'denomination:new_apostolic': {
        'pl': 'Kościół Nowoapostolski',
        'en': 'New Apostolic Church'
    },
    'denomination:armenian_apostolic': {
        'pl': 'Apostolski Kościół Ormiański',
        'en': 'Armenian Apostolic Church'
    },
    'denomination:millenarianism': {
        'pl': 'milenaryzm',
        'en': 'millenarianism'
    },
    "denomination:exclusive_brethren": {
        'pl': 'Bracia plymuccy (bracia zamknięci)',
        'en': 'Exclusive Brethren'
    },
    "denomination:quaker": {
        'pl': 'Religijne Towarzystwo Przyjaciół (kwakrzy)',
        'en': 'Quakers'
    },
    "denomination:lectorium_rosicrucianum": {
        'pl': 'Lectorium Rosicrucianum',
        'en': 'Lectorium Rosicrucianum'
    },

    'building:church': {
        'pl': 'kościół',
        'en': 'church'
    },
    'building:cathedral': {
        'pl': 'katedra',
        'en': 'cathedral'
    },
    'building:basilica': {
        'pl': 'bazylika',
        'en': 'basilica'
    },
    'building:chapel': {
        'pl': 'kaplica',
        'en': 'chapel'
    },
    'building:synagogue': {
        'pl': 'synagoga',
        'en': 'synagogue'
    },
    'building:mosque': {
        'pl': 'meczet',
        'en': 'mosque'
    },
    'building:temple': {
        'pl': 'świątynia',
        'en': 'temple'
    },
    'building:monastery': {
        'pl': 'klasztor',
        'en': 'monastery'
    },
    'building:convent': {
        'pl': 'klasztor',
        'en': 'convent'
    },
    'building:yes': {
        'pl': 'tak',
        'en': 'yes'
    },
    'building:house': {
        'pl': 'dom',
        'en': 'house'
    },
    'building:education': {
        'pl': 'oświatowy',
        'en': 'education'
    },
    'building:residential': {
        'pl': 'mieszkalny',
        'en': 'residential'
    },
    'building:roof': {
        'pl': 'zadaszenie',
        'en': 'roof'
    },
    'building:no': {
        'pl': 'nie',
        'en': 'no'
    },
    'building:construction': {
        'pl': 'budynek w budowie',
        'en': 'construction'
    },
    'building:industrial': {
        'pl': 'budynek przemysłowy',
        'en': 'industrial'
    },
    'building:wayside_shrine': {
        'pl': 'kapliczka',
        'en': 'wayside shrine'
    },
    'wheelchair:limited': {
        'pl': 'ograniczone',
        'en': 'limited'
    },
    'wheelchair:yes': {
        'pl': 'tak',
        'en': 'yes'
    },
    'wheelchair:no': {
        'pl': 'nie',
        'en': 'no'
    },
    'church:type:parish': {
        'pl': 'parafialny',
        'en': 'parish'
    },
    'church:type:filial': {
        'pl': 'filialny',
        'en': 'filial'
    },
    'church:type:garrison': {
        'pl': 'garnizonowy',
        'en': 'garrison'
    },
    'church:type:hospital': {
        'pl': 'szpitalny',
        'en': 'hospital'
    },
    'church:type:rectoral': {
        'pl': 'pomocniczy',
        'en': 'rectoral'
    },
    'church:type:monastic': {
        'pl': 'klasztorny',
        'en': 'klasztorny'
    },
    'church:type:prison': {
        'pl': 'więzienny',
        'en': 'prison'
    },
    'church:type:cemetery': {
        'pl': 'cmentarny',
        'en': 'cemetery'
    },
    'building:architecture:baroque': {
        'pl': 'barok',
        'en': 'baroque'
    },
    'building:architecture:gothic': {
        'en': 'gothic',
        'pl': 'gotyk'
    },
    'building:architecture:romanesque': {
        'pl': 'architektura romańska',
        'en': 'romanesque'
    },
    'building:architecture:neo-romanesque': {
        'pl': 'neoromanizm',
        'en': 'neo-romanesque'
    },
    'building:architecture:neo-baroque': {
        'pl': 'neobarok',
        'en': 'neo-baroque'
    },
    'building:architecture:neo-gothic': {
        'pl': 'neogotyk',
        'en': 'neo-gothic'
    },
    'building:architecture:renaissance': {
        'pl': 'renesans',
        'en': 'renaissance'
    },
    'building:architecture:modern': {
        'en': 'modern',
        'pl': 'nowoczesna'
    },
    'community:gender:male': {
        'en': 'male',
        'pl': 'męski'
    },
    'community:gender:female': {
        'en': 'female',
        'pl': 'żeński'
    },

};

const tagsDictionary = {
    'religion': {
        'en': 'religion',
        'pl': 'religia'
    },
    'denomination': {
        'en': 'denomination',
        'pl': 'wyznanie'
    },
    'deanery': {
        'en': 'deanery',
        'pl': 'dekanat'
    },
    'name': {
        'en': 'name',
        'pl': 'nazwa'
    },
    'church:type': {
        'en': 'church type',
        'pl': 'rodzaj kościoła'
    },
    'diocese': {
        'en': 'diocese',
        'pl': 'diecezja'
    },
    'service_times': {
        'en': 'times of service',
        'pl': 'godziny nabożeństw'
    },
    'opening_hours': {
        'en': 'opening hours',
        'pl': 'godziny otwarcia'
    },
    'building': {
        'en': 'building',
        'pl': 'budynek'
    },
    'heritage_register': {
        'en': 'heritage register',
        'pl': 'numer zabytku'
    },
    'telephone': {
        'en': 'telephone',
        'pl': 'telefon'
    },
    'description': {
        'en': 'description',
        'pl': 'dodatkowy opis'
    },
    'operator': {
        'en': 'operator',
        'pl': 'zarządzający'
    },
    'start_date':
    {
        'en': 'start date',
        'pl': 'data od'
    },
    'year_of_construction': {
        'en': 'year of construction',
        'pl': 'data wybudowania' 
    },
    'architect': {
        'en': 'architect',
        'pl': 'architekt' 
    },
    'wheelchair': {
        'en': 'wheelchair access',
        'pl': 'dostępność dla niepełnosprawnych' 
    },
    'community': {
        'en': 'community',
        'pl': 'skrót zakonny' 
    },
    'community:gender': {
        'en': 'community gender',
        'pl': 'typ zakonu' 
    },
};

const interfaceDictionary = {
    'building': {
        'en': 'building',
        'pl': 'budynek'
    },
    'organization': {
        'en': 'organization',
        'pl': 'organizacja'
    },
    'address': {
        'en': 'address',
        'pl': 'adres'
    },
    'additional_info': {
        'en': 'additional info',
        'pl': 'dodatkowe informacje'
    },
    'contact': {
        'en': 'contact',
        'pl': 'kontakt'
    },
    'stats': {
        'en': 'Statistics',
        'pl': 'Statystyki'
    },
};

function featureTags(apiFeature)
{
    let tags = {
        'id': {
            'label': 'id',
            'value': apiFeature.properties.id
        },
        'type': {
            'label': 'type',
            'value': apiFeature.properties.type
        },
        'name': {
            'label': label('name'),
            'value': tag(apiFeature, 'name') || ''
        },
        'localName': {
            'label': 'nazwa w języku przeglądarki',
            'value': tag(apiFeature, 'name:' + locale.slice(0, 2))
        },
        'religion': {
            'label': label('religion'),
            'value': tag(apiFeature, 'religion') || ''
        },
        'denomination': {
            'label': label('denomination'),
            'value': tag(apiFeature, 'denomination') || ''
        },
        'churchType': {
            'label': label('church:type'),
            'value': tag(apiFeature, 'church:type') || ''
        },
        'operator': {
            'label': label('operator'),
            'value': tag(apiFeature, 'operator') || ''
        },
        'diocese': {
            'label': label('diocese'),
            'value': tag(apiFeature, 'diocese') || ''
        },
        'deanery': {
            'label': label('deanery'),
            'value': tag(apiFeature, 'deanery') || ''
        },
        'serviceTimes': {
            'label': label('service_times'),
            'value': parseOpeningHours(tag(apiFeature, 'service_times')) || ''
        },
        'openingHours': {
            'label': label('opening_hours'),
            'value': parseOpeningHours(tag(apiFeature, 'opening_hours')) || ''
        },
        'community': {
            'label': label('community'),
            'value': tag(apiFeature, 'community') || ''
        },
        'communityGender': {
            'label': label('community:gender'),
            'value': tag(apiFeature, 'community:gender') || ''
        },
        'building': {
            'label': label('building'),
            'value': tag(apiFeature, 'building') || ''
        },
        'startDate': {
            'label': label('start_date'),
            'value': tag(apiFeature, 'start_date') || ''
        },
        'yearOfConstruction': {
            'label': label('year_of_construction'),
            'value': (tag(apiFeature, 'year_of_construction') || tag(apiFeature, 'construction_date')) || ''
        },
        'architect': {
            'label': label('architect'),
            'value': tag(apiFeature, 'architect') || ''
        },
        'buildingArchitecture': {
            'label': 'styl architektoniczny',
            'value': tag(apiFeature, 'building:architecture') || ''
        },
        'historic': {
            'label': 'zabytek',
            'value': tag(apiFeature, 'historic') || ''
        },
        'heritage': {
            'label': label('heritage_register'),
            'value': tag(apiFeature, 'heritage') || ''
        },
        'heritageRef': {
            'label': label('heritage_register'),
            'value': tag(apiFeature, 'ref:nid')
        },
        'city': {
            'label': 'miejscowość',
            'value': tag(apiFeature, 'addr:city') || ''
        },
        'place': {
            'label': 'miejsce',
            'value': tag(apiFeature, 'addr:place') || ''
        },
        'street': {
            'label': 'ulica',
            'value': tag(apiFeature, 'addr:street') || ''
        },
        'houseNumber': {
            'label': 'numer budynku',
            'value': tag(apiFeature, 'addr:housenumber') || ''
        },
        'postCode': {
            'label': 'kod pocztowy',
            'value': tag(apiFeature, 'addr:postcode') || ''
        },
        'website': {
            'label': 'strona internetowa',
            'value': (tag(apiFeature, 'website') || tag(apiFeature, 'contact:website')) || ''
        },
        'email': {
            'label': 'e-mail',
            'value': (tag(apiFeature, 'email') || tag(apiFeature, 'contact:email')) || ''
        },
        'phone': {
            'label': label('telephone'),
            'value': (tag(apiFeature, 'phone') || tag(apiFeature, 'contact:phone')) || ''
        },
        'url': {
            'label': 'adres z dodatkowymi informacjami',
            'value': tag(apiFeature, 'url') || ''
        },
        'description': {
            'label': label('description'),
            'value': tag(apiFeature, 'description') || ''
        },
        'wheelchair': {
            'label': label('wheelchair'),
            'value': tag(apiFeature, 'wheelchair') || ''
        },
        'image': {
            'label': '',
            'value': tag(apiFeature, 'image') || ''
        },
        'wikidata': {
            'label': 'Wikidata',
            'value': tag(apiFeature, 'wikidata') || ''
        },
        'wikipedia': {
            'label': 'Wikipedia',
            'value': tag(apiFeature, 'wikipedia') || ''
        },
        'mapillary': {
            'label': 'Mapillary',
            'value': tag(apiFeature, 'mapillary') || ''
        },
    };
    return tags;
}

const religions = {
    1: missingReligionTagMarkers,
    2: christianMarkers,
    3: jewishMarkers,
    4: buddhismMarkers,
    5: muslimMarkers,
    6: hinduMarkers,
    7: multifaithMarkers,
    8: paganMarkers,
    9: otherReligonMarkers
};