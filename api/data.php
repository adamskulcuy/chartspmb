<?php
/**
 * API Endpoint untuk Data Dashboard SPMB (Versi 3)
 *
 * Disesuaikan dengan skema database yang ada:
 * - Tabel: siswa
 * - Kolom: jurusan, tgl_siswa, asal_sekolah, kelas, status
 * - Kredensial: ppdb / 123
 * - Menambahkan pemetaan kode jurusan ke singkatan.
 * - Menangani nilai NULL pada kolom 'kelas'.
 */

// --- KONFIGURASI DATABASE ---
$host = 'localhost';
$db   = 'smkwimap_ppdb25';
$user = 'smkwimap_root';
$pass = 'Karsodrs123@';
// --------------------------

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Koneksi ke database gagal: ' . $e->getMessage()]);
    exit();
}

$response = [];

// 1. Mengambil data pendaftar selama 7 hari terakhir
$dateLabels = [];
$dates = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $dateLabels[] = date('d M', strtotime($date));
    $dates[$date] = 0;
}
// Menggunakan kolom 'tgl_siswa'
$stmt = $pdo->query("
    SELECT DATE(tgl_siswa) as tanggal, COUNT(*) as jumlah 
    FROM siswa 
    WHERE tgl_siswa >= CURDATE() - INTERVAL 7 DAY
    GROUP BY DATE(tgl_siswa)
");
$dailyData = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
foreach ($dailyData as $date => $count) {
    if (isset($dates[$date])) $dates[$date] = (int)$count;
}
$response['pendaftar_harian'] = ['labels' => $dateLabels, 'data' => array_values($dates)];

// 2. Mengambil data pendaftar per jurusan dengan pemetaan
$stmt = $pdo->query("
    SELECT 
        CASE jurusan
            WHEN '01' THEN 'AKL'
            WHEN '02' THEN 'MPLB'
            WHEN '03' THEN 'ANM'
            WHEN '04' THEN 'DKV'
            WHEN '05' THEN 'TO'
            WHEN 'AKUNTANSI DAN KEUANGAN LEMBAGA' THEN 'AKL'
            WHEN 'MANAJEMEN PERKANTORAN DAN LAYANAN BISNIS' THEN 'MPLB'
            WHEN 'ANIMASI' THEN 'ANM'
            WHEN 'DESAIN KOMUNIKASI VISUAL' THEN 'DKV'
            WHEN 'TEKNIK OTOMOTIF (TEKNIK SEPEDA MOTOR)' THEN 'TO'
            ELSE 'Lainnya'
        END as jurusan_singkat,
        COUNT(*) as jumlah
    FROM siswa
    GROUP BY jurusan_singkat
");
$response['pendaftar_per_jurusan'] = $stmt->fetchAll();

// 3. Mengambil data pendaftar per jalur (kolom 'kelas')
// IFNULL digunakan untuk menangani nilai NULL
$stmt = $pdo->query("
    SELECT 
        CASE 
            WHEN kelas IS NULL OR kelas = '' THEN 'Belum Memilih'
            ELSE kelas 
        END as jalur, 
        COUNT(*) as jumlah
    FROM siswa
    GROUP BY jalur
");
$response['pendaftar_per_jalur'] = $stmt->fetchAll();

// 4. Mengambil data status daftar ulang (kolom 'status')
$stmt = $pdo->query("
    SELECT 
        SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as sudah,
        SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as belum
    FROM siswa
");
$response['status_daftar_ulang'] = $stmt->fetch();

// 5. Mengambil data rekapitulasi asal sekolah (kolom 'asal_sekolah')
$stmt = $pdo->query("SELECT asal_sekolah, COUNT(*) as jumlah FROM siswa GROUP BY asal_sekolah ORDER BY jumlah DESC LIMIT 5");
$response['rekap_asal_sekolah'] = $stmt->fetchAll();

// 6. Mengambil data ringkasan untuk footer
$totalPendaftar = $pdo->query("SELECT COUNT(*) FROM siswa")->fetchColumn();
$jalurData = $pdo->query("
    SELECT IFNULL(kelas, 'Belum Memilih') as jalur, COUNT(*) as jumlah 
    FROM siswa GROUP BY jalur
")->fetchAll(PDO::FETCH_KEY_PAIR);

$response['summary'] = [
    'total_pendaftar' => (int)$totalPendaftar,
    'total_sudah_daftar_ulang' => (int)($response['status_daftar_ulang']['sudah'] ?? 0),
    'total_belum_daftar_ulang' => (int)($response['status_daftar_ulang']['belum'] ?? 0),
    'jalur_afirmasi' => (int)($jalurData['AFIRMASI'] ?? 0),
    'jalur_kip' => (int)($jalurData['KIP'] ?? 0),
    'jalur_reguler' => (int)($jalurData['REGULER'] ?? 0),
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
