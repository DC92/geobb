<?php
// phpBB 3.2.x auto-generated configuration file
// Do not change anything in this file!
$dbms = 'phpbb\\db\\driver\\mysqli';
$dbhost = 'localhost';
$dbport = '';
$dbname = 'geobb57';
$dbuser = 'root';
$dbpasswd = '';
$table_prefix = 'phpbb_';
$phpbb_adm_relative_path = 'adm/';
$acm_type = 'phpbb\\cache\\driver\\file';

define('PHPBB_INSTALLED', true);
// define('PHPBB_DISPLAY_LOAD_TIME', true);
define('PHPBB_ENVIRONMENT', 'production');
// define('DEBUG_CONTAINER', true);

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 'on');

define('TRACES_DOM', 'test');
define('META_ROBOTS', 'noindex, nofollow');

$geo_keys = [
//	'IGN' => 'd27mzh49fzoki1v3aorusg6y', // ASPIR Commande n° 207839 Contrat n° 0269018 Expire le 20/10/2019 / alpages.info
//	'IGN' => 'jv1hl9ntrac8q5aycla6wc5f', // WRI Commande n° 118986 Contrat n° 0148807 Expire le 03/07/2019 / *refuges.info
	'IGN' => 'hcxdz5f1p9emo4i1lch6ennl', // Tous DOM Commande n° 118826 Contrat n° 0148608 Expire le 02/07/2019 / *chemineur.fr,*.dc9.fr,*cavailhez.fr,localhost,*.github.io
	'thunderforest' => 'a54d38a8b23f435fa08cfb1d0d0b266e',
	'bing' => 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
	'mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', // Calcul altitude
//	'EPSG21781' => true, // Coordonnées suisses
	'initialFit' => '7/5/45',
];
