<?php
// ============================================================
//  AutoRent — API Transaksi
//  GET         → semua transaksi (join dengan mobil)
//  POST        → buat transaksi baru
//  PUT ?id=xxx → selesaikan transaksi
// ============================================================
require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? '';

// ── GET ───────────────────────────────────────────────────
if ($method === 'GET') {
    $conn = getConnection();
    $result = $conn->query(
        "SELECT t.*, m.nama AS mobil_nama, m.jenis AS mobil_jenis, m.plat AS mobil_plat
         FROM transaksi t
         LEFT JOIN mobil m ON t.mobil_id = m.id
         ORDER BY t.tgl_dibuat DESC"
    );
    sendJSON(['success'=>true,'data'=>$result->fetch_all(MYSQLI_ASSOC)]);
}

// ── POST: buat transaksi baru ─────────────────────────────
if ($method === 'POST') {
    $b = getBody();
    $pelanggan_nama  = trim($b['pelanggan_nama']  ?? '');
    $pelanggan_ktp   = trim($b['pelanggan_ktp']   ?? '');
    $pelanggan_telp  = trim($b['pelanggan_telp']  ?? '');
    $pelanggan_email = trim($b['pelanggan_email'] ?? '');
    $mobil_id        = trim($b['mobil_id']        ?? '');
    $tgl_mulai       = trim($b['tgl_mulai']       ?? '');
    $tgl_selesai     = trim($b['tgl_selesai']     ?? '');
    $tipe            = trim($b['tipe']            ?? 'harian');
    $dengan_supir    = trim($b['dengan_supir']    ?? 'tanpa');
    $catatan         = trim($b['catatan']         ?? '');
    $biaya           = intval($b['biaya']         ?? 0);

    if (!$pelanggan_nama || !$pelanggan_ktp || !$mobil_id || !$tgl_mulai || !$tgl_selesai) {
        sendJSON(['success'=>false,'message'=>'Data tidak lengkap'], 400);
    }

    $conn = getConnection();

    // Cek mobil tersedia
    $chk = $conn->prepare("SELECT status FROM mobil WHERE id=?");
    $chk->bind_param('s', $mobil_id);
    $chk->execute();
    $mobil = $chk->get_result()->fetch_assoc();
    if (!$mobil || $mobil['status'] !== 'Tersedia') {
        $conn->close();
        sendJSON(['success'=>false,'message'=>'Kendaraan tidak tersedia'], 409);
    }

    // Generate ID transaksi
    $count = $conn->query("SELECT COUNT(*) AS c FROM transaksi")->fetch_assoc()['c'];
    $trx_id = 'TRX' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

    // Simpan pelanggan jika belum ada
    $ep = $conn->prepare("SELECT id FROM pelanggan WHERE ktp=?");
    $ep->bind_param('s', $pelanggan_ktp);
    $ep->execute();
    if ($ep->get_result()->num_rows === 0) {
        $ip = $conn->prepare("INSERT INTO pelanggan(nama,ktp,telp,email) VALUES(?,?,?,?)");
        $ip->bind_param('ssss', $pelanggan_nama, $pelanggan_ktp, $pelanggan_telp, $pelanggan_email);
        $ip->execute();
    }

    // Simpan transaksi
    $stmt = $conn->prepare(
        "INSERT INTO transaksi
         (id,pelanggan_nama,pelanggan_ktp,pelanggan_telp,mobil_id,tgl_mulai,tgl_selesai,tipe,dengan_supir,catatan,biaya,status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,'Aktif')"
    );
    $stmt->bind_param('ssssssssssi',
        $trx_id, $pelanggan_nama, $pelanggan_ktp, $pelanggan_telp,
        $mobil_id, $tgl_mulai, $tgl_selesai, $tipe, $dengan_supir, $catatan, $biaya
    );
    $stmt->execute();

    // Update status mobil → Disewa
    $um = $conn->prepare("UPDATE mobil SET status='Disewa' WHERE id=?");
    $um->bind_param('s', $mobil_id);
    $um->execute();

    $conn->close();
    sendJSON(['success'=>true,'message'=>"Transaksi $trx_id berhasil dibuat",'id'=>$trx_id]);
}

// ── PUT: selesaikan transaksi ─────────────────────────────
if ($method === 'PUT') {
    if (!$id) sendJSON(['success'=>false,'message'=>'ID diperlukan'], 400);
    $conn = getConnection();

    // Ambil mobil_id dari transaksi
    $get = $conn->prepare("SELECT mobil_id FROM transaksi WHERE id=?");
    $get->bind_param('s', $id);
    $get->execute();
    $trx = $get->get_result()->fetch_assoc();
    if (!$trx) { $conn->close(); sendJSON(['success'=>false,'message'=>'Transaksi tidak ditemukan'], 404); }

    // Update status transaksi → Selesai
    $stmt = $conn->prepare("UPDATE transaksi SET status='Selesai' WHERE id=?");
    $stmt->bind_param('s', $id);
    $stmt->execute();

    // Update status mobil → Tersedia
    $um = $conn->prepare("UPDATE mobil SET status='Tersedia' WHERE id=?");
    $um->bind_param('s', $trx['mobil_id']);
    $um->execute();

    // Update total sewa pelanggan
    $ktp = $conn->query("SELECT pelanggan_ktp FROM transaksi WHERE id='$id'")->fetch_assoc()['pelanggan_ktp'];
    $conn->prepare("UPDATE pelanggan SET total_sewa=total_sewa+1 WHERE ktp=?")->execute();

    $conn->close();
    sendJSON(['success'=>true,'message'=>"Transaksi $id diselesaikan"]);
}

sendJSON(['success'=>false,'message'=>'Method tidak didukung'], 405);
