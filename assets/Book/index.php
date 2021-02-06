<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Photos Dominique Cavailhez</title>
	<link href="index.css?<?=filemtime('index.css')?>" rel="stylesheet">
	<script src="index.js?<?=filemtime('index.js')?>"></script>
	<link href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Sacramento&display=swap" rel="stylesheet">
</head>

<?php
//TODO centrage image / titre dépend de la taille de la fenetre - idem n° pages
//BEST Centrer verticalement les textes dans la page

foreach (glob('*/*.[jJ]*') AS $f) {
	preg_match ('/(.*)\/([0-9][0-9]).*/', $f, $m);
	if (count ($m))
		$galleries [$m[1]] [$m[2]] = $f;
}

$album_courant = @array_keys ($_GET)[0];
$page_current = intval (@$_GET[$album_courant]);
$page_prev = substr (intval ($page_current / 2) * 2 + 99, -2);
$page_left = substr (intval ($page_current / 2) * 2 + 100, -2);
$page_right = substr (intval ($page_current / 2) * 2 + 101, -2);
$page_next = substr (intval ($page_current / 2) * 2 + 102, -2);
$page_max = @max (array_keys ($galleries[$album_courant]));
preg_match ("/§00(.*)/", @file_get_contents("$album_courant/index.txt"), $titre_album);

function carre ($album, $page, $attr = 'xonclick="full(this)"') {
	global $galleries;
	$h = 0; // Nb em de h1 & p
	$r = '';

	preg_match ("/§$page([^§]*)/s", @file_get_contents("$album/index.txt"), $m);
	if (count ($m)) {
		$ts = explode ("\n", $m[1]);
		foreach ($ts AS $kv=>$vv)
			if (!trim ($vv))
				;
			elseif ($kv) {
				$r .= '<p>'.trim ($vv).'</p>'.PHP_EOL;
				$h += 1.1;
			}
			else {
				$r .= '<h1>'.trim ($vv).'</h1>'.PHP_EOL;
				$h += 3.4;
			}
	}

	if (isset ($galleries[$album][$page]))
		$r .= "<div style='height:calc(100% - {$h}em)'>\n".
			  "<img src='{$galleries[$album][$page]}' />\n</div>\n";

	return "<div $attr>$r</div>";
}
?>

<body>

<?php // Entrée dans le site
if (!$album_courant) { ?>
	<div class="rayon">
		<h1>Exposition de mes meilleures photos</h1>

<?php foreach ($galleries AS $album => $images) { ?>
		<a class="cover" href="?<?=$album?>" title="Ouvrir ce livre">
			<?=carre ($album, '00')?>
		</a>
<?php } ?>

		<p>&copy; Dominique Cavailhez 2021</p>
	</div>
<?php }

// Un livre ouvert
else { ?>
	<h1 id="titre"><?=$titre_album[1]?><h1>
	<div class="book open">
		<p><?=intval($page_left)?:''?></p>
		<p><?=intval($page_right)?></p>
<?php if ($page_current > 1) { ?>
		<?=carre ($album_courant, $page_left, 'class="left"')?>
<?php } ?>
		<?=carre ($album_courant, $page_right)?>
<?php if ($page_current <= 1) { ?>
		<a id="previous-page" href="." title="Refermer le livre">&#8627;</a>
<?php } elseif ($page_prev) { ?>
		<a id="previous-page" href="?<?=$album_courant?>=<?=$page_prev?>" title="Retourner à la page précédente">&#8627;</a>
<?php } if ($page_next && ($page_current + 1) < $page_max) { ?>
		<a id="next-page" href="?<?=$album_courant?>=<?=$page_next?>" title="Tourner la page">&#8626;</a>
<?php } ?>
	</div>
	<a id="full-screen" href="." title="Plein écran">&#9974;</a>
	<a id="download" href="." title="Télécharger l'image">&#128427;</a>
	<a id="home" href="." title="Revenir à l'accueil">&#8962;</a>
<?php } ?>

</body>
</html>