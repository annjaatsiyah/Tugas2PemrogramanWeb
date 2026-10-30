/* ===========================================================
   stok-app.js — Logika Vue.js untuk halaman Stok Bahan Ajar
   Tugas Praktik 2 — STSI4209 Pemrograman Berbasis Web
   =========================================================== */

var stokApp = new Vue({
  el: "#app",

  data: {
    // ---- Data acuan (diadaptasi dari dataBahanAjar.js) ----
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],

    stok: [
      { kode: "EKMA4116", judul: "Pengantar Manajemen", kategori: "MK Wajib", upbjj: "Jakarta", lokasiRak: "R1-A3", harga: 65000, qty: 28, safety: 20, catatanHTML: "<em>Edisi 2024, cetak ulang</em>" },
      { kode: "EKMA4115", judul: "Pengantar Akuntansi", kategori: "MK Wajib", upbjj: "Jakarta", lokasiRak: "R1-A4", harga: 60000, qty: 7, safety: 15, catatanHTML: "<strong>Cover baru</strong>" },
      { kode: "BIOL4201", judul: "Biologi Umum (Praktikum)", kategori: "Praktikum", upbjj: "Surabaya", lokasiRak: "R3-B2", harga: 80000, qty: 12, safety: 10, catatanHTML: "Butuh <u>pendingin</u> untuk kit basah" },
      { kode: "FISIP4001", judul: "Dasar-Dasar Sosiologi", kategori: "MK Pilihan", upbjj: "Makassar", lokasiRak: "R2-C1", harga: 55000, qty: 2, safety: 8, catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder" },
      { kode: "MKDU4221", judul: "Sistem Informasi Manajemen", kategori: "MK Wajib", upbjj: "Padang", lokasiRak: "R4-A1", harga: 58000, qty: 0, safety: 10, catatanHTML: "Stok <strong>kosong</strong>, menunggu kiriman pusat" },
      { kode: "SATS4411", judul: "Metode Statistika", kategori: "MK Wajib", upbjj: "Denpasar", lokasiRak: "R2-D2", harga: 62000, qty: 40, safety: 15, catatanHTML: "Kondisi baik" },
      { kode: "PBIS4423", judul: "Studi Kasus Bisnis (Problem-Based)", kategori: "Problem-Based", upbjj: "Surabaya", lokasiRak: "R5-A2", harga: 75000, qty: 9, safety: 12, catatanHTML: "Permintaan <em>meningkat</em> menjelang UAS" },
      { kode: "BIOL4219", judul: "Mikrobiologi (Praktikum)", kategori: "Praktikum", upbjj: "Jakarta", lokasiRak: "R3-C4", harga: 82000, qty: 18, safety: 10, catatanHTML: "—" },
    ],

    // ---- State filter & urutan ----
    filterUpbjj: "",
    filterKategori: "",
    onlyReorder: false,
    sortBy: "judul",
    sortDir: "asc",
    showFilterPanel: true,

    // ---- State modal ubah ----
    editingItem: null,
    editForm: {},

    // ---- State modal tambah ----
    showAddForm: false,
    addForm: { kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "", harga: null, qty: null, safety: null, catatanHTML: "" },
    addErrors: {},

    // ---- Notifikasi ----
    toastMessage: "",
    toastType: "success",
    toastTimer: null,
  },

  computed: {
    // Computed property: hasil filter + urutan. Vue secara otomatis meng-cache
    // nilai ini dan hanya menghitung ulang ketika salah satu data reaktif yang
    // dipakai di dalamnya (stok, filterUpbjj, filterKategori, onlyReorder,
    // sortBy, sortDir) benar-benar berubah, sehingga tidak perlu recompute
    // manual pada setiap render.
    filteredSortedStok: function () {
      var list = this.stok.filter(function (item) {
        if (this.filterUpbjj && item.upbjj !== this.filterUpbjj) return false;
        if (this.filterKategori && item.kategori !== this.filterKategori) return false;
        if (this.onlyReorder && !(item.qty === 0 || item.qty < item.safety)) return false;
        return true;
      }, this);

      var key = this.sortBy;
      var dir = this.sortDir === "desc" ? -1 : 1;
      list = list.slice().sort(function (a, b) {
        if (typeof a[key] === "string") {
          return a[key].localeCompare(b[key]) * dir;
        }
        return (a[key] - b[key]) * dir;
      });
      return list;
    },

    reorderCount: function () {
      return this.stok.filter(function (item) {
        return item.qty === 0 || item.qty < item.safety;
      }).length;
    },
  },

  watch: {
    // Watcher 1: dependent options — setiap kali UT-Daerah berganti, filter
    // Kategori yang sedang aktif dikembalikan ke kosong agar tidak menyaring
    // dengan kombinasi yang sudah tidak relevan.
    filterUpbjj: function () {
      this.filterKategori = "";
    },

    // Watcher 2: kode mata kuliah pada formulir tambah data otomatis
    // dikapitalkan (huruf besar) selagi pengguna mengetik, agar format kode
    // tetap konsisten dengan data yang sudah ada.
    "addForm.kode": function (newVal) {
      var upper = (newVal || "").toUpperCase();
      if (upper !== newVal) this.addForm.kode = upper;
    },
  },

  methods: {
    formatRupiah: function (n) {
      return "Rp " + Number(n || 0).toLocaleString("id-ID");
    },

    statusInfo: function (item) {
      if (item.qty === 0) return { key: "kosong", label: "Kosong" };
      if (item.qty < item.safety) return { key: "menipis", label: "Menipis" };
      return { key: "aman", label: "Aman" };
    },

    resetFilters: function () {
      this.filterUpbjj = "";
      this.filterKategori = "";
      this.onlyReorder = false;
      this.sortBy = "judul";
      this.sortDir = "asc";
    },

    showToast: function (message, type) {
      this.toastMessage = message;
      this.toastType = type || "success";
      clearTimeout(this.toastTimer);
      var self = this;
      this.toastTimer = setTimeout(function () {
        self.toastMessage = "";
      }, 2800);
    },

    // ---- Ubah data ----
    openEdit: function (item) {
      this.editingItem = item;
      this.editForm = Object.assign({}, item);
    },
    cancelEdit: function () {
      this.editingItem = null;
    },
    saveEdit: function () {
      var target = this.stok.find(function (s) {
        return s.kode === this.editingItem.kode;
      }, this);
      if (target) {
        target.judul = this.editForm.judul;
        target.kategori = this.editForm.kategori;
        target.upbjj = this.editForm.upbjj;
        target.lokasiRak = this.editForm.lokasiRak;
        target.harga = Number(this.editForm.harga) || 0;
        target.qty = Number(this.editForm.qty) || 0;
        target.safety = Number(this.editForm.safety) || 0;
        target.catatanHTML = this.editForm.catatanHTML;
      }
      this.editingItem = null;
      this.showToast("Data " + target.kode + " berhasil diperbarui.", "success");
    },

    // ---- Tambah data ----
    openAddForm: function () {
      this.addForm = { kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "", harga: null, qty: null, safety: null, catatanHTML: "" };
      this.addErrors = {};
      this.showAddForm = true;
    },
    cancelAdd: function () {
      this.showAddForm = false;
    },
    submitAdd: function () {
      var f = this.addForm;
      var errors = {};
      if (!f.kode.trim()) errors.kode = "Kode mata kuliah wajib diisi.";
      else if (this.stok.some(function (s) { return s.kode === f.kode.trim(); })) errors.kode = "Kode ini sudah terdaftar.";
      if (!f.judul.trim()) errors.judul = "Nama mata kuliah wajib diisi.";
      if (!f.kategori) errors.kategori = "Kategori wajib dipilih.";
      if (!f.upbjj) errors.upbjj = "UT-Daerah wajib dipilih.";
      if (!f.lokasiRak.trim()) errors.lokasiRak = "Lokasi rak wajib diisi.";
      if (f.harga === null || f.harga < 0) errors.harga = "Harga wajib diisi dengan angka 0 atau lebih.";
      if (f.qty === null || f.qty < 0) errors.qty = "Jumlah stok wajib diisi dengan angka 0 atau lebih.";
      if (f.safety === null || f.safety < 0) errors.safety = "Safety stock wajib diisi dengan angka 0 atau lebih.";

      this.addErrors = errors;
      if (Object.keys(errors).length > 0) {
        this.showToast("Lengkapi data dengan benar sebelum menyimpan.", "danger");
        return;
      }

      this.stok.push({
        kode: f.kode.trim(),
        judul: f.judul.trim(),
        kategori: f.kategori,
        upbjj: f.upbjj,
        lokasiRak: f.lokasiRak.trim(),
        harga: Number(f.harga),
        qty: Number(f.qty),
        safety: Number(f.safety),
        catatanHTML: f.catatanHTML.trim() || "—",
      });

      this.showAddForm = false;
      this.showToast("Bahan ajar baru berhasil ditambahkan.", "success");
    },
  },
});
