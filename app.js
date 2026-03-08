const API = 'http://localhost/autorent/api';

const AutoRent = (() => {

  
  // CLASS: Kendaraan
  
  class Kendaraan {
    #id; #nama; #plat; #tahun; #warna;
    constructor(id, nama, plat, tahun, warna) {
      this.#id = id; this.#nama = nama; this.#plat = plat;
      this.#tahun = tahun; this.#warna = warna;
      this.status = 'Tersedia';
    }
    get id()    { return this.#id;    }
    get nama()  { return this.#nama;  }
    get plat()  { return this.#plat;  }
    get tahun() { return this.#tahun; }
    get warna() { return this.#warna; }
    getInfo() { return `${this.#nama} (${this.#plat}) - ${this.#tahun}`; }
    hitungBiayaTambahan(hari) { return 0; }
    getEmoji() { return '🚗'; }
  }

  
  // CLASS: MobilBiasa extends Kendaraan (Inheritance)
  
  class MobilBiasa extends Kendaraan {
    constructor(id, nama, plat, tahun, warna, hargaPerHari, kapasitas, transmisi) {
      super(id, nama, plat, tahun, warna);
      this.jenis = 'MPV'; this.hargaPerHari = hargaPerHari;
      this.kapasitas = kapasitas; this.transmisi = transmisi;
    }
    hitungBiayaTambahan(hari) { return 0; }
    getEmoji() { return '🚙'; }
  }

  
  // CLASS: MobilMewah extends Kendaraan (Polymorphism)
  
  class MobilMewah extends Kendaraan {
    constructor(id, nama, plat, tahun, warna, hargaPerHari, kapasitas, transmisi) {
      super(id, nama, plat, tahun, warna);
      this.jenis = 'Mewah'; this.hargaPerHari = hargaPerHari;
      this.kapasitas = kapasitas; this.transmisi = transmisi;
    }
    hitungBiayaTambahan(hari) { return hari * 100000; }
    getEmoji() { return '🏎️'; }
    getInfo()  { return super.getInfo() + ' [PREMIUM]'; }
  }

  
  // CLASS: Pelanggan
 
  class Pelanggan {
    #ktp;
    constructor(nama, ktp, telp, email) {
      this.nama = nama; this.#ktp = ktp;
      this.telp = telp; this.email = email;
      this.totalSewa = 0; this.riwayat = [];
    }
    get ktp() { return this.#ktp; }
    tambahSewa(id) { this.totalSewa++; this.riwayat.push(id); }
    getStatus() {
      if (this.totalSewa >= 5) return 'VIP';
      if (this.totalSewa >= 2) return 'Regular';
      return 'Baru';
    }
  }

  
  // CLASS: Transaksi
  
  class Transaksi {
    static counter = 1;
    constructor(pelanggan, mobil, tglMulai, tglSelesai, tipe, denganSupir, catatan) {
      this.id = 'TRX' + String(Transaksi.counter++).padStart(4,'0');
      this.pelanggan = pelanggan; this.mobil = mobil;
      this.tglMulai = tglMulai; this.tglSelesai = tglSelesai;
      this.tipe = tipe; this.denganSupir = denganSupir;
      this.catatan = catatan; this.status = 'Aktif';
      this.biaya = this.hitungBiaya();
      this.tglDibuat = new Date().toISOString();
    }
    hitungHari() {
      return Math.max(1, Math.ceil((new Date(this.tglSelesai)-new Date(this.tglMulai))/(1000*60*60*24)));
    }
    hitungBiaya() {
      const hari = this.hitungHari();
      let total = this.mobil.hargaPerHari * hari;
      const diskon = { harian:0, mingguan:0.10, bulanan:0.20 };
      total -= total * (diskon[this.tipe] || 0);
      if (this.denganSupir === 'dengan') total += 150000 * hari;
      total += this.mobil.hitungBiayaTambahan(hari);
      return Math.round(total);
    }
    selesaikan() { this.status = 'Selesai'; }
  }

  
  // Array utama (state lokal — sync dengan database)
  
  let armada          = [];
  let daftarPelanggan = [];
  let daftarTransaksi = [];

  
  // UTILITI
  
  function rupiahFormat(n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); }

  function rowToMobil(row) {
    const m = row.jenis === 'Mewah'
      ? new MobilMewah(row.id, row.nama, row.plat, row.tahun, row.warna, row.harga_per_hari, row.kapasitas, row.transmisi)
      : new MobilBiasa(row.id, row.nama, row.plat, row.tahun, row.warna, row.harga_per_hari, row.kapasitas, row.transmisi);
    m.jenis  = row.jenis;
    m.status = row.status;
    return m;
  }

  
  // API HELPERS
 
  async function apiGet(endpoint) {
    try {
      const res = await fetch(`${API}/${endpoint}`);
      return await res.json();
    } catch(e) { return { success: false }; }
  }
  async function apiPost(endpoint, body) {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch(e) { return { success: false }; }
  }
  async function apiPut(endpoint, body) {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch(e) { return { success: false }; }
  }
  async function apiDelete(endpoint) {
    try {
      const res = await fetch(`${API}/${endpoint}`, { method: 'DELETE' });
      return await res.json();
    } catch(e) { return { success: false }; }
  }

  // 
  // LOAD DATA DATABASE
  // 
  async function loadAll() {
    const [dm, dt, dp] = await Promise.all([
      apiGet('mobil.php'),
      apiGet('transaksi.php'),
      apiGet('pelanggan.php'),
    ]);

    armada = (dm.data || []).map(rowToMobil);

    daftarTransaksi = (dt.data || []).map(t => {
      const mobil = armada.find(m => m.id === t.mobil_id) || {
        id: t.mobil_id, nama: t.mobil_nama || '-', jenis: t.mobil_jenis || '-',
        hargaPerHari: 0, hitungBiayaTambahan: () => 0, getEmoji: () => '🚗'
      };
      return {
        id: t.id,
        pelanggan: { nama: t.pelanggan_nama, ktp: t.pelanggan_ktp, telp: t.pelanggan_telp },
        mobil,
        tglMulai: t.tgl_mulai, tglSelesai: t.tgl_selesai,
        tipe: t.tipe, denganSupir: t.dengan_supir, catatan: t.catatan,
        status: t.status, biaya: t.biaya, tglDibuat: t.tgl_dibuat
      };
    });

    daftarPelanggan = (dp.data || []).map(p => {
      const obj = new Pelanggan(p.nama, p.ktp, p.telp, p.email);
      obj.totalSewa = parseInt(p.total_sewa_count) || 0;
      return obj;
    });

    renderAll();
  }

  // 
  // RENDER
  // 
  function renderDashboard() {
    const tersedia   = armada.filter(m => m.status === 'Tersedia').length;
    const disewa     = armada.filter(m => m.status === 'Disewa').length;
    const aktif      = daftarTransaksi.filter(t => t.status === 'Aktif').length;
    const selesai    = daftarTransaksi.filter(t => t.status === 'Selesai').length;
    const terlambat  = daftarTransaksi.filter(t => t.status === 'Terlambat').length;
    const pendapatan = daftarTransaksi.filter(t => t.status !== 'Dibatalkan').reduce((s,t) => s + parseInt(t.biaya||0), 0);

    document.getElementById('stat-total-mobil').textContent = armada.length;
    document.getElementById('stat-tersedia').textContent    = tersedia;
    document.getElementById('stat-disewa').textContent      = disewa;
    document.getElementById('stat-pelanggan').textContent   = daftarPelanggan.length;
    document.getElementById('sum-pendapatan').textContent   = rupiahFormat(pendapatan);
    document.getElementById('sum-aktif').textContent        = aktif;
    document.getElementById('sum-selesai').textContent      = selesai;
    document.getElementById('sum-terlambat').textContent    = terlambat;

    document.getElementById('dashboard-cars').innerHTML =
      armada.slice(0,6).map(m => renderCarCard(m)).join('');
  }

  function renderCarCard(m) {
    const badgeClass = m.status === 'Tersedia' ? '' : m.jenis === 'Mewah' ? 'premium' : 'unavail';
    return `
      <div class="car-card" onclick="showCarDetail('${m.id}')">
        <div class="car-img">
          ${m.getEmoji ? m.getEmoji() : '🚗'}
          <div class="car-badge ${badgeClass}">${m.status}</div>
        </div>
        <div class="car-info">
          <div class="car-name">${m.nama}</div>
          <div class="car-type">${m.plat} · ${m.jenis} · ${m.tahun}</div>
          <div class="car-meta">
            <div class="car-price">${rupiahFormat(m.hargaPerHari)} <span>/hari</span></div>
          </div>
          <div class="car-features">
            <span class="feat-tag">${m.transmisi||'Auto'}</span>
            <span class="feat-tag">${m.kapasitas||5} org</span>
            <span class="feat-tag">${m.warna}</span>
          </div>
        </div>
      </div>`;
  }

  function renderTabelMobil() {
    document.getElementById('tbody-mobil').innerHTML = armada.map((m,i) => `
      <tr>
        <td>${i+1}</td>
        <td><strong>${m.nama}</strong><br><small style="color:var(--muted)">${m.getInfo ? m.getInfo() : m.nama}</small></td>
        <td>${m.plat}</td>
        <td>${m.jenis}</td>
        <td>${m.tahun}</td>
        <td>${rupiahFormat(m.hargaPerHari)}</td>
        <td><span class="badge ${m.status==='Tersedia'?'badge-green':'badge-yellow'}">${m.status}</span></td>
        <td>
          <div class="flex-row">
            <button class="btn btn-secondary btn-sm" onclick="toggleStatus('${m.id}')">Toggle Status</button>
            <button class="btn btn-danger btn-sm"    onclick="hapusMobil('${m.id}')">Hapus</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function renderTransaksi() {
    const keyword = document.getElementById('filter-transaksi').value.toLowerCase();
    const sf      = document.getElementById('filter-status').value;
    const today   = new Date().toISOString().split('T')[0];

    let data = daftarTransaksi.map(t => {
      if (t.status === 'Aktif' && t.tglSelesai < today) t.status = 'Terlambat';
      return t;
    });
    if (keyword) data = data.filter(t =>
      (t.pelanggan.nama||'').toLowerCase().includes(keyword) ||
      (t.mobil.nama||'').toLowerCase().includes(keyword) ||
      t.id.toLowerCase().includes(keyword)
    );
    if (sf) data = data.filter(t => t.status === sf);

    const tbody = document.getElementById('tbody-transaksi');
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:2rem">Belum ada transaksi</td></tr>';
      return;
    }
    tbody.innerHTML = data.map(t => {
      const bc = {Aktif:'badge-green',Selesai:'badge-gray',Terlambat:'badge-red'}[t.status]||'badge-gray';
      return `
        <tr>
          <td><strong>${t.id}</strong></td>
          <td>${t.pelanggan.nama}</td>
          <td>${t.mobil.nama}</td>
          <td>${t.tglMulai}</td>
          <td>${t.tglSelesai}</td>
          <td><strong style="color:var(--accent)">${rupiahFormat(t.biaya)}</strong></td>
          <td><span class="badge ${bc}">${t.status}</span></td>
          <td>
            <div class="flex-row">
              <button class="btn btn-secondary btn-sm" onclick="showTrxDetail('${t.id}')">Detail</button>
              ${t.status==='Aktif'||t.status==='Terlambat'
                ? `<button class="btn btn-success btn-sm" onclick="selesaikanTrx('${t.id}')">Selesai</button>` : ''}
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function renderPelanggan() {
    const tbody = document.getElementById('tbody-pelanggan');
    if (!daftarPelanggan.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:2rem">Belum ada data pelanggan</td></tr>';
      return;
    }
    tbody.innerHTML = daftarPelanggan.map((p,i) => {
      const sc = {VIP:'badge-yellow',Regular:'badge-green',Baru:'badge-gray'}[p.getStatus()];
      return `<tr>
        <td>${i+1}</td>
        <td><strong>${p.nama}</strong></td>
        <td>${p.ktp}</td>
        <td>${p.telp}</td>
        <td>${p.email||'-'}</td>
        <td>${p.totalSewa}x</td>
        <td><span class="badge ${sc}">${p.getStatus()}</span></td>
      </tr>`;
    }).join('');
  }

  function renderLaporan() {
    const totalPend = daftarTransaksi.reduce((s,t) => s + parseInt(t.biaya||0), 0);
    const jenisMap  = {};
    armada.forEach(m => {
      if (!jenisMap[m.jenis]) jenisMap[m.jenis] = {unit:0,sewa:0,pendapatan:0};
      jenisMap[m.jenis].unit++;
    });
    daftarTransaksi.forEach(t => {
      const j = t.mobil.jenis||'Lainnya';
      if (!jenisMap[j]) jenisMap[j] = {unit:0,sewa:0,pendapatan:0};
      jenisMap[j].sewa++;
      jenisMap[j].pendapatan += parseInt(t.biaya||0);
    });
    document.getElementById('laporan-summary').innerHTML = `
      <div class="summary-card"><div class="sum-label">Total Pendapatan</div><div class="sum-value accent">${rupiahFormat(totalPend)}</div></div>
      <div class="summary-card"><div class="sum-label">Total Transaksi</div><div class="sum-value">${daftarTransaksi.length}</div></div>
      <div class="summary-card"><div class="sum-label">Total Pelanggan</div><div class="sum-value">${daftarPelanggan.length}</div></div>
      <div class="summary-card"><div class="sum-label">Total Armada</div><div class="sum-value">${armada.length}</div></div>`;
    document.getElementById('tbody-laporan-jenis').innerHTML = Object.entries(jenisMap).map(([j,v]) =>
      `<tr><td>${j}</td><td>${v.unit}</td><td>${v.sewa}</td><td><strong style="color:var(--accent)">${rupiahFormat(v.pendapatan)}</strong></td></tr>`
    ).join('');
  }

  function renderSelectMobil() {
    const sel      = document.getElementById('s-mobil');
    const tersedia = armada.filter(m => m.status === 'Tersedia');
    sel.innerHTML  = tersedia.length
      ? tersedia.map(m => `<option value="${m.id}">${m.nama} (${m.plat}) - ${rupiahFormat(m.hargaPerHari)}/hari</option>`).join('')
      : '<option value="">-- Tidak ada kendaraan tersedia --</option>';
  }

  function renderAll() {
    renderDashboard(); renderTabelMobil(); renderTransaksi();
    renderPelanggan(); renderLaporan(); renderSelectMobil();
  }

  
  // ACTIONS
  
  async function tambahMobil() {
    const nama      = document.getElementById('m-nama').value.trim();
    const jenis     = document.getElementById('m-jenis').value;
    const plat      = document.getElementById('m-plat').value.trim().toUpperCase();
    const harga     = parseInt(document.getElementById('m-harga').value);
    const tahun     = parseInt(document.getElementById('m-tahun').value);
    const warna     = document.getElementById('m-warna').value.trim();
    const kapasitas = parseInt(document.getElementById('m-kapasitas').value) || 5;
    const transmisi = document.getElementById('m-transmisi').value;

    if (!nama || !plat || !harga || !tahun) { showToast('Isi semua field wajib!','error'); return; }

    const res = await apiPost('mobil.php', { nama, jenis, plat, harga, tahun, warna, kapasitas, transmisi });
    if (!res.success) { showToast(res.message||'Gagal menambah kendaraan','error'); return; }
    showToast(`✅ ${nama} berhasil ditambahkan!`, 'success');
    resetFormMobil();
    await loadAll();
  }

  function resetFormMobil() {
    ['m-nama','m-plat','m-harga','m-tahun','m-warna','m-kapasitas'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  async function hapusMobil(id) {
    const m = armada.find(m => m.id === id);
    if (!m) return;
    if (m.status === 'Disewa') { showToast('Tidak bisa hapus kendaraan yang sedang disewa!','error'); return; }
    if (!confirm(`Hapus ${m.nama}?`)) return;
    const res = await apiDelete(`mobil.php?id=${id}`);
    if (!res.success) { showToast(res.message||'Gagal menghapus','error'); return; }
    showToast(`🗑 ${m.nama} dihapus`, 'success');
    await loadAll();
  }

  async function toggleStatus(id) {
    const m = armada.find(m => m.id === id);
    if (!m) return;
    if (m.status === 'Disewa') { showToast('Kendaraan sedang aktif disewa!','error'); return; }
    const newStatus = m.status === 'Tersedia' ? 'Maintenance' : 'Tersedia';
    const res = await apiPut(`mobil.php?id=${id}`, { status: newStatus });
    if (!res.success) { showToast('Gagal mengubah status','error'); return; }
    showToast(`Status ${m.nama} → ${newStatus}`, 'success');
    await loadAll();
  }

  function hitungHarga() {
    const mobilId    = document.getElementById('s-mobil').value;
    const tglMulai   = document.getElementById('s-tgl-mulai').value;
    const tglSelesai = document.getElementById('s-tgl-selesai').value;
    if (!mobilId || !tglMulai || !tglSelesai) {
      document.getElementById('panel-kalkulasi').style.display = 'none'; return;
    }
    const mobil = armada.find(m => m.id === mobilId);
    if (!mobil) return;
    const d1 = new Date(tglMulai), d2 = new Date(tglSelesai);
    if (d2 <= d1) { showToast('Tanggal selesai harus setelah tanggal mulai!','error'); return; }
    const hari        = Math.ceil((d2-d1)/(1000*60*60*24));
    const tipe        = document.getElementById('s-tipe').value;
    const supir       = document.getElementById('s-supir').value;
    const diskon      = {harian:0,mingguan:0.10,bulanan:0.20}[tipe]||0;
    let biayaMobil    = mobil.hargaPerHari * hari;
    let disc          = biayaMobil * diskon;
    let biayaSupir    = supir==='dengan' ? 150000*hari : 0;
    let biayaTambahan = mobil.hitungBiayaTambahan ? mobil.hitungBiayaTambahan(hari) : 0;
    let total         = biayaMobil - disc + biayaSupir + biayaTambahan;

    document.getElementById('panel-kalkulasi').style.display = 'block';
    document.getElementById('receipt-content').innerHTML = `
      <div class="receipt-row"><span>${mobil.nama}</span><span>${rupiahFormat(mobil.hargaPerHari)} × ${hari} hari</span></div>
      <div class="receipt-row"><span>Biaya sewa</span><span>${rupiahFormat(biayaMobil)}</span></div>
      ${disc>0?`<div class="receipt-row" style="color:var(--success)"><span>Diskon ${tipe} (${(diskon*100).toFixed(0)}%)</span><span>-${rupiahFormat(disc)}</span></div>`:''}
      ${biayaSupir>0?`<div class="receipt-row"><span>Supir (${hari} hari)</span><span>${rupiahFormat(biayaSupir)}</span></div>`:''}
      ${biayaTambahan>0?`<div class="receipt-row"><span>Biaya premium</span><span>${rupiahFormat(biayaTambahan)}</span></div>`:''}
      <div class="receipt-row total"><span>TOTAL</span><span>${rupiahFormat(total)}</span></div>`;
  }

  async function prosesTransaksi() {
    const nama       = document.getElementById('s-nama').value.trim();
    const ktp        = document.getElementById('s-ktp').value.trim();
    const telp       = document.getElementById('s-telp').value.trim();
    const email      = document.getElementById('s-email').value.trim();
    const mobilId    = document.getElementById('s-mobil').value;
    const tglMulai   = document.getElementById('s-tgl-mulai').value;
    const tglSelesai = document.getElementById('s-tgl-selesai').value;
    const tipe       = document.getElementById('s-tipe').value;
    const supir      = document.getElementById('s-supir').value;
    const catatan    = document.getElementById('s-catatan').value;

    if (!nama||!ktp||!telp||!mobilId||!tglMulai||!tglSelesai) {
      showToast('Lengkapi semua data penyewa!','error'); return;
    }
    const mobil = armada.find(m => m.id === mobilId);
    const hari  = Math.ceil((new Date(tglSelesai)-new Date(tglMulai))/(1000*60*60*24));
    const diskon= {harian:0,mingguan:0.10,bulanan:0.20}[tipe]||0;
    let biaya   = mobil.hargaPerHari * hari;
    biaya      -= biaya * diskon;
    if (supir==='dengan') biaya += 150000 * hari;
    biaya      += mobil.hitungBiayaTambahan(hari);
    biaya       = Math.round(biaya);

    const res = await apiPost('transaksi.php', {
      pelanggan_nama: nama, pelanggan_ktp: ktp,
      pelanggan_telp: telp, pelanggan_email: email,
      mobil_id: mobilId, tgl_mulai: tglMulai, tgl_selesai: tglSelesai,
      tipe, dengan_supir: supir, catatan, biaya
    });
    if (!res.success) { showToast(res.message||'Gagal proses transaksi','error'); return; }
    showToast(`✅ Transaksi ${res.id} berhasil dibuat!`, 'success');
    resetFormSewa();
    await loadAll();
  }

  function resetFormSewa() {
    ['s-nama','s-ktp','s-telp','s-email','s-tgl-mulai','s-tgl-selesai','s-catatan'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('panel-kalkulasi').style.display = 'none';
  }

  async function selesaikanTrx(id) {
    const res = await apiPut(`transaksi.php?id=${id}`, {});
    if (!res.success) { showToast(res.message||'Gagal','error'); return; }
    showToast(`✅ Transaksi ${id} diselesaikan`, 'success');
    await loadAll();
  }

  function showCarDetail(id) {
    const m = armada.find(m => m.id === id);
    if (!m) return;
    document.getElementById('modal-car-title').textContent = m.nama;
    document.getElementById('modal-car-body').innerHTML = `
      <div style="font-size:5rem;text-align:center;margin-bottom:1rem">${m.getEmoji?m.getEmoji():'🚗'}</div>
      <div class="receipt">
        <div class="receipt-row"><span>Plat Nomor</span><span>${m.plat}</span></div>
        <div class="receipt-row"><span>Jenis</span><span>${m.jenis}</span></div>
        <div class="receipt-row"><span>Tahun</span><span>${m.tahun}</span></div>
        <div class="receipt-row"><span>Warna</span><span>${m.warna}</span></div>
        <div class="receipt-row"><span>Kapasitas</span><span>${m.kapasitas} orang</span></div>
        <div class="receipt-row"><span>Transmisi</span><span>${m.transmisi}</span></div>
        <div class="receipt-row"><span>Harga/Hari</span><span>${rupiahFormat(m.hargaPerHari)}</span></div>
        <div class="receipt-row"><span>Status</span><span>${m.status}</span></div>
      </div>`;
    openModal('modal-mobil');
  }

  function showTrxDetail(id) {
    const t = daftarTransaksi.find(t => t.id === id);
    if (!t) return;
    const hari = Math.max(1, Math.ceil((new Date(t.tglSelesai)-new Date(t.tglMulai))/(1000*60*60*24)));
    document.getElementById('modal-trx-body').innerHTML = `
      <div class="receipt">
        <div class="receipt-row"><span>ID Transaksi</span><span>${t.id}</span></div>
        <div class="receipt-row"><span>Pelanggan</span><span>${t.pelanggan.nama}</span></div>
        <div class="receipt-row"><span>KTP/SIM</span><span>${t.pelanggan.ktp}</span></div>
        <div class="receipt-row"><span>Kendaraan</span><span>${t.mobil.nama}</span></div>
        <div class="receipt-row"><span>Tanggal Mulai</span><span>${t.tglMulai}</span></div>
        <div class="receipt-row"><span>Tanggal Selesai</span><span>${t.tglSelesai}</span></div>
        <div class="receipt-row"><span>Durasi</span><span>${hari} hari</span></div>
        <div class="receipt-row"><span>Tipe Sewa</span><span>${t.tipe}</span></div>
        <div class="receipt-row"><span>Supir</span><span>${t.denganSupir==='dengan'?'Ya':'Tidak'}</span></div>
        <div class="receipt-row total"><span>TOTAL BIAYA</span><span>${rupiahFormat(t.biaya)}</span></div>
        <div class="receipt-row"><span>Status</span><span>${t.status}</span></div>
      </div>`;
    openModal('modal-transaksi');
  }

  function eksporJSON() {
    const blob = new Blob([JSON.stringify({armada,daftarTransaksi,daftarPelanggan},null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download='autorent_data.json'; a.click();
    showToast('📁 Data berhasil diekspor ke JSON','success');
  }
  function eksporCSV() {
    let csv = 'ID,Pelanggan,Kendaraan,Tgl Mulai,Tgl Selesai,Total Biaya,Status\n';
    daftarTransaksi.forEach(t => { csv += `${t.id},${t.pelanggan.nama},${t.mobil.nama},${t.tglMulai},${t.tglSelesai},${t.biaya},${t.status}\n`; });
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download='autorent_transaksi.csv'; a.click();
    showToast('📊 Data berhasil diekspor ke CSV','success');
  }
  async function resetData() {
    if (!confirm('Reset semua data? Tidak bisa dibatalkan!')) return;
    showToast('⚠ Untuk reset gunakan phpMyAdmin','error');
  }

  
  // UI HELPERS
  
  function showToast(msg, type='success') {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = `show ${type}`;
    setTimeout(() => t.className = '', 3000);
  }
  function openModal(id)  { document.getElementById(id).classList.add('open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('open'); }

  function showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('page-'+id).classList.add('active');
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.getAttribute('onclick')?.includes(id)) t.classList.add('active');
    });
    if (id==='transaksi') renderTransaksi();
    if (id==='laporan')   renderLaporan();
    if (id==='sewa')      renderSelectMobil();
  }

  function setDefaultDates() {
    const today    = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now()+86400000).toISOString().split('T')[0];
    document.getElementById('s-tgl-mulai').value   = today;
    document.getElementById('s-tgl-selesai').value = tomorrow;
  }

  loadAll();
  setDefaultDates();

  return {
    showPage, tambahMobil, hapusMobil, toggleStatus,
    hitungHarga, prosesTransaksi, resetFormSewa, resetFormMobil,
    selesaikanTrx, showCarDetail, showTrxDetail,
    closeModal, eksporJSON, eksporCSV, resetData, renderTransaksi
  };
})();

// Global wrappers 
function showPage(id)         { AutoRent.showPage(id); }
function tambahMobil()        { AutoRent.tambahMobil(); }
function hapusMobil(id)       { AutoRent.hapusMobil(id); }
function toggleStatus(id)     { AutoRent.toggleStatus(id); }
function hitungHarga()        { AutoRent.hitungHarga(); }
function prosesTransaksi()    { AutoRent.prosesTransaksi(); }
function resetFormSewa()      { AutoRent.resetFormSewa(); }
function resetFormMobil()     { AutoRent.resetFormMobil(); }
function selesaikanTrx(id)    { AutoRent.selesaikanTrx(id); }
function showCarDetail(id)    { AutoRent.showCarDetail(id); }
function showTrxDetail(id)    { AutoRent.showTrxDetail(id); }
function closeModal(id)       { AutoRent.closeModal(id); }
function eksporJSON()         { AutoRent.eksporJSON(); }
function eksporCSV()          { AutoRent.eksporCSV(); }
function resetData()          { AutoRent.resetData(); }
function renderTransaksi()    { AutoRent.renderTransaksi(); }


//  NAMESPACE: AuthModule — Login dengan fallback lokal

const AuthModule = (() => {

  // Akun fallback jika database belum diimport
  const FALLBACK_ACCOUNTS = [
    { username:'admin',    password:'admin123', role:'Admin',    nama:'Administrator' },
    { username:'operator', password:'op123',    role:'Operator', nama:'Budi Santoso'  },
  ];

  let currentUser = null;

  async function login(username, password) {
    // Coba login via PHP API dulu
    try {
      const res = await fetch(`${API}/auth.php?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        currentUser = { ...data.data, loginAt: new Date().toLocaleString('id-ID') };
        const remember = document.getElementById('login-remember').checked;
        if (remember) localStorage.setItem('autorent_session', JSON.stringify(currentUser));
        return currentUser;
      }
    } catch(e) {
      // API tidak bisa diakses — lanjut ke fallback
      console.warn('API tidak tersedia, menggunakan akun lokal.');
    }

    // Fallback: cek akun hardcode
    const acc = FALLBACK_ACCOUNTS.find(a => a.username === username && a.password === password);
    if (!acc) return null;
    currentUser = { ...acc, loginAt: new Date().toLocaleString('id-ID') };
    const remember = document.getElementById('login-remember').checked;
    if (remember) localStorage.setItem('autorent_session', JSON.stringify(currentUser));
    return currentUser;
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('autorent_session');
    showLoginScreen();
  }

  function checkSavedSession() {
    try {
      const saved = localStorage.getItem('autorent_session');
      if (saved) { currentUser = JSON.parse(saved); return currentUser; }
    } catch(e) {}
    return null;
  }

  function getUser() { return currentUser; }
  return { login, logout, checkSavedSession, getUser };
})();

// Login UI 
function showLoginScreen() {
  document.getElementById('login-screen').style.display  = 'flex';
  document.getElementById('main-nav').style.display      = 'none';
  document.getElementById('main-content').style.display  = 'none';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('login-error').style.display = 'none';
}
function showMainApp(user) {
  document.getElementById('login-screen').style.display  = 'none';
  document.getElementById('main-nav').style.display      = 'flex';
  document.getElementById('main-content').style.display  = 'block';
  document.getElementById('nav-username-label').innerHTML =
    `<strong>${user.nama}</strong> <span style="color:var(--accent);font-size:0.72rem">[${user.role}]</span>`;
}
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  if (!username || !password) { showLoginError('Username dan password tidak boleh kosong.'); return; }

  const btn = document.getElementById('login-submit');
  const btnText = document.getElementById('login-btn-text');
  const spinner = document.getElementById('login-spinner');
  btn.disabled=true; btnText.style.display='none'; spinner.style.display='inline';

  const user = await AuthModule.login(username, password);
  btn.disabled=false; btnText.style.display='inline'; spinner.style.display='none';

  if (!user) {
    showLoginError('Username atau password salah. Silakan coba lagi.');
    document.getElementById('login-password').value='';
    document.getElementById('login-password').focus();
    return;
  }
  showMainApp(user);
}
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent='⚠ '+msg; el.style.display='block';
  el.style.animation='none'; el.offsetHeight; el.style.animation='';
}
function doLogout()      { if (confirm('Yakin ingin keluar?')) AuthModule.logout(); }
function togglePassword() {
  const input = document.getElementById('login-password');
  const btn   = document.getElementById('btn-toggle-pw');
  input.type = input.type==='password' ? 'text' : 'password';
  btn.textContent = input.type==='password' ? '👁' : '🙈';
}
function fillDemo(u, p) {
  document.getElementById('login-username').value = u;
  document.getElementById('login-password').value = p;
  document.getElementById('login-error').style.display = 'none';
}
function showForgot() {
  alert('ℹ️ Gunakan akun demo:\n\n👑 Admin    → admin / admin123\n🔧 Operator → operator / op123');
}

// Cek sesi tersimpan
(function initAuth() {
  const saved = AuthModule.checkSavedSession();
  if (saved) showMainApp(saved);
})();
