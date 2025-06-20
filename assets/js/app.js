/**
 * File: app.js (Versi 2)
 * Deskripsi: Penambahan chart pendaftar harian dan penyesuaian
 * untuk tata letak baru.
 */
document.addEventListener('DOMContentLoaded', () => {
    
    Chart.defaults.font.family = 'Inter';
    Chart.defaults.plugins.legend.position = 'bottom';
    Chart.defaults.maintainAspectRatio = false; // Penting untuk layout responsif
    Chart.defaults.responsive = true;

    // Konteks canvas dari HTML
    const ctxHarian = document.getElementById('chartHarian')?.getContext('2d');
    const ctxJurusan = document.getElementById('chartJurusan')?.getContext('2d');
    const ctxJalur = document.getElementById('chartJalur')?.getContext('2d');
    const ctxDaftarUlang = document.getElementById('chartDaftarUlang')?.getContext('2d');

    if (!ctxHarian || !ctxJurusan || !ctxJalur || !ctxDaftarUlang) {
        console.error("Satu atau lebih elemen canvas chart tidak ditemukan!");
        return;
    }

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
