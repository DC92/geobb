<?php
$css = $js = "/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 * Based on https://openlayers.org
 *
 * This file is generated by build.php from the src/... sources
 * Please dont modify it. Modify src/... & rebuild it !
 */".PHP_EOL .PHP_EOL;
echo "<p>";

$css .= get ('layerSwitcher.css').PHP_EOL .PHP_EOL;
$css .= get ('myol.css');
file_put_contents ('myol.css', $css);
echo "TO myol.css</p>\n<p>";

$js .= get ('header.js').PHP_EOL .PHP_EOL;
$js .= get ('tileLayers.js').PHP_EOL .PHP_EOL;
$js .= get ('layerSwitcher.js').PHP_EOL .PHP_EOL;
$js .= get ('myol.js');
file_put_contents ('myol.js', $js);
echo "TO myol.js</p>";

function get ($file) {
	echo "$file, ";
	$text = file_get_contents ('src/'.$file);
	$texts = explode ('/*--*/', $text);

	return isset ($texts[1]) ? $texts[1] : $text;
}
?>

<h1>Demos</h1>
<p><a href="index.html">BASIC</a></p>
<p><a href="examples/layerSwitcher.html">LAYER SWITCHER</a></p>
<p><a href="examples/tileLayers.html">TILE LAYERS</a></p>
<p><a href="examples/vectorLayers.html">VECTOR LAYERS</a></p>
<p><a href="examples/markers.html">MARKERS</a></p>
<p><a href="examples/editor.html">EDITOR</a></p>
<p><a href="gps">OFF LINE GPS</a></p>
<p><a href="https://github.com/Dominique92/MyOl/">Github</a></p>
