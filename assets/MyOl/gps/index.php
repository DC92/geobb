<!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<?php
$url_path = str_replace ('../../', '.././../', @$url_path); //HACK avoid http 406 error

$manifest = json_decode (file_get_contents ('manifest.json.php'), true);
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);
?>
<html>
<head>
	<title><?=$manifest['name']?></title>
	<link rel="manifest" href="<?=@$script_path?>manifest.json.php">

	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link rel="icon" type="image/<?=$icon_type?>" href="<?=$icon_file?>" />

	<!-- Polyfill iOS : Amélioration du pseudo full screen pour les cartes pour d'anciennes versions d'iOS/Safari -->
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

	<!-- Openlayers -->
	<link href="<?=@$script_path?>../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="<?=@$script_path?>../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link href="<?=@$script_path?>../myol.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../myol.js"></script>

	<!-- This app -->
	<link href="<?=@$script_path?>index.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>index.js" defer="defer"></script>
	<script>
		var serviceWorkerName = '<?=@$script_path?>service-worker.js.php?url_path=<?=$url_path?>',
			scope = '<?=@$scope_path?$scope_path:'./'?>',
			scriptName = 'index.php',
			mapKeys = <?=json_encode(@$mapKeys)?>;
	</script>
</head>

<!--
	// Add a gpx layer if any arguments to the url
	const gpxFile = location.search.replace('?', '').replace('gpx=', '');
-->
<body>
	<?php
	// List gpx files on the url directory
	$gpx_files = glob ('*.gpx');
	$gpx_args = $_GET ?: $gpx_files;

	// Add a gpx layer if any arguments to the url
	if (count ($gpx_args) == 1) {
		$gpx_show =
			@$gpx_args['gpx'] ?: // 1 : ?gpx=trace
			str_replace ('.gpx', '', array_values($gpx_args)[0]) ?: // 3 : 1 gpx file in the directory
			array_keys($gpx_args)[0]; // 2 : ?trace

		if (in_array ($gpx_show.'.gpx', $gpx_files)) { ?>
		<script>
			var gpxFile = '<?=$gpx_show?>.gpx';
		</script>
	<?php }
	}

	if (count ($gpx_files)) { ?>
		<div id="liste">
			<p>Cliquez sur le nom de la trace pour l'afficher :</p>
			<ul>
			<?php foreach ($gpx_files AS $gpx) { ?>
				<li>
					<a title="Cliquer pour afficher la trace"
						onclick="addLayer('<?=$gpx?>')">
						<?=ucfirst(pathinfo($gpx,PATHINFO_FILENAME))?>
					</a>
				</li>
		<?php } ?>
			</ul>
			<p>Puis sur la cible pour afficher votre position.</p>
			<p>Fermer : <a onclick="document.getElementById('liste').style.display='none'" title="Replier">&#9651;</a></p>
		</div>
	<?php } ?>

	<div id="map"></div>

	<?php // WRI
		if(file_exists ('footer.php'))
			include 'footer.php';
	?>
</body>
</html>
