<?php
date_default_timezone_set('UTC');

require "db.php";

function query($q) {
  $q = mysql_query($q);
  if (!$q) die(mysql_error());
  return $q;
}

function err($msg) {
  echo json_encode(array("error" => true, "msg" => $msg));
}

function ip() {
  return $_SERVER["REMOTE_ADDR"];
}

function values($arr) { 
  $out = array();
  foreach ($arr as $key => $value) {
    $out[] = $key." = '".mysql_real_escape_string($value)."'";
  }

  return implode(", ", $out);
}

function validate($source, $names, &$failed=array()) {
  foreach ($names as $name) {
    if (empty($source[$name])) {
      $failed[] = $name;
    }
  }
  return empty($failed) ? true : false;
}

if (!isset($_GET["act"])) {
  $q = query("select * from snippets order by date desc limit 50");
  echo '
    <!DOCTYPE HTML>
    <html lang="en">
    <head>
    <meta name="robots" content="noindex" />
    <meta charset="UTF-8">
    <title>Snippets</title>
    </head>
    <body>
    ';
  echo "<h1>Last 50 snippets</h1>";
  echo "<ul>";
  while ($r = mysql_fetch_assoc($q)) {
    echo '<li><a href="/compiler/#'.base_convert($r['id'], 10, 36).'">'.
      $r["type"].' on '.date("F j, Y, g:i a", $r["date"]).'</a>';
  }
  echo "</ul>";

  echo '
    </body>
    </html>';

  exit();
}

switch ($_GET["act"]) {
case "get":
  $id = $_GET["id"];
  if (!preg_match("/^[a-z0-9]+$/i", $id)) {
    exit(err("invalid id"));
  }
  $id = base_convert($id, 36, 10);
  $where = values(array("id" => $id));

  $r = query("select * from snippets where ".$where);
  $r = mysql_fetch_assoc($r);
  if (!$r) exit(err("could not find snippet #".htmlentities($_GET['id'])));

  query("update snippets set views = views + 1 where ".$where);

  echo json_encode(array(
    "date" => $r["date"],
    "input" => $r["input"],
    "output" => $r["output"],
    "version" => $r["version"],
    "type" => $r["type"],
  ));

  break;
case "save":
  if ($_SERVER["REQUEST_METHOD"] != "POST") exit(err("expecting POST"));
  $r = query("select date
    from snippets
    where ".values(array("ip" => ip()))."
    order by date desc limit 1");

  if (mysql_num_rows($r) > 0) {
    $row = mysql_fetch_assoc($r);
    if (time() - intval($row["date"]) < 1) {
      exit(err("posting too fast"));
    }
  }

  // type, input, output
  if (!validate($_POST, array("type", "input"), $failed)) {
    exit(err("missing properties: " . implode(", ", $failed)));
  }

  if (!isset($_POST["output"])) $_POST["output"] = "";

  if (!in_array($_POST["type"], array("compile", "run"))) {
    exit(err("invalid type"));
  }

  query("insert into snippets
    set ".values(array(
      "ip" => ip(),
      "date" => time(),
      "version" => "0.2.0-dev",
      "type" => $_POST["type"],
      "input" => $_POST["input"],
      "output" => $_POST["output"],
    )));

  $id = base_convert(mysql_insert_id(), 10, 36);
  echo json_encode(array("success" => true, "id" => $id));
  break;
}

