-- ============================================================
--  AutoRent — Sistem Rental Mobil
--  File Import phpMyAdmin: autorent.sql
--
--  CARA IMPORT:
--  1. Buka http://localhost/phpmyadmin
--  2. Klik "New" di sidebar kiri
--  3. Isi nama database: autorent  → klik Create
--  4. Klik database "autorent" → tab Import
--  5. Pilih file ini → klik Go
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+07:00";

-- ── Buat Database ──────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS `autorent`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `autorent`;

-- ── Tabel: users (login admin & operator) ─────────────────
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)  NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `role`       ENUM('Admin','Operator') NOT NULL DEFAULT 'Operator',
  `nama`       VARCHAR(100) NOT NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabel: mobil (armada kendaraan) ───────────────────────
CREATE TABLE IF NOT EXISTS `mobil` (
  `id`           VARCHAR(20)  NOT NULL,
  `nama`         VARCHAR(100) NOT NULL,
  `jenis`        ENUM('Sedan','SUV','MPV','Hatchback','Pickup','Mewah') NOT NULL DEFAULT 'MPV',
  `plat`         VARCHAR(20)  NOT NULL UNIQUE,
  `harga_per_hari` INT(11)    NOT NULL DEFAULT 0,
  `tahun`        YEAR         NOT NULL,
  `warna`        VARCHAR(50)  NOT NULL DEFAULT '',
  `kapasitas`    INT(3)       NOT NULL DEFAULT 5,
  `transmisi`    ENUM('Manual','Otomatis') NOT NULL DEFAULT 'Otomatis',
  `status`       ENUM('Tersedia','Disewa','Maintenance') NOT NULL DEFAULT 'Tersedia',
  `created_at`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabel: pelanggan ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `pelanggan` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `nama`       VARCHAR(100) NOT NULL,
  `ktp`        VARCHAR(30)  NOT NULL UNIQUE,
  `telp`       VARCHAR(20)  NOT NULL DEFAULT '',
  `email`      VARCHAR(100) NOT NULL DEFAULT '',
  `total_sewa` INT(11)      NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tabel: transaksi ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id`             VARCHAR(20)  NOT NULL,
  `pelanggan_nama` VARCHAR(100) NOT NULL,
  `pelanggan_ktp`  VARCHAR(30)  NOT NULL,
  `pelanggan_telp` VARCHAR(20)  NOT NULL DEFAULT '',
  `mobil_id`       VARCHAR(20)  NOT NULL,
  `tgl_mulai`      DATE         NOT NULL,
  `tgl_selesai`    DATE         NOT NULL,
  `tipe`           ENUM('harian','mingguan','bulanan') NOT NULL DEFAULT 'harian',
  `dengan_supir`   ENUM('tanpa','dengan') NOT NULL DEFAULT 'tanpa',
  `catatan`        TEXT,
  `biaya`          INT(11)      NOT NULL DEFAULT 0,
  `status`         ENUM('Aktif','Selesai','Terlambat','Dibatalkan') NOT NULL DEFAULT 'Aktif',
  `tgl_dibuat`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`mobil_id`) REFERENCES `mobil`(`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  DATA AWAL
-- ============================================================

-- Akun login
INSERT INTO `users` (`username`, `password`, `role`, `nama`) VALUES
('admin',    'admin123', 'Admin',    'Administrator'),
('operator', 'op123',    'Operator', 'Budi Santoso');

-- Data kendaraan demo
INSERT INTO `mobil` (`id`, `nama`, `jenis`, `plat`, `harga_per_hari`, `tahun`, `warna`, `kapasitas`, `transmisi`, `status`) VALUES
('M001', 'Toyota Avanza',      'MPV',      'B 1234 ABC', 350000, 2022, 'Putih',  7, 'Otomatis', 'Tersedia'),
('M002', 'Honda Brio',         'Hatchback','B 5678 DEF', 280000, 2023, 'Silver', 5, 'Otomatis', 'Tersedia'),
('M003', 'Mitsubishi Xpander', 'MPV',      'B 9012 GHI', 450000, 2022, 'Hitam',  7, 'Otomatis', 'Tersedia'),
('M004', 'Toyota Rush',        'SUV',      'D 3456 JKL', 400000, 2021, 'Merah',  7, 'Otomatis', 'Tersedia'),
('M005', 'BMW 3 Series',       'Mewah',    'B 0001 VIP', 1500000,2023, 'Hitam',  5, 'Otomatis', 'Tersedia'),
('M006', 'Suzuki Ertiga',      'MPV',      'B 7777 MNO', 320000, 2022, 'Abu',    7, 'Manual',   'Tersedia');

-- ============================================================
--  SELESAI — Database autorent siap digunakan!
-- ============================================================
