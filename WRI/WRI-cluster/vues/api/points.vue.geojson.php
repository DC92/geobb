<?php
header("Content-disposition: filename=points.json");
header("Content-Type: application/json; UTF-8"); // rajout du charset
header("Content-Transfer-Encoding: binary");
headers_cors_par_default();
headers_cache_api();

?>
{
  "type": "FeatureCollection",
  "generator": "Refuges.info API",
  "copyright": "<?=$config_wri['copyright_API']?>",
  "timestamp": "<?=date(DATE_ATOM)?>",
  "features": 
  [
<?php
foreach ($points as $j => $point) {
  if ($j) echo ",";
?>
    {
      "type": "Feature",
      "id": <?=$point->id?>,
      "properties": <?=json_encode($point)?>,
      "geometry": <?=$points_geojson[$point->id]['geojson']?>
      
    }<?php
    }
?>

  ]
}