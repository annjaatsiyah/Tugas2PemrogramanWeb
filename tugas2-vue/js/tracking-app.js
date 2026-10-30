/* ===========================================================
   tracking-app.js — Logika Vue.js untuk halaman Tracking DO
   Tugas Praktik 2 — STSI4209 Pemrograman Berbasis Web
   =========================================================== */

function todayISO() {
  var d = new Date();
  var mm = String(d.getMonth() + 1).padStart(2, "0");
  var dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
}

var trackingApp = new Vue({
  el: "#app",

  data: {
    // ---- Data acuan (diadaptasi dari dataBahanAjar.js) ----
    pengirimanList: [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" },
    ],
    paketList: [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116", "EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201", "FISIP4001"], harga: 140000 },
    ],
    trackingList: [
      {
        nomorDO: "DO2025-0001",
        nim: "123456789",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "JNE Reguler (3-5 hari)",
        tanggalKirim: "2025-08-25",
        paketKode: "PAKET-UT-001",
        total: 120000,
        perjalanan: [
          { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
          { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" },
        ],
      },
    ],

    // ---- State pencarian & detail ----
    searchNomor: "",
    selectedDO: null,

    // ---- State formulir tambah DO ----
    showForm: true,
    form: { nim: "", nama: "", ekspedisiKode: "", paketKode: "", tanggalKirim: todayISO(), total: 0 },
    errors: {},

    // ---- Notifikasi ----
    toastMessage: "",
    toastType: "success",
    toastTimer: null,
  },

  computed: {
    // Computed property: nomor DO berikutnya dihitung otomatis dari tahun
    // berjalan dan jumlah data yang sudah ada, mengikuti pola DO{tahun}-{urut}.
    nextNomorDO: function () {
      var year = new Date().getFullYear();
      var seq = this.trackingList.length + 1;
      return "DO" + year + "-" + String(seq).padStart(4, "0");
    },

    // Computed property: detail paket yang sedang dipilih pada formulir,
    // dipakai untuk menampilkan isi paket secara kondisional (v-if).
    selectedPaketDetail: function () {
      return this.paketList.find(function (p) {
        return p.kode === this.form.paketKode;
      }, this) || null;
    },

    filteredTrackingList: function () {
      var q = this.searchNomor.trim().toLowerCase();
      if (!q) return this.trackingList;
      return this.trackingList.filter(function (item) {
        return item.nomorDO.toLowerCase().indexOf(q) !== -1 || item.nama.toLowerCase().indexOf(q) !== -1;
      });
    },
  },

  watch: {
    // Watcher 1: begitu paket bahan ajar dipilih, total harga pada formulir
    // otomatis diisi dari data paket.harga (one-way, hasil sinkronisasi
    // berasal dari data acuan, bukan diketik manual oleh pengguna).
    "form.paketKode": function (newKode) {
      var p = this.paketList.find(function (x) {
        return x.kode === newKode;
      });
      this.form.total = p ? p.harga : 0;
    },

    // Watcher 2: input NIM disaring agar hanya berisi digit angka selagi
    // pengguna mengetik, mencegah karakter non-angka tersimpan.
    "form.nim": function (newVal) {
      var digitsOnly = (newVal || "").replace(/\D/g, "");
      if (digitsOnly !== newVal) this.form.nim = digitsOnly;
    },
  },

  methods: {
    formatRupiah: function (n) {
      return "Rp " + Number(n || 0).toLocaleString("id-ID");
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

    viewDetail: function (item) {
      this.selectedDO = item;
    },

    resetForm: function () {
      this.form = { nim: "", nama: "", ekspedisiKode: "", paketKode: "", tanggalKirim: todayISO(), total: 0 };
      this.errors = {};
    },

    submitForm: function () {
      var f = this.form;
      var errors = {};
      if (!f.nim || f.nim.length < 6) errors.nim = "NIM wajib diisi, minimal 6 digit angka.";
      if (!f.nama.trim()) errors.nama = "Nama wajib diisi.";
      if (!f.ekspedisiKode) errors.ekspedisiKode = "Ekspedisi wajib dipilih.";
      if (!f.paketKode) errors.paketKode = "Paket bahan ajar wajib dipilih.";

      this.errors = errors;
      if (Object.keys(errors).length > 0) {
        this.showToast("Lengkapi data dengan benar sebelum menyimpan.", "danger");
        return;
      }

      var ekspedisi = this.pengirimanList.find(function (e) { return e.kode === f.ekspedisiKode; });
      var nomorBaru = this.nextNomorDO;

      this.trackingList.push({
        nomorDO: nomorBaru,
        nim: f.nim,
        nama: f.nama.trim(),
        status: "Dalam Perjalanan",
        ekspedisi: "JNE " + (ekspedisi ? ekspedisi.nama : ""),
        tanggalKirim: f.tanggalKirim || todayISO(),
        paketKode: f.paketKode,
        total: f.total,
        perjalanan: [
          { waktu: f.tanggalKirim + " 09:00:00", keterangan: "Pesanan diterima sistem SITTA" },
        ],
      });

      this.selectedDO = this.trackingList[this.trackingList.length - 1];
      this.resetForm();
      this.showToast("Delivery Order " + nomorBaru + " berhasil dicatat.", "success");
    },
  },
});
