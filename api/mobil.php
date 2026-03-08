<?php

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? '';

// GET: ambil semua kendaraan 
if ($method === 'GET') {
    $conn = getConnection();
    $result = $conn->query("SELECT * FROM mobil ORDER BY created_at DESC");
    $rows = $result->fetch_all(MYSQLI_ASSOC);
    $conn->close();
    sendJSON(['success'=>true,'data'=>$rows]);
}

// ── POST: tambah kendaraan baru ────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    $mid        = 'M'.strtoupper(substr(md5(uniqid()),0,8));
    $nama       = trim($b['nama']       ?? '');
    $jenis      = trim($b['jenis']      ?? 'MPV');
    $plat       = strtoupper(trim($b['plat'] ?? ''));
    $harga      = intval($b['harga']    ?? 0);
    $tahun      = intval($b['tahun']    ?? date('Y'));
    $warna      = trim($b['warna']      ?? '');
    $kapasitas  = intval($b['kapasitas'] ?? 5);
    $transmisi  = trim($b['transmisi']  ?? 'Otomatis');

    if (!$nama || !$plat || !$harga || !$tahun) {
        sendJSON(['success'=>false,'message'=>'Field wajib tidak lengkap'], 400);
    }

    $conn = getConnection();

    // Cek plat duplikat
    $chk = $conn->prepare("SELECT id FROM mobil WHERE plat = ?");
    $chk->bind_param('s', $plat);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) {
        $conn->close();
        sendJSON(['success'=>false,'message'=>'Plat nomor sudah terdaftar'], 409);
    }

    $stmt = $conn->prepare(
        "INSERT INTO mobil (id,nama,jenis,plat,harga_per_hari,tahun,warna,kapasitas,transmisi,status)
         VALUES (?,?,?,?,?,?,?,?,?,'Tersedia')"
    );
    $stmt->bind_param('ssssiisis', $mid, $nama, $jenis, $plat, $harga, $tahun, $warna, $kapasitas, $transmisi);
    $stmt->execute();
    $conn->close();

    sendJSON(['success'=>true,'message'=>"$nama berhasil ditambahkan",'id'=>$mid]);
}

// ── PUT: update status ─────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) sendJSON(['success'=>false,'message'=>'ID diperlukan'], 400);
    $b      = getBody();
    $status = trim($b['status'] ?? '');
    if (!$status) sendJSON(['success'=>false,'message'=>'Status diperlukan'], 400);

    $conn = getConnection();
    $stmt = $conn->prepare("UPDATE mobil SET status=? WHERE id=?");
    $stmt->bind_param('ss', $status, $id);
    $stmt->execute();
    $conn->close();
    sendJSON(['success'=>true,'message'=>'Status diperbarui']);
}

// ── DELETE: hapus kendaraan ───────────────────────────────
if ($method === 'DELETE') {
    if (!$id) sendJSON(['success'=>false,'message'=>'ID diperlukan'], 400);
    $conn = getConnection();

    // Cek sedang disewa
    $chk = $conn->prepare("SELECT status FROM mobil WHERE id=?");
    $chk->bind_param('s', $id);
    $chk->execute();
    $row = $chk->get_result()->fetch_assoc();
    if ($row && $row['status'] === 'Disewa') {
        $conn->close();
        sendJSON(['success'=>false,'message'=>'Tidak bisa hapus kendaraan yang sedang disewa'], 409);
    }

    $stmt = $conn->prepare("DELETE FROM mobil WHERE id=?");
    $stmt->bind_param('s', $id);
    $stmt->execute();
    $conn->close();
    sendJSON(['success'=>true,'message'=>'Kendaraan dihapus']);
}

sendJSON(['success'=>false,'message'=>'Method tidak didukung'], 405);
