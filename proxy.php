<?php

if (get_magic_quotes_gpc()) {
	function stripslashes_deep($value) {
		$value = is_array($value) ?
			array_map('stripslashes_deep', $value) :
			stripslashes($value);

		return $value;
	}

	$_POST = array_map('stripslashes_deep', $_POST);
	$_GET = array_map('stripslashes_deep', $_GET);
	$_COOKIE = array_map('stripslashes_deep', $_COOKIE);
	$_REQUEST = array_map('stripslashes_deep', $_REQUEST);
}

$api = "http://moonscript.herokuapp.com/";
$default_code = "print'hello world'";

$action = empty($_GET['action']) ? 'version' : $_GET['action'];

function post($url, $payload) {
	global $api;
	$c = curl_init($api.$url);
	curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);

	curl_setopt($c, CURLOPT_POST, true);
	curl_setopt($c, CURLOPT_POSTFIELDS, json_encode($payload));

	curl_setopt($c, CURLOPT_HTTPHEADER, array(
		"Content-Type: application/json",
	));

	$out = curl_exec($c);
	curl_close($c);

	return $out;
}

switch ($action) {
	case 'compile':
		$code = isset($_REQUEST['code']) ? $_REQUEST['code'] : $default_code;
		header("Content-type: application/json");
		echo post("compile", array('code' => $code));
		break;
	case 'run':
		$code = isset($_REQUEST['code']) ? $_REQUEST['code'] : $default_code;
		header("Content-type: application/json");
		echo post("run", array('code' => $code));
		break;
	case 'version':
		$c = curl_init($api."version");
		curl_setopt($c, CURLOPT_RETURNTRANSFER, 1);
		echo curl_exec($c);
		curl_close($c);
		break;
}


