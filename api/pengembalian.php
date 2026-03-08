<?php
error_reporting(0);
ini_set('display_errors', 0);
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET - Riwayat pengembalian
if ($method === 'GET') {
    $conn = getConnection();
    $sql  = "SELECT p.*, t.nama_pelanggan, t.mobil_id, t.tanggal_selesai,
                    m.nama AS nama_mobil, m.plat_nomor
             FROM pengembalian p
             JOIN transaksi t ON p.transaksi_id = t.id
             JOIN mobil m ON t.mobil_id = m.id
             ORDER BY p.created_at DESC";
    $result = $conn->query($sql);
    $rows   = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    $conn->close();
    echo json_encode(['success' => true, 'data' => $rows]);
    exit();
}

// POST - Proses pengembalian
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) {
        echo json_encode(['success' => false, 'message' => 'Data tidak valid.']);
        exit();
    }

    $trx_id    = trim($body['transaksi_id']   ?? '');
    $tgl_k     = trim($body['tanggal_kembali'] ?? '');
    $kondisi   = trim($body['kondisi']        ?? 'Baik');
    $kerusakan = intval($body['biaya_kerusakan'] ?? 0);
    $catatan   = trim($body['catatan']        ?? '');

    if (!$trx_id || !$tgl_k) {
        echo json_encode(['success' => false, 'message' => 'Transaksi dan tanggal kembali wajib diisi.']);
        exit();
    }

    $conn = getConnection();

    // Ambil data transaksi + tarif
    $stmt = $conn->prepare("SELECT t.*, m.tarif_harian, m.id AS m_id FROM transaksi t JOIN mobil m ON t.mobil_id = m.id WHERE t.id=? AND t.status='Aktif' LIMIT 1");
    $stmt->bind_param('s', $trx_id);
    $stmt->execute();
    $trx = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$trx) {
        echo json_encode(['success' => false, 'message' => 'Transaksi tidak ditemukan atau sudah selesai.']);
        $conn->close(); exit();
    }

    // Hitung denda
    $d_selesai  = new DateTime($trx['tanggal_selesai']);
    $d_kembali  = new DateTime($tgl_k);
    $terlambat  = max(0, (int)$d_selesai->diff($d_kembali)->days);
    $denda      = intval($terlambat * intval($trx['tarif_harian']) * 1.5);
    $total      = intval($trx['biaya_sewa']) + $denda + $kerusakan;

    // Simpan pengembalian
    $ins = $conn->prepare("INSERT INTO pengembalian (transaksi_id, tanggal_kembali, kondisi, biaya_kerusakan, denda_terlambat, total_bayar, catatan) VALUES (?,?,?,?,?,?,?)");
    $ins->bind_param('sssiiis', $trx_id, $tgl_k, $kondisi, $kerusakan, $denda, $total, $catatan);
    if (!$ins->execute()) {
        echo json_encode(['success' => false, 'message' => 'Gagal simpan pengembalian: ' . $conn->error]);
        $ins->close(); $conn->close(); exit();
    }
    $ins->close();

    // Update transaksi -> Selesai
    $u1 = $conn->prepare("UPDATE transaksi SET status='Selesai', denda=?, total_bayar=? WHERE id=?");
    $u1->bind_param('iis', $denda, $total, $trx_id);
    $u1->execute(); $u1->close();

    // Update mobil -> Tersedia
    $u2 = $conn->prepare("UPDATE mobil SET status='Tersedia' WHERE id=?");
    $u2->bind_param('s', $trx['m_id']);
    $u2->execute(); $u2->close();

    $conn->close();
    echo json_encode([
        'success'   => true,
        'message'   => 'Pengembalian berhasil dicatat.',
        'denda'     => $denda,
        'total'     => $total,
        'terlambat' => $terlambat
    ]);
    exit();
}

echo json_encode(['success' => false, 'message' => 'Method tidak didukung.']);
