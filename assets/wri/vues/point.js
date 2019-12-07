<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const overlays = [
		layerRefugesInfo({
			serverUrl: '<?=$config_wri['sous_dossier_installation']?>',
		}),

		layerMarker({
			imageUrl: '<?=$config_wri['sous_dossier_installation']?>images/cadre.png',
			idDisplay: 'marqueur',
		}),
	],

	controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({ // Permet de garder le même réglage de carte d'une page à l'autre
			visible: false, // Mais on ne visualise pas le lien du permalink
			init: false, // Ici, on utilisera plutôt la position du point
		}),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '', //HACK Bad presentation on IE & FF
			tipLabel: 'Plein écran',
		}),
		controlDownload(),
		new ol.control.Attribution({
			collapsible: false, // Attribution always open
		}),
	],

	map = new ol.Map({
		target: 'carte-point',
		view: new ol.View({
			center: ol.proj.fromLonLat([
				<?=$vue->point->longitude?> ,
				<?=$vue->point->latitude?>,
			]),
			zoom: 13,
		}),
		layers: overlays,
		controls: controls,
	});