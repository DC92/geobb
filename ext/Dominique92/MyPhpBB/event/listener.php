<?php
/**
 * Usefull tricks to for phpBB
 *
 * Clickable banner (overall_header_searchbox_before.html)
 * Warning to wait until end loading of attached files (posting_attach_body_file_list_before.html)
 * See other docs lines bellow
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\MyPhpBB\event;

if (!defined('IN_PHPBB'))
{
	exit;
}

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class listener implements EventSubscriberInterface
{
	// List of externals
	public function __construct(
		\phpbb\db\driver\driver_interface $db,
		\phpbb\request\request_interface $request,
		\phpbb\template\template $template,
		\phpbb\user $user,
		\phpbb\auth\auth $auth,
		\phpbb\language\language $language
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->language = $language;

/**
 * Includes language files of this extension
 */
		$ns = explode ('\\', __NAMESPACE__);
		$this->language->add_lang('common', $ns[0].'/'.$ns[1]);

/**
 * Includes style files of this extension
 */
//TODO explore all active extensions
//TODO bug acp_main.html
/*
		$this->ext_path = 'ext/'.$ns[0].'/'.$ns[1].'/';
		$template->set_style ([
			$this->ext_path.'styles',
			'styles', // core styles
			'adm', // core styles //TODO needed for template/adm/...
		]);
*/
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {

/**
 * For debug, Varnish will not be caching pages where you are setting a cookie
 */
		if (defined('DEBUG_CONTAINER'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		return [
			// Posting
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',

			// All
			'core.twig_environment_render_template_before' => 'twig_environment_render_template_before',

			// Ucp&mode=register
			'core.ucp_register_requests_after' => 'ucp_register_requests_after',
		];
	}

/**
 * Allows entering a POST with empty text
 */
	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
	}

	// Called when viewing the post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

/**
 * Prevent an empty title to invalidate the full page and input.
 */
		$page_data = $vars['page_data'];

		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'New';

		$vars['page_data'] = $page_data;

/**
 * Keep trace of values prior to modifications
 * Create a log file with the post existing data if there is none
 */
		// Create the LOG directory if none
		if (!is_dir('LOG'))
			mkdir('LOG');
		// Add a blank file if none
		file_put_contents ('LOG/index.html', '');

		// Create the file with the existing post data
		$file_name = 'LOG/'.$post_data['post_id'].'.txt';
		if (!file_exists ($file_name))
			file_put_contents ($file_name,
				pack('CCC',0xef,0xbb,0xbf). // UTF-8 encoding
				date('r').PHP_EOL.
				'Titre: '.$post_data['post_subject'].PHP_EOL.
				$post_data['post_text'].PHP_EOL.
				$this->specific_data($post_data).PHP_EOL
			);

	}

/**
 * Log new post data
 */
	function modify_submit_notification_data($vars) {
		$post_data = $vars['data_ary'];
		$post = $this->request->get_super_global(\phpbb\request\request_interface::POST);

		$file_name = 'LOG/'.$post_data['post_id'].'.txt';
		file_put_contents ($file_name,
			'_______________________________'.PHP_EOL.
			date('r').' '.$this->user->data['username'].PHP_EOL.
			'Titre: '.$post['subject'].PHP_EOL.
			$post['message'].PHP_EOL.
			$this->specific_data($post).PHP_EOL,
		FILE_APPEND);
	}

	function specific_data($post_data) {
		$r = '';
		foreach ($post_data AS $k=>$v)
			if ($k[3] == '_' &&
				$v &&
				$v != '00' &&
				$v != '0' &&
				$v != '?' &&
				$v != 'off')
				$r .= $k.': '.(is_array($v) ? implode(',',$v) : $v).PHP_EOL;
		return $r;
	}

	// Inhibe l'enregistrement des pays non autorisés dans $config['country_codes']
	function ucp_register_requests_after () {
		global $config;
		if (defined('COUNTRY_CODES')) {
			$server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
			$iplocation = unserialize (file_get_contents ('http://www.geoplugin.net/php.gp?ip='.$server['REMOTE_ADDR']));
			if (!strpos (COUNTRY_CODES, $iplocation['geoplugin_countryCode']))
				header ('Location: ucp.php');
		}
	}

/**
 * DEBUG
 * Dump global & templates variables
 */
	function twig_environment_render_template_before($vars) {
		if(defined('DUMP_GLOBALS')) {
			$this->request->enable_super_globals();
			var_dump ([DUMP_GLOBALS => $GLOBALS[DUMP_GLOBALS]]);
			$this->request->disable_super_globals();
		}

		if(defined('DUMP_TEMPLATE') &&
			$vars['name'] != 'attachment.html')
			var_dump('TEMPLATE '.$vars['name'], $vars['context']);
	}

/**
 * Short link /?f=0&t=0&p=0 to viewforum & viewtopic
 * Add these lines at the end of /.htaccess
 *
RewriteCond %{REQUEST_FILENAME} index.php
RewriteCond %{QUERY_STRING} (^|&)f=[0-9]+(&|$)
RewriteRule ^(.*)$ viewforum.php [QSA,L]

RewriteCond %{REQUEST_FILENAME} index.php
RewriteCond %{QUERY_STRING} (^|&)(t|p)=[0-9]+(&|$)
RewriteRule ^(.*)$ viewtopic.php [QSA,L]
 */
}