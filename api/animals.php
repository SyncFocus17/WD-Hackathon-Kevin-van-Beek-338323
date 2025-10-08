<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$baseDir = dirname(__DIR__);
$animalsDir = $baseDir . DIRECTORY_SEPARATOR . 'animalcards';
$dbFile = $baseDir . DIRECTORY_SEPARATOR . 'scores.sqlite';

try {
  if (class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers(), true)) {
    $pdo = new PDO('sqlite:' . $dbFile);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE IF NOT EXISTS animals (key TEXT PRIMARY KEY, adult TEXT NOT NULL, baby TEXT NOT NULL)');
    $count = (int)$pdo->query('SELECT COUNT(1) FROM animals')->fetchColumn();
    if ($count === 0 && is_dir($animalsDir)) {
      $files = scandir($animalsDir);
      $pairs = [];
      foreach ($files as $file) {
        if ($file === '.' || $file === '..') { continue; }
        if (!preg_match('/^(.*)_(adult|baby)\.(png|jpg|jpeg|webp)$/i', $file, $m)) { continue; }
        $key = strtolower($m[1]);
        $type = strtolower($m[2]);
        if (!isset($pairs[$key])) { $pairs[$key] = ['key'=>$key]; }
        $pairs[$key][$type] = './animalcards/' . $file;
      }
      foreach ($pairs as $k=>$p) {
        if (isset($p['adult']) && isset($p['baby'])) {
          $stmt=$pdo->prepare('INSERT OR REPLACE INTO animals(key, adult, baby) VALUES(?,?,?)');
          $stmt->execute([$k, $p['adult'], $p['baby']]);
        }
      }
    }
    $rows = $pdo->query('SELECT key, adult, baby FROM animals')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(array_values($rows));
    exit;
  }
} catch (Exception $e) {
}

if (!is_dir($animalsDir)) {
  echo json_encode([]);
  exit;
}

$files = scandir($animalsDir);
$pairs = [];
foreach ($files as $file) {
  if ($file === '.' || $file === '..') { continue; }
  if (!preg_match('/^(.*)_(adult|baby)\.(png|jpg|jpeg|webp)$/i', $file, $m)) { continue; }
  $key = strtolower($m[1]);
  $type = strtolower($m[2]);
  if (!isset($pairs[$key])) { $pairs[$key] = ['key'=>$key]; }
  $pairs[$key][$type] = './animalcards/' . $file;
}

$result = array_values(array_filter($pairs, function($p){ return isset($p['adult']) && isset($p['baby']); }));
echo json_encode($result);




