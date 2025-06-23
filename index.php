<!DOCTYPE html>
<html lang="id" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan SPMB SMK Widya Manggala Purbalingga</title>
    <link rel="shortcut icon" href="assets/img/logo manggala.png" >
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <!--<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.1.0/dist/chartjs-plugin-datalabels.min.js"></script>-->
    <!-- DITAMBAHKAN: Library untuk generate PDF -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f2f5; }
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-150%); } }
        .marquee-text { animation: marquee 45s linear infinite; display: inline-block; white-space: nowrap; padding-left: 100%; }
        .card { background-color: white; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); transition: box-shadow 0.3s; }
        .card:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.1); }
    </style>
</head>
<body class="text-gray-800">

    <!--<div class="flex flex-col h-screen">-->
        <!-- HEADER -->
        <header class="flex-shrink-0 px-6 pt-6">
            <div class="flex items-center justify-between">
                <img src="assets/img/logo manggala.png" alt="Logo Sekolah" class="h-16 w-16 md:h-20 md:w-20">
                <div class="text-center">
                    <h1 class="text-xl md:text-3xl font-bold text-slate-700">Perkembangan Pendaftar SPMB</h1>
                    <h2 class="text-lg md:text-2xl font-semibold text-slate-600">SMK Widya Manggala Purbalingga</h2>
                    <p class="text-sm md:text-base text-slate-500">Tahun Ajaran 2025/2026</p>
                </div>
                <div class="h-16 w-16 md:h-20 md:w-20"></div>
            </div>
        </header>

        <!-- KONTEN UTAMA (fleksibel dan bisa scroll di mobile) -->
        <main class="flex-grow p-6 space-y-6 overflow-y-auto">

            <!-- Section 1: Pendaftar 7 Hari Terakhir & Waktu -->
            <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="card lg:col-span-2 flex flex-col order-2 lg:order-1">
                    <h3 class="text-xl font-semibold mb-4 flex-shrink-0">Pendaftar 7 Hari Terakhir</h3>
                    <div class="relative flex-grow min-h-[200px] md:min-h-[250px]">
                        <canvas id="chartHarian"></canvas>
                    </div>
                </div>
                <div class="card flex flex-col justify-center items-center text-center order-1 lg:order-2">
                    <div id="clock" class="text-4xl md:text-5xl font-bold text-blue-600 tracking-wider"></div>
                    <div id="date" class="text-base md:text-lg text-gray-500 mt-2"></div>
                </div>
            </section>

            <!-- Section 2: Ringkasan Jurusan, Jalur & Daftar Ulang -->
            <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="card flex flex-col">
                    <h3 class="text-xl font-semibold mb-4 text-center">Pendaftar per Jurusan</h3>
                    <div class="relative flex-grow min-h-[220px]">
                        <canvas id="chartJurusan"></canvas>
                    </div>
                </div>
                <div class="card flex flex-col">
                    <h3 class="text-xl font-semibold mb-4 text-center">Jalur Pendaftaran</h3>
                    <div class="relative flex-grow min-h-[220px]">
                        <canvas id="chartJalur"></canvas>
                    </div>
                </div>
                <div class="card flex flex-col">
                    <h3 class="text-xl font-semibold mb-4 text-center">Status Daftar Ulang</h3>
                    <div class="relative flex-grow min-h-[220px]">
                        <canvas id="chartDaftarUlang"></canvas>
                    </div>
                </div>
            </section>

            <!-- Section 3: Tabel Asal Sekolah -->
            <section class="card">
                <h3 class="text-xl font-semibold mb-4">5 Besar Asal Sekolah Pendaftar</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-left">
                        <thead class="border-b-2 border-gray-200">
                            <tr>
                                <th class="py-3 px-4 font-semibold text-sm">#</th>
                                <th class="py-3 px-4 font-semibold text-sm">Nama Sekolah</th>
                                <th class="py-3 px-4 font-semibold text-sm text-center">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody id="tabelAsalSekolah"></tbody>
                    </table>
                </div>
            </section>

            <!-- DITAMBAHKAN: Section 4 untuk Laporan -->
            <section class="card">
                <h3 class="text-xl font-semibold mb-4">Cetak Laporan PDF</h3>
                <div class="flex flex-col sm:flex-row gap-4">
                    <button id="printTodayBtn" class="print-btn w-full sm:w-auto flex-1 bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400">
                        Cetak Laporan Hari Ini
                    </button>
                    <button id="printAllBtn" class="print-btn w-full sm:w-auto flex-1 bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-600">
                        Cetak Laporan Seluruhnya
                    </button>
                </div>
            </section>
        </main>

        <!-- FOOTER -->
        <footer class="flex-shrink-0 bg-slate-800 text-white p-3 overflow-hidden">
            <div class="whitespace-nowrap">
                <p id="footerText" class="marquee-text font-medium"></p>
            </div>
        </footer>
    </div>
    
    <script src="assets/js/app.js"></script>
</body>
</html>
