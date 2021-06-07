// Vector layer
const source = new ol.source.Vector({
    format: new ol.format.GeoJSON(),
    strategy: ol.loadingstrategy.bbox,
    url: function(extent, resolution, projection) {
        // Retreive checked parameters
        /*			let list = permanentCheckboxList(options.selectorName).filter(
        					function(evt) {
        						return evt !== 'on'; // Except the "all" input (default value = "on")
        					}),*/
        let bbox = null;

        if (ol.extent.getWidth(extent) != Infinity) {
            bbox = ol.proj.transformExtent(
                extent,
                projection.getCode(),
                'EPSG:4326' // Received projection
            );
        }
        //return 'https://chemineur.fr/ext/Dominique92/GeoBB/gis.php?bbox=' + bbox.join(',');
        return 'http://www.refuges.info/api/bbox?nb_points=all&type_points=7,10,9,23,6,3,28&bbox=' + bbox.join(',');
    },
});

source.on('change', function(evt) {
    //TODO Load status ???
});

const clusterSource = new ol.source.Cluster({
    distance: 32,
    source: source,
    WWWW_geometryFunction: function(feature) {
        //TODO getInteriorPoint() for polygons
        return feature.getGeometry();
    }
});

const chemLayer = new ol.layer.Vector({
    source: clusterSource,
    style: function(feature) {
        const style = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 16,
                stroke: new ol.style.Stroke({
                    color: 'red',
                }),
            }),
            text: new ol.style.Text({
                text: feature.get('features').length.toString(),
				font: '16px Calibri,sans-serif',
                fill: new ol.style.Fill({
                    color: 'red',
                }),
            }),
        });

        if (feature.getProperties().features.length == 1)
            feature = feature.getProperties().features[0];

        const typewri = feature.getProperties().type; // WRI
        icon = feature.getProperties().icon; // Chemineur


        if (typewri)
            icon = 'http://www.refuges.info/images/icones/' + typewri.icone + '.svg';
        if (icon)
            style.setImage(new ol.style.Icon({
                src: icon,
            }));

        return style;
    },
});

// Hover
const hoverStyle = new ol.style.Style({
        text: new ol.style.Text({
            font: '16px Calibri,sans-serif',
            fill: new ol.style.Fill({
                color: 'black',
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(255,255,255,0.5)',
                width: 10,
            }),
        }),
    }),
    hoverLayer = new ol.layer.Vector({
        source: new ol.source.Vector(),
        style: function(feature) {
            hoverStyle.getText().setText(feature.get('name') || feature.get('nom'));
            return hoverStyle;
        },
    });

// Map
const map = new ol.Map({
    target: 'map',
    controls: controlsCollection({
        baseLayers: layersCollection(),
    }),
});

map.on('moveend', function(evt) {
    const zoom = evt.target.getView().getZoom(),
        distance = Math.max(8, Math.min(10 * (13 - zoom), 50));
    clusterSource.setDistance(distance);
});

let hoveredFeature;
map.on('pointermove', function(evt) {
    const pixel = map.getEventPixel(evt.originalEvent),
        feature = map.forEachFeatureAtPixel(pixel, function(feature) {
            return feature;
        });

    if (feature !== hoveredFeature) {
        //TODO changer le curseur
        if (hoveredFeature) {
            hoverLayer.getSource().removeFeature(hoveredFeature);
        }
        if (feature) {
            hoverLayer.getSource().addFeature(feature);
        }
        hoveredFeature = feature;
    }
});

map.on('click', function(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
    });
    if (feature) {
        const link = feature.getProperties().link;
        if (link) {
            if (evt.originalEvent.ctrlKey) {
                const tab = window.open(link, '_blank');
                if (evt.originalEvent.shiftKey)
                    tab.focus();
            } else
                window.location = link;
        }
    }
});

map.addLayer(chemLayer);
map.addLayer(hoverLayer);