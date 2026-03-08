<?php
// ============================================================
//  AutoRent — Konfigurasi Database
//  File: config/database.php
// ============================================================
error_reporting(0);
ini_set('display_errors', 0);

define('DB_HOST',    'localhost');
define('DB_USER',    'root');
define('DB_PASS',    '');
define('DB_NAME',    'autorent');
define('DB_CHARSET', 'utf8mb4');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

function getConnection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        http_response_code(500);
        echo json_encode(['success'=>false,'message'=>'Koneksi gagal: '.$conn->connect_error]);
        exit();
    }
    $conn->set_charset(DB_CHARSET);
    return $conn;
}
function sendJSON($data, $code=200) { http_response_code($code); echo json_encode($data); exit(); }
function getBody() { return json_decode(file_get_contents('php://input'), true) ?? []; }
