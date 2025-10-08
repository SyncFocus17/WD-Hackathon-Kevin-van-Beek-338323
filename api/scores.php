<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$root = dirname(__DIR__);
$dbFile = $root . DIRECTORY_SEPARATOR . 'scores.sqlite';
$jsonFile = $root . DIRECTORY_SEPARATOR . 'scores.json';

function json_store_get($file){
  if (!file_exists($file)) { return []; }
  $raw = @file_get_contents($file);
  if ($raw === false) { return []; }
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function json_store_put($file, $list){
  $tmp = $file . '.tmp';
  $json = json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
  $fp = @fopen($tmp, 'wb');
  if ($fp === false) { return false; }
  @flock($fp, LOCK_EX);
  fwrite($fp, $json);
  @flock($fp, LOCK_UN);
  fclose($fp);
  @rename($tmp, $file);
  return true;
}

$useSqlite = true;
try {
  if (class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE IF NOT EXISTS scores (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, turns INTEGER NOT NULL, seconds INTEGER NOT NULL, start_time INTEGER, end_time INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');
    $useSqlite = true;
  }
} catch (Exception $e) {
  $useSqlite = false;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $input = json_decode(file_get_contents('php://input'), true);
  $name = trim($input['name'] ?? '');
  $turns = intval($input['turns'] ?? 0);
  $seconds = intval($input['seconds'] ?? 0);
  $startTime = intval($input['start_time'] ?? 0);
  $endTime = intval($input['end_time'] ?? 0);
  if ($name === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid payload']);
    exit;
  }
  if (strlen($name) > 20) { $name = substr($name, 0, 20); }
  if ($turns < 0) { $turns = 0; }
  if ($seconds < 0) { $seconds = 0; }
  if ($useSqlite) {
    $stmt = $pdo->prepare('INSERT INTO scores(name, turns, seconds, start_time, end_time) VALUES(?,?,?,?,?)');
    $stmt->execute([$name, $turns, $seconds, $startTime ?: null, $endTime ?: null]);
  }
}

if ($useSqlite) {
  $stmt = $pdo->query('SELECT name, turns, seconds, start_time, end_time FROM scores ORDER BY turns ASC, seconds ASC, created_at ASC LIMIT 10');
  echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} else {
  http_response_code(500);
  echo json_encode(['error'=>'sqlite_unavailable']);
}





