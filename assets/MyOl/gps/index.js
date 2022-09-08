// Force https to allow PWA and geolocation
// Force full script name of short url to allow PWA
if (!location.href.match(/(https|localhost).*index/))
	location.replace(
		(location.hostname == 'localhost' ? 'http://' : 'https://') +
		location.hostname +
		location.pathname + (location.pathname.slice(-1) == '/' ? 'index.php' : '') +
		location.search +
		location.hash);

// Load service worker for web application, install & update
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register(scriptPath + 'service-worker.js.php', {
		scope: './',
	})
	.then(registration => {
		console.log('PWA SW registered ' + myolSWbuild);
		registration.onupdatefound = async function() { // service-worker.js is changed
			console.log('PWA update found');

			if (registration.active) // If it's an upgrade
				// completely unregister the previous SW to avoid old actions ongoing
				registration.unregister().then(console.log('SW ' + registration.active.scriptURL + ' deleted'));

			const installingWorker = registration.installing;
			installingWorker.addEventListener('statechange', () => {
				if (installingWorker.state === 'installed') {
					console.log('PWA update installed / reload');
					location.reload();
				}
			});
		}
	})

// Manage the map
var map,
	controlOptions = {
		Help: {
			helpId: 'myol-gps-help', //TODO REMOVE
		},
		layerSwitcher: {}, //TODO REMOVE
	}; // To be updated by gps_addons.php before load

window.addEventListener('load', function() {
	// Dynamicaly set version number to helps
	Array.from(document.getElementsByClassName('myol-sw-build'))
		.forEach(el => el.innerHTML = myolSWbuild); //TODO REPLACE BY js tag

	// Load the map
	map = new ol.Map({
		target: 'map',
		view: new ol.View({
			constrainResolution: true, // Force zoom on the available tile's definition
		}),
		controls: controlsCollection(controlOptions)
			.concat(controlLayerSwitcher({
				layers: controlOptions.layerSwitcher.layers || layersCollection(),
				...controlOptions.layerSwitcher
			})),
	});
});