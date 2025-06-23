/**
 * File: app.js (Versi 2)
 * Deskripsi: Penambahan chart pendaftar harian dan penyesuaian
 * untuk tata letak baru.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Definisi jsPDF dari window object
    const { jsPDF } = window.jspdf;

    

    Chart.defaults.font.family = 'Inter';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.maintainAspectRatio = false; // Penting untuk layout responsif
    Chart.defaults.responsive = true;

    // Konteks canvas dari HTML
    const ctxHarian = document.getElementById('chartHarian')?.getContext('2d');
    const ctxJurusan = document.getElementById('chartJurusan')?.getContext('2d');
    const ctxJalur = document.getElementById('chartJalur')?.getContext('2d');
    const ctxDaftarUlang = document.getElementById('chartDaftarUlang')?.getContext('2d');
    const refreshBtn = document.getElementById('refreshBtn');
    const printTodayBtn = document.getElementById('printTodayBtn');
    const printAllBtn = document.getElementById('printAllBtn');

    if (!ctxHarian || !ctxJurusan || !ctxJalur || !ctxDaftarUlang) {
        console.error("Satu atau lebih elemen canvas chart tidak ditemukan!");
        return;
    }

    // Variabel global untuk menyimpan data terakhir dari API
    let lastApiData = null;
    let lastDataFetchTime = null;

    // --- Fungsi Helper untuk memuat logo ---
    async function getLogoBase64(url) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Gagal memuat gambar logo:", error);
            return null; // Kembalikan null jika gagal
        }
    }
    
    // --- Fungsi Generate PDF ---
    async function generatePdf(scope) {
        if (!lastApiData) {
            alert('Data belum tersedia, silakan tunggu atau segarkan halaman.');
            return;
        }

        // GANTI URL INI dengan URL logo sekolah Anda yang sebenarnya
        const logoUrl = 'http://localhost/chartspmb/assets/img/logo%20manggala.png';
        const logoBase64 = await getLogoBase64(logoUrl);


        const doc = new jsPDF();
        const JURUSAN_LIST = ['AKL', 'MPLB', 'ANM', 'DKV', 'TO'];
        const today = new Date();
        const todayString = today.toISOString().split('T')[0]; // Format 'YYYY-MM-DD'
        
        // Filter data berdasarkan scope (hari ini atau semua)
        const dataToProcess = scope === 'today'
            ? lastApiData.raw_data.filter(siswa => siswa.tgl_siswa === todayString)
            : lastApiData.raw_data;

        // --- Header PDF ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Laporan SPMB SMK Widya Manggala Purbalingga', doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('Tahun Ajaran 2025/2026', doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
        
        // Logo Placeholder
        doc.setFontSize(10);
        // Menambahkan gambar logo jika berhasil dimuat
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 10, 10, 15, 15);
        } else {
            // Fallback jika logo gagal dimuat
            doc.rect(15, 15, 25, 25);
            doc.setFontSize(10);
            doc.text('LOGO', 27.5, 28, { align: 'center' });
        }

        // laporan harian atau semua
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Laporan ${scope === 'today' ? 'Harian' : 'Keseluruhan'} Pendaftar`, 15, 35);
        doc.setFontSize(10);
        doc.text(`Tanggal: ${today.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}`, 15, 40);
        
        // Timestamps
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        const downloadTime = `Diunduh pada: ${today.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})} Pukul ${today.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB`;
        const updateTime = `Data terakhir update: ${lastDataFetchTime.toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})} Pukul ${lastDataFetchTime.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})} WIB`;
        doc.text(downloadTime, 15, 45);
        doc.text(updateTime, 15, 50);
        
        let detailedData = JURUSAN_LIST.map(jurusan => ({
            jurusan: jurusan,
            total: dataToProcess.filter(s => s.jurusan_singkat === jurusan).length,
            sudah_du: dataToProcess.filter(s => s.jurusan_singkat === jurusan && s.status == 1).length,
            belum_du: dataToProcess.filter(s => s.jurusan_singkat === jurusan && s.status == 0).length,
            // afirmasi: dataToProcess.filter(s => s.jurusan_singkat === jurusan && s.kelas === 'AFIRMASI').length,
            // kip: dataToProcess.filter(s => s.jurusan_singkat === jurusan && s.kelas === 'KIP').length,
            // reguler: dataToProcess.filter(s => s.jurusan_singkat === jurusan && (s.kelas === 'REGULER' || s.kelas === 'Belum Memilih')).length,
        }));

        // --- Tabel Ringkasan Total (1 baris) ---
        const totalPendaftar = dataToProcess.filter(s => s.status !== null).length;
        const totalSudahDU = dataToProcess.filter(s => s.status == 1).length;
        const totalBelumDU = dataToProcess.filter(s => s.status == 0).length;
        doc.autoTable({
            startY: 60,
            head: [['Total Pendaftar', 'Sudah Daftar Ulang', 'Belum Daftar Ulang']],
            body: [
                [
                    { content: `${totalPendaftar}`, styles: { fontStyle: 'bold', fontSize: 20, halign: 'center'} },
                    { content: `${totalSudahDU}`, styles: { fontStyle: 'bold', fontSize: 20, halign: 'center' } },
                    { content: `${totalBelumDU}`, styles: { fontStyle: 'bold', fontSize: 20, halign: 'center' } }
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
        });
        
        doc.autoTable({
            startY: doc.autoTable.previous.finalY + 10,
            head: [['Jurusan', 'Total', 'Sudah DU', 'Belum DU']],
            // head: [['Jurusan', 'Total', 'Sudah DU', 'Belum DU', 'Afirmasi', 'KIP', 'Reguler']],
            body: detailedData.map(row => [
                row.jurusan, row.total, row.sudah_du, row.belum_du
                // row.jurusan, row.total, row.sudah_du, row.belum_du, row.afirmasi, row.kip, row.reguler
            ]),
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] },
        });
        
        // --- Footer PDF ---
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Petugas Piket, Tim Data, dan IT', doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }

        // --- Simpan PDF ---
        const fileName = `Laporan_SPMB_${scope}_${todayString}.pdf`;
        doc.save(fileName);
    }
    
    // --- Event Listeners untuk Tombol Cetak ---
    printTodayBtn.addEventListener('click', () => generatePdf('today'));
    printAllBtn.addEventListener('click', () => generatePdf('all'));


    // Chart BARU: Pendaftar 7 Hari Terakhir
    const chartHarian = new Chart(ctxHarian, {
        type: 'bar',
        data: {
            labels: [], // Akan diisi oleh API
            datasets: [{
                label: 'Jumlah Pendaftar',
                data: [], // Akan diisi oleh API
                backgroundColor: 'rgba(59, 130, 246, 0.75)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 4,
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
        }
    });

    const chartJurusan = new Chart(ctxJurusan, {
        type: 'line',
        data: {
            labels: ['AKL', 'MPLB', 'ANM', 'DKV', 'TO'],
            datasets: [{
                label: 'Pendaftar',
                data: [0, 0, 0, 0, 0],
                backgroundColor: 'rgba(22, 163, 74, 0.2)',
                borderColor: 'rgba(22, 163, 74, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(22, 163, 74, 1)',
                tension: 0.4,
                fill: true,
            }]
        },
        options: { plugins: { legend: { display: false } } }
    });

    // Inisialisasi Chart Jalur dengan label baru, termasuk 'Belum Memilih'
    const chartJalur = new Chart(ctxJalur, {
        type: 'doughnut',
        data: {
            labels: ['AFIRMASI', 'KIP', 'REGULER', 'Belum Memilih'], // Label diperbarui
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#9CA3AF'], // Warna ditambahkan
                hoverOffset: 5,
                borderWidth: 0,
            }]
        }
    });

    const chartDaftarUlang = new Chart(ctxDaftarUlang, {
        type: 'pie',
        data: {
            labels: ['Sudah', 'Belum'],
            datasets: [{
                label: 'Status',
                data: [0, 0],
                backgroundColor: ['#22C55E', '#EF4444'],
                hoverOffset: 8,
                borderWidth: 0,
            }]
        }
    });

    async function updateDashboardData() {
        try {
            const response = await fetch('api/data.php');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            // Simpan data dan waktu fetch untuk digunakan oleh PDF
            lastApiData = data;
            lastDataFetchTime = new Date();

            // 1. Update Chart Harian
            chartHarian.data.labels = data.pendaftar_harian.labels;
            chartHarian.data.datasets[0].data = data.pendaftar_harian.data;
            chartHarian.update();

            // 2. Update Chart Jurusan (disesuaikan dengan kunci 'jurusan_singkat')
            const jurusanLabels = chartJurusan.data.labels;
            const jurusanData = jurusanLabels.map(label => {
                const found = data.pendaftar_per_jurusan.find(item => item.jurusan_singkat === label);
                return found ? found.jumlah : 0;
            });
            chartJurusan.data.datasets[0].data = jurusanData;
            chartJurusan.update();

            // 3. Update Chart Jalur (disesuaikan dengan kunci 'jalur')
            const jalurLabels = chartJalur.data.labels;
            const jalurData = jalurLabels.map(label => {
                const found = data.pendaftar_per_jalur.find(item => item.jalur.toUpperCase() === label.toUpperCase());
                return found ? found.jumlah : 0;
            });
            chartJalur.data.datasets[0].data = jalurData;
            chartJalur.update();

            // 4. Update Chart Daftar Ulang
            chartDaftarUlang.data.datasets[0].data = [data.status_daftar_ulang.sudah, data.status_daftar_ulang.belum];
            chartDaftarUlang.update();

            // 5. Update Tabel Asal Sekolah
            const tabelBody = document.getElementById('tabelAsalSekolah');
            tabelBody.innerHTML = '';
            if (data.rekap_asal_sekolah.length > 0) {
                data.rekap_asal_sekolah.forEach((sekolah, index) => {
                    tabelBody.innerHTML += `
                        <tr class="border-b border-gray-100 hover:bg-gray-50">
                            <td class="py-3 px-4 text-gray-500">${index + 1}</td>
                            <td class="py-3 px-4 font-medium">${sekolah.asal_sekolah}</td>
                            <td class="py-3 px-4 font-semibold text-center text-blue-600">${sekolah.jumlah}</td>
                        </tr>
                    `;
                });
            } else {
                tabelBody.innerHTML = '<tr><td colspan="3" class="text-center py-4">Belum ada data pendaftar.</td></tr>';
            }

            // 6. Update Footer
            const summary = data.summary;
            const getJurusanCount = (jurusan) => {
                const found = data.pendaftar_per_jurusan.find(j => j.jurusan_singkat === jurusan);
                return found ? found.jumlah : 0;
            };
            document.getElementById('footerText').innerText = `Data pendaftar SMK Widya Manggala Purbalingga diperbarui setiap saat. SMK Widya Manggala Purbalingga, pilihan tepat untuk masa depanmu. Pendaftaran masih dibuka, ayo segera bergabung! Total Pendaftar: ${summary.total_pendaftar} Orang ••• Sudah Daftar Ulang: ${summary.total_sudah_daftar_ulang} ••• Belum Daftar Ulang: ${summary.total_belum_daftar_ulang} ••• Jalur Reguler: ${summary.jalur_reguler} | Jalur KIP: ${summary.jalur_kip} | Jalur Afirmasi: ${summary.jalur_afirmasi}. Berikut untuk total pendaftar per jurusan AKL: ${getJurusanCount('AKL')} | MPLB: ${getJurusanCount('MPLB')} | ANM: ${getJurusanCount('ANM')} | DKV: ${getJurusanCount('DKV')} | TO: ${getJurusanCount('TO')}`;

        } catch (error) {
            console.error('Gagal memperbarui data dashboard:', error);
        }
    }

    function updateClock() {
        const now = new Date();
        document.getElementById('clock').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('date').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    updateClock();
    updateDashboardData();
    setInterval(updateClock, 1000);
    setInterval(updateDashboardData, 300000); // Refresh data setiap 5 menit
});
