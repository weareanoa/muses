// Multi-language dictionary for the MUSES site (Indonesian + English).
// Indonesian copy is the source of truth: the `id` tree keeps every
// existing Indonesian string verbatim (and, where the current copy is
// already English, the English text). The `en` tree only adds English
// equivalents. getDict() deep-merges English over Indonesian, so any
// key missing from `en` falls back to the Indonesian text instead of
// rendering an empty string or a raw key.

export type Locale = "id" | "en";

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE = "muses_locale";

export function resolveLocale(cookieValue: string | undefined): Locale {
  return cookieValue === "en" ? "en" : "id";
}

export const DATE_LOCALE: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
};

// Replace {placeholder} tokens in a dictionary template.
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: DeepPartial<T>,
): T {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    if (isPlainObject(baseValue) && isPlainObject(value)) {
      out[key] = deepMerge(
        baseValue as Record<string, unknown>,
        value as DeepPartial<Record<string, unknown>>,
      );
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

const id = {
  nav: {
    home: "BERANDA",
    member: "MEMBER",
    discography: "DISKOGRAFI",
    schedule: "JADWAL",
    gallery: "GALERI",
    store: "TOKO",
    contact: "KONTAK",
    signIn: "masuk",
    signInAria: "Masuk ke Akun",
    cartAria: "Keranjang Belanja",
    accountMenuAria: "Menu akun",
    openNavAria: "Buka Menu Navigasi",
    mobileSignIn: "MASUK AJA",
    cart: "Keranjang",
    myProfile: "Profil Saya",
    myAddresses: "Alamat Saya",
    myOrders: "Pesanan Saya",
    merchStore: "Official Merch Store",
    adminSchedule: "Admin Jadwal",
    signOut: "Keluar (Sign Out)",
    bias: "Bias",
  },
  language: {
    label: "Bahasa",
    indonesian: "Indonesia",
    english: "English",
    aria: "Pilih bahasa",
  },
  footer: {
    tagline:
      "Temani Vira, Vely, Mine, Faril, Ndah, Liz, dan Lia dari mimpi pertama sampai cahaya berikutnya, di rumah resmi MUSES.",
    copyright1: "© 2026 MUSES OFFICIAL MANAGEMENT. All Rights Reserved.",
    copyright2: "Local Idol Group Profile & Interactive Music Showcase.",
    follow: "Ikuti MUSES",
    businessPrefix: "Untuk bisnis dan kolaborasi, tulis ke",
    homeAria: "MUSES Home",
  },
  contact: {
    eyebrow: "OFFICIAL CONTACT",
    headline: "Ingin bekerja sama dengan MUSES?",
    body: "Pertanyaan bisnis, kolaborasi, dan kemitraan acara ditujukan ke tim manajemen MUSES.",
    management: "Manajemen",
    cardHeadline: "Bicara dengan manajemen soal booking dan kemitraan.",
    cardBody:
      "Untuk pertanyaan bisnis, kolaborasi, dan kemitraan acara, tulis ke Dania di manajemen MUSES.",
    advice:
      "Sebaiknya sertakan tanggal dan kota acara, jenis kolaborasi, dan linimasamu.",
    follow: "Ikuti Muses",
  },
  home: {
    heroOpenProfile: "Buka Profil {name}",
    shopEyebrow: "OFFICIAL MERCHANDISE",
    shopHeading: "Merchandise Resmi MUSES.",
    shopBody:
      "Official merchandise MUSES. Saat ini tersedia cheki resmi bersama member favoritmu, dalam opsi Two Shot dan Solo.",
    viewAll: "Lihat Semua Produk",
    galleryTitle: "Gallery",
    galleryEyebrow: "SEMESTA KECIL KAMI",
    galleryHeading: "Momen Kecil, Kenangan Tanpa Akhir.",
    galleryBody:
      "Dari momen kecil di balik layar sampai hari-hari tak terlupakan bersama bintang favoritmu.",
  },
  gallery: {
    filterAll: "Semua",
    filterConcert: "Konser",
    filterBts: "Behind the Scenes",
    filterEvent: "Event",
    empty: "Belum ada foto dalam kategori ini.",
    loadMore: "Muat Lebih Banyak ({remaining} foto tersisa)",
    allShown: "Semua {count} foto telah ditampilkan.",
    prevAria: "Sebelumnya",
    nextAria: "Berikutnya",
    closeAria: "Tutup",
  },
  schedule: {
    eyebrow: "MUSES LIVE & EVENTS",
    heading: "Jadwal Mendatang",
    days: "HARI",
    hours: "JAM",
    minutes: "MENIT",
    seconds: "DETIK",
    getTickets: "DAPATKAN TIKET",
    statusAvailable: "TERSEDIA",
    statusSellingFast: "SEGERA HABIS",
    statusComingSoon: "SEGERA DATANG",
    statusSoldOut: "HABIS",
    posterAlt: "7 Member MUSES",
  },
  discography: {
    heading: "Diskografi",
    mvLabel: "VIDEO MUSIK",
    mvTitle: "{album} Video Musik",
    closeVideo: "Tutup Video",
    listenOn: "Dengarkan di",
    spotifyTitle: "Dengarkan di Spotify",
    youtubeTitle: "Tonton di YouTube",
  },
  member: {
    closeAria: "Tutup Profil Member",
    pickAria: "Pilih {name}",
    born: "LAHIR",
    height: "TINGGI",
    zodiac: "ZODIAK",
    color: "WARNA",
    icon: "IKON",
  },
};

const idStore = {
  store: {
    eyebrow: 'Official Store',
    heading: 'Store',
    description: 'Merch resmi, cheki, dan videocall bersama MUSES \u2014 stok terbatas, langsung dari Official Circle.',
    bannerTag: 'PRE-ORDER',
    bannerHeadingA: 'Pilih member',
    bannerHeadingB: 'favoritmu!',
    bannerBody: 'Dari apparel MUSES sampai photopack koleksi \u2014 bawa momen favoritmu lebih dekat. Satu bagian kecil dari MUSES, dibuat khusus untukmu.',
    filterAll: 'Semua',
    filterCheki: 'Cheki',
    filterMerchandise: 'Merchandise',
    filterVideocall: 'Videocall',
    comingSoon: 'Coming Soon',
    comingSoonAria: '{category}, segera datang',
    searchPlaceholder: 'Cari produk atau member...',
    emptySearch: 'Tidak ada produk yang cocok dengan pencarian "{query}".',
    stockLeft: 'Sisa {stock}',
    add: 'Tambah',
    added: '\u2713 Ditambahkan',
    comingSoonMerchHeading: 'Merchandise MUSES lagi disiapkan.',
    comingSoonMerchBody: 'Light stick, hoodie, vinyl, dan apparel lainnya belum bisa dibeli. Tunggu pengumuman rilisnya, sementara itu cheki masih bisa dibeli.',
    comingSoonVideocallHeading: 'Videocall dengan member lagi disiapkan.',
    comingSoonVideocallBody: 'Sesi 1-on-1 online dengan member belum dibuka. Slot dan jadwalnya akan diumumkan setelah siap, sementara itu cheki masih bisa dibeli.',
    seeCheki: 'Lihat cheki yang tersedia',
  },
  cart: {
    title: 'Keranjang Belanja ({count})',
    emptyTitle: 'Keranjang masih kosong',
    emptyBody: 'Album resmi, lightstick, dan merchandise tur MUSES.',
    viewStore: 'Lihat Store',
    orderReceived: 'Pesanan Diterima!',
    orderReceivedBody: 'Terima kasih sudah mendukung MUSES. Konfirmasi pesanan dan struk akan segera diproses.',
    continueBrowsing: 'Lanjut Belanja',
    shippingAddress: 'Alamat Pengiriman',
    guest: 'Tamu',
    noAddress: 'Belum ada alamat tersimpan',
    setAddress: '+ Atur Alamat',
    subtotal: 'Subtotal',
    size: 'Ukuran',
    color: 'Warna',
    taxesNote: 'Pajak dan ongkos kirim dihitung saat checkout. Gratis ongkir untuk album resmi.',
    checkoutNow: 'Checkout Sekarang',
    processing: 'Memproses...',
  },
};

const idAuth = {
  auth: {
    welcome: 'Selamat datang di Muverse!',
    welcomeSub: 'Pilih akunmu dan ayo mulai.',
    continueGoogle: 'Continue with Google',
    or: 'OR',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    phoneLabel: 'Nomor Handphone',
    confirmLabel: 'Ulangi Sandi',
    emailPlaceholder: 'nama@email.com',
    passwordPlaceholder: 'Masukkan password',
    phonePlaceholder: '081234567890',
    passwordMinPlaceholder: 'Min. 6 digit',
    confirmPlaceholder: 'Ulangi sandi',
    showPassword: 'Tampilkan password',
    hidePassword: 'Sembunyikan password',
    loginSubmit: 'Login',
    processing: 'Memproses...',
    registering: 'Mendaftarkan...',
    registerSubmit: 'Daftar Akun',
    noAccount: 'Belum punya akun? Daftar',
    hasAccount: 'Sudah punya akun? Masuk',
    terms: 'Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi MUSES.',
    otpEmailLabel: 'Alamat Email untuk OTP',
    sendOtp: 'Kirim Kode OTP',
    sendingCode: 'Mengirim Kode...',
    backToMain: '\u2190 Kembali ke form utama',
    changeEmail: 'Ganti email',
    resend: 'Kirim ulang',
    resendIn: 'Kirim ulang ({countdown}s)',
    verify: 'Verifikasi & Masuk',
    verifying: 'Memverifikasi...',
    errInvalidEmail: 'Silakan masukkan format alamat email yang valid.',
    errPasswordRequired: 'Silakan masukkan kata sandi Anda.',
    errLoginMismatch: 'Email atau kata sandi tidak sesuai.',
    errPhoneInvalid: 'Silakan masukkan nomor HP yang valid.',
    errPasswordMin: 'Kata sandi harus minimal 6 karakter.',
    errConfirmMismatch: 'Konfirmasi kata sandi tidak cocok.',
    errAgreeRequired: 'Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.',
    errRegisterFailed: 'Gagal mendaftarkan akun. Silakan coba kembali.',
    errGoogleFailed: 'Login Google gagal. Silakan coba lagi.',
    errOtpIncomplete: 'Harap masukkan 6 digit kode OTP secara lengkap.',
    errOtpInvalid: 'Kode verifikasi tidak valid.',
    otpSent: 'Kode verifikasi dikirim ke {email} (Kode demo: {code})',
    otpResent: 'Kode baru telah dikirim! (Gunakan: {code})',
  },
  profile: {
    changeProfile: 'Ubah Profil',
    sidebarProfile: 'Profil',
    sidebarAddresses: 'Alamat',
    sidebarOrders: 'Pesanan Saya',
    signOutAccount: 'Keluar Akun',
    myAccount: 'Akun saya',
    myProfileHeading: 'Profil Saya',
    myProfileDesc: 'Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun',
    chooseImage: 'Pilih gambar',
    nameLabel: 'Nama',
    emailLabel: 'Email',
    phoneLabel: 'No. Telepon',
    saved: 'Profil berhasil disimpan',
    saveButton: 'SIMPAN',
    addressesHeading: 'Alamat',
    addAddress: '+ Tambahkan Alamat',
    editAddress: 'Ubah',
    orderFilterAll: 'Semua',
    orderFilterUnpaid: 'Belum dibayar',
    orderFilterProcessing: 'Sedang diproses',
    orderFilterCompleted: 'Selesai',
    noOrdersFilter: 'Tidak ada pesanan pada filter ini.',
    payWithin: 'Selesaikan pembayaran dalam {time}',
    autoCancel: 'Pesanan otomatis dibatalkan jika waktu habis.',
    payWithQR: 'Bayar dengan QR',
    importantInfo: 'Informasi Penting',
    importantBody: 'Jika kamu tidak dapat hadir saat event untuk mengambil cheki, hubungi tim MUSES melalui kontak resmi kami untuk informasi lebih lanjut mengenai pengambilan alternatif.',
    contactTeam: 'Hubungi Tim MUSES',
    trackingLabel: 'No Resi:',
    buyAgain: 'Beli lagi',
    viewOrderFlow: 'Lihat alur pesanan',
  },
};

const idCheckout = {
  address: {
    heading: 'Alamat',
    addAddress: '+ Tambah Alamat',
    noAddressText: 'Kamu belum memiliki alamat pengiriman tersimpan.',
    addNewAddress: 'Tambah Alamat Baru',
    edit: 'Ubah',
    chooseOther: 'Pilih Lain',
    ordersHeading: 'Pesanan',
    addItem: '+ Tambah',
    decreaseAria: 'Kurangi jumlah',
    increaseAria: 'Tambah jumlah',
    paymentMethod: 'Metode pembayaran',
    paymentWallets: 'Gopay, OVO, ShopeePay, DANA, BCA Mobile, Livin, dll',
    summary: 'Ringkasan',
    subtotalProducts: 'Subtotal Produk',
    shippingFee: 'Biaya Pengiriman',
    serviceFee: 'Biaya Layanan & Asuransi',
    notesPlaceholder: 'Catatan',
    totalPrice: 'Total harga',
    orderButton: 'Pesan',
    pickerTitle: 'Pilih Alamat Pengiriman',
    defaultBadge: 'Utama',
    editAddressTitle: 'Edit Alamat',
    deleteAddressTitle: 'Hapus Alamat',
    close: 'Tutup',
  },
  addressModal: {
    titleAdd: 'Tambah Alamat',
    titleEdit: 'Ubah Alamat',
    closeAria: 'Tutup',
    phName: 'Nama',
    phPhone: 'No. Telepon',
    phProvince: 'Provinsi',
    phCity: 'Kota/Kabupaten',
    phDistrict: 'Kecamatan',
    phPostal: 'Kode Pos',
    phStreet: 'Nama Jalan, Gedung, No. Rumah',
    phDetail: 'Detail lainnya (cont: Blok / Unit / Patokan)',
    markAs: 'Tandai sebagai:',
    homeLabel: 'Rumah',
    officeLabel: 'Kantor',
    save: 'Simpan',
  },
  orders: {
    emptyTitle: 'Belum ada pesanan dengan status ini',
    emptyBody: 'Jelajahi jadwal event, tiket cheki, atau merchandise resmi MUSES.',
    visitStore: 'Kunjungi Store',
    payWithin: 'Selesaikan pembayaran dalam',
    autoCancel: 'Pesanan otomatis dibatalkan jika waktu habis. Slot cheki baru aman setelah dibayar.',
    payWithQR: 'Bayar dengan QR',
    pickupFallbackLocation: 'Ambil cheki di venue event',
    pickupFallbackNote: 'Tunjukkan kode ini ke staff management.',
    copyCodeTitle: 'Klik untuk menyalin kode',
    shippingInTransit: 'Paket dalam perjalanan via {courier}',
    trackingNo: 'Nomor Resi:',
    eta: 'Estimasi tiba {eta}',
    trackReceipt: 'Lacak Resi',
    copied: 'Tersalin',
    completedTitle: 'Pesanan telah selesai & cheki telah diterima',
    completedBody: 'Terima kasih telah mendukung MUSES! Sampai jumpa di event berikutnya.',
    buyChekiAgain: 'Beli Cheki Lagi',
    viewOrderFlow: 'Lihat alur pesanan',
    productFallbackAlt: 'Produk MUSES',
  },
  payment: {
    waiting: 'Menunggu Pembayaran',
    orderNo: 'No. pesanan #{id}',
    totalPayment: 'Total Pembayaran',
    payBefore: 'Bayar sebelum',
    downloadQR: 'Unduh QR',
    checkStatus: 'Cek status',
    checking: 'Mengecek...',
    howToPay: 'Cara Membayar',
    step1: 'Buka aplikasi e-wallet atau m-banking yang kamu pakai.',
    step2: 'Pilih menu bayar atau pindai, lalu arahkan kamera ke kode QR.',
    step3: 'Pastikan nominalnya sesuai, lalu konfirmasi. Halaman ini akan berubah otomatis.',
    summaryTitle: 'Ringkasan Pembayaran',
    shippingCost: 'Ongkos kirim',
    serviceCost: 'Biaya layanan & asuransi',
    total: 'Total',
    paidTitle: 'Pembayaran Berhasil!',
    paidBody: 'Terima kasih! Pembayaran untuk pesanan #{id} senilai {total} telah berhasil diverifikasi.',
    viewHistory: 'Lihat History Pesanan',
    paymentHeading: 'Pembayaran.',
    backToStore: 'Kembali ke Store',
    qrAlert: 'QR Code dapat di-screenshot atau di-scan langsung dari layar.',
  },
};

const idProduct = {
  product: {
    breadcrumbHome: 'Beranda',
    breadcrumbStore: 'Toko',
    shareAria: 'Bagikan produk',
    copied: 'Tautan disalin',
    exclusive: 'EXCLUSIVE',
    exclTax: 'Belum termasuk pajak',
    storeCash: 'Hingga USD {cash} MUSE Hub Store Cash',
    colorLabel: 'Warna',
    sizeLabel: 'Ukuran',
    decreaseAria: 'Kurangi jumlah',
    increaseAria: 'Tambah jumlah',
    selected: '{qty} dipilih',
    maxOrder: 'Kamu bisa memesan hingga {max} item.',
    added: 'Ditambahkan',
    addToCart: 'Tambah ke Keranjang',
    purchase: 'Beli',
    shippingHint: 'Tambahkan alamat pengiriman untuk memeriksa ongkir.',
    detailsTab: 'Detail',
    notesTab: 'Catatan',
    information: 'Informasi',
    productName: 'Nama Produk',
    material: 'Material Produk',
    sizeCm: 'Ukuran (cm)',
    contents: 'Isi Paket',
    manufacturer: 'Produsen',
    country: 'Negara Pembuat',
    power: 'Daya',
    operationTime: 'Waktu Operasi',
    kcMark: 'KC Mark',
    manufactureDate: 'Tahun dan bulan pembuatan',
    overview: 'Ringkasan Produk',
    keyFeatures: 'Fitur Utama',
    notesTitle: 'Catatan & Pemberitahuan',
    returns: 'Pengembalian & Penukaran',
    returnsPeriod: 'Periode Pengembalian & Penukaran',
    returnsFees: 'Biaya Pengembalian & Penukaran',
    returnsNotes: 'Catatan Penukaran & Pengembalian',
    returnsB1a: 'Buka [Saya atau Lainnya \u2192 Pesanan Saya \u2192 Detail Pesanan] untuk meminta penukaran/pengembalian.',
    returnsB1b: 'Silakan lihat FAQ yang tersedia di Bantuan MUSE Hub untuk informasi lebih lanjut.',
    returnsB2a: 'Pelanggan dapat meminta penukaran/pengembalian lewat halaman Pesanan Saya atau lewat Bantuan MUSE Hub [Hubungi kami] dalam 7 hari sejak produk diterima. (Untuk sekadar berubah pikiran, hanya pengembalian yang dimungkinkan dan penukaran tidak diperbolehkan.)',
    returnsB2b: 'Jika produk berbeda dari iklan atau ketentuan dalam kontraknya, termasuk cacat, pelanggan dapat menghubungi kami lewat Bantuan MUSE Hub [Hubungi kami] untuk membatalkan pesanan dalam 3 bulan sejak produk diterima dan dalam 30 hari sejak pelanggan menemukan atau seharusnya menemukan fakta tersebut.',
    returnsB3a: 'Jika pelanggan ingin menukar/mengembalikan produk karena sekadar berubah pikiran, pelanggan menanggung ongkos kirim.',
    returnsB3b: 'Untuk produk cacat, produk tidak sesuai, atau pengembalian karena masalah pengiriman, penjual menanggung ongkos kirim.',
    returnsB4a: 'Penukaran/pengembalian mungkin tidak tersedia dalam kasus berikut:',
    returnsB4b: 'Produk rusak atau hancur karena penyebab yang berasal dari pelanggan (kecuali membuka kemasan untuk memeriksa isi);',
    returnsB4c: 'Nilai produk telah menurun secara substansial karena pemakaian atau konsumsi total maupun sebagian oleh pelanggan (termasuk pemakaian Kode Digital);',
    returnsB4d: 'Nilai produk telah menurun secara substansial karena berlalunya waktu, sehingga sulit atau tidak mungkin dijual kembali;',
    returnsB4e: 'Kemasan produk yang dapat disalin telah rusak (termasuk album, buku, publikasi video, photocard, postcard, dan poster yang kemasannya dibuka);',
    returnsB4f: 'Pembuatan produk made-to-order sudah berjalan (di mana kerusakan yang tidak dapat diperbaiki pada penjual dapat diperkirakan, dan penjual telah memperoleh persetujuan tertulis bahwa hak penarikan tidak dapat dilaksanakan karena kerusakan tersebut);',
    returnsB4g: 'Sebagian komponen produk telah dipakai, hilang, atau tidak dapat dijual kembali karena kerusakan/kegagalan/kontaminasi akibat salah penanganan, atau produk dikembalikan dengan komponen yang tidak lengkap;',
    returnsB4h: 'Penukaran/pengembalian untuk tiap kategori produk mungkin tidak tersedia dalam kasus berikut:',
    returnsB4i: '[Pakaian, tas, sepatu, aksesori fashion]',
    returnsB4j: 'Nilai produk telah menurun secara substansial karena pencucian, noda, bau parfum atau deodoran, tanda pemakaian, dll.',
    relatedTitle: 'Produk Terkait',
    prevPage: 'Halaman sebelumnya',
    nextPage: 'Halaman berikutnya',
    shippedFrom: 'Dikirim dari KR',
    contentsFallback: 'Lihat detail produk',
  },
  common: {
    close: 'Tutup',
    back: 'Kembali',
    loading: 'Memuat\u2026',
    home: 'Beranda',
    store: 'Toko',
    checkout: 'Checkout',
    officialMerch: 'Official Merch',
    backToStore: 'Kembali ke Store',
  },
  preloader: {
    aria: 'Memuat MUSES',
    stage: 'Menyiapkan panggung...',
    charm: 'Memuat pesona para muse...',
    harmony: 'Menyelaraskan harmoni...',
    welcome: 'Selamat datang di MUSES',
  },
};

const idMeta = {
  meta: {
    defaultTitle: "MUSES | Official Idol Group",
    defaultDesc:
      "Situs resmi idol grup MUSES (7 member: Vira, Vely, Mine, Faril, Ndah, Liz, Lia). Album, jadwal konser tur, galeri, dan merchandise resmi.",
    homeTitle: "MUSES | Official Idol Group",
    homeDesc:
      "Situs profil resmi idol grup lokal MUSES (7 member: Vira, Vely, Mine, Faril, Ndah, Liz, Lia). Musik, jadwal tur, galeri, merchandise, dan kontak manajemen.",
    memberTitle: "Members Profile | MUSES Official Portal",
    memberDesc: "Profil lengkap 7 member MUSES: Vira, Vely, Mine, Faril, Ndah, Liz, Lia.",
    discographyTitle: "Discography | MUSES Official Portal",
    discographyDesc:
      "Daftar album dan rilisan musik idol grup MUSES lengkap dengan pemutar piringan hitam vinyl dan tautan resmi.",
    scheduleTitle: "Tour Schedule | MUSES Official Portal",
    scheduleDesc:
      "Jadwal tur dan konser idol grup MUSES. Hitung mundur waktu acara dan dapatkan tiket resmi.",
    galleryTitle: "Gallery | MUSES Official Portal",
    galleryDesc:
      "Koleksi foto dan video eksklusif konser, behind the scenes, dan aktivitas resmi idol grup MUSES.",
    storeTitle: "Official Store | MUSES Official Portal",
    storeDesc:
      "Official MUSES merchandise store. Exclusive limited vinyl pressings, official lightstick, tour apparel, cheki, and videocall tickets.",
    storeDetailTitle: "{name} | MUSES Official Store",
    contactTitle: "Kontak Manajemen Resmi | MUSES Official Portal",
    contactDesc:
      "Kanal kontak resmi manajemen idol grup MUSES untuk kerjasama bisnis, sponsor, kolaborasi, dan kemitraan acara.",
    loginTitle: "Masuk ke Akun | MUSES Official Portal",
    loginDesc:
      "Masuk ke akun official MUSES Official Portal untuk akses album eksklusif, tur, dan merchandise resmi.",
    registerTitle: "Daftar Akun | MUSES Official Portal",
    registerDesc:
      "Daftar akun official MUSES Official Portal untuk akses album eksklusif, tur, dan merchandise resmi.",
    authTitle: "Masuk / Daftar Akun | MUSES Official Portal",
    authDesc:
      "Akses resmi MUSES Official Portal dengan Google atau Email OTP untuk pembelian tiket, merchandise, dan konten eksklusif.",
    profileTitle: "Profil Saya | MUSES Official",
    profileDesc:
      "Kelola informasi profil Anda untuk mengontrol, melindungi dan mengamankan akun.",
    ordersTitle: "History Pesanan | MUSES Official",
    ordersDesc:
      "Riwayat transaksi pesanan, tiket cheki event, dan pengiriman merchandise resmi MUSES.",
    checkoutTitle: "Checkout | MUSES Official",
    checkoutDesc: "Proses checkout dan pembayaran pesanan merchandise resmi MUSES.",
    paymentTitle: "Pembayaran QRIS | MUSES Official",
    paymentDesc:
      "Halaman pembayaran resmi untuk pesanan merchandise dan tiket idol grup MUSES.",
    adminSchedulesTitle: "Admin Jadwal | MUSES Official",
    adminSchedulesDesc:
      "Kelola jadwal tur MUSES. Hanya akun admin Supabase yang bisa menambah, mengubah, atau menghapus jadwal.",
    adminLoginTitle: "Login Admin | MUSES Official",
    adminLoginDesc:
      "Login khusus admin MUSES untuk mengelola jadwal. Hanya akun dengan role admin yang bisa masuk.",
    adminStoreTitle: "Admin Store | MUSES Official",
    adminStoreDesc:
      "Kelola produk toko MUSES. Hanya akun admin Supabase yang bisa menambah, mengubah, atau menghapus produk.",
    addressRedirectTitle: "Redirecting to Alamat...",
    addressRedirectBody: "Mengalihkan ke halaman alamat...",
    addressRedirectLink: "Klik di sini jika tidak beralih otomatis",
  },
};

const idAdmin = {
  admin: {
    checking: "Memeriksa sesi admin\u2026",
    noSupabaseTitle: "Supabase belum dikonfigurasi",
    loginNoSupabaseBody:
      "Login admin membutuhkan Supabase. Set dulu PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY, lalu muat ulang halaman ini.",
    schedNoSupabaseBody:
      "Admin jadwal sengaja tidak mengedit data lokal (schedules.json) supaya tidak terkesan tersimpan padahal tidak masuk database. Set dulu PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY di Cloudflare, terapkan supabase/schema.sql dan supabase/migrations/20261031_admin_schedules.sql, lalu angkat satu akun menjadi admin (lihat supabase/ADMIN_SCHEDULES.md).",
    storeNoSupabaseBody:
      "Admin store sengaja tidak mengedit data lokal supaya tidak terkesan tersimpan padahal tidak masuk database. Set dulu PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY, terapkan migrasi admin products, lalu login lewat /admin/login.",
    forbiddenTitle: "Akun ini bukan admin",
    loginForbiddenBody:
      "{account} tidak punya role admin, jadi tidak bisa membuka halaman admin.",
    schedForbiddenBody:
      "{account} tidak punya role admin, jadi tidak bisa menambah, mengubah, atau menghapus jadwal. Minta admin yang sudah ada untuk mengubah role akun ini.",
    storeForbiddenBody:
      "{account} tidak punya role admin, jadi tidak bisa menambah, mengubah, atau menghapus produk. Minta admin yang sudah ada untuk mengubah role akun ini.",
    signOutButton: "Keluar dan login akun lain",
    backHome: "Kembali ke beranda",
    loginEyebrow: "MUSES Admin",
    loginHeading: "Login Admin",
    loginIntro:
      "Halaman ini khusus untuk akun admin MUSES. Akun biasa tetap ditolak walaupun berhasil login.",
    emailLabel: "Email admin",
    passwordLabel: "Kata sandi",
    emailPlaceholder: "admin@muses.id",
    checkingSubmit: "Memeriksa\u2026",
    submit: "Masuk sebagai Admin",
    errEmail: "Masukkan email admin yang valid.",
    errPassword: "Masukkan kata sandi.",
    errMismatch: "Email atau kata sandi salah. Periksa kembali dan coba lagi.",
    loginRequiredTitleSched: "Login dulu untuk mengelola jadwal",
    loginRequiredTitleStore: "Login dulu untuk mengelola store",
    loginRequiredBody:
      "Halaman ini hanya bisa dibuka dengan akun Supabase yang sudah dijadikan admin.",
    loginButton: "Ke halaman login admin",
    backSchedule: "Kembali ke jadwal publik",
    backStore: "Kembali ke toko",
    headerAdmin: "Admin \u00b7 {email}",
    schedHeading: "Kelola Jadwal Tur",
    schedIntro:
      "Perubahan di sini langsung tersimpan ke tabel public.schedules di Supabase, bukan ke schedules.json. Kalau tabel di Supabase masih kosong, halaman publik akan menampilkan data awal lokal sampai jadwal pertama disimpan dari sini.",
    addSchedButton: "+ Tambah jadwal",
    formTitleNew: "Jadwal baru",
    formTitleEdit: "Edit jadwal: {id}",
    formHint:
      "ID jadwal baru dibuat otomatis dari nama tur, kota, dan tanggal. Saat mengedit, ID dikunci supaya tidak merusak referensi yang sudah ada.",
    tourName: "Nama tur *",
    showTitle: "Judul tampil",
    city: "Kota *",
    venue: "Venue *",
    target: "Tanggal & jam acara *",
    status: "Status",
    door: "Pintu dibuka",
    show: "Jam tampil *",
    ticket: "Link tiket",
    poster: "Poster (URL / path) *",
    day: "Hari (angka)",
    dayName: "Nama hari",
    month: "Bulan",
    year: "Tahun",
    tourPh: "1ST ANNIVERSARY LIVE",
    titlePh: "Kosongkan = sama dengan nama tur",
    cityPh: "JAKARTA",
    venuePh: "M Bloc Space",
    doorPh: "13:00 WIB",
    showPh: "14:00 WIB",
    ticketPh: "https://\u2026",
    posterPh: "/images/\u2026 atau https://\u2026",
    dayPh: "25",
    dayNamePh: "SABTU",
    monthPh: "OCT",
    yearPh: "2026",
    autofill: "Isi otomatis dari tanggal",
    saveNewSched: "Tambah jadwal",
    saveEditSched: "Simpan perubahan",
    saving: "Menyimpan\u2026",
    cancelEdit: "Batal edit",
    listTitle: "Daftar jadwal ({count})",
    loadingSched: "Memuat jadwal\u2026",
    emptySched: "Belum ada jadwal. Tambah jadwal pertama lewat form di atas.",
    edit: "Edit",
    delete: "Hapus",
    confirmDelete: "Ya, hapus",
    cancel: "Batal",
    errLoadSched: "Gagal memuat jadwal.",
    errRequired: "Nama tur, kota, venue, jam tampil, dan poster wajib diisi.",
    errDate: "Tanggal & jam acara wajib diisi (dipakai untuk hitung mundur dan urutan).",
    errSaveSched: "Gagal menyimpan jadwal.",
    errDeleteSched: "Gagal menghapus jadwal.",
    noticeUpdatedSched: "Jadwal berhasil diperbarui.",
    noticeAddedSched: "Jadwal baru berhasil ditambahkan.",
    noticeDeletedSched: "Jadwal berhasil dihapus.",
    storeEyebrow: "MUSES Admin",
    storeHeading: "Admin Store",
    count: "Produk di database saat ini: {count}",
    addProductButton: "Tambah produk",
    warningTitle: "Perhatian sebelum menyimpan produk pertama",
    warningBody:
      "Selama tabel products masih kosong, toko menampilkan katalog default dari kode (cheki, merchandise, videocall). Begitu ada 1 produk di database, toko hanya menampilkan produk dari database. Jadi sebelum menyimpan produk pertama, pastikan semua produk yang mau dijual \u2014 termasuk cheki \u2014 sudah dimasukkan di sini.",
    formTitleNewProduct: "Tambah produk",
    formTitleEditProduct: "Edit produk",
    prodName: "Nama produk",
    prodId: "ID produk",
    idLocked: "(tidak bisa diubah)",
    idAuto: "(otomatis dari nama)",
    prodCategory: "Kategori",
    prodSubtitle: "Subjudul",
    prodPrice: "Harga (Rupiah)",
    prodStock: "Stok",
    prodImage: "Gambar (URL atau path, kosongkan untuk gambar default toko)",
    prodOptions: "Opsi (pisahkan dengan koma, contoh: Two shot, Solo)",
    prodDescription: "Deskripsi",
    prodFeatured: "Produk unggulan (tampil di sorotan toko)",
    prodNamePh: "Light Stick",
    prodIdPh: "light-stick",
    prodSubtitlePh: "Rechargeable Concert Light Device",
    prodPricePh: "880000",
    prodStockPh: "40",
    prodImagePh: "/images/store/product-1.svg",
    prodOptionsPh: "Box Set, Standard",
    saveNewProduct: "Simpan produk",
    saveEditProduct: "Simpan perubahan",
    emptyProdTitle: "Belum ada produk di database",
    emptyProdBody:
      "Toko saat ini menampilkan katalog default dari kode. Tambahkan produk lewat form di atas untuk mulai mengelola store dari database.",
    featuredBadge: "Unggulan",
    stockLabel: "Stok {stock}",
    errProdName: "Nama produk wajib diisi.",
    errProdId: "ID produk wajib diisi.",
    errProdPrice: "Harga harus angka 0 atau lebih (Rupiah).",
    errProdStock: "Stok harus bilangan bulat 0 atau lebih.",
    errProdNoSupabase: "Supabase belum dikonfigurasi.",
    noticeProdUpdated: "Produk berhasil diubah.",
    noticeProdAdded: "Produk berhasil ditambahkan.",
    noticeProdDeleted: "Produk berhasil dihapus.",
  },
};

const en = {
  nav: {
    home: "HOME",
    member: "MEMBER",
    discography: "DISCOGRAPHY",
    schedule: "SCHEDULE",
    gallery: "GALLERY",
    store: "STORE",
    contact: "CONTACT",
    signIn: "sign in",
    signInAria: "Sign in to your account",
    cartAria: "Shopping cart",
    accountMenuAria: "Account menu",
    openNavAria: "Open navigation menu",
    mobileSignIn: "JUST SIGN IN",
    cart: "Cart",
    myProfile: "My profile",
    myAddresses: "My addresses",
    myOrders: "My orders",
    merchStore: "Official Merch Store",
    adminSchedule: "Schedule Admin",
    signOut: "Sign out",
    bias: "Bias",
  },
  language: {
    label: "Language",
    indonesian: "Indonesia",
    english: "English",
    aria: "Choose language",
  },
  footer: {
    tagline:
      "Follow Vira, Vely, Mine, Faril, Ndah, Liz, and Lia from their first dream to the next light, at the official home of MUSES.",
    copyright1: "\u00a9 2026 MUSES OFFICIAL MANAGEMENT. All Rights Reserved.",
    copyright2: "Local Idol Group Profile & Interactive Music Showcase.",
    follow: "Follow MUSES",
    businessPrefix: "For business and collaborations, write to",
    homeAria: "MUSES Home",
  },
  contact: {
    eyebrow: "OFFICIAL CONTACT",
    headline: "Want to work with MUSES?",
    body: "Business inquiries, collaborations, and event partnerships go to the MUSES management team.",
    management: "Management",
    cardHeadline: "Talk to management about bookings and partnerships.",
    cardBody:
      "For business inquiries, collaborations, and event partnerships, write to Dania at MUSES management.",
    advice:
      "It helps to include the event date and city, the type of collaboration, and your timeline.",
    follow: "Follow Muses",
  },
  home: {
    heroOpenProfile: "Open {name} profile",
    shopEyebrow: "OFFICIAL MERCHANDISE",
    shopHeading: "Official MUSES Merchandise.",
    shopBody:
      "Official MUSES merchandise. Right now, official cheki with your favorite member are available, in Two Shot and Solo options.",
    viewAll: "View All Products",
    galleryTitle: "Gallery",
    galleryEyebrow: "OUR LITTLE UNIVERSE",
    galleryHeading: "Little Moments, Endless Memories.",
    galleryBody:
      "From little behind-the-scenes moments to unforgettable days with our favorite stars.",
  },
  gallery: {
    filterAll: "All",
    filterConcert: "Concert",
    filterBts: "Behind the Scenes",
    filterEvent: "Event",
    empty: "No photos in this category yet.",
    loadMore: "Load More ({remaining} photos left)",
    allShown: "All {count} photos shown.",
    prevAria: "Previous",
    nextAria: "Next",
    closeAria: "Close",
  },
  schedule: {
    eyebrow: "MUSES LIVE & EVENTS",
    heading: "Upcoming Schedule",
    days: "DAYS",
    hours: "HOURS",
    minutes: "MINUTE",
    seconds: "SECOND",
    getTickets: "GET TICKETS",
    statusAvailable: "AVAILABLE",
    statusSellingFast: "SELLING FAST",
    statusComingSoon: "COMING SOON",
    statusSoldOut: "SOLD OUT",
    posterAlt: "MUSES 7 Members",
  },
  discography: {
    heading: "Discography",
    mvLabel: "MUSIC VIDEO",
    mvTitle: "{album} Music Video",
    closeVideo: "Close Video",
    listenOn: "Listen on",
    spotifyTitle: "Listen on Spotify",
    youtubeTitle: "Watch on YouTube",
  },
  member: {
    closeAria: "Close Member Profile",
    pickAria: "Select {name}",
    born: "BORN",
    height: "HEIGHT",
    zodiac: "ZODIAC",
    color: "COLOR",
    icon: "ICON",
  },
};

const enStore = {
  store: {
    eyebrow: "Official Store",
    heading: "Store",
    description:
      "Official merch, cheki, and videocalls with MUSES \u2014 limited stock, straight from the Official Circle.",
    bannerTag: "PRE-ORDER",
    bannerHeadingA: "Pick your",
    bannerHeadingB: "favorite member!",
    bannerBody:
      "From MUSES apparel to collectible photopacks \u2014 bring your favorite moment closer. A small piece of MUSES, made just for you.",
    filterAll: "All",
    filterCheki: "Cheki",
    filterMerchandise: "Merchandise",
    filterVideocall: "Videocall",
    comingSoon: "Coming Soon",
    comingSoonAria: "{category}, coming soon",
    searchPlaceholder: "Search products or members...",
    emptySearch: 'No products match your search "{query}".',
    stockLeft: "{stock} left",
    add: "Add",
    added: "\u2713 Added",
    comingSoonMerchHeading: "MUSES merchandise is being prepared.",
    comingSoonMerchBody:
      "Light sticks, hoodies, vinyl, and other apparel cannot be purchased yet. Wait for the release announcement \u2014 meanwhile, cheki are still available.",
    comingSoonVideocallHeading: "Videocalls with members are being prepared.",
    comingSoonVideocallBody:
      "1-on-1 online sessions with members are not open yet. Slots and schedules will be announced once ready \u2014 meanwhile, cheki are still available.",
    seeCheki: "See available cheki",
  },
  cart: {
    title: "Shopping Cart ({count})",
    emptyTitle: "Your cart is still empty",
    emptyBody: "Official albums, lightsticks, and MUSES tour merchandise.",
    viewStore: "View Store",
    orderReceived: "Order Received!",
    orderReceivedBody:
      "Thank you for supporting MUSES. Your order confirmation and receipt will be processed shortly.",
    continueBrowsing: "Continue Shopping",
    shippingAddress: "Shipping Address",
    guest: "Guest",
    noAddress: "No saved address yet",
    setAddress: "+ Set Address",
    subtotal: "Subtotal",
    size: "Size",
    color: "Color",
    taxesNote:
      "Taxes and shipping are calculated at checkout. Free shipping for official albums.",
    checkoutNow: "Checkout Now",
    processing: "Processing...",
  },
};

const enAuth = {
  auth: {
    welcome: "Welcome to Muverse!",
    welcomeSub: "Choose your account and let's get started.",
    continueGoogle: "Continue with Google",
    or: "OR",
    emailLabel: "Email",
    passwordLabel: "Password",
    phoneLabel: "Phone Number",
    confirmLabel: "Repeat Password",
    emailPlaceholder: "name@email.com",
    passwordPlaceholder: "Enter password",
    phonePlaceholder: "081234567890",
    passwordMinPlaceholder: "Min. 6 characters",
    confirmPlaceholder: "Repeat password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    loginSubmit: "Login",
    processing: "Processing...",
    registering: "Registering...",
    registerSubmit: "Create Account",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Sign in",
    terms: "I agree to the MUSES Terms & Conditions and Privacy Policy.",
    otpEmailLabel: "Email Address for OTP",
    sendOtp: "Send OTP Code",
    sendingCode: "Sending Code...",
    backToMain: "\u2190 Back to main form",
    changeEmail: "Change email",
    resend: "Resend",
    resendIn: "Resend ({countdown}s)",
    verify: "Verify & Sign In",
    verifying: "Verifying...",
    errInvalidEmail: "Please enter a valid email address.",
    errPasswordRequired: "Please enter your password.",
    errLoginMismatch: "Email or password do not match.",
    errPhoneInvalid: "Please enter a valid phone number.",
    errPasswordMin: "Password must be at least 6 characters.",
    errConfirmMismatch: "Password confirmation does not match.",
    errAgreeRequired: "You must agree to the Terms & Conditions and Privacy Policy.",
    errRegisterFailed: "Failed to register your account. Please try again.",
    errGoogleFailed: "Google login failed. Please try again.",
    errOtpIncomplete: "Please enter all 6 digits of the OTP code.",
    errOtpInvalid: "Invalid verification code.",
    otpSent: "Verification code sent to {email} (Demo code: {code})",
    otpResent: "New code sent! (Use: {code})",
  },
  profile: {
    changeProfile: "Edit Profile",
    sidebarProfile: "Profile",
    sidebarAddresses: "Addresses",
    sidebarOrders: "My Orders",
    signOutAccount: "Sign Out",
    myAccount: "My account",
    myProfileHeading: "My Profile",
    myProfileDesc: "Manage your profile information to control, protect, and secure your account",
    chooseImage: "Choose image",
    nameLabel: "Name",
    emailLabel: "Email",
    phoneLabel: "Phone No.",
    saved: "Profile saved successfully",
    saveButton: "SAVE",
    addressesHeading: "Addresses",
    addAddress: "+ Add Address",
    editAddress: "Edit",
    orderFilterAll: "All",
    orderFilterUnpaid: "Unpaid",
    orderFilterProcessing: "Processing",
    orderFilterCompleted: "Completed",
    noOrdersFilter: "No orders under this filter.",
    payWithin: "Complete payment within {time}",
    autoCancel: "Orders are cancelled automatically if time runs out.",
    payWithQR: "Pay with QR",
    importantInfo: "Important Information",
    importantBody:
      "If you cannot attend the event to pick up your cheki, contact the MUSES team through our official contact for more information about alternative pickup.",
    contactTeam: "Contact the MUSES Team",
    trackingLabel: "Tracking No.:",
    buyAgain: "Buy again",
    viewOrderFlow: "View order flow",
  },
};

const enCheckout = {
  address: {
    heading: "Addresses",
    addAddress: "+ Add Address",
    noAddressText: "You have no saved shipping address yet.",
    addNewAddress: "Add New Address",
    edit: "Edit",
    chooseOther: "Choose Another",
    ordersHeading: "Orders",
    addItem: "+ Add",
    decreaseAria: "Decrease quantity",
    increaseAria: "Increase quantity",
    paymentMethod: "Payment method",
    paymentWallets: "Gopay, OVO, ShopeePay, DANA, BCA Mobile, Livin, etc.",
    summary: "Summary",
    subtotalProducts: "Product Subtotal",
    shippingFee: "Shipping Fee",
    serviceFee: "Service & Insurance Fee",
    notesPlaceholder: "Notes",
    totalPrice: "Total price",
    orderButton: "Order",
    pickerTitle: "Choose Shipping Address",
    defaultBadge: "Primary",
    editAddressTitle: "Edit Address",
    deleteAddressTitle: "Delete Address",
    close: "Close",
  },
  addressModal: {
    titleAdd: "Add Address",
    titleEdit: "Edit Address",
    closeAria: "Close",
    phName: "Name",
    phPhone: "Phone No.",
    phProvince: "Province",
    phCity: "City/Regency",
    phDistrict: "District",
    phPostal: "Postal Code",
    phStreet: "Street Name, Building, House No.",
    phDetail: "Other details (e.g. Block / Unit / Landmark)",
    markAs: "Mark as:",
    homeLabel: "Home",
    officeLabel: "Office",
    save: "Save",
  },
  orders: {
    emptyTitle: "No orders with this status yet",
    emptyBody: "Explore event schedules, cheki tickets, or official MUSES merchandise.",
    visitStore: "Visit Store",
    payWithin: "Complete payment within",
    autoCancel:
      "Orders are cancelled automatically if time runs out. Cheki slots are only secured after payment.",
    payWithQR: "Pay with QR",
    pickupFallbackLocation: "Pick up cheki at the event venue",
    pickupFallbackNote: "Show this code to the management staff.",
    copyCodeTitle: "Click to copy code",
    shippingInTransit: "Package in transit via {courier}",
    trackingNo: "Tracking No.:",
    eta: "Estimated arrival {eta}",
    trackReceipt: "Track Receipt",
    copied: "Copied",
    completedTitle: "Order completed & cheki received",
    completedBody: "Thank you for supporting MUSES! See you at the next event.",
    buyChekiAgain: "Buy Cheki Again",
    viewOrderFlow: "View order flow",
    productFallbackAlt: "MUSES Product",
  },
  payment: {
    waiting: "Waiting for Payment",
    orderNo: "Order no. #{id}",
    totalPayment: "Total Payment",
    payBefore: "Pay before",
    downloadQR: "Download QR",
    checkStatus: "Check status",
    checking: "Checking...",
    howToPay: "How to Pay",
    step1: "Open the e-wallet or m-banking app you use.",
    step2: "Choose the pay or scan menu, then point your camera at the QR code.",
    step3: "Make sure the amount matches, then confirm. This page will update automatically.",
    summaryTitle: "Payment Summary",
    shippingCost: "Shipping cost",
    serviceCost: "Service & insurance fee",
    total: "Total",
    paidTitle: "Payment Successful!",
    paidBody: "Thank you! Payment for order #{id} of {total} has been verified.",
    viewHistory: "View Order History",
    paymentHeading: "Payment.",
    backToStore: "Back to Store",
    qrAlert: "QR codes can be screenshotted or scanned directly from the screen.",
  },
};

const enProduct = {
  product: {
    breadcrumbHome: "Home",
    breadcrumbStore: "Store",
    shareAria: "Share product",
    copied: "Link copied",
    exclusive: "EXCLUSIVE",
    exclTax: "Excluding tax",
    storeCash: "Up to USD {cash} MUSE Hub Store Cash",
    colorLabel: "Color",
    sizeLabel: "Size",
    decreaseAria: "Decrease quantity",
    increaseAria: "Increase quantity",
    selected: "{qty} selected",
    maxOrder: "You can order up to {max} items.",
    added: "Added",
    addToCart: "Add to Cart",
    purchase: "Buy",
    shippingHint: "Add a shipping address to check shipping costs.",
    detailsTab: "Details",
    notesTab: "Notes",
    information: "Information",
    productName: "Product Name",
    material: "Product Material",
    sizeCm: "Size (cm)",
    contents: "Package Contents",
    manufacturer: "Manufacturer",
    country: "Country of Origin",
    power: "Power",
    operationTime: "Operation Time",
    kcMark: "KC Mark",
    manufactureDate: "Year and month of manufacture",
    overview: "Product Overview",
    keyFeatures: "Key Features",
    notesTitle: "Notes & Notices",
    returns: "Returns & Exchanges",
    returnsPeriod: "Return & Exchange Period",
    returnsFees: "Return & Exchange Fees",
    returnsNotes: "Exchange & Return Notes",
    returnsB1a: "Open [Me or Others \u2192 My Orders \u2192 Order Details] to request an exchange/return.",
    returnsB1b: "Please see the FAQ available in MUSE Hub Help for more information.",
    returnsB2a:
      "Customers may request an exchange/return via the My Orders page or via MUSE Hub Help [Contact us] within 7 days of receiving the product. (For a simple change of mind, only returns are possible and exchanges are not allowed.)",
    returnsB2b:
      "If the product differs from its advertisement or contract terms, including defects, customers may contact us via MUSE Hub Help [Contact us] to cancel the order within 3 months of receiving the product and within 30 days of when the customer discovered or should have discovered the fact.",
    returnsB3a:
      "If customers wish to exchange/return a product due to a simple change of mind, the customer bears the shipping cost.",
    returnsB3b:
      "For defective products, incorrect products, or returns due to shipping issues, the seller bears the shipping cost.",
    returnsB4a: "Exchanges/returns may not be available in the following cases:",
    returnsB4b:
      "Product damaged or destroyed due to a cause attributable to the customer (except opening packaging to inspect contents);",
    returnsB4c:
      "Product value has substantially decreased due to total or partial use or consumption by the customer (including use of Digital Codes);",
    returnsB4d:
      "Product value has substantially decreased due to the passage of time, making resale difficult or impossible;",
    returnsB4e:
      "Packaging of copyable products has been damaged (including albums, books, video publications, photocards, postcards, and posters whose packaging has been opened);",
    returnsB4f:
      "Production of a made-to-order product is already underway (where irreparable harm to the seller can be foreseen, and the seller has obtained written consent that the right of withdrawal cannot be exercised due to such harm);",
    returnsB4g:
      "Some components of the product have been used, lost, or cannot be resold due to damage/failure/contamination from mishandling, or the product is returned with incomplete components;",
    returnsB4h:
      "Exchanges/returns for each product category may not be available in the following cases:",
    returnsB4i: "[Clothing, bags, shoes, fashion accessories]",
    returnsB4j:
      "Product value has substantially decreased due to washing, stains, perfume or deodorant odor, signs of use, etc.",
    relatedTitle: "Related Products",
    prevPage: "Previous page",
    nextPage: "Next page",
    shippedFrom: "Ships from KR",
    contentsFallback: "View product details",
  },
  common: {
    close: "Close",
    back: "Back",
    loading: "Loading\u2026",
    home: "Home",
    store: "Store",
    checkout: "Checkout",
    officialMerch: "Official Merch",
    backToStore: "Back to Store",
  },
  preloader: {
    aria: "Loading MUSES",
    stage: "Setting the stage...",
    charm: "Loading the muses' charm...",
    harmony: "Harmonizing...",
    welcome: "Welcome to MUSES",
  },
};

const enMeta = {
  meta: {
    defaultTitle: "MUSES | Official Idol Group",
    defaultDesc:
      "Official site of idol group MUSES (7 members: Vira, Vely, Mine, Faril, Ndah, Liz, Lia). Albums, concert tour schedules, gallery, and official merchandise.",
    homeTitle: "MUSES | Official Idol Group",
    homeDesc:
      "Official profile site of local idol group MUSES (7 members: Vira, Vely, Mine, Faril, Ndah, Liz, Lia). Music, tour schedules, gallery, merchandise, and management contact.",
    memberTitle: "Members Profile | MUSES Official Portal",
    memberDesc: "Full profiles of all 7 MUSES members: Vira, Vely, Mine, Faril, Ndah, Liz, Lia.",
    discographyTitle: "Discography | MUSES Official Portal",
    discographyDesc:
      "Complete list of albums and music releases from idol group MUSES, with a vinyl record player and official links.",
    scheduleTitle: "Tour Schedule | MUSES Official Portal",
    scheduleDesc:
      "Tour and concert schedules of idol group MUSES. Countdown to showtime and official tickets.",
    galleryTitle: "Gallery | MUSES Official Portal",
    galleryDesc:
      "Exclusive photo and video collection from concerts, behind the scenes, and official activities of idol group MUSES.",
    storeTitle: "Official Store | MUSES Official Portal",
    storeDesc:
      "Official MUSES merchandise store. Exclusive limited vinyl pressings, official lightstick, tour apparel, cheki, and videocall tickets.",
    storeDetailTitle: "{name} | MUSES Official Store",
    contactTitle: "Official Management Contact | MUSES Official Portal",
    contactDesc:
      "Official contact channel of MUSES idol group management for business partnerships, sponsorships, collaborations, and event partnerships.",
    loginTitle: "Sign In to Your Account | MUSES Official Portal",
    loginDesc:
      "Sign in to your official MUSES Official Portal account for exclusive albums, tours, and official merchandise.",
    registerTitle: "Create Account | MUSES Official Portal",
    registerDesc:
      "Create an official MUSES Official Portal account for exclusive albums, tours, and official merchandise.",
    authTitle: "Sign In / Sign Up | MUSES Official Portal",
    authDesc:
      "Official MUSES Official Portal access with Google or Email OTP for ticket purchases, merchandise, and exclusive content.",
    profileTitle: "My Profile | MUSES Official",
    profileDesc: "Manage your profile information to control, protect, and secure your account.",
    ordersTitle: "Order History | MUSES Official",
    ordersDesc:
      "Transaction history for orders, event cheki tickets, and official MUSES merchandise shipping.",
    checkoutTitle: "Checkout | MUSES Official",
    checkoutDesc: "Checkout and payment process for official MUSES merchandise orders.",
    paymentTitle: "QRIS Payment | MUSES Official",
    paymentDesc: "Official payment page for MUSES idol group merchandise and ticket orders.",
    adminSchedulesTitle: "Schedule Admin | MUSES Official",
    adminSchedulesDesc:
      "Manage MUSES tour schedules. Only Supabase accounts made admin can add, edit, or delete schedules.",
    adminLoginTitle: "Admin Login | MUSES Official",
    adminLoginDesc:
      "MUSES admin-only login for managing schedules. Only accounts with the admin role can sign in.",
    adminStoreTitle: "Store Admin | MUSES Official",
    adminStoreDesc:
      "Manage MUSES store products. Only Supabase accounts made admin can add, edit, or delete products.",
    addressRedirectTitle: "Redirecting to Addresses...",
    addressRedirectBody: "Redirecting to the addresses page...",
    addressRedirectLink: "Click here if you are not redirected automatically",
  },
};

const enAdmin = {
  admin: {
    checking: "Checking admin session\u2026",
    noSupabaseTitle: "Supabase not configured",
    loginNoSupabaseBody:
      "Admin login requires Supabase. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY first, then reload this page.",
    schedNoSupabaseBody:
      "The schedule admin deliberately does not edit local data (schedules.json) so it never looks saved when it is not in the database. First set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY in Cloudflare, apply supabase/schema.sql and supabase/migrations/20261031_admin_schedules.sql, then promote one account to admin (see supabase/ADMIN_SCHEDULES.md).",
    storeNoSupabaseBody:
      "The store admin deliberately does not edit local data so it never looks saved when it is not in the database. First set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY, apply the admin products migration, then sign in via /admin/login.",
    forbiddenTitle: "This account is not an admin",
    loginForbiddenBody: "{account} does not have the admin role, so it cannot open admin pages.",
    schedForbiddenBody:
      "{account} does not have the admin role, so it cannot add, edit, or delete schedules. Ask an existing admin to change this account's role.",
    storeForbiddenBody:
      "{account} does not have the admin role, so it cannot add, edit, or delete products. Ask an existing admin to change this account's role.",
    signOutButton: "Sign out and log in with another account",
    backHome: "Back to home",
    loginEyebrow: "MUSES Admin",
    loginHeading: "Admin Login",
    loginIntro:
      "This page is only for MUSES admin accounts. Regular accounts are still rejected even after signing in.",
    emailLabel: "Admin email",
    passwordLabel: "Password",
    emailPlaceholder: "admin@muses.id",
    checkingSubmit: "Checking\u2026",
    submit: "Sign in as Admin",
    errEmail: "Enter a valid admin email.",
    errPassword: "Enter your password.",
    errMismatch: "Incorrect email or password. Please check and try again.",
    loginRequiredTitleSched: "Sign in to manage schedules",
    loginRequiredTitleStore: "Sign in to manage the store",
    loginRequiredBody:
      "This page can only be opened with a Supabase account that has been made admin.",
    loginButton: "Go to admin login page",
    backSchedule: "Back to public schedule",
    backStore: "Back to store",
    headerAdmin: "Admin \u00b7 {email}",
    schedHeading: "Manage Tour Schedules",
    schedIntro:
      "Changes here are saved directly to the public.schedules table in Supabase, not to schedules.json. If the Supabase table is still empty, the public page will show the local starter data until the first schedule is saved from here.",
    addSchedButton: "+ Add schedule",
    formTitleNew: "New schedule",
    formTitleEdit: "Edit schedule: {id}",
    formHint:
      "New schedule IDs are generated automatically from the tour name, city, and date. When editing, the ID is locked so existing references are not broken.",
    tourName: "Tour name *",
    showTitle: "Show title",
    city: "City *",
    venue: "Venue *",
    target: "Event date & time *",
    status: "Status",
    door: "Doors open",
    show: "Show time *",
    ticket: "Ticket link",
    poster: "Poster (URL / path) *",
    day: "Day (number)",
    dayName: "Day name",
    month: "Month",
    year: "Year",
    tourPh: "1ST ANNIVERSARY LIVE",
    titlePh: "Leave empty = same as tour name",
    cityPh: "JAKARTA",
    venuePh: "M Bloc Space",
    doorPh: "13:00 WIB",
    showPh: "14:00 WIB",
    ticketPh: "https://\u2026",
    posterPh: "/images/\u2026 or https://\u2026",
    dayPh: "25",
    dayNamePh: "SATURDAY",
    monthPh: "OCT",
    yearPh: "2026",
    autofill: "Autofill from date",
    saveNewSched: "Add schedule",
    saveEditSched: "Save changes",
    saving: "Saving\u2026",
    cancelEdit: "Cancel edit",
    listTitle: "Schedule list ({count})",
    loadingSched: "Loading schedules\u2026",
    emptySched: "No schedules yet. Add the first schedule using the form above.",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Yes, delete",
    cancel: "Cancel",
    errLoadSched: "Failed to load schedules.",
    errRequired: "Tour name, city, venue, show time, and poster are required.",
    errDate: "Event date & time are required (used for the countdown and ordering).",
    errSaveSched: "Failed to save schedule.",
    errDeleteSched: "Failed to delete schedule.",
    noticeUpdatedSched: "Schedule updated successfully.",
    noticeAddedSched: "New schedule added successfully.",
    noticeDeletedSched: "Schedule deleted successfully.",
    storeEyebrow: "MUSES Admin",
    storeHeading: "Store Admin",
    count: "Products currently in the database: {count}",
    addProductButton: "Add product",
    warningTitle: "Before saving the first product",
    warningBody:
      "While the products table is still empty, the store shows the default catalog from code (cheki, merchandise, videocall). Once 1 product exists in the database, the store only shows products from the database. So before saving the first product, make sure all products you want to sell \u2014 including cheki \u2014 have been entered here.",
    formTitleNewProduct: "Add product",
    formTitleEditProduct: "Edit product",
    prodName: "Product name",
    prodId: "Product ID",
    idLocked: "(cannot be changed)",
    idAuto: "(automatic from name)",
    prodCategory: "Category",
    prodSubtitle: "Subtitle",
    prodPrice: "Price (Rupiah)",
    prodStock: "Stock",
    prodImage: "Image (URL or path, leave empty for the default store image)",
    prodOptions: "Options (separate with commas, e.g. Two shot, Solo)",
    prodDescription: "Description",
    prodFeatured: "Featured product (shown in store highlights)",
    prodNamePh: "Light Stick",
    prodIdPh: "light-stick",
    prodSubtitlePh: "Rechargeable Concert Light Device",
    prodPricePh: "880000",
    prodStockPh: "40",
    prodImagePh: "/images/store/product-1.svg",
    prodOptionsPh: "Box Set, Standard",
    saveNewProduct: "Save product",
    saveEditProduct: "Save changes",
    emptyProdTitle: "No products in the database yet",
    emptyProdBody:
      "The store currently shows the default catalog from code. Add products using the form above to start managing the store from the database.",
    featuredBadge: "Featured",
    stockLabel: "Stock {stock}",
    errProdName: "Product name is required.",
    errProdId: "Product ID is required.",
    errProdPrice: "Price must be a number 0 or greater (Rupiah).",
    errProdStock: "Stock must be a whole number 0 or greater.",
    errProdNoSupabase: "Supabase is not configured.",
    noticeProdUpdated: "Product updated successfully.",
    noticeProdAdded: "Product added successfully.",
    noticeProdDeleted: "Product deleted successfully.",
  },
};

const idDict = {
  ...id,
  ...idStore,
  ...idAuth,
  ...idCheckout,
  ...idProduct,
  ...idMeta,
  ...idAdmin,
};

const enDict: DeepPartial<typeof idDict> = {
  ...en,
  ...enStore,
  ...enAuth,
  ...enCheckout,
  ...enProduct,
  ...enMeta,
  ...enAdmin,
};

export type Dict = typeof idDict;

export const dict: Record<Locale, Dict> = {
  id: idDict,
  en: deepMerge(idDict, enDict),
};

export function getDict(locale: Locale): Dict {
  return dict[locale];
}

// Map known Indonesian service error strings to English. Unknown
// messages (e.g. raw Supabase errors) pass through unchanged.
const SERVICE_ERRORS: Record<string, string> = {
  "Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.":
    "Sign in failed. Please check your email and password and try again.",
  "Supabase belum dikonfigurasi, jadi login Google belum bisa dipakai.":
    "Supabase is not configured yet, so Google login cannot be used.",
  "Login Google gagal dimulai. Pastikan provider Google sudah diaktifkan di Supabase.":
    "Google login failed to start. Make sure the Google provider is enabled in Supabase.",
  "Supabase belum dikonfigurasi, jadi jadwal tidak bisa disimpan.":
    "Supabase is not configured yet, so schedules cannot be saved.",
  "Gagal menyimpan jadwal.": "Failed to save schedule.",
  "Gagal menyimpan produk.": "Failed to save product.",
  "Gagal memuat jadwal.": "Failed to load schedules.",
};

export function translateServiceError(locale: Locale, message: string): string {
  if (locale === "id") return message;
  return SERVICE_ERRORS[message] ?? message;
}

// Videocall duration options are stored in Indonesian ("60 Detik").
export function localizeOption(locale: Locale, option: string): string {
  if (locale === "id") return option;
  return option.replace(/(\d+)\s*Detik/g, "$1 Seconds");
}

const ADDRESS_LABELS: Record<string, string> = {
  Rumah: "Home",
  Kantor: "Office",
};

export function localizeAddressLabel(locale: Locale, label: string): string {
  if (locale === "id") return label;
  return ADDRESS_LABELS[label] ?? label;
}

// Demo-order strings live in src/data/orders.ts as prefilled Indonesian
// content (not UI copy), so they are mapped here instead of the tree.
const DEMO_TEXT: Record<string, string> = {
  "Menunggu pembayaran": "Waiting for payment",
  "Diambil di event": "Pickup at event",
  Dikirim: "Shipped",
  Selesai: "Completed",
  "Diambil saat event \u2022 2 Cheki": "Picked up at event \u2022 2 Cheki",
  "Diambil saat event \u2022 1 Cheki": "Picked up at event \u2022 1 Cheki",
  "Ambil cheki di Itasha Domei, Bandung": "Pick up cheki at Itasha Domei, Bandung",
  "Sabtu, 24 Oktober 2026. Tunjukkan kode ini ke staff management.":
    "Saturday, 24 October 2026. Show this code to the management staff.",
  "25 - 26 Oktober 2026": "25 - 26 October 2026",
  Dibayar: "Paid",
  "Disiapkan Management": "Prepared by Management",
  "Siap diambil di event": "Ready for pickup at event",
  "Dalam Pengiriman (JNE)": "In transit (JNE)",
  Semua: "All",
  "Belum Bayar": "Unpaid",
  "Belum dibayar": "Unpaid",
  "2 - 3 hari": "2 - 3 days",
  "Menunggu Pembayaran": "Waiting for payment",
  Dikemas: "Packed",
  Diterima: "Received",
  "Ambil cheki di Itasha Dome, Bandung": "Pick up cheki at Itasha Dome, Bandung",
  "Cheki kamu sudah kamu ambil": "You have picked up your cheki",
  "Terima kasih sudah mendukung member favoritmu!":
    "Thank you for supporting your favorite member!",
  "Paket dalam perjalanan via JNE Reguler": "Package in transit via JNE Regular",
  "Sedang diproses": "Processing",
};

export function localizeDemoText(locale: Locale, text: string): string {
  if (locale === "id") return text;
  return DEMO_TEXT[text] ?? text;
}

// Gallery card categories come from src/data/gallery.json as Indonesian
// content strings; only "Konser" differs in English.
export function localizeGalleryCategory(locale: Locale, category: string): string {
  if (locale === "id") return category;
  return category === "Konser" ? "Concert" : category;
}
