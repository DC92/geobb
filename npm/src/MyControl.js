/**
 * Controls.js
 * Add some usefull controls
 */

// Openlayers
import Attribution from 'ol/control/Attribution';
import Control from 'ol/control/Control';
import FullScreen from 'ol/control/FullScreen';
import Icon from 'ol/style/Icon';
import MousePosition from 'ol/control/MousePosition';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import ScaleLine from 'ol/control/ScaleLine';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Zoom from 'ol/control/Zoom';
import * as coordinate from 'ol/coordinate';
import * as olFormat from 'ol/format';
import * as olExtent from 'ol/extent';
import * as proj from 'ol/proj';
import * as sphere from 'ol/sphere';
import * as style from 'ol/style';

// MyOl
import './MyControl.css';
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';


/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class MyButton extends Control {
	constructor(options) {
		super({
			element: document.createElement('div'),
			className: '',
			...options ||= {},
		});

		// Add submenu below the button
		if (options.submenuEl)
			this.submenuEl = options.submenuEl;
		else if (options.submenuId)
			this.submenuEl = document.getElementById(options.submenuId);
		else {
			this.submenuEl = document.createElement('div');
			if (options.submenuHTML)
				this.submenuEl.innerHTML = options.submenuHTML;
		}

		// Display the button only if there are no label or submenu
		if (options.label && this.submenuEl && this.submenuEl.innerHTML) {
			// Create a button
			const buttonEl = document.createElement('button');
			buttonEl.setAttribute('type', 'button');
			buttonEl.innerHTML = options.label;
			buttonEl.addEventListener('click', evt => this.action(evt));

			// Populate the control
			this.element.className = 'ol-control myol-button ' + options.className;
			this.element.addEventListener('mouseover', evt => this.action(evt));
			this.element.addEventListener('mouseout', evt => this.action(evt));
			this.element.appendChild(buttonEl); // Add the button
			this.element.appendChild(this.submenuEl); // Add the submenu

			// Close the submenu when click or touch on the map
			document.addEventListener('click', evt => {
				if (document.elementFromPoint(evt.x, evt.y).tagName == 'CANVAS')
					this.element.classList.remove('myol-button-selected');
			});
		}
	}

	action(evt) {
		if (evt.type == 'mouseover')
			this.element.classList.add('myol-button-hover');
		else // mouseout | click
			this.element.classList.remove('myol-button-hover');

		if (evt.type == 'click') // Mouse click & touch
			this.element.classList.toggle('myol-button-selected');

		// Close other open buttons
		for (let el of document.getElementsByClassName('myol-button'))
			if (el != this.element)
				el.classList.remove('myol-button-selected');
	}
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
export function permalink(opt) {
	const options = {
			//BEST init with bbox option
			init: true, // {true | false} use url hash or localStorage to position the map.
			setUrl: false, // {true | false} Change url hash when moving the map.
			display: false, // {true | false} Display permalink link the map.
			hash: '?', // {?, #} the permalink delimiter after the url
			...opt,
		},
		control = new Control({
			element: document.createElement('div'),
			render: render,
		}),
		aEl = document.createElement('a'),
		urlMod = location.href.replace( // Get value from params with priority url / ? / #
			/map=([0-9\.]+)\/(-?[0-9\.]+)\/(-?[0-9\.]+)/, // map=<zoom>/<lon>/<lat>
			'zoom=$1&lon=$2&lat=$3' // zoom=<zoom>&lon=<lon>&lat=<lat>
		) +
		// Last values
		'zoom=' + localStorage.myol_zoom +
		'lon=' + localStorage.myol_lon +
		'lat=' + localStorage.myol_lat +
		// Default
		'zoom=6&lon=2&lat=47';

	if (options.display) {
		control.element.className = 'myol-permalink';
		aEl.innerHTML = 'Permalink';
		aEl.title = 'Generate a link with map zoom & position';
		control.element.appendChild(aEl);
	}

	function render(evt) { //HACK to get map object
		const view = evt.map.getView();

		// Set center & zoom at the init
		if (options.init) {
			options.init = false; // Only once

			view.setZoom(urlMod.match(/zoom=([0-9\.]+)/)[1]);

			view.setCenter(proj.transform([
				urlMod.match(/lon=(-?[0-9\.]+)/)[1],
				urlMod.match(/lat=(-?[0-9\.]+)/)[1],
			], 'EPSG:4326', 'EPSG:3857'));
		}

		// Set the permalink with current map zoom & position
		if (view.getCenter()) {
			const ll4326 = proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
				newParams = 'map=' +
				(localStorage.myol_zoom = Math.round(view.getZoom() * 10) / 10) + '/' +
				(localStorage.myol_lon = Math.round(ll4326[0] * 10000) / 10000) + '/' +
				(localStorage.myol_lat = Math.round(ll4326[1] * 10000) / 10000);

			if (options.display)
				aEl.href = options.hash + newParams;

			if (options.setUrl)
				location.href = '#' + newParams;
		}
	}
	return control;
}

/**
 * Control to display the mouse position
 */
export class MyMousePosition extends MousePosition {
	constructor(options) {
		super({
			projection: 'EPSG:4326',
			className: 'myol-coordinate',
			placeholder: String.fromCharCode(0), // Hide control when mouse is out of the map

			coordinateFormat: function(mouse) {
				//BEST find better than window.gpsValues to share info
				if (window.gpsValues && window.gpsValues.position) {
					const ll4326 = proj.transform(window.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
						distance = sphere.getDistance(mouse, ll4326);

					return distance < 1000 ?
						(Math.round(distance)) + ' m' :
						(Math.round(distance / 10) / 100) + ' km';
				} else
					return coordinate.createStringXY(4)(mouse);
			},
			...options,
		});
	}
}

/**
 * Control to display the length & height difference of an hovered line
 */
//TODO class
export class LengthLine extends MyButton {
	constructor(options) {
		super({});
	}
}

export function lengthLine() {
	const control = new MyButton(); //HACK button not visible

	control.element.className = 'myol-length-line';

	control.setMap = function(map) { //HACK execute actions on Map init
		Control.prototype.setMap.call(this, map);

		map.on('pointermove', evt => {
			control.element.innerHTML = ''; // Clear the measure if hover no feature

			// Find new features to hover
			map.forEachFeatureAtPixel(evt.pixel, calculateLength, {
				hitTolerance: 6, // Default is 0
			});
		});
	};

	function getFlatCoordinates(geometry) {
		let fcs = [];

		if (geometry.stride == 3)
			fcs = geometry.flatCoordinates;

		if (geometry.getType() == 'GeometryCollection')
			for (let g of geometry.getGeometries())
				fcs.push(...getFlatCoordinates(g));

		return fcs;
	}

	//BEST calculate distance to the ends
	function calculateLength(feature) {
		if (feature) {
			let geometry = feature.getGeometry(),
				length = sphere.getLength(geometry),
				fcs = getFlatCoordinates(geometry),
				denivPos = 0,
				denivNeg = 0;

			// Height difference calculation
			for (let c = 5; c < fcs.length; c += 3) {
				const d = fcs[c] - fcs[c - 3];

				if (d > 0)
					denivPos += d;
				else
					denivNeg -= d;
			}

			// Display
			if (length) {
				control.element.innerHTML =
					// Line length
					length < 1000 ?
					(Math.round(length)) + ' m' :
					(Math.round(length / 10) / 100) + ' km' +
					// Height difference
					(denivPos ? ' +' + denivPos + ' m' : '') +
					(denivNeg ? ' -' + denivNeg + ' m' : '');

				return false; // Continue detection (for editor that has temporary layers)
			}
		}
	}
	return control;
}

/**
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */
//TODO TEST
export function tilesBuffer(opt) {
	const options = {
			depth: 3,
			...opt,
		},
		control = new MyButton(); //HACK no button

	control.setMap = function(map) { //HACK execute actions on Map init
		Control.prototype.setMap.call(this, map);

		// Action on each layer
		//BEST too much load on basic browsing
		map.on('precompose', () => {
			map.getLayers().forEach(layer => {
				if (typeof layer.setPreload == 'function')
					layer.setPreload(options.depth);
			});
		});
	};

	return control;
}

/**
 * Print control
 */
export class Print extends MyButton {
	constructor(options) {
		super({
			label: '&#x1F5A8;',
			className: 'myol-button-print',
			submenuHTML: '<p>Pour imprimer la carte:</p>' +
				'<p>-Choisir portrait ou paysage,</p>' +
				'<p>-zoomer et déplacer la carte dans le format,</p>' +
				'<p>-imprimer.</p>' +
				'<label><input type="radio" value="0">Portrait A4</label>' +
				'<label><input type="radio" value="1">Paysage A4</label>' +
				'<a id="print">Imprimer</a>' +
				'<a onclick="location.reload()">Annuler</a>',
			...options,
		});

		// Register action listeners
		this.element.querySelectorAll('input,a')
			.forEach(el => {
				el.onclick ||= evt => this.click(evt);
			});

		// To return without print
		document.addEventListener('keydown', function(evt) {
			if (evt.key == 'Escape')
				setTimeout(function() { // Delay reload for FF & Opera
					location.reload();
				});
		});
	}

	click(evt) {
		const map = this.getMap(),
			mapEl = map.getTargetElement(),
			poElcs = this.element.querySelectorAll('input:checked'), // Selected orientation inputs
			orientation = poElcs.length ? parseInt(poElcs[0].value) : 0; // Selected orientation or portrait

		// Change map size & style
		mapEl.style.maxHeight = mapEl.style.maxWidth =
			mapEl.style.float = 'none';
		mapEl.style.width = orientation == 0 ? '208mm' : '295mm';
		mapEl.style.height = orientation == 0 ? '295mm' : '208mm';
		map.setSize([mapEl.clientWidth, mapEl.clientHeight]);

		// Set style portrait / landscape
		const styleSheet = document.createElement('style');
		styleSheet.type = 'text/css';
		styleSheet.innerText = '@page {size: ' + (orientation == 0 ? 'portrait' : 'landscape') + '}';
		document.head.appendChild(styleSheet);

		// Hide all but the map
		document.body.appendChild(mapEl);
		for (let child = document.body.firstElementChild; child !== null; child = child.nextSibling)
			if (child.style && child !== mapEl)
				child.style.display = 'none';

		// Finer zoom not dependent on the baselayer's levels
		map.getView().setConstrainResolution(false);
		map.addInteraction(new MouseWheelZoom({
			maxDelta: 0.1,
		}));

		// Finally print if required
		if (evt.target.id == 'print')
			map.once('rendercomplete', () => {
				window.print();
				location.reload();
			});
	}
}

/**
 * GPX file loader control
 */
export class Load extends MyButton {
	constructor(options) {
		super({
			label: '&#x1F4C2;',
			submenuHTML: '<p>Importer un fichier de points ou de traces</p>' +
				'<input type="file" />',
			...options ||= {},
		});

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el => {
				el.onchange ||= evt => this.change(evt);
			});

		// Load file at init
		if (options.initFile) {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', options.initFile);
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4 && xhr.status == 200)
					this.loadText(xhr.responseText, 'GPX');
			};
			xhr.send();
		}

		this.reader = new FileReader();
	}

	change(evt) {
		if (evt.target.files) {
			this.reader.readAsText(evt.target.files[0]);

			this.reader.onload = () => {
				this.loadText(
					this.reader.result,
					evt.target.files[0].name.split('.').pop().toUpperCase()
				);
			};
		}
	}

	loadText(text, formatName) {
		const map = this.getMap(),
			loadFormat = new olFormat[formatName in olFormat ? formatName : 'GeoJSON'](),
			receivedLat = text.match(/lat="-?([0-9]+)/), // Received projection depending on the first value
			receivedProjection = receivedLat.length && parseInt(receivedLat[1]) > 100 ? 'EPSG:3857' : 'EPSG:4326',
			features = loadFormat.readFeatures(text, {
				dataProjection: receivedProjection,
				featureProjection: 'EPSG:3857', // Map projection
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn Editor that we uploaded some features
				features: features,
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const gpxSource = new VectorSource({
					format: loadFormat,
					features: features,
				}),
				gpxLayer = new VectorLayer({
					source: gpxSource,
					style: function(feature) {
						const properties = feature.getProperties();

						return new style.Style({
							stroke: new style.Stroke({
								color: 'blue',
								width: 3,
							}),
							image: properties.sym ? new Icon({
								//TODO compléter chemineur avec les symboles standards
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
							}) : null,
						});
					},
				});

			map.addLayer(gpxLayer);

			// Zoom the map on the added features
			const fileExtent = gpxSource.getExtent();

			if (olExtent.isEmpty(fileExtent))
				alert('Ce fichier ne comporte pas de points ni de trace');
			else
				map.getView().fit(
					fileExtent, {
						maxZoom: 17,
						padding: [5, 5, 5, 5],
					});
		}

		// Close the submenu
		this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * File downloader control
 */
//BEST BUG incompatible with clusters
export function Download(opt) {
	const options = {
			label: '&#x1f4e5;',
			className: 'myol-button-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a ctrlOnClick="download" id="GPX" mime="application/gpx+xml">GPX</a>' +
				'<a ctrlOnClick="download" id="KML" mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a ctrlOnClick="download" id="GeoJSON" mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature
			...opt,
		},
		control = new MyButton(options),
		hiddenEl = document.createElement('a');

	hiddenEl.target = '_self';
	hiddenEl.style = 'display:none';
	document.body.appendChild(hiddenEl);

	control.download = function(evt) {
		const formatName = evt.target.id,
			mime = evt.target.getAttribute('mime'),
			downloadFormat = new olFormat[formatName](),
			map = control.getMap();
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (options.savedLayer)
			getFeatures(options.savedLayer);
		else
			map.getLayers().forEach(getFeatures);

		function getFeatures(savedLayer) {
			if (savedLayer.getSource() &&
				savedLayer.getSource().forEachFeatureInExtent) // For vector layers only
				savedLayer.getSource().forEachFeatureInExtent(extent, feature => {
					if (!savedLayer.getProperties().dragable) // Don't save the cursor
						features.push(feature);
				});
		}

		if (formatName == 'GPX')
			// Transform *Polygons in linestrings
			for (let f in features) {
				const geometry = features[f].getGeometry();

				if (geometry.getType().includes('Polygon')) {
					geometry.getCoordinates().forEach(coords => {
						if (typeof coords[0][0] == 'number')
							// Polygon
							features.push(new Feature(new LineString(coords)));
						else
							// MultiPolygon
							coords.forEach(subCoords =>
								features.push(new Feature(new LineString(subCoords)))
							);
					});
				}
			}

		const data = downloadFormat.writeFeatures(features, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
				decimals: 5,
			})
			// Beautify the output
			.replace(/<[a-z]*>(0|null|[\[object Object\]|[NTZa:-]*)<\/[a-z]*>/g, '')
			.replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
			.replace(/<Data name="copy"><value>[a-z_\.]*<\/value><\/Data>|,"copy":"[a-z_\.]*"/g, '')
			.replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
			.replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
			.replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
			.replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1'),

			file = new Blob([data], {
				type: mime,
			});

		hiddenEl.download = options.fileName + '.' + formatName.toLowerCase();
		hiddenEl.href = URL.createObjectURL(file);
		hiddenEl.click();

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	};

	return control;
}

/**
 * Help control
 * Display help contained in <TAG id="<options.submenuId>">
 */
export class Help extends MyButton {
	constructor(options) {
		super({
			label: '?',
			submenuId: 'myol-help',
			...options,
		});
	}
}

/**
 * Controls examples
 */
export function collection(opt) {
	const options = {
		supplementaryControls: [], //BEST resorb
		...opt,
	};

	return [
		// Top left
		new Zoom(options.Zoom),
		new FullScreen(options.FullScreen),
		new MyGeocoder(options.Geocoder),
		new MyGeolocation(options.Geolocation),
		new Load(options.load),
		new Download(options.download),
		new Print(options.Print),
		new Help(options.Help),

		// Bottom left
		lengthLine(options.LengthLine),
		new MyMousePosition(options.MyMouseposition),
		new ScaleLine(options.ScaleLine),

		// Bottom right
		permalink(options.Permalink),
		new Attribution(options.Attribution),

		...options.supplementaryControls
	];
}