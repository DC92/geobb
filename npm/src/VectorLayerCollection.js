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
	getArea,
} from 'ol/extent.js';
import {
	bbox,
} from 'ol/loadingstrategy.js';
import {
	Fill,
	Stroke,
	Text,
} from 'ol/style.js';

// MyOl
import {
	clusterSpreadStylesOptions,
	labelStyleOptions,
	MyVectorLayer,
	Selector,
} from './VectorLayer.js';

// chemineur.fr
export class LayerGeoBB extends MyVectorLayer {
	constructor(options) {
		super({
			host: 'https://chemineur.fr/',
			clickUrl: properties => properties.link,
			attribution: '&copy;chemineur.fr',
			stylesOptions: function(feature, hoveredSubFeature, layer) {
				const properties = (feature || hoveredSubFeature).getProperties();

				return [{
					image: properties.icon ? new Icon({
						src: properties.icon,
					}) : null,
					...labelStyleOptions(feature,
						hoveredSubFeature ? {
							...properties,
							attribution: layer.options.attribution,
						} : {
							name: properties.name,
						}),
					stroke: new Stroke({
						color: hoveredSubFeature ? 'red' : 'blue',
						width: 2,
					}),
				}];
			},

			...options,

			query: opt => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: opt.selector && opt.selector.getSelection() != 'on' ? opt.selector.getSelection() : null,
				...(options.query ? options.query(...arguments) : null),
			}),
		});
	}
};

// Get icon from chemineur.fr if we only have a type
export function chemIconUrl(type) {
	if (type) {
		const icons = type.split(' ');

		return 'https://chemineur.fr/ext/Dominique92/GeoBB/icones/' +
			icons[0] + (icons.length > 1 ? '_' + icons[1] : '') + // Limit to 2 type names & ' ' -> '_'
			'.svg';
	}
}

// alpages.info
export class LayerAlpages extends LayerGeoBB {
	constructor(options) {
		super({
			host: '//alpages.info/',
			attribution: '&copy;alpages.info',
			query: () => ({
				forums: '4,5', // Cabanes, points d'eau
				cat: null,
				...(options.query ? options.query(...arguments) : null),
			}),
			//TODO style icon : use : chemIconUrl(properties.type)

			...options,
		});
	}
}

// refuges.info
export class LayerWri extends MyVectorLayer {
	constructor(opt) {
		const options = {
				host: 'https://www.refuges.info/',
				disjoinClusterMaxResolution: 100,
				serverClusterMinResolution: 50,
				name: properties => properties.nom, // Function returning the name for cluster agregation
				clickUrl: properties => properties.lien, // Function returning url to go on click
				spreadClusterMaxResolution: 20,
				clusterStylesOptions: clusterSpreadStylesOptions,

				...opt,

				query: options => ({
					_path: 'api/bbox',
					nb_points: 'all',
					type_points: options.selector ? options.selector.getSelection() : null,
					...(opt.query ? opt.query(...arguments) : null),
				}),

				stylesOptions: function(feature, hoveredSubFeature, layer) {
					const properties = (feature || hoveredSubFeature).getProperties(),
						so = hoveredSubFeature ?
						labelStyleOptions(feature, {
							name: properties.nom,
							ele: properties.coord.alt,
							bed: properties.places.valeur,
							type: properties.type.valeur,
							attribution: layer.options.attribution,
						}, true) :
						opt.stylesOptions ?
						opt.stylesOptions(...arguments)[0] : {}; // Only one Style there

					return [{
						image: new Icon({
							src: layer.options.host + 'images/icones/' + properties.type.icone + '.svg',
						}),
						...so,
					}];
				},
			},

			// High resolutions layer
			hightResolutionsLayer = new MyVectorLayer({
				minResolution: options.disjoinClusterMaxResolution,

				...options,

				query: function() {
					return {
						cluster: 0.1,
						...(options.query ? options.query(...arguments) : null),
					};
				},
			});

		// Low resolutions layer
		super({
			maxResolution: options.disjoinClusterMaxResolution,
			altLayer: hightResolutionsLayer,
			...options,
		});
	}
}

//BEST make it a class
export function layerWri(options) {
	return layerVectorCluster({ //BEST case of WRI without local cluster ?
		host: '//www.refuges.info/',
		//strategy: bbox,
		...options,
		urlParams: (_, bbox, selections) => ({
			path: selections[1] ? 'api/massif' : 'api/bbox',
			type_points: selections[0],
			massif: selections[1],
			nb_points: 'all',
			bbox: bbox.join(','),
			...functionLike(options.urlParams, ...arguments),
		}),
		convertProperties: (properties, opt) => ({
			name: properties.nom,
			url: properties.lien,
			icon: opt.host + 'images/icones/' + properties.type.icone + '.svg',
			ele: properties.coord ? properties.coord.alt : 0,
			bed: properties.places ? properties.places.valeur : 0,
			type: properties.type ? properties.type.valeur : null,
			attribution: '&copy;Refuges.info',
			...functionLike(options.convertProperties, ...arguments),
		}),
	});
}

//BEST make it a class
export function layerClusterWri(opt) {
	const options = {
			disjoinClusterMaxResolution: 100,
			...opt,
		},
		// High resolutions layer
		clusterLayer = layerWri({
			minResolution: options.disjoinClusterMaxResolution,
			...options,
			urlParams: {
				cluster: 0.1,
			},
		});

	// Low resolutions
	return layerWri({
		maxResolution: options.disjoinClusterMaxResolution,
		altLayer: clusterLayer,
		...options,
	});
}

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
		styleOptionsDisplay: function(feature, properties) {
			// Build color and transparency
			const colors = properties.couleur
				.match(/([0-9a-f]{2})/ig)
				.map(c => parseInt(c, 16));

			return {
				...labelStyleOptions(feature, properties.nom, {
					padding: [1, -1, -1, 1],
					backgroundStroke: null,
					font: null,
				}),
				fill: new Fill({
					color: 'rgba(' + colors.join(',') + ',0.3)'
				}),
			};
		},
		styleOptionsHover: (feature, properties) => ({
			...labelStyleOptions(feature, properties.nom, {
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

// Return the value of result of function with arguments
function functionLike(value, ...a) {
	return typeof value == 'function' ? value(...a) : value || [];
}

// Vectors layers examples
export function vectorLayerCollection(options) {
	options = options || {};

	return [
		layerClusterWri(options.wri),
		layerPrc(options.prc),
		layerC2C(options.c2c),
		layerOverpass(options.osm),
		layerChemineur(options.chemineur),
		layerAlpages(options.alpages),
	];
}