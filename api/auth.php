<?php
// ============================================================
//  AutoRent — API Autentikasi
//  File: api/auth.php
//  POST ?action=login  { username, password }
//  POST ?action=logout
// ============================================================
require_once '../config/database.php';

$action = $_GET['action'] ?? '';
$body   = getBody();

if ($action === 'login') {
    $username = trim($body['username'] ?? '');
    $password = trim($body['password'] ?? '');

    if (!$username || !$password) {
        sendJSON(['success'=>false,'message'=>'Username dan password wajib diisi'], 400);
    }

    $conn = getConnection();
    $stmt = $conn->prepare("SELECT id, username, password, role, nama FROM users WHERE username = ? LIMIT 1");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $conn->close();

    if (!$row || $row['password'] !== $password) {
        sendJSON(['success'=>false,'message'=>'Username atau password salah'], 401);
    }

    sendJSON(['success'=>true,'data'=>[
        'id'       => $row['id'],
        'username' => $row['username'],
        'role'     => $row['role'],
        'nama'     => $row['nama'],
    ]]);
}

sendJSON(['success'=>false,'message'=>'Action tidak dikenali'], 400);
