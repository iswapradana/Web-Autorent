<?php
// ============================================================
//  AutoRent — API Dashboard (statistik)
//  GET → statistik ringkasan
// ============================================================
require_once '../config/database.php';

$conn = getConnection();

$total_mobil   = $conn->query("SELECT COUNT(*) AS c FROM mobil")->fetch_assoc()['c'];
$tersedia      = $conn->query("SELECT COUNT(*) AS c FROM mobil WHERE status='Tersedia'")->fetch_assoc()['c'];
$disewa        = $conn->query("SELECT COUNT(*) AS c FROM mobil WHERE status='Disewa'")->fetch_assoc()['c'];
$total_pelanggan = $conn->query("SELECT COUNT(*) AS c FROM pelanggan")->fetch_assoc()['c'];
$aktif         = $conn->query("SELECT COUNT(*) AS c FROM transaksi WHERE status='Aktif'")->fetch_assoc()['c'];
$selesai       = $conn->query("SELECT COUNT(*) AS c FROM transaksi WHERE status='Selesai'")->fetch_assoc()['c'];
$terlambat     = $conn->query("SELECT COUNT(*) AS c FROM transaksi WHERE status='Terlambat'")->fetch_assoc()['c'];
$pendapatan    = $conn->query("SELECT COALESCE(SUM(biaya),0) AS s FROM transaksi WHERE status != 'Dibatalkan'")->fetch_assoc()['s'];

$mobil_list = $conn->query("SELECT * FROM mobil ORDER BY created_at DESC LIMIT 6")->fetch_all(MYSQLI_ASSOC);

$conn->close();

sendJSON(['success'=>true,'data'=>[
    'total_mobil'     => (int)$total_mobil,
    'tersedia'        => (int)$tersedia,
    'disewa'          => (int)$disewa,
    'total_pelanggan' => (int)$total_pelanggan,
    'aktif'           => (int)$aktif,
    'selesai'         => (int)$selesai,
    'terlambat'       => (int)$terlambat,
    'pendapatan'      => (int)$pendapatan,
    'mobil_list'      => $mobil_list,
]]);
