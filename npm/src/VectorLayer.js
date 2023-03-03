import VectorSource from '../node_modules/ol/source/Vector.js';
import GeoJSON from '../node_modules/ol/format/GeoJSON.js';
import Cluster from '../node_modules/ol/source/Cluster.js';
import VectorLayer from '../node_modules/ol/layer/Vector.js';
import Point from '../node_modules/ol/geom/Point.js';
import Feature from '../node_modules/ol/Feature.js';
import {
	bbox,
} from '../node_modules/ol/loadingstrategy.js';
import {
	transformExtent,
} from '../node_modules/ol/proj.js';
import {
	getCenter,
} from '../node_modules/ol/extent.js';
import {
	Circle,
	Fill,
	Stroke,
	Style,
	Text,
} from '../node_modules/ol/style.js';

class MyVectorSource extends VectorSource {
	//TODO Format / convertProperties
	//TODO selector
	constructor(opt) {
		const options = {
				strategy: bbox,
				format: new GeoJSON(),
				projection: 'EPSG:4326',

				bbox: (extent, _, projection) => transformExtent(
					extent,
					projection.getCode(), // Map projection
					options.projection // Received projection
				).map(c => c.toFixed(4)), // Round to 4 digits

				url: function() {
					const query = options.query(...arguments),
						url = options.host + query._path;
					delete query._path;
					if (options.strategy == bbox)
						query.bbox = options.bbox(...arguments);
					return url + '?' + new URLSearchParams(query).toString();
				},
				...opt
			},
			statusEl = document.getElementById(options.statusId);

		super(options);

		// Display loading status
		if (statusEl)
			this.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
				if (!statusEl.textContent.includes('error'))
					statusEl.innerHTML = '';

				switch (evt.type) {
					case 'featuresloadstart':
						statusEl.innerHTML = '&#8987;';
						break;
					case 'featuresloaderror':
						statusEl.innerHTML = 'Erreur !';
						//BEST status out of zoom bounds
				}
			});
	}
}

class MyVectorClusterSource extends Cluster {
	constructor(options) {
		super({ // Cluster source
			source: new MyVectorSource(options), // Full source

			// Generate a center point where display the cluster
			geometryFnc: feature => {
				const geometry = feature.getGeometry();

				if (geometry) {
					const extent = feature.getGeometry().getExtent(),
						pixelSemiPerimeter = (extent[2] - extent[0] + extent[3] - extent[1]) / this.resolution;

					// Don't cluster lines or polygons whose the extent perimeter is more than 400 pixels
					if (pixelSemiPerimeter > 200)
						this.addFeature(feature);
					else
						return new Point(getCenter(feature.getGeometry().getExtent()));
				}
			},

			// Generate the features to render the cluster
			createCluster: (point, features) => {
				let nbClusters = 0,
					includeCluster = false,
					lines = [];

				features.forEach(f => {
					const properties = f.getProperties();

					nbClusters += parseInt(properties.cluster) || 1;
					if (properties.cluster)
						includeCluster = true;
					if (properties.name)
						lines.push(properties.name);
				});

				// Single feature : display it
				if (nbClusters == 1)
					return features[0];

				if (includeCluster || lines.length > 5)
					lines = ['Cliquer pour zoomer'];

				// Display a cluster point
				return new Feature({
					id: features[0].getId(), // Pseudo id = the id of the first feature in the cluster
					name: lines.join('\n'),
					geometry: point, // The gravity center of all the features into the cluster
					features: features,
					cluster: nbClusters, //BEST voir pourquoi on ne met pas ça dans properties
				});
			},
		});
	}
}

export class MyVectorLayer extends VectorLayer {
	constructor(opt) {
		const options = {
			// Normal style
			stylesOptions: properties => [{
				image: new ol.style.Icon({
					//TODO BUG general : send cookies to the server, event non secure		
					src: properties.icon,
				}),
			}],
			// Cluster circle with number inside
			clusterStylesOptions: properties => [{
				image: new Circle({
					radius: 14,
					stroke: new Stroke({
						color: 'blue',
					}),
					fill: new Fill({
						color: 'white',
					}),
				}),
				text: new Text({
					text: properties.cluster.toString(),
					font: '12px Verdana',
				}),
			}],
			// Several icons for a cluster
			clusterDetailStylesOptions: function(properties, hover, options, feature, resolution) {
				return {}; //TODO
			},
			...opt,
		};

		super({
			...options,
			source: options.minClusterResolution === undefined ?
				new MyVectorSource(options) : new MyVectorClusterSource(options),

			style: (feature, resolution, hover) => {
				const properties = feature.getProperties(),
					display = !properties.cluster ? 'stylesOptions' :
					resolution > options.minClusterResolution ? 'clusterStylesOptions' :
					'clusterDetailStylesOptions';

				return options[display](
					properties,
					hover,
					options,
					feature,
					resolution
				).map(o => new Style(o));
			},

			click: () => null,
		});
		this.options = options;
	}

	//HACK execute actions on Map init
	setMapInternal(map) {
		// Add the alternate layer if any
		if (this.options.altLayer)
			map.addLayer(this.options.altLayer);

		// Attach one hover & click listener to each map
		if (!(map.getListeners() || []).includes(mapMouseListener)) { // Only once for each map
			map.on(['pointermove', 'click'], mapMouseListener);
			window.addEventListener('mousemove', evt => windowMouseListener(evt, map));
		}
		return super.setMapInternal(map);
	}
}

function mapMouseListener(evt) {
	// Find the first hovered feature
	let hoveredLayer = null,
		hoveredFeature = evt.map.forEachFeatureAtPixel(
			evt.map.getEventPixel(evt.originalEvent),
			function(feature, layer) {
				if (layer && layer.options) {
					hoveredLayer = layer;
					return feature;
				}
			}, {
				hitTolerance: 6, // For lines / Default 0
			}
		);

	evt.map.getViewport().style.cursor = '';
	if (hoveredFeature) {
		const hoveredProperties = hoveredFeature.getProperties(),
			hoveredClickUrl = hoveredLayer.options.click(hoveredProperties);

		if (hoveredClickUrl || hoveredProperties.cluster)
			evt.map.getViewport().style.cursor = 'pointer';

		if (evt.type == 'click') {
			if (hoveredClickUrl) {
				// Open a new tag
				if (evt.originalEvent.ctrlKey)
					window.open(hoveredClickUrl, '_blank').focus();
				else
					// Open a new window
					if (evt.originalEvent.shiftKey)
						window.open(hoveredClickUrl, '_blank', 'resizable=yes').focus();
					else
						// Go on the same window
						window.location.href = hoveredClickUrl;
			}
			// Cluster
			if (hoveredProperties.cluster)
				evt.map.getView().animate({
					zoom: evt.map.getView().getZoom() + 2,
					center: hoveredProperties.geometry.getCoordinates(),
				});
		} else { // pointermove
			hoveredFeature.setStyle( //TODO
				(feature, resolution) => [
					new ol.style.Style({
						...hoveredLayer.options.style(hoveredProperties, hoveredFeature, hoveredLayer.options, resolution),
						...labelStyleOptions(hoveredFeature, 'text'),
						zIndex: 200,
					}),
				]);
		}
	}

	if (0) { /////////////// //TODO
		const styledFeature = hoveredFeature, // The feature that will receive the style
			//hoveredProperties = hoveredFeature ? hoveredFeature.getProperties() : {},
			noIconStyleOption = null; //TODO what is ???

		// Setup the curseur
		evt.map.getViewport().style.cursor =
			hoveredClickUrl ?
			'pointer' : '';

		// Click on a feature
		if (hoveredFeature && evt.type == 'click') {
			if (hoveredProperties && hoveredProperties.url) {}
		} else {


			if (hoveredFeature != map.lastHoveredFeature) {
				if (hoveredProperties.cluster) {} else {}

				//hoveredLayer.hover(hoveredProperties, hoveredFeature, evt);
			}
		}
	}
}

function windowMouseListener(evt, map) {
	// Leaving the map reset hovering
	const divRect = map.getTargetElement().getBoundingClientRect();

	// The mouse is outside of the map
	if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
		evt.clientY < divRect.top || divRect.bottom < evt.clientY)
		console.log('Out of map');
	/* //TODO
	if (map.lastHover.styledFeature) {
		map.lastHover.styledFeature.setStyle();
		map.lastHover.layer.setZIndex(100);
		map.lastHover = {};
	}
	*/
}

/////////////////////////////////////////////////////////
/**
 * Layer to display remote geoJson layer
 */
export function layerVector(opt) {
	const options = {
			host: '', // Url host
			/* urlParams: function(layerOptions, bbox, selections, extent) {
				path: '', // Url path of the layer
				key: value, // key=values pairs to add to the url as parameters
			}, */
			selectName: '',
			/* <input name="SELECT_NAME"> url arguments selector
				can be several SELECT_NAME_1,SELECT_NAME_2,...
				display loading status <TAG id="SELECT_NAME-status"></TAG>
				no selectName will display the layer
				selectName with no selector with this name will hide the layer
			*/
			callBack: function() { // Function called when the selector is actioned
				layer.setVisible(
					!selectNames[0] || // No selector name
					selectVectorLayer(selectNames[0]).length // By default, visibility depends on the first selector only
				);
				source.refresh();
			},
			strategy: ol.loadingstrategy.all,
			projection: 'EPSG:4326', // Received projection
			zIndex: 100, // Above the background layers
			// convertProperties: function(properties, options) {}, // Convert some server properties to the one used by this package
			// altLayer: Another layer to add to the map with this one (for resolution depending layers)
			...opt,

			// Default style options
			styleOptionsDisplay: function(feature, properties, layer, resolution) {
				return {
					...iconStyleOptions(...arguments), // Default style
					...functionLike(opt.styleOptionsDisplay, ...arguments),
				};
			},
			styleOptionsHover: function(feature, properties, layer, resolution) {
				return { // Each of these options can overwrite the previous
					...functionLike(options.styleOptionsDisplay, ...arguments), // Non hover style
					...fullLabelStyleOptions(...arguments), // Default hovering
					...functionLike(opt.styleOptionsHover, ...arguments), // Overwrite when hovering
				};
			},
		},
		// Other cons
		selectNames = (options.selectName || '').split(','),
		statusEl = document.getElementById(selectNames[0] + '-status'), // XHR download tracking
		format = new ol.format.GeoJSON(),
		source = new ol.source.Vector({
			url: sourceUrl,
			format: format,
			...options,
		}),
		layer = new MyVectorLayer({
			source: source,
			style: (feature, resolution) => [
				// One style with overwriting options
				new ol.style.Style(
					functionLike(options.styleOptionsDisplay, feature, feature.getProperties(), layer, resolution)
				),
				// Many styles to have several icons & labels
				...functionLike(options.stylesDisplay, feature, feature.getProperties(), layer, resolution),
			],
			...options,
		});

	//layer.options = options; // Embark the options

	selectNames.map(name => selectVectorLayer(name, options.callBack)); // Setup the selector managers
	options.callBack(); // Init parameters depending on the selector

	layer.setMapInternal = function(map) {
		//HACK execute actions on Map init
		MyVectorLayer.prototype.setMapInternal.call(this, map);

		// Add the alternate layer if any
		//if (options.altLayer)
		//	map.addLayer(options.altLayer);

		// Add the hovering listener to the map (once for one map)
		addMapListener(map);
	};
	/*
	// Display loading status
	if (statusEl)
		source.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
			if (!statusEl.textContent.includes('error'))
				statusEl.innerHTML = '';

			//BEST status out of zoom bounds
			switch (evt.type) {
				case 'featuresloadstart':
					statusEl.innerHTML = '&#8987;';
					break;
				case 'featuresloaderror':
					statusEl.innerHTML = 'Erreur !';
			}
		});
	*/
	format.readFeatures = function(doc, opt) {
		try {
			const json = JSON.parse(doc);
			// For all features
			json.features.map(jsonFeature => {
				// Generate a pseudo id if none
				// This is important for non duplication of displayed features when bbox zooming
				if (!jsonFeature.id)
					jsonFeature.id =
					jsonFeature.properties.id || // Takes the one in properties
					JSON.stringify(jsonFeature.properties).replace(/\D/g, '') % 987654; // Generate a pseudo id if none
				// Callback function to convert some server properties to the one displayed by this package
				jsonFeature.properties = {
					...jsonFeature.properties,
					...functionLike(options.convertProperties, jsonFeature.properties, options),
				};
				return jsonFeature;
			});
			return ol.format.GeoJSON.prototype.readFeatures.call(this, JSON.stringify(json), opt);
		} catch (returnCode) {
			console.error(returnCode + '\nParsing "' + doc + '"\n' + new Error().stack);
		};
	};

	// Default url callback function for the layer
	function sourceUrl(extent, resolution, projection) {
		/*
		const bbox = ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(), // Map projection
				options.projection // Received projection
			)
			.map(c => c.toFixed(4)), // Round to 4 digits
			selections = selectNames.map(name => selectVectorLayer(name).join(',')), // Array of string: selected values separated with ,
			urlParams = functionLike(options.urlParams, options, bbox, selections, ...arguments),
			query = [];

		// Don't send bbox parameter if no extent is available
		if (urlParams.bbox && !isFinite(urlParams.bbox[0]))
			urlParams.bbox = null;

		for (let k in urlParams)
			if (k != 'path' && urlParams[k])
				query.push(k + '=' + urlParams[k]);

				return options.host + urlParams.path + '?' + query.join('&');
		*/
	}

	return layer;
}

/**
 * Clustering features
 */
export function layerVectorCluster(opt) {
	const options = {
			distance: 30, // Minimum distance (pixels) between clusters
			density: 1000, // Maximum number of displayed clusters
			maxResolutionDegroup: 5, // Resolution below which a cluster display a group of icons
			stylesDisplay: stylesCluster, //BEST QUESTION how does it takes the heritage WriWri ?
			...opt,
		},
		layer = layerVector(options), // Creates the basic layer (with all the points)
		clusterSource = new ol.source.Cluster({
			source: layer.getSource(),
			//geometryFunction: geometryFnc,
			//createCluster: createCluster,
			...options,
		}),
		clusterLayer = new ol.layer.Vector({
			source: clusterSource,
			style: layer.getStyleFunction(),
			visible: layer.getVisible(),
			zIndex: layer.getZIndex(),
			...options,
		});

	clusterLayer.options = layer.options;
	clusterLayer.setMapInternal = layer.setMapInternal; //HACK execute actions on Map init

	// Propagate setVisible following the selector status
	layer.on('change:visible', () => clusterLayer.setVisible(layer.getVisible()));

	// Tune the clustering distance depending on the zoom level
	clusterLayer.on('prerender', evt => {
		let surface = evt.context.canvas.width * evt.context.canvas.height, // Map pixels number
			distanceMinCluster = Math.min(
				evt.frameState.viewState.resolution, // No clusterisation on low resolution zooms
				Math.max(options.distance, Math.sqrt(surface / options.density))
			);

		if (clusterSource.getDistance() != distanceMinCluster) // Only when changed
			clusterSource.setDistance(distanceMinCluster);
	});
	/*
	// Generate a center point to manage clusterisations
	function geometryFnc(feature) {
		const geometry = feature.getGeometry();

		if (geometry) {
			const extent = feature.getGeometry().getExtent(),
				pixelSemiPerimeter = (extent[2] - extent[0] + extent[3] - extent[1]) / this.resolution;

			// Don't cluster lines or polygons whose the extent perimeter is more than 400 pixels
			if (pixelSemiPerimeter > 200)
				clusterSource.addFeature(feature);
			else
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
		}
	}

	// Generate the features to render the clusters
	function createCluster(point, features) {
		let nbClusters = 0,
			includeCluster = false,
			lines = [];

		features.forEach(f => {
			const properties = f.getProperties();

			nbClusters += parseInt(properties.cluster) || 1;
			if (properties.cluster)
				includeCluster = true;
			if (properties.name)
				lines.push(properties.name);
		});

		// Single feature : display it
		if (nbClusters == 1)
			return features[0];

		if (includeCluster || lines.length > 5)
			lines = ['Cliquer pour zoomer'];

		// Display a cluster point
		return new ol.Feature({
			geometry: point, // The gravity center of all the features into the cluster
			cluster: nbClusters, //BEST voir pourquoi on ne met pas ça dans properties
			id: features[0].getId(), // Pseudo id = the id of the first feature in the cluster
			name: lines.join('\n'),
			features: features,
		});
	}
	*/
	return clusterLayer;
}

// Add a listener to manage hovered features
export function addMapListener(map) {
	return;
	if (typeof map.lastHover == 'undefined') { // Once for a map
		map.lastHover = {};

		map.on(['pointermove', 'click'], evt => {
			/*
			// Find the first hovered feature
			let hoveredLayer = null,
				hoveredFeature = map.forEachFeatureAtPixel(
					map.getEventPixel(evt.originalEvent),
					function(feature, layer) {
						if (layer && layer.options) {
							hoveredLayer = layer;
							return feature;
						}
					}, {
						hitTolerance: 6, // For lines / Default 0
					}
				),
				styledFeature = hoveredFeature, // The feature that will receive the style
				hoveredProperties = hoveredFeature ? hoveredFeature.getProperties() : {},
				noIconStyleOption = null;

			// Setup the curseur
			map.getViewport().style.cursor = hoveredFeature &&
				(hoveredProperties.url || hoveredProperties.cluster) && !hoveredLayer.options.noClick ?
				'pointer' : '';
			*/
			// Detect feature of a disjoin cluster
			if (hoveredFeature && hoveredProperties.cluster &&
				map.getView().getResolution() < hoveredLayer.options.maxResolutionDegroup) {
				const hoveredFeaturePixel = map.getPixelFromCoordinate(
						hoveredFeature.getGeometry().getCoordinates()
					),
					// Calculate the feature index from the cursor position
					indexHovered = Math.max(0, Math.min(hoveredProperties.cluster - 1, Math.floor(
						(evt.originalEvent.layerX - hoveredFeaturePixel[0]) / 21.6 + hoveredProperties.cluster / 2
					)));

				hoveredFeature = hoveredProperties.features[indexHovered];
				noIconStyleOption = {
					image: null,
				};
			}

			// Change this feature only style (As the main style is a layer only style)
			if (map.lastHover.feature != hoveredFeature) {
				if (map.lastHover.styledFeature)
					map.lastHover.styledFeature.setStyle(); // Erase previous hover style
				if (map.lastHover.layer)
					map.lastHover.layer.setZIndex(100);

				map.lastHover = {
					layer: hoveredLayer,
					feature: hoveredFeature,
					styledFeature: styledFeature,
				};

				//BEST à réécrire
				if (styledFeature) {
					styledFeature.setStyle(
						(feature, resolution) => [
							new ol.style.Style({
								...functionLike(hoveredLayer.options.styleOptionsHover,
									hoveredFeature, hoveredFeature.getProperties(), hoveredLayer, resolution
								),
								...noIconStyleOption,
								zIndex: 200,
							}),
							...functionLike(hoveredLayer.options.stylesDisplay,
								hoveredFeature, hoveredProperties, hoveredLayer, resolution
							),
						]);
					hoveredLayer.setZIndex(200);
				}
			}

			// Click on a feature
			/*		if (evt.type == 'click' && hoveredFeature) {
						const hoveredProperties = hoveredFeature.getProperties();

						if (hoveredProperties && hoveredProperties.url && !hoveredLayer.options.noClick) {
							// Open a new tag
							if (evt.originalEvent.ctrlKey)
								window.open(hoveredProperties.url, '_blank').focus();
							else
								// Open a new window
								if (evt.originalEvent.shiftKey)
									window.open(hoveredProperties.url, '_blank', 'resizable=yes').focus();
								else
									// Go on the same window
									window.location.href = hoveredProperties.url;
						}
						// Cluster
						if (hoveredProperties.cluster)
							map.getView().animate({
								zoom: map.getView().getZoom() + 2,
								center: hoveredProperties.geometry.getCoordinates(),
							});
					}*/
		});
		/*
		// Leaving the map reset hovering
		window.addEventListener('mousemove', evt => {
			const divRect = map.getTargetElement().getBoundingClientRect();

			// The mouse is outside of the map
			if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				if (map.lastHover.styledFeature) {
					map.lastHover.styledFeature.setStyle();
					map.lastHover.layer.setZIndex(100);
					map.lastHover = {};
				}
		});
		*/
	}
}

/**
 * Manage a collection of checkboxes with the same name
 * There can be several selectors for one layer
 * A selector can be used by several layers
 * The checkbox without value check / uncheck the others
 * Current selection is saved in window.localStorage
 * name : input names
 * callBack : callback function (this reset the checkboxes)
 * You can force the values in window.localStorage[simplified name]
 * Return return an array of selected values
 */
export function selectVectorLayer(name, callBack) {
	const selectEls = [...document.getElementsByName(name)],
		safeName = 'myol_' + name.replace(/[^a-z]/ig, ''),
		init = (localStorage[safeName] || '').split(',');

	// Init
	if (typeof callBack == 'function') {
		selectEls.forEach(el => {
			el.checked =
				init.includes(el.value) ||
				init.includes('all') ||
				init.join(',') == el.value;
			el.addEventListener('click', onClick);
		});
		onClick();
	}

	function onClick(evt) {
		// Test the "all" box & set other boxes
		if (evt && evt.target.value == 'all')
			selectEls
			.forEach(el => el.checked = evt.target.checked);

		// Test if all values are checked
		const allChecked = selectEls
			.filter(el => !el.checked && el.value != 'all');

		// Set the "all" box
		selectEls
			.forEach(el => {
				if (el.value == 'all')
					el.checked = !allChecked.length;
			});

		// Save the current status
		if (selection().length)
			localStorage[safeName] = selection().join(',');
		else
			delete localStorage[safeName];

		if (evt)
			callBack(selection());
	}

	function selection() {
		return selectEls
			.filter(el => el.checked && el.value != 'all')
			.map(el => el.value);
	}

	return selection();
}

/**
 * Some usefull style functions
 */
// Display a label (Used by cluster)
export function iconStyleOptions(feature, properties) {
	if (properties.icon && !ol.extent.getArea(feature.getGeometry().getExtent()))
		return {
			image: new ol.style.Icon({
				//TODO BUG general : send cookies to the server, event non secure		
				src: properties.icon,
			}),
		};
}

export function labelStyleOptions(feature, text, textStyleOptions) {
	const elLabel = document.createElement('span'),
		area = ol.extent.getArea(feature.getGeometry().getExtent()); // Detect lines or polygons

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = text;

	return {
		text: new ol.style.Text({
			text: elLabel.innerHTML,
			textBaseline: area ? 'middle' : 'bottom',
			offsetY: area ? 0 : -13, // Above the icon
			padding: [1, 1, -1, 3],
			font: '12px Verdana',
			fill: new ol.style.Fill({
				color: 'black',
			}),
			backgroundFill: new ol.style.Fill({
				color: 'white',
			}),
			backgroundStroke: new ol.style.Stroke({
				color: 'blue',
			}),
			...textStyleOptions,
		}),
	};
}

export function fullLabelStyleOptions(properties) {
	return labelStyleOptions(
		agregateText([
			properties.name,
			agregateText([
				properties.ele && properties.ele ? parseInt(properties.ele) + ' m' : null,
				properties.bed && properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : null,
			], ', '),
			properties.type,
			properties.attribution,
		]),
	);
}

function clusterStylesOptions(properties) {
	return [{
		image: new Circle({
			radius: 14,
			stroke: new Stroke({
				color: 'blue',
			}),
			fill: new Fill({
				color: 'white',
			}),
		}),
		text: new Text({
			text: properties.cluster.toString(),
			font: '12px Verdana',
		}),
	}];
}

function clusterDetailStylesOptions(properties) {
	/*return [
		// One style with overwriting options
		new  Style(options.styleOptions(...arguments)),
		//...options.styles(...arguments), // Many styles to have several icons & labels
	]*/
}

// Simplify & agreagte an array of lines
export function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}

export function stylesCluster(feature, properties, layer, resolution) {
	let styles = [], // Need separate styles to display several icons / labels
		x = 0.95 + 0.45 * properties.cluster;

	if (properties.cluster) {
		if (resolution < layer.options.maxResolutionDegroup)
			// Spread icons under the label
			properties.features.forEach(f => {
				const image = layer.getStyleFunction()(f, resolution)[0].getImage();

				if (image) {
					image.setAnchor([x -= 0.9, 0.5]);
					styles.push(new ol.style.Style({
						image: image,
					}));
				}
			});
		/*		else
					// Cluster circle with number inside
					styles.push(new ol.style.Style({
						image: new ol.style.Circle({
							radius: 14,
							stroke: new ol.style.Stroke({
								color: 'blue',
							}),
							fill: new ol.style.Fill({
								color: 'white',
							}),
						}),
						text: new ol.style.Text({
							text: properties.cluster.toString(),
							font: '12px Verdana',
						}),
					}));*/
	}
	return styles;
}

// Return the value of result of function with arguments
export function functionLike(value, ...a) {
	return typeof value == 'function' ? value(...a) : value || [];
}