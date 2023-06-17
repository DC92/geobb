/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON.js';
import Icon from 'ol/style/Icon.js';
import OSMXML from 'ol/format/OSMXML.js';
import {
	Fill,
	Stroke,
} from 'ol/style.js';

// MyOl
import {
	basicStylesOptions,
	concatenateStylesOptions,
	labelStylesOptions,
	MyVectorLayer,
	ServerClusterVectorLayer,
} from './VectorLayer.js';


// chemineur.fr
export class LayerChemineur extends ServerClusterVectorLayer {
	constructor(options) {
		super({
			host: '//chemineur.fr/',
			attribution: '&copy;chemineur.fr',

			...options,

			query: query_,
			clusterQuery: clusterQuery_,
			stylesOptions: stylesOptions_,
		});

		function query_(opt) {
			return {
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: opt.selector.getSelection(),

				...(options.query ? options.query(...arguments) : null),
			};
		}

		function clusterQuery_() {
			return {
				layer: 'cluster',

				...query_(...arguments),
			};
		}

		function stylesOptions_(properties, _, layer) {
			return concatenateStylesOptions(
				basicStylesOptions(...arguments),
				[{
					image: new Icon({
						src: properties.icon ? // For isolated points on server cluster
							properties.icon : layer.options.host + 'ext/Dominique92/GeoBB/icones/' +
							(properties.type || 'a63') + '.svg',
					}),
				}],
			);
		}
	}
};

// alpages.info
export class LayerAlpages extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//alpages.info/',
			attribution: '&copy;alpages.info',

			...opt,
		};
		super({
			...options,

			query: query_,
			clickUrl: properties => options.host + 'viewtopic.php?t=' + properties.id,
			stylesOptions: stylesOptions_,
		});

		function query_(opt) {
			return {
				_path: 'ext/Dominique92/GeoBB/gis.php',
				forums: opt.selector.getSelection(),
			};
		}

		function stylesOptions_(properties) {
			return concatenateStylesOptions(
				basicStylesOptions(...arguments),
				[{
					image: new Icon({
						src: chemIconUrl(properties.type), // Replace the alpages icon
					}),
				}],
			);
		}
	}
}

// Get icon from chemineur.fr
export function chemIconUrl(type) {
	const icons = (type || 'a63').split(' ');

	return '//chemineur.fr/ext/Dominique92/GeoBB/icones/' +
		icons[0] +
		(icons.length > 1 ? '_' + icons[1] : '') + // Limit to 2 type names & ' ' -> '_'
		'.svg';
}

// refuges.info
export class LayerWri extends ServerClusterVectorLayer {
	constructor(options) {
		super({
			host: '//www.refuges.info/',
			name: properties => properties.nom, // Function returning the name for cluster agregation
			clickUrl: properties => properties.lien, // Function returning url to go on click

			...options,

			query: query_,
			clusterQuery: clusterQuery_,
			stylesOptions: stylesOptions_,
		});

		function query_(opt) {
			return {
				_path: 'api/bbox',
				nb_points: 'all',
				type_points: opt.selector ? opt.selector.getSelection() : null,

				...(options.query ? options.query(...arguments) : null),
			};
		}

		function clusterQuery_() {
			return {
				cluster: 0.1,

				...query_(...arguments),
			};
		}

		function stylesOptions_(properties, hover, layer) {
			return [{
					image: new Icon({
						src: layer.options.host + 'images/icones/' + properties.type.icone + '.svg',
					}),
				},
				labelStylesOptions({
					label: properties.nom, // Non hover
					name: properties.nom, // Hover properties...
					ele: properties.coord.alt,
					bed: properties.places.valeur,
					type: properties.type.valeur,
					attribution: layer.options.attribution,
				}, hover)
			];
		}
	}
}

/** RENEW RENEW RENEW RENEW RENEW RENEW */

//BEST make it a class
export function layerWriAreas(options) {
	/*
	return layerVector({
		host: '//www.refuges.info/',
		urlParams: {
			path: 'api/polygones',
			type_polygon: 1, // Massifs
		},
		zIndex: 2, // Behind points
		...options,
		convertProperties: properties => ({
			url: properties.lien,
		}),
		stylesOptionsDisplay: function(feature, properties) {
			// Build color and transparency
			const colors = properties.couleur
				.match(/([0-9a-f]{2})/ig)
				.map(c => parseInt(c, 16));

			return {
				...labelStylesOptions(feature, properties.nom, {
					padding: [1, -1, -1, 1],
					backgroundStroke: null,
					font: null,
				}),
				fill: new Fill({
					color: 'rgba(' + colors.join(',') + ',0.3)'
				}),
			};
		},
		stylesOptionsHover: (feature, properties) => ({
			...labelStylesOptions(feature, properties.nom, {
				padding: [1, 0, -1, 2],
				font: '12px Verdana',
				overflow: true, // Force display even if no place
			}),
			fill: new Fill({
				color: 'rgba(0,0,0,0)', // Transparent
			}),
			stroke: new Stroke({
				color: properties.couleur,
				width: 2,
			}),
		}),
	});
	*/
}

// pyrenees-refuges.com
//BEST make it a class
export function layerPrc(options) {
	return layerVectorCluster({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		convertProperties: properties => ({
			type: properties.type_hebergement,
			url: properties.url,
			icon: chemIconUrl(properties.type_hebergement),
			ele: properties.altitude,
			capacity: properties.cap_ete,
			attribution: '&copy;Pyrenees-Refuges',
		}),
		...options,
	});
}

// camptocamp.org
//BEST make it a class
export function layerC2C(options) {
	const format = new GeoJSON({ // Format of received data
		dataProjection: 'EPSG:3857',
	});

	format.readFeatures = function(json, opt) {
		const features = [],
			objects = JSONparse(json);

		for (let o in objects.documents) {
			const properties = objects.documents[o];

			features.push({
				id: properties.document_id,
				type: 'Feature',
				geometry: JSONparse(properties.geometry.geom),
				properties: {
					name: properties.locales[0].title,
					type: properties.waypoint_type,
					icon: chemIconUrl(properties.waypoint_type),
					ele: properties.elevation,
					url: '//www.camptocamp.org/waypoints/' + properties.document_id,
					attribution: '&copy;Camp2camp',
				},
			});
		}
		return format.readFeaturesFromObject({
				type: 'FeatureCollection',
				features: features,
			},
			format.getReadOptions(json, opt)
		);
	};

	return layerVectorCluster({
		host: 'https://api.camptocamp.org/',
		//strategy: bbox,
		format: format,
		...options,
		urlParams: (o, b, s, extent) => ({
			path: 'waypoints',
			bbox: extent.join(','),
		}),
	});
}

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
//BEST make it a class
export function layerOverpass(opt) {
	const options = {
			//host: 'https://overpass-api.de',
			//host: 'https://lz4.overpass-api.de',
			//host: 'https://overpass.openstreetmap.fr', // Out of order
			//host: 'https://overpass.nchc.org.tw',
			host: 'https://overpass.kumi.systems',
			maxResolution: 50,
			...opt,
		},
		format = new OSMXML(),
		layer = layerVectorCluster({
			//strategy: bbox,
			urlParams: urlParams,
			format: format,
			...options,
		}),
		statusEl = document.getElementById(options.selectName),
		selectEls = document.getElementsByName(options.selectName);

	// List of acceptable tags in the request return
	let tags = '';

	for (let e in selectEls)
		if (selectEls[e].value)
			tags += selectEls[e].value.replace('private', '');

	function urlParams(o, bbox, selections) {
		const items = selections[0].split(','), // The 1st (and only) selector
			bb = '(' + bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2] + ');',
			args = [];

		// Convert selected items on overpass_api language
		for (let l = 0; l < items.length; l++) {
			const champs = items[l].split('+');

			for (let ls = 0; ls < champs.length; ls++)
				args.push(
					'node' + champs[ls] + bb + // Ask for nodes in the bbox
					'way' + champs[ls] + bb // Also ask for areas
				);
		}

		return {
			path: '/api/interpreter',
			data: '[timeout:5];(' + args.join('') + ');out center;',
		};
	}

	// Extract features from data when received
	format.readFeatures = function(doc, opt) {
		// Transform an area to a node (picto) at the center of this area

		for (let node = doc.documentElement.firstElementChild; node; node = node.nextSibling) {
			// Translate attributes to standard MyOl
			for (let tag = node.firstElementChild; tag; tag = tag.nextSibling)
				if (tag.attributes) {
					if (tags.indexOf(tag.getAttribute('k')) !== -1 &&
						tags.indexOf(tag.getAttribute('v')) !== -1 &&
						tag.getAttribute('k') != 'type') {
						addTag(node, 'type', tag.getAttribute('v'));
						addTag(node, 'icon', chemIconUrl(tag.getAttribute('v')));
						// Only once for a node
						addTag(node, 'url', 'https://www.openstreetmap.org/node/' + node.id);
						addTag(node, 'attribution', '&copy;OpenStreetMap');
					}

					if (tag.getAttribute('k') && tag.getAttribute('k').includes('capacity:'))
						addTag(node, 'capacity', tag.getAttribute('v'));
				}

			// Create a new 'node' element centered on the surface
			if (node.nodeName == 'way') {
				const newNode = doc.createElement('node');
				newNode.id = node.id;
				doc.documentElement.appendChild(newNode);

				// Browse <way> attributes to build a new node
				for (let subTagNode = node.firstElementChild; subTagNode; subTagNode = subTagNode.nextSibling)
					switch (subTagNode.nodeName) {
						case 'center':
							// Set node attributes
							newNode.setAttribute('lon', subTagNode.getAttribute('lon'));
							newNode.setAttribute('lat', subTagNode.getAttribute('lat'));
							newNode.setAttribute('nodeName', subTagNode.nodeName);
							break;

						case 'tag': {
							// Get existing properties
							newNode.appendChild(subTagNode.cloneNode());

							// Add a tag to mem what node type it was (for link build)
							addTag(newNode, 'nodetype', node.nodeName);
						}
					}
			}

			// Status 200 / error message
			if (node.nodeName == 'remark' && statusEl)
				statusEl.textContent = node.textContent;
		}

		function addTag(node, k, v) {
			const newTag = doc.createElement('tag');
			newTag.setAttribute('k', k);
			newTag.setAttribute('v', v);
			node.appendChild(newTag);
		}

		return OSMXML.prototype.readFeatures.call(this, doc, opt);
	};

	return layer;
}

// Vectors layers examples
export function vectorLayerCollection(options) {
	options = options || {};

	return [
		//layerClusterWri(options.wri),
		layerPrc(options.prc),
		layerC2C(options.c2c),
		layerOverpass(options.osm),
		layerChemineur(options.chemineur),
		layerAlpages(options.alpages),
	];
}