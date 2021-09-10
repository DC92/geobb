<?php
$js = $css = ["/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 * Based on https://openlayers.org
 *
 * This file has been generated ".date('r')."
 * by build.php from the src/... sources
 * Please dont modify it : modify src/... & rebuild it !
 */"];
echo "<p>";

$css[] = get ('controls.css');
$css[] = get ('layerSwitcher.css');
file_put_contents ('myol.css', implode (PHP_EOL .PHP_EOL, $css));
echo "TO myol.css</p>\n<p>";

$js[] = get ('header.js');
$js[] = get ('layerTileCollection.js');
$js[] = get ('layerSwitcher.js');
$js[] = get ('layerVector.js');
$js[] = get ('layerVectorCollection.js');
$js[] = get ('controls.js');
$js[] = get ('editor.js');
file_put_contents ('myol.js', implode (PHP_EOL .PHP_EOL, $js));
echo 'TO myol.js</p>';

function get ($file) {
	echo "$file, ";
	return "/* FILE src/$file */\n".file_get_contents ('src/'.$file);
}
?>

<h1 style="clear:both">MyOl</h1>
<p>Set of js functions adding some facilities to <a href="https://openlayers.org/">Openlayers</a></p>
<p>See doc & details on <a href="https://github.com/DC92/dev/tree/master/assets/MyOl">GITHUB</a></p>
<p><a href="index.html">Overview</a></p>
<p><a href="examples/layerSwitcher.html">Layer switcher</a></p>
<p><a href="examples/layerTile.html">Layer tile</a></p>
<p><a href="examples/layerVector.html">Layer vector</a></p>
<p><a href="examples/controls.html">Controls</a></p>
<p><a href="examples/marker.html">Marker</a></p>
<p><a href="examples/editor.html">Editor</a></p>
<p><a href="gps">Off line GPS</a></p>
<p><a href="build.php">Build</a></p>
