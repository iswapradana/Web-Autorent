<?php
// ============================================================
//  AutoRent — API Pelanggan
//  GET → semua pelanggan + total sewa
// ============================================================
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $conn = getConnection();
    $result = $conn->query(
        "SELECT p.*, COUNT(t.id) AS total_sewa_count
         FROM pelanggan p
         LEFT JOIN transaksi t ON t.pelanggan_ktp = p.ktp
         GROUP BY p.id ORDER BY p.nama"
    );
    sendJSON(['success'=>true,'data'=>$result->fetch_all(MYSQLI_ASSOC)]);
}

sendJSON(['success'=>false,'message'=>'Method tidak didukung'], 405);
