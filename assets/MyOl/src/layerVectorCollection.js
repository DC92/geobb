/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */

/**
 * Site chemineur.fr, alpages.info
 * layer: verbose (full data) | cluster (grouped points) | '' (simplified)
 */
function layerGeoBB(options) {
	return layerVectorCluster({
		host: '//chemineur.fr/',
		urlArgsFunction: function(opt, bbox, selections) {
			return {
				url: opt.host + 'ext/Dominique92/GeoBB/gis.php',
				cat: selections[0], // The 1st (and only selector)
				limit: 10000,
				...opt.extraParams(bbox),
			};
		},
		extraParams: function(bbox) {
			return {
				bbox: bbox.join(','),
			};
		},
		convertProperties: function(properties, opt) {
			return {
				icon: properties.type ?
					opt.host + 'ext/Dominique92/GeoBB/icones/' + properties.type + '.' + iconCanvasExt() : null,
				url: properties.id ?
					opt.host + 'viewtopic.php?t=' + properties.id : null,
				attribution: opt.attribution,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return {
				...styleOptionsIcon(properties.icon), // Points
				...styleOptionsPolygon(properties.color, 0.5), // Polygons with color
				stroke: new ol.style.Stroke({ // Lines
					color: 'blue',
					width: 2,
				}),
			};
		},
		hoverStyleOptionsFunction: function(feature, properties) {
			return {
				...styleOptionsFullLabel(feature, properties), // Labels
				stroke: new ol.style.Stroke({ // Lines
					color: 'red',
					width: 3,
				}),
			};
		},
		...options
	});
}

function layersGeoBB(options) {
	const clusterLayer = layerGeoBB({
		minResolution: 100,
		extraParams: function(bbox) {
			return {
				layer: 'cluster',
				bbox: bbox.join(','),
			};
		},
		...options
	});

	return layerGeoBB({
		maxResolution: 100,
		altLayer: clusterLayer,
		...options
	});
}

/**
 * Site refuges.info
 */
function layerWri(options) {
	return layerVectorCluster({
		host: '//www.refuges.info/',
		urlArgsFunction: function(opt, bbox, selections) {
			return {
				url: opt.host + (selections[1] ? 'api/massif' : 'api/bbox'),
				type_points: selections[0],
				massif: selections[1],
				nb_points: 'all',
				...opt.extraParams(bbox),
			};
		},
		extraParams: function(bbox) {
			return {
				bbox: bbox.join(','),
			};
		},
		convertProperties: function(properties, opt) {
			return {
				type: properties.type.valeur,
				name: properties.nom,
				icon: opt.host + 'images/icones/' + properties.type.icone + '.' + iconCanvasExt(),
				ele: properties.coord ? properties.coord.alt : null,
				capacity: properties.places ? properties.places.valeur : null,
				url: opt.noClick ? null : properties.lien,
				attribution: opt.attribution,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIcon(properties.icon);
		},
		hoverStyleOptionsFunction: function(feature, properties) {
			return styleOptionsFullLabel(feature, properties);
		},
		attribution: 'refuges.info',
		...options
	});
}

function layersWri(options) {
	const clusterLayer = layerWri({
		minResolution: 100,
		strategy: ol.loadingstrategy.all,
		extraParams: function() {
			return {
				cluster: 0.1,
			};
		},
		...options
	});

	return layerWri({
		maxResolution: 100,
		altLayer: clusterLayer,
		...options
	});
}

function layerWriAreas(options) {
	return layerVector({
		host: '//www.refuges.info/',
		strategy: ol.loadingstrategy.all,
		polygon: 1, // Massifs
		zIndex: 2, // Behind points
		urlArgsFunction: function(opt) {
			return {
				url: opt.host + 'api/polygones',
				type_polygon: opt.polygon,
			};
		},
		convertProperties: function(properties) {
			return {
				name: properties.nom,
				color: properties.couleur,
				url: properties.lien,
			};
		},
		styleOptionsFunction: function(feature, properties) {
			return {
				...styleOptionsLabel(properties.name, feature, properties),
				...styleOptionsPolygon(properties.color, 0.5),
			};
		},
		hoverStyleOptionsFunction: function(feature, properties) {
			// Invert previous color
			const colors = properties.color
				.match(/([0-9a-f]{2})/ig)
				.map(c =>
					(255 - parseInt(c, 16))
					.toString(16).padStart(2, '0')
				)
				.join('');

			return {
				...styleOptionsLabel(properties.name, feature, properties, true),
				...styleOptionsPolygon('#' + colors, 0.3),
				stroke: new ol.style.Stroke({
					color: properties.color,
					width: 3,
				}),
			};
		},
		...options
	});
}

/**
 * Site pyrenees-refuges.com
 */
function layerPyreneesRefuges(options) {
	return layerVectorCluster({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		strategy: ol.loadingstrategy.all,
		convertProperties: function(properties) {
			return {
				type: properties.type_hebergement,
				url: properties.url,
				ele: properties.altitude,
				capacity: properties.cap_ete,
				attribution: 'Pyrenees-Refuges',
			};
		},
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIconChemineur(properties.type_hebergement);
		},
		hoverStyleOptionsFunction: function(feature, properties) {
			return styleOptionsFullLabel(feature, properties);
		},
		...options
	});
}

/**
 * Site camptocamp.org
 */
function layerC2C(options) {
	const format = new ol.format.GeoJSON({ // Format of received data
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
					type: properties.waypoint_type,
					name: properties.locales[0].title,
					ele: properties.elevation,
					url: '//www.camptocamp.org/waypoints/' + properties.document_id,
					attribution: 'campTOcamp',
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
		urlArgsFunction: function(o, b, s, extent) {
			return {
				url: 'https://api.camptocamp.org/waypoints',
				bbox: extent.join(','),
			};
		},
		format: format,
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIconChemineur(properties.type);
		},
		hoverStyleOptionsFunction: function(feature, properties) {
			return styleOptionsFullLabel(feature, properties);
		},
		...options
	});
}

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
function layerOverpass(opt) {
	const format = new ol.format.OSMXML(),
		options = {
			//host: 'overpass-api.de',
			//host: 'lz4.overpass-api.de',
			//host: 'overpass.openstreetmap.fr', // Out of order
			host: 'overpass.kumi.systems',
			//host: 'overpass.nchc.org.tw',

			urlArgsFunction: urlArgsFunction,
			maxResolution: 50,
			format: format,
			styleOptionsFunction: function(f, properties) {
				return styleOptionsIconChemineur(properties.type);
			},
			hoverStyleOptionsFunction: function(feature, properties) {
				return styleOptionsFullLabel(feature, properties);
			},
			...opt
		},
		layer = layerVectorCluster(options),
		statusEl = document.getElementById(options.selectorName),
		selectorEls = document.getElementsByName(options.selectorName);

	// List of acceptable tags in the request return
	let tags = '';

	for (let e in selectorEls)
		if (selectorEls[e].value)
			tags += selectorEls[e].value.replace('private', '');

	function urlArgsFunction(o, bbox, selections) {
		const items = selections[0].split(','), // The 1st (and only selector)
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
			url: 'https://' + options.host + '/api/interpreter',
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
						// Only once for a node
						addTag(node, 'url', 'https://www.openstreetmap.org/node/' + node.id);
						addTag(node, 'attribution', 'osm');
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

		return ol.format.OSMXML.prototype.readFeatures.call(this, doc, opt);
	};

	return layer;
}