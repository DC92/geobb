//HACK I.E. polyfills
// Need to transpile ol.js to ol-ie.js with: https://babeljs.io/repl (TARGETS = default)
// Need polyfill-ie.js generate with https://polyfill.io/v3/url-builder/ includes append promise assign hypot

//HACK for some mobiles touch functions
if (navigator.userAgent.match(/iphone.+safari/i)) {
	const script = document.createElement('script');
	script.src = 'https://unpkg.com/elm-pep';
	document.head.appendChild(script);
}

/**
 * Display OL version
 */
try {
	new ol.style.Icon(); // Try incorrect action
} catch (err) { // to get Assert url
	ol.version = 'Ol ' + err.message.match('/v([0-9\.]+)/')[1];
	console.log(ol.version);
}

/**
 * Debug facilities on mobile
 */
//HACK use hash ## for error alerts
if (!window.location.hash.indexOf('##'))
	window.addEventListener('error', function(evt) {
		alert(evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
//HACK use hash ### to route all console logs on alerts
if (window.location.hash == '###')
	console.log = function(message) {
		alert(message);
	};

//HACK Json parsing errors log
//TODO implement on layerVector.js & editor
function JSONparse(json) {
	try {
		return JSON.parse(json);
	} catch (returnCode) {
		console.log(returnCode + ' parsing : "' + json + '" ' + new Error().stack);
	}
}

//HACK warn layers when added to the map
//BEST DELETE
ol.Map.prototype.handlePostRender = function() {
	ol.PluggableMap.prototype.handlePostRender.call(this);

	const map = this;
	map.getLayers().forEach(function(layer) {
		if (!layer.map_) {
			layer.map_ = map;

			layer.dispatchEvent({
				type: 'myol:onadd',
				map: map,
			});
		}
	});

	// Save the js object into the DOM
	map.getTargetElement()._map = map;
};