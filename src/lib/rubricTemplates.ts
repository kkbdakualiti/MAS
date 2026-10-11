// ============================================================
// e-APRESIASI KKBDA — Official Rubric Templates & Item Sets
// Sourced from Official Institutional Rubric Specifications
// ============================================================

import type { AwardItemSet, AwardItem } from './types';

export interface RubricLevelText {
  level_5: string;
  level_4: string;
  level_3: string;
  level_2: string;
  level_1: string;
}

export interface TemplateItemDef {
  name: string;
  description: string;
  wajaran: number; // Max score / percentage
  rubric_levels: RubricLevelText;
}

export interface TemplateSetDef {
  setId: string;
  awardId: string;
  awardName: string;
  setName: string;
  items: TemplateItemDef[];
}

export const OFFICIAL_RUBRIC_TEMPLATES: TemplateSetDef[] = [
  // 1. IKON SUKARELAWAN
  {
    setId: 'set-sukarelawan',
    awardId: 'award-1',
    awardName: 'Ikon Sukarelawan',
    setName: 'Rubrik Ikon Sukarelawan – Peringkat Institusi',
    items: [
      {
        name: 'Penglibatan aktif dalam program kesukarelawanan institusi',
        description: 'Kekerapan, inisiatif dan keterlibatan aktif dalam pelbagai program kesukarelawanan.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Sangat aktif dan konsisten dalam pelbagai program; menjadi penggerak utama.',
          level_4: 'Aktif dan konsisten dalam beberapa program dengan penglibatan jelas.',
          level_3: 'Terlibat dengan baik dalam program yang berkaitan.',
          level_2: 'Penglibatan terhad dan tidak konsisten.',
          level_1: 'Penglibatan sangat minimum; bukti terhad.',
        },
      },
      {
        name: 'Sumbangan/peranan dalam menjayakan aktiviti',
        description: 'Tahap peranan dan sumbangan signifikan dalam menjayakan aktiviti kesukarelawanan.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Memegang peranan utama dan sumbangan sangat signifikan kepada kejayaan program.',
          level_4: 'Memegang peranan penting dan memberi sumbangan yang jelas.',
          level_3: 'Melaksanakan peranan yang diberikan dengan baik.',
          level_2: 'Peranan dan sumbangan sederhana/terhad.',
          level_1: 'Sumbangan minimum dan kurang bukti.',
        },
      },
      {
        name: 'Komitmen dan konsistensi penglibatan',
        description: 'Komitmen tinggi, sikap proaktif dan konsistensi sepanjang tempoh penilaian.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Komitmen sangat tinggi, proaktif dan konsisten sepanjang tempoh penilaian.',
          level_4: 'Komitmen tinggi dan konsisten.',
          level_3: 'Komitmen baik serta memenuhi tanggungjawab.',
          level_2: 'Komitmen tidak konsisten.',
          level_1: 'Komitmen sangat minimum.',
        },
      },
      {
        name: 'Impak kepada institusi/komuniti',
        description: 'Impak positif yang nyata, luas dan terbukti kepada institusi dan komuniti luar.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Impak sangat jelas, luas dan boleh dibuktikan kepada institusi/komuniti.',
          level_4: 'Impak jelas dan positif kepada institusi/komuniti.',
          level_3: 'Memberi impak yang baik dan relevan.',
          level_2: 'Impak sederhana dan bukti terhad.',
          level_1: 'Tiada impak yang jelas.',
        },
      },
    ],
  },

  // 2. IKON KOKURIKULUM
  {
    setId: 'set-kokurikulum',
    awardId: 'award-2',
    awardName: 'Ikon Kokurikulum',
    setName: 'Rubrik Ikon Kokurikulum – Peringkat Institusi',
    items: [
      {
        name: 'Penglibatan dalam aktiviti kokurikulum institusi',
        description: 'Tahap keterlibatan konsisten dan menjadi penggerak utama dalam aktiviti kokurikulum institusi.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Sangat aktif, konsisten dan menjadi penggerak utama aktiviti kokurikulum.',
          level_4: 'Aktif dan konsisten dalam pelbagai aktiviti.',
          level_3: 'Terlibat dengan baik dan memenuhi tanggungjawab.',
          level_2: 'Penglibatan terhad/tidak konsisten.',
          level_1: 'Penglibatan sangat minimum.',
        },
      },
      {
        name: 'Peranan sebagai penyelaras/pembimbing/jurulatih',
        description: 'Peranan utama dan bimbingan sistematik serta berkesan kepada pelajar/pasukan.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Peranan utama; bimbingan sangat sistematik dan berkesan.',
          level_4: 'Peranan penting; bimbingan konsisten dan berkesan.',
          level_3: 'Melaksanakan peranan dan bimbingan dengan baik.',
          level_2: 'Peranan/bimbingan terhad.',
          level_1: 'Tiada atau sangat sedikit bukti peranan.',
        },
      },
      {
        name: 'Pencapaian program/pelajar',
        description: 'Kejayaan cemerlang dan pengiktirafan hasil bimbingan dalam program kokurikulum.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Pencapaian sangat cemerlang dan memberi pengiktirafan jelas di institusi.',
          level_4: 'Pencapaian sangat baik dengan bukti yang kukuh.',
          level_3: 'Pencapaian baik dan memenuhi sasaran.',
          level_2: 'Pencapaian sederhana/terhad.',
          level_1: 'Tiada pencapaian yang jelas.',
        },
      },
      {
        name: 'Inisiatif dan impak aktiviti',
        description: 'Kreativiti inisiatif kokurikulum serta impak tinggi kepada pembangunan pelajar dan institusi.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Inisiatif sangat kreatif dan memberi impak tinggi kepada pelajar/institusi.',
          level_4: 'Inisiatif jelas dan memberi impak yang baik.',
          level_3: 'Terdapat inisiatif dan impak yang relevan.',
          level_2: 'Inisiatif/impak terhad.',
          level_1: 'Tiada inisiatif/impak yang jelas.',
        },
      },
    ],
  },

  // 3. MENTOR KEUSAHAWANAN
  {
    setId: 'set-keusahawanan',
    awardId: 'award-3',
    awardName: 'Mentor Keusahawanan',
    setName: 'Rubrik Mentor Keusahawanan – Peringkat Institusi',
    items: [
      {
        name: 'Bimbingan kepada pelajar dalam aktiviti keusahawanan',
        description: 'Tahap bimbingan sistematik, intensif dan menghasilkan perkembangan usahawan pelajar.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Bimbingan sangat sistematik, intensif dan menghasilkan perkembangan pelajar yang jelas.',
          level_4: 'Bimbingan konsisten dan berkesan.',
          level_3: 'Bimbingan dilaksanakan dengan baik.',
          level_2: 'Bimbingan terhad/tidak konsisten.',
          level_1: 'Tiada atau sangat sedikit bukti bimbingan.',
        },
      },
      {
        name: 'Penglibatan dalam program keusahawanan',
        description: 'Peranan aktif sebagai penggerak utama program keusahawanan di peringkat institusi dan luar.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Sangat aktif dan menjadi penggerak utama program keusahawanan institusi.',
          level_4: 'Aktif dan memegang peranan penting.',
          level_3: 'Terlibat dengan baik dalam program.',
          level_2: 'Penglibatan terhad.',
          level_1: 'Penglibatan sangat minimum.',
        },
      },
      {
        name: 'Kejayaan/hasil aktiviti pelajar',
        description: 'Hasil jelas aktiviti seperti jualan, produk, projek atau pencapaian signifikan pelajar.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Hasil sangat jelas seperti jualan, produk, projek atau pencapaian yang signifikan.',
          level_4: 'Hasil jelas dan menunjukkan kejayaan yang baik.',
          level_3: 'Terdapat hasil yang memenuhi objektif.',
          level_2: 'Hasil sederhana dan bukti terhad.',
          level_1: 'Tiada hasil yang jelas.',
        },
      },
      {
        name: 'Inisiatif membudayakan keusahawanan',
        description: 'Kreativiti dan konsistensi inisiatif bagi membentuk budaya keusahawanan di kampus.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Inisiatif sangat kreatif, konsisten dan membentuk budaya keusahawanan.',
          level_4: 'Inisiatif jelas dan dilaksanakan secara konsisten.',
          level_3: 'Terdapat usaha yang relevan.',
          level_2: 'Usaha masih terhad.',
          level_1: 'Tiada inisiatif yang jelas.',
        },
      },
    ],
  },

  // 4. IKON PEMBELAJARAN & PENGAJARAN (PDP)
  {
    setId: 'set-pdp-ikon',
    awardId: 'award-4',
    awardName: 'Ikon Pembelajaran & Pengajaran',
    setName: 'Rubrik Ikon PdP – Peringkat Institusi',
    items: [
      {
        name: 'Perancangan dan pelaksanaan PdP berkualiti',
        description: 'PdP terancang, sistematik, lengkap, konsisten dan menunjukkan amalan terbaik.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'PdP sangat sistematik, lengkap, konsisten dan menunjukkan amalan terbaik.',
          level_4: 'PdP terancang, lengkap dan konsisten.',
          level_3: 'PdP dilaksanakan dengan baik dan memenuhi keperluan.',
          level_2: 'PdP dilaksanakan tetapi terdapat beberapa kekurangan.',
          level_1: 'Pelaksanaan kurang sistematik dan bukti sangat terhad.',
        },
      },
      {
        name: 'Inovasi/kreativiti dalam PdP',
        description: 'Menghasilkan atau mengaplikasikan inovasi PdP yang kreatif serta memberi impak tinggi.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Menghasilkan/menggunakan inovasi PdP yang kreatif dan memberi impak tinggi.',
          level_4: 'Menggunakan pendekatan inovatif secara konsisten dan memberi impak.',
          level_3: 'Terdapat penggunaan pendekatan kreatif dalam PdP.',
          level_2: 'Penggunaan pendekatan kreatif masih terhad.',
          level_1: 'Tiada/amat sedikit bukti inovasi PdP.',
        },
      },
      {
        name: 'Penggunaan teknologi/digital dalam PdP',
        description: 'Integrasi teknologi digital yang berkesan, pelbagai dan meningkatkan pengalaman pembelajaran.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Integrasi teknologi sangat berkesan, pelbagai dan meningkatkan pembelajaran.',
          level_4: 'Teknologi digunakan secara konsisten dan berkesan.',
          level_3: 'Teknologi digunakan dengan sesuai.',
          level_2: 'Penggunaan teknologi terhad.',
          level_1: 'Tiada/amat sedikit penggunaan teknologi.',
        },
      },
      {
        name: 'Maklum balas/pencapaian pelajar',
        description: 'Bukti jelas menunjukkan impak tinggi terhadap maklum balas dan pencapaian pelajar.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Bukti menunjukkan impak sangat tinggi terhadap pembelajaran/pencapaian pelajar.',
          level_4: 'Impak jelas dan positif.',
          level_3: 'Terdapat impak yang baik.',
          level_2: 'Impak sederhana/terhad.',
          level_1: 'Tiada bukti impak yang jelas.',
        },
      },
      {
        name: 'Perkongsian amalan baik PdP',
        description: 'Penglibatan aktif dalam perkongsian amalan terbaik PdP dan menjadi rujukan institusi.',
        wajaran: 10,
        rubric_levels: {
          level_5: 'Sangat aktif berkongsi amalan terbaik dan menjadi rujukan di institusi.',
          level_4: 'Aktif berkongsi amalan baik secara konsisten.',
          level_3: 'Pernah melaksanakan perkongsian yang relevan.',
          level_2: 'Perkongsian sangat terhad.',
          level_1: 'Tiada bukti perkongsian.',
        },
      },
    ],
  },

  // 12. PENGURUSAN PDP TERBAIK (Spesifik Mengikut Bahagian)
  {
    setId: 'set-pdp-pengurusan',
    awardId: 'award-12',
    awardName: 'Pengurusan PdP Terbaik',
    setName: 'Rubrik Pengurusan PdP Terbaik (Mengikut Bahagian)',
    items: [
      {
        name: 'Perancangan dan pelaksanaan PdP berkualiti',
        description: 'Kualiti pengurusan kurikulum, fail PdP terancang, sistematik, dan amalan terbaik kursus.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'PdP sangat sistematik, lengkap, konsisten dan menunjukkan amalan terbaik.',
          level_4: 'PdP terancang, lengkap dan konsisten.',
          level_3: 'PdP dilaksanakan dengan baik dan memenuhi keperluan.',
          level_2: 'PdP dilaksanakan tetapi terdapat beberapa kekurangan.',
          level_1: 'Pelaksanaan kurang sistematik dan bukti sangat terhad.',
        },
      },
      {
        name: 'Inovasi/kreativiti dalam PdP',
        description: 'Penerapan inovasi kaedah pengajaran dan alatan bantuan mengajar di bahagian.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Menghasilkan/menggunakan inovasi PdP yang kreatif dan memberi impak tinggi.',
          level_4: 'Menggunakan pendekatan inovatif secara konsisten dan memberi impak.',
          level_3: 'Terdapat penggunaan pendekatan kreatif dalam PdP.',
          level_2: 'Penggunaan pendekatan kreatif masih terhad.',
          level_1: 'Tiada/amat sedikit bukti inovasi PdP.',
        },
      },
      {
        name: 'Penggunaan teknologi/digital dalam PdP',
        description: 'Pengoptimuman portal e-learning (CIDOS), perisian teknikal dan teknologi PdP interaktif.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Integrasi teknologi sangat berkesan, pelbagai dan meningkatkan pembelajaran.',
          level_4: 'Teknologi digunakan secara konsisten dan berkesan.',
          level_3: 'Teknologi digunakan dengan sesuai.',
          level_2: 'Penggunaan teknologi terhad.',
          level_1: 'Tiada/amat sedikit penggunaan teknologi.',
        },
      },
      {
        name: 'Maklum balas/pencapaian pelajar',
        description: 'Keputusan penilaian kursus oleh pelajar dan pencapaian akademik kursus yang cemerlang.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Bukti menunjukkan impak sangat tinggi terhadap pembelajaran/pencapaian pelajar.',
          level_4: 'Impak jelas dan positif.',
          level_3: 'Terdapat impak yang baik.',
          level_2: 'Impak sederhana/terhad.',
          level_1: 'Tiada bukti impak yang jelas.',
        },
      },
      {
        name: 'Perkongsian amalan baik PdP',
        description: 'Sumbangan bimbingan kurikulum dan perkongsian amalan PdP di peringkat program/bahagian.',
        wajaran: 10,
        rubric_levels: {
          level_5: 'Sangat aktif berkongsi amalan terbaik dan menjadi rujukan di institusi.',
          level_4: 'Aktif berkongsi amalan baik secara konsisten.',
          level_3: 'Pernah melaksanakan perkongsian yang relevan.',
          level_2: 'Perkongsian sangat terhad.',
          level_1: 'Tiada bukti perkongsian.',
        },
      },
    ],
  },

  // 5. IKON PENYELIDIKAN
  {
    setId: 'set-penyelidikan',
    awardId: 'award-5',
    awardName: 'Ikon Penyelidikan',
    setName: 'Rubrik Ikon Penyelidikan',
    items: [
      {
        name: 'Penghasilan penyelidikan & projek inovasi',
        description: 'Kuantiti dan kualiti projek inovasi, prototaip atau penyelidikan ilmiah berimpak tinggi.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Menghasilkan pelbagai projek inovasi/penyelidikan berimpak tinggi dan berdaya saing.',
          level_4: 'Menghasilkan projek inovasi/penyelidikan berkualiti dan relevan.',
          level_3: 'Melaksanakan projek inovasi atau penyelidikan mengikut piawaian.',
          level_2: 'Penglibatan dalam inovasi/penyelidikan pada tahap minimum.',
          level_1: 'Tiada bukti hasil projek inovasi atau penyelidikan yang jelas.',
        },
      },
      {
        name: 'Penyertaan & pengiktirafan pertandingan inovasi',
        description: 'Penyertaan aktif dan kejayaan memenangi anugerah di peringkat kebangsaan/antarabangsa.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Memperoleh pingat emas/anugerah utama di peringkat kebangsaan atau antarabangsa.',
          level_4: 'Memperoleh pengiktirafan pingat perak/gangsa di peringkat kebangsaan.',
          level_3: 'Menyertai pertandingan inovasi dan menerima sijil penghargaan peringkat zon/negeri.',
          level_2: 'Menyertai pertandingan di peringkat institusi/dalaman sahaja.',
          level_1: 'Tiada penyertaan dalam pertandingan inovasi.',
        },
      },
      {
        name: 'Impak & kebolehgunaan inovasi',
        description: 'Kebolehgunaan inovasi dalam membantu komuniti, industri atau pengurusan kolej.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Inovasi digunapakai secara meluas, dikomersialkan atau dipatenkan/hak cipta.',
          level_4: 'Inovasi telah digunapakai oleh pihak industri atau komuniti sasaran.',
          level_3: 'Inovasi diaplikasikan di peringkat institusi kolej.',
          level_2: 'Potensi aplikasi terhad dan masih pada peringkat cadangan.',
          level_1: 'Tiada impak atau kebolehgunaan yang jelas.',
        },
      },
      {
        name: 'Inisiatif membudayakan penyelidikan & inovasi',
        description: 'Peranan membimbing staf/pelajar dan memupuk budaya penyelidikan di kolej.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sangat proaktif membimbing pasukan, menganjurkan bengkel dan menjadi pakar rujuk.',
          level_4: 'Aktif membimbing pasukan inovasi staf/pelajar dengan konsisten.',
          level_3: 'Terlibat dalam aktiviti pembudayaan inovasi kolej.',
          level_2: 'Penglibatan pembudayaan inovasi masih terhad.',
          level_1: 'Tiada inisiatif pembudayaan inovasi.',
        },
      },
    ],
  },

  // 6. IKON PENERBITAN
  {
    setId: 'set-penerbitan',
    awardId: 'award-6',
    awardName: 'Ikon Penerbitan',
    setName: 'Rubrik Ikon Penerbitan – Peringkat Institusi',
    items: [
      {
        name: 'Kuantiti & kualiti penerbitan ilmiah/modul',
        description: 'Penghasilan buku, modul pembelajaran, bab dalam buku, dan artikel berindeks.',
        wajaran: 35,
        rubric_levels: {
          level_5: 'Menerbitkan lebih 3 karya ilmiah/modul berdaftar ISBN/e-ISSN dengan kualiti cemerlang.',
          level_4: 'Menerbitkan 2 karya ilmiah/modul berdaftar dengan kualiti baik.',
          level_3: 'Menerbitkan 1 karya ilmiah atau modul berdaftar.',
          level_2: 'Menerbitkan artikel buletin atau modul tanpa pendaftaran rasmi.',
          level_1: 'Tiada penerbitan berdaftar dihasilkan.',
        },
      },
      {
        name: 'Peranan sebagai penulis utama / editor',
        description: 'Sumbangan sebagai penulis utama, penyelaras penerbitan atau sidang editor.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Berperanan sebagai penulis utama/ketua editor bagi penerbitan berimpak.',
          level_4: 'Berperanan sebagai penulis utama dalam sebahagian besar penerbitan.',
          level_3: 'Berperanan sebagai penulis bersama yang aktif.',
          level_2: 'Sumbangan penulisan adalah sampingan/minimum.',
          level_1: 'Tiada peranan kepengarangan yang jelas.',
        },
      },
      {
        name: 'Impak penerbitan & rujukan akademik',
        description: 'Karya dijadikan rujukan kursus, sitasi, atau bahan rujukan rasmi kementerian/institusi.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Penerbitan digunapakai sebagai rujukan rasmi di pelbagai institusi atau disitasi luas.',
          level_4: 'Penerbitan dijadikan rujukan kursus di peringkat kolej.',
          level_3: 'Penerbitan memenuhi keperluan silibus program.',
          level_2: 'Penggunaan rujukan terhad kepada kelompok kecil.',
          level_1: 'Tiada bukti impak penerbitan.',
        },
      },
      {
        name: 'Konsistensi & komitmen penulisan ilmiah',
        description: 'Amalan penulisan konsisten dan penyertaan dalam persidangan/kolokium penulisan.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Konsisten menulis setiap tahun dan membimbing staf lain menghasilkan karya.',
          level_4: 'Konsisten menghasilkan penulisan mengikut perancangan tahunan.',
          level_3: 'Menunjukkan komitmen penulisan apabila diarahkan.',
          level_2: 'Penulisan tidak konsisten dan bukti terhad.',
          level_1: 'Tiada komitmen penulisan.',
        },
      },
    ],
  },

  // 7. IKON PSH
  {
    setId: 'set-psh',
    awardId: 'award-7',
    awardName: 'Ikon PSH',
    setName: 'Rubrik Ikon Pembelajaran Sepanjang Hayat (PSH)',
    items: [
      {
        name: 'Kekerapan & kepelbagaian kursus PSH dikendalikan',
        description: 'Komitmen mengendalikan pelbagai kursus pendek berkualiti tinggi sepanjang tahun.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Mengendalikan kursus PSH melebihi sasaran dengan modul berimpak dan pelbagai bidang.',
          level_4: 'Mengendalikan kursus PSH mengikut sasaran dengan sambutan amat baik.',
          level_3: 'Mengendalikan kursus PSH mengikut jadual asas kolej.',
          level_2: 'Kekerapan pengendalian kursus PSH adalah terhad.',
          level_1: 'Penglibatan PSH sangat minimum atau tiada bukti.',
        },
      },
      {
        name: 'Jumlah penyertaan & kepuasan peserta PSH',
        description: 'Bilangan peserta komuniti yang ramai dan skor kepuasan pelanggan yang tinggi.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Penyertaan peserta melebihi 100 orang dengan tahap kepuasan pelanggan >95%.',
          level_4: 'Penyertaan tinggi dan maklum balas kepuasan pelanggan melebihi 85%.',
          level_3: 'Penyertaan memuaskan dan mencapai kuorum kursus.',
          level_2: 'Jumlah penyertaan terhad dan maklum balas sederhana.',
          level_1: 'Penyertaan rendah atau tiada maklum balas direkodkan.',
        },
      },
      {
        name: 'Impak sosio-ekonomi kepada komuniti',
        description: 'Membantu meningkatkan kemahiran, pendapatan atau taraf hidup komuniti sasaran.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Peserta kursus berjaya menjana pendapatan atau memulakan perniagaan daripada kursus.',
          level_4: 'Meningkatkan kebolehpasaran dan kemahiran praktikal peserta secara nyata.',
          level_3: 'Memberi pendedahan kemahiran baharu yang relevan kepada peserta.',
          level_2: 'Impak kemahiran kepada peserta masih terhad.',
          level_1: 'Tiada bukti impak kepada komuniti.',
        },
      },
      {
        name: 'Inisiatif promosi & pembangunan modul baharu PSH',
        description: 'Kreativiti mempromosi kursus dan mereka bentuk modul latihan mengikut keperluan semasa.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Membangunkan modul PSH baharu berpotensi tinggi dan proaktif dalam pemasaran digital.',
          level_4: 'Membangunkan modul yang menarik dan menyumbang promosi aktif.',
          level_3: 'Menggunakan modul sedia ada dengan pengubahsuaian sesuai.',
          level_2: 'Usaha promosi dan pembangunan modul adalah terhad.',
          level_1: 'Tiada inisiatif promosi atau pembangunan modul.',
        },
      },
    ],
  },

  // 8. IKON KOLABORASI
  {
    setId: 'set-kolaborasi',
    awardId: 'award-8',
    awardName: 'Ikon Kolaborasi',
    setName: 'Rubrik Ikon Kolaborasi Strategik',
    items: [
      {
        name: 'Inisiatif jalinan kerjasama industri & agensi luar',
        description: 'Keupayaan merintis hubungan strategik dan memeterai persefahaman (MoU/MoA/NoU).',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Berjaya merintis dan memeterai kerjasama strategik berimpak tinggi dengan agensi terkemuka.',
          level_4: 'Berjaya menjalin kerjasama rasmi dengan beberapa rakan industri/agensi.',
          level_3: 'Mengadakan rundingan kerjasama yang membuahkan hasil program.',
          level_2: 'Jalinan kerjasama pada peringkat awal atau terhad.',
          level_1: 'Tiada inisiatif jalinan kerjasama yang jelas.',
        },
      },
      {
        name: 'Pelaksanaan aktiviti & program bersama',
        description: 'Kelancaran pelaksanaan program bersama rakan kolaborasi seperti latihan, CSR dan tajaan.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Melaksanakan pelbagai program bersama berimpak besar dengan sumbangan/tajaan signifikan.',
          level_4: 'Melaksanakan program kolaborasi dengan jayanya dan mencapai objektif bersama.',
          level_3: 'Menjayakan program asas bersama rakan kolaborasi.',
          level_2: 'Aktiviti bersama dilaksanakan secara terhad.',
          level_1: 'Tiada aktiviti bersama yang berjaya dilaksanakan.',
        },
      },
      {
        name: 'Impak kepada kebolehpasaran & latihan pelajar',
        description: 'Sumbangan kolaborasi terhadap penempatan Latihan Industri (WBL/OJT) dan peluang pekerjaan.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Membuka peluang latihan industri dan tawaran kerja terus (hiring) kepada ramai graduan.',
          level_4: 'Memberi penempatan latihan industri yang berkualiti kepada pelajar.',
          level_3: 'Membantu lawatan industri atau perkongsian pakar industri kepada pelajar.',
          level_2: 'Impak kepada pelajar masih minimum.',
          level_1: 'Tiada impak langsung kepada pelajar.',
        },
      },
      {
        name: 'Kelestarian hubungan strategik rakan kolaborasi',
        description: 'Konsistensi mengekalkan hubungan jangka panjang dan komitmen berterusan rakan industri.',
        wajaran: 15,
        rubric_levels: {
          level_5: 'Hubungan kolaborasi berterusan lebih dari 2 tahun dengan komitmen tinggi kedua-dua pihak.',
          level_4: 'Hubungan kolaborasi aktif dan sentiasa dikemas kini.',
          level_3: 'Hubungan kolaborasi berjalan lancar sepanjang tempoh perjanjian.',
          level_2: 'Hubungan terputus selepas program pertama selesai.',
          level_1: 'Tiada kelestarian hubungan kerjasama.',
        },
      },
    ],
  },

  // 9. PENSYARAH HARAPAN
  {
    setId: 'set-pensyarah-harapan',
    awardId: 'award-9',
    awardName: 'Pensyarah Harapan',
    setName: 'Rubrik Pensyarah Harapan – Peringkat Institusi',
    items: [
      {
        name: 'Prestasi pengajaran & pembelajaran (PdP)',
        description: 'Kualiti penyampaian PdP, komitmen pengajaran tinggi dan maklum balas positif pelajar.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Pengajaran sangat inovatif, komitmen luar biasa dan maklum balas pelajar amat cemerlang.',
          level_4: 'Pengajaran kreatif, pengurusan kelas berkesan dan maklum balas pelajar sangat baik.',
          level_3: 'Melaksanakan PdP dengan baik dan memenuhi keperluan kurikulum.',
          level_2: 'PdP memenuhi standard minimum tetapi masih terdapat ruang penambahbaikan.',
          level_1: 'Prestasi PdP kurang memuaskan dan bukti terhad.',
        },
      },
      {
        name: 'Penglibatan aktif dalam aktiviti jabatan & institusi',
        description: 'Keterlibatan dalam pelbagai jawatankuaka, majlis kolej dan program institusi.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Sangat proaktif, memegang peranan penting dalam pelbagai jawatankuasa utama kolej.',
          level_4: 'Aktif menyumbang tenaga dalam tugas rasmi dan aktiviti jabatan/institusi.',
          level_3: 'Menjalankan tugas jawatankuasa yang diamanahkan dengan baik.',
          level_2: 'Penglibatan aktiviti jabatan pada tahap sederhana.',
          level_1: 'Penglibatan sangat minimum dalam aktiviti kolej.',
        },
      },
      {
        name: 'Potensi kepimpinan & inisiatif pembangunan diri',
        description: 'Semangat belajar tinggi, menyertai kursus profesional dan menunjukkan bakat kepimpinan.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Menunjukkan daya kepimpinan cemerlang, proaktif mengambil cabaran dan cepat belajar.',
          level_4: 'Mempunyai inisiatif peningkatan profesionalisme kendiri yang sangat baik.',
          level_3: 'Menyertai latihan peningkatan kerjaya yang ditetapkan institusi.',
          level_2: 'Inisiatif peningkatan diri adalah sederhana.',
          level_1: 'Kurang berminat meningkatkan kemahiran profesional.',
        },
      },
      {
        name: 'Sahsiah, disiplin & hubungan profesional',
        description: 'Integriti, ketepatan masa, kerjasama berpasukan dan etika keguruan terpuji.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sahsiah sangat terpuji, berintegriti tinggi dan menjadi teladan kepada rakan sekerja.',
          level_4: 'Berdisiplin tinggi, mudah bekerjasama dan beretika profesional.',
          level_3: 'Mematuhi peraturan perkhidmatan dan bergaul baik dengan rakan sekerja.',
          level_2: 'Disiplin dan hubungan profesional pada tahap memuaskan.',
          level_1: 'Terdapat teguran disiplin atau sahsiah yang kurang memuaskan.',
        },
      },
    ],
  },

  // 10. PENSYARAH CEMERLANG
  {
    setId: 'set-pensyarah-cemerlang',
    awardId: 'award-10',
    awardName: 'Pensyarah Cemerlang',
    setName: 'Rubrik Pensyarah Cemerlang – Peringkat Institusi',
    items: [
      {
        name: 'Kecemerlangan pengajaran & pembelajaran (PdP)',
        description: 'Kepakaran pedagogi tinggi, inovasi pengajaran konsisten dan keberhasilan pelajar unggul.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Menjadi pakar rujuk PdP, integrasi teknologi unggul dan pencapaian pelajar sangat cemerlang.',
          level_4: 'Pengajaran bertaraf amalan terbaik dengan bukti keberhasilan pelajar yang kukuh.',
          level_3: 'PdP konsisten berkualiti tinggi dan memenuhi standard kualiti kolej.',
          level_2: 'Prestasi pengajaran pada tahap baik.',
          level_1: 'Prestasi pengajaran sekadar memenuhi syarat minimum.',
        },
      },
      {
        name: 'Pencapaian penyelidikan, inovasi & penerbitan',
        description: 'Penghasilan karya ilmiah, inovasi memenangi anugerah dan sumbangan kepakaran.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Mempunyai portfolio lengkap inovasi menang anugerah, penulisan berindeks dan modul rasmi.',
          level_4: 'Mempunyai pencapaian yang kukuh dalam inovasi dan penerbitan berdaftar.',
          level_3: 'Terlibat dalam penerbitan modul atau projek inovasi kolej.',
          level_2: 'Sumbangan penyelidikan dan penerbitan adalah terhad.',
          level_1: 'Tiada sumbangan penyelidikan atau penerbitan.',
        },
      },
      {
        name: 'Sumbangan kepimpinan & perkhidmatan institusi/komuniti',
        description: 'Peranan strategik dalam pentadbiran akademik, panel penasihat atau khidmat masyarakat.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Menerajui jawatankuasa strategik kolej, memberi impak tinggi kepada dasar dan komuniti.',
          level_4: 'Memegang tanggungjawab kepimpinan penting dengan rekod kejayaan jelas.',
          level_3: 'Menjalankan tugas khas pentadbiran dengan komitmen baik.',
          level_2: 'Sumbangan kepimpinan pada tahap sederhana.',
          level_1: 'Tiada sumbangan kepimpinan yang signifikan.',
        },
      },
      {
        name: 'Teladan profesional, sahsiah & integriti',
        description: 'Integriti profesional tanpa kompromi, dedikasi tinggi dan inspirasi kepada warga kolej.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Menjadi ikon teladan seluruh institusi, integriti unggul dan berdedikasi tinggi.',
          level_4: 'Sangat dihormati, sahsiah profesional mantap dan sentiasa memberi sokongan padu.',
          level_3: 'Sahsiah baik, berintegriti dan komited kepada tugas.',
          level_2: 'Etika kerja memuaskan.',
          level_1: 'Kurang menunjukkan ciri-ciri teladan kepimpinan.',
        },
      },
    ],
  },

  // 11. PENASIHAT AKADEMIK TERBAIK
  {
    setId: 'set-penasihat-akademik',
    awardId: 'award-11',
    awardName: 'Penasihat Akademik Terbaik',
    setName: 'Rubrik Penasihat Akademik Terbaik – Peringkat Institusi',
    items: [
      {
        name: 'Pengurusan rekod & pemantauan prestasi pelajar',
        description: 'Pengurusan fail PA sistematik, rekod kehadiran dan pemantauan CGPA pelajar yang rapi.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Fail PA dan rekod pemantauan pelajar sangat lengkap, sistematik dan sentiasa dikemas kini.',
          level_4: 'Rekod prestasi pelajar lengkap dan pemantauan dijalankan secara konsisten.',
          level_3: 'Fail PA diurus dengan baik mengikut garis panduan asas.',
          level_2: 'Pengurusan rekod terdapat beberapa kekurangan dan lewat dikemas kini.',
          level_1: 'Rekod pemantauan tidak lengkap atau tiada fail yang kemas.',
        },
      },
      {
        name: 'Sesi bimbingan, nasihat & kaunseling akademik',
        description: 'Kekerapan sesi pertemuan rasmi/tidak rasmi dan kualiti bimbingan holistik kepada mente.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Melaksanakan sesi bimbingan berkala melebihi ketetapan dengan pendekatan empati berkesan.',
          level_4: 'Sesi bimbingan dilaksanakan mengikut jadual dengan dokumentasi yang jelas.',
          level_3: 'Melaksanakan sesi pertemuan PA seperti yang diarahkan.',
          level_2: 'Kekerapan sesi pertemuan adalah terhad.',
          level_1: 'Sesi pertemuan jarang diadakan.',
        },
      },
      {
        name: 'Tindakan susulan & penyelesaian masalah pelajar',
        description: 'Kepekaan terhadap isu pelajar lemah/berisiko dan intervensi pantas bersama pihak berkaitan.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Pantas mengesan isu pelajar berisiko dan berjaya menyelamatkan status pengajian pelajar.',
          level_4: 'Mengambil tindakan susulan yang berkesan terhadap masalah akademik dan disiplin.',
          level_3: 'Memanjangkan isu pelajar kepada pihak pengurusan/kaunselor.',
          level_2: 'Tindakan susulan lambat diambil.',
          level_1: 'Tiada tindakan susulan terhadap masalah pelajar.',
        },
      },
      {
        name: 'Hubungan interpersonal & kebolehcapaian penasihat',
        description: 'Sikap mesra, mudah dihubungi dan menjadi tempat rujukan dipercayai oleh pelajar.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sangat prihatin, mudah diakses melalui pelbagai saluran dan disayangi para mente.',
          level_4: 'Hubungan rapat dan sentiasa bersedia mendengar permasalahan pelajar.',
          level_3: 'Mempunyai hubungan profesional yang baik dengan pelajar.',
          level_2: 'Sukar dihubungi pada waktu-waktu tertentu.',
          level_1: 'Hubungan renggang dengan pelajar di bawah jagaan.',
        },
      },
    ],
  },

  // 13. KEHADIRAN TERBAIK
  {
    setId: 'set-kehadiran',
    awardId: 'award-13',
    awardName: 'Kehadiran Terbaik',
    setName: 'Rubrik Kehadiran Terbaik – Peringkat Institusi',
    items: [
      {
        name: 'Rekod ketepatan masa & kehadiran penuh bertugas',
        description: 'Peratusan kehadiran kerja 100% tanpa sebarang rekod kelewatan (punch-card / biometrik).',
        wajaran: 40,
        rubric_levels: {
          level_5: 'Kehadiran 100% sempurna tanpa sebarang rekod lewat (merah) atau pulang awal tanpa kebenaran.',
          level_4: 'Kehadiran 98% - 99% dengan rekod ketepatan masa yang sangat cemerlang.',
          level_3: 'Kehadiran 95% - 97% dengan justifikasi kelewatan yang diterima.',
          level_2: 'Kehadiran 90% - 94% dengan beberapa catatan rekod kelewatan.',
          level_1: 'Kehadiran di bawah 90% atau kerap lewat.',
        },
      },
      {
        name: 'Penggunaan cuti rehat & kecemasan minimum/terkawal',
        description: 'Disiplin pengambilan cuti rehat terancang tanpa menjejaskan operasi kolej.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Penggunaan cuti kecemasan sifar (0) dan cuti rehat dirancang dengan amat teliti.',
          level_4: 'Penggunaan cuti kecemasan minimum (<2 hari) dan sentiasa mengutamakan urusan tugas.',
          level_3: 'Pengambilan cuti teratur dan mematuhi tatacara permohonan kolej.',
          level_2: 'Pengambilan cuti kecemasan beberapa kali sepanjang tahun.',
          level_1: 'Kekerapan mengambil cuti kecemasan tanpa sebab kukuh.',
        },
      },
      {
        name: 'Kesiapsiagaan & komitmen bertugas',
        description: 'Kesediaan hadir bertugas di luar waktu pejabat atau pada hujung minggu apabila diperlukan.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sentiasa bersedia dan hadir membantu operasi kolej tanpa mengira waktu dan tugas rasmi.',
          level_4: 'Memberi komitmen tinggi untuk hadir bertugas semasa aktiviti khas kolej.',
          level_3: 'Hadir bertugas apabila diarahkan oleh pihak pengurusan.',
          level_2: 'Jarang hadir membantu aktiviti di luar waktu bertugas biasa.',
          level_1: 'Enggan bertugas di luar waktu pejabat.',
        },
      },
      {
        name: 'Pematuhan peraturan & etika kehadiran organisasi',
        description: 'Pematuhan borang pergerakan keluar, perakam waktu dan etika kerja berdisiplin.',
        wajaran: 10,
        rubric_levels: {
          level_5: 'Mematuhi 100% SOP pergerakan tugas rasmi dengan dokumentasi lengkap dan telus.',
          level_4: 'Mematuhi tatacara perakam waktu dan pergerakan tugas dengan baik.',
          level_3: 'Mematuhi peraturan asas kehadiran institusi.',
          level_2: 'Pernah ditegur mengenai pematuhan rekod pergerakan.',
          level_1: 'Kerap mengabaikan rekod keluar masuk bertugas.',
        },
      },
    ],
  },

  // 14. STAF SOKONGAN TERBAIK
  {
    setId: 'set-staf-sokongan',
    awardId: 'award-14',
    awardName: 'Staf Sokongan Terbaik',
    setName: 'Rubrik Staf Sokongan Terbaik – Peringkat Institusi',
    items: [
      {
        name: 'Kualiti & kecekapan hasil kerja sokongan/pentadbiran',
        description: 'Hasil kerja berkualiti tinggi, cekap, pantas, teliti dan menepati tempoh masa (SLA).',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Hasil kerja sangat berkualiti, tiada kesilapan, cekap dan sentiasa mendahului jangkaan.',
          level_4: 'Hasil kerja kemas, teliti dan disiapkan mengikut tempoh masa yang ditetapkan.',
          level_3: 'Menyelesaikan tugasan harian dengan baik mengikut arahan kerja.',
          level_2: 'Terdapat beberapa kelemahan atau kesilapan dalam hasil kerja yang perlu diperbaiki.',
          level_1: 'Kualiti kerja kurang memuaskan dan kerap memerlukan pembetulan.',
        },
      },
      {
        name: 'Inisiatif, sikap proaktif & tanggungjawab',
        description: 'Kerelaan memikul tanggungjawab tambahan, menyelesaikan masalah dan berdikari.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Sangat proaktif, mencari penyelesaian tanpa menunggu arahan dan berdedikasi tinggi.',
          level_4: 'Menunjukkan inisiatif yang baik dalam menambah baik tugasan harian.',
          level_3: 'Menjalankan tugas yang diarahkan dengan penuh tanggungjawab.',
          level_2: 'Hanya bertindak apabila diarahkan semata-mata.',
          level_1: 'Kurang inisiatif dan mengabaikan tanggungjawab tugas.',
        },
      },
      {
        name: 'Kerjasama berpasukan & layanan pelanggan',
        description: 'Semangat kerja berpasukan harmoni, budi pekerti mulia dan layanan mesra pelanggan.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Menjadi penggerak semangat berpasukan, disukai rakan sekerja dan layanan pelanggan cemerlang.',
          level_4: 'Mudah bekerjasama, sentiasa sedia membantu dan layanan mesra kepada pelanggan.',
          level_3: 'Boleh bekerjasama dalam pasukan dan beradab sopan.',
          level_2: 'Kurang berinteraksi dalam pasukan atau layanan pelanggan sederhana.',
          level_1: 'Sukar bekerjasama atau menerima aduan layanan pelanggan.',
        },
      },
      {
        name: 'Disiplin, integriti & sahsiah peribadi',
        description: 'Amanah memegang rahsia jabatan, ketepatan masa dan pematuhan pekeliling perkhidmatan.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Integriti dan amanah tertinggi, menjadi model disiplin dan sahsiah terpuji unit.',
          level_4: 'Berdisiplin tinggi, memegang amanah dengan cemerlang dan berakhlak mulia.',
          level_3: 'Mematuhi peraturan perkhidmatan dan berdisiplin baik.',
          level_2: 'Tahap disiplin memuaskan.',
          level_1: 'Pernah menerima peringatan tatatertib atau isu integriti.',
        },
      },
    ],
  },

  // 15. IKON PENGURUSAN
  {
    setId: 'set-pengurusan',
    awardId: 'award-15',
    awardName: 'Ikon Pengurusan',
    setName: 'Rubrik Ikon Pengurusan – Peringkat Institusi',
    items: [
      {
        name: 'Keberkesanan tadbir urus & pengurusan unit/jabatan',
        description: 'Kecekapan perancangan strategik, pengurusan sumber dan pencapaian KPI unit/jabatan.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Pengurusan unit cemerlang, KPI 100% tercapai dan tadbir urus bertaraf amalan terbaik.',
          level_4: 'Tadbir urus unit teratur, sistematik dan mencapai sasaran kerja utama.',
          level_3: 'Menguruskan unit dengan baik dan mematuhi SOP pentadbiran kolej.',
          level_2: 'Pengurusan unit pada tahap sederhana dan KPI lewat diselesaikan.',
          level_1: 'Tadbir urus kurang teratur dan sasaran KPI tidak tercapai.',
        },
      },
      {
        name: 'Kepimpinan berwawasan & hubungan harmoni pasukan',
        description: 'Keupayaan memimpin subordinat, memotivasi pasukan dan mengekalkan persekitaran harmoni.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Kepimpinan sangat berkarisma, menyuntik inspirasi dan pasukan berprestasi tinggi.',
          level_4: 'Kepimpinan dihormati, komunikasi telus dan menjaga kebajikan anggota pasukan.',
          level_3: 'Mampu mengetuai pasukan dengan baik dan menyelesaikan tugasan bersama.',
          level_2: 'Hubungan kepimpinan terdapat jurang komunikasi dalam pasukan.',
          level_1: 'Gagal mengurus pasukan dengan baik sehingga timbul konflik.',
        },
      },
      {
        name: 'Pelaksanaan inisiatif penambahbaikan kualiti organisasi',
        description: 'Mencetuskan inovasi tadbir urus, penjimatan kos atau automasi proses kerja kolej.',
        wajaran: 25,
        rubric_levels: {
          level_5: 'Mencetuskan pembaharuan dan automasi kerja yang memberi impak penjimatan/kecekapan besar.',
          level_4: 'Berjaya melaksanakan inisiatif penambahbaikan kualiti yang ketara di unit.',
          level_3: 'Menyokong dan melaksanakan program kualiti kolej.',
          level_2: 'Inisiatif penambahbaikan kualiti masih pada tahap terhad.',
          level_1: 'Tiada inisiatif penambahbaikan kualiti diperkenalkan.',
        },
      },
      {
        name: 'Penyelesaian masalah & ketetapan keputusan pengurusan',
        description: 'Ketangkasan membuat keputusan tepat, pengurusan krisis dan kebijaksanaan berdiplomasi.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sangat tangkas menangani isu kritikal, keputusan matang dan diplomasi peringkat tinggi.',
          level_4: 'Cekap menyelesaikan masalah pentadbiran dengan pertimbangan adil dan tepat.',
          level_3: 'Mampu menangani masalah operasi harian dengan baik.',
          level_2: 'Mengambil masa lama dalam membuat ketetapan keputusan.',
          level_1: 'Keputusan kurang berkesan dan kerap menimbulkan isu susulan.',
        },
      },
    ],
  },

  // 16. IKON INOVASI
  {
    setId: 'set-ikon-inovasi',
    awardId: 'award-16',
    awardName: 'Ikon Inovasi',
    setName: 'Rubrik Ikon Inovasi – Peringkat Institusi',
    items: [
      {
        name: 'Penghasilan & Kreativiti Projek Inovasi',
        description: 'Penghasilan produk/sistem/modul inovasi yang asli, kreatif dan berdaya saing.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Inovasi sangat asli, kreatif, berkualiti tinggi dan berimpak tinggi.',
          level_4: 'Inovasi kreatif dengan bukti pelaksanaan yang kukuh.',
          level_3: 'Penghasilan inovasi yang baik dan berfungsi.',
          level_2: 'Inovasi pada tahap sederhana.',
          level_1: 'Inovasi kurang kreatif dan bukti terhad.',
        },
      },
      {
        name: 'Pencapaian & Pengiktirafan Pertandingan Inovasi',
        description: 'Kejayaan memenangi anugerah/pingat dalam pertandingan inovasi peringkat Zon/Kebangsaan/Antarabangsa.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Memenangi Pingat Emas / Anugerah Utama peringkat Kebangsaan atau Antarabangsa.',
          level_4: 'Memenangi Pingat Perak/Gangsa peringkat Kebangsaan atau Emas peringkat Negeri.',
          level_3: 'Menyertai pertandingan inovasi peringkat Zon/Negeri dengan sijil penghargaan.',
          level_2: 'Penyertaan pertandingan peringkat institusi.',
          level_1: 'Tiada penyertaan pertandingan inovasi.',
        },
      },
      {
        name: 'Kebolehgunaan & Impak kepada Institusi/Komuniti',
        description: 'Tahap aplikasi inovasi secara praktikal bagi menyelesaikan masalah institusi atau komuniti.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Diguna pakai secara meluas di institusi/komuniti/industri atau dikomersialkan.',
          level_4: 'Diguna pakai dengan berkesan di peringkat institusi.',
          level_3: 'Mempunyai potensi aplikasi yang baik.',
          level_2: 'Aplikasi terhad kepada kelompok kecil.',
          level_1: 'Tiada bukti kebolehgunaan.',
        },
      },
      {
        name: 'Pembudayaan & Pembimbingan Inovasi',
        description: 'Sumbangan membimbing staf/pelajar dan menggerakkan budaya inovasi.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sangat proaktif membimbing pasukan inovasi staf/pelajar dan menjadi pakar rujuk.',
          level_4: 'Aktif membimbing pasukan inovasi dengan konsisten.',
          level_3: 'Terlibat dalam aktiviti pembudayaan inovasi.',
          level_2: 'Penglibatan pembudayaan inovasi terhad.',
          level_1: 'Tiada penglibatan dalam pembudayaan inovasi.',
        },
      },
    ],
  },

  // 17. ANUGERAH KETUA PROGRAM TERBAIK
  {
    setId: 'set-kp-terbaik',
    awardId: 'award-17',
    awardName: 'Anugerah Ketua Program Terbaik',
    setName: 'Rubrik Anugerah Ketua Program Terbaik – Peringkat Institusi',
    items: [
      {
        name: 'Kepimpinan & Pengurusan Kurikulum Program',
        description: 'Kecekapan memimpin program akademik, pengurusan Fail Program, akreditasi dan kualiti PdP.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Kepimpinan cemerlang, pengurusan akreditasi/MQA/JPPKK sempurna dan PdP program diiktiraf.',
          level_4: 'Pengurusan program akademik sangat teratur dan mematuhi standard kualiti.',
          level_3: 'Mengurus program akademik dengan baik mengikut garis panduan.',
          level_2: 'Pengurusan program pada tahap memuaskan tetapi ada kekurangan.',
          level_1: 'Pengurusan program kurang memuaskan dan lewat tindakan.',
        },
      },
      {
        name: 'Pencapaian KPI Program & Kebolehpasaran Graduan',
        description: 'Pencapaian peratusan pendaftaran pelajar, kadar kebolehpasaran graduan (GE) dan WBL.',
        wajaran: 30,
        rubric_levels: {
          level_5: 'Melebihi sasaran pendaftaran pelajar dan peratus kebolehpasaran graduan >90%.',
          level_4: 'Mencapai sasaran KPI pendaftaran dan kebolehpasaran graduan yang tinggi.',
          level_3: 'Mencapai sasaran asas KPI program.',
          level_2: 'Pencapaian KPI program pada tahap sederhana.',
          level_1: 'Pencapaian KPI program di bawah sasaran.',
        },
      },
      {
        name: 'Jalinan Kolaborasi Industri & Program Impak Tinggi',
        description: 'Inisiatif merintis hubungan industri, penempatan Latihan Industri dan penganjuran aktiviti program.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Berjaya memeterai MoU/NoU bersama industri utama dan menganjurkan pelbagai program impak tinggi.',
          level_4: 'Mempunyai hubungan industri yang kukuh dan jalinan latihan industri berkualiti.',
          level_3: 'Melaksanakan program kerjasama industri asas.',
          level_2: 'Jalinan industri terhad.',
          level_1: 'Tiada inisiatif jalinan industri.',
        },
      },
      {
        name: 'Sahsiah, Kepimpinan Berpasukan & Integriti Pentadbiran',
        description: 'Keupayaan memotivasikan pensyarah program, penyelesaian masalah dan integriti kepimpinan.',
        wajaran: 20,
        rubric_levels: {
          level_5: 'Sangat dihormati, keupayaan memotivasikan pasukan cemerlang dan integriti tinggi.',
          level_4: 'Mempunyai kebolehan memimpin pasukan pensyarah dengan harmoini dan berkesan.',
          level_3: 'Menjalankan tugas kepimpinan berpasukan dengan baik.',
          level_2: 'Kepimpinan berpasukan pada tahap sederhana.',
          level_1: 'Kurang menonjolkan ciri kepimpinan berpasukan.',
        },
      },
    ],
  },
];

// Helper to get template for an award by ID or name
export function getTemplateForAward(awardId?: string, awardName?: string): TemplateSetDef | undefined {
  if (awardId) {
    const found = OFFICIAL_RUBRIC_TEMPLATES.find((t) => t.awardId === awardId);
    if (found) return found;
  }
  if (awardName) {
    const lower = awardName.toLowerCase();
    return OFFICIAL_RUBRIC_TEMPLATES.find((t) => 
      t.awardName.toLowerCase() === lower || lower.includes(t.awardName.toLowerCase())
    );
  }
  return undefined;
}

// Convert templates into initial DB structures
export function generateInitialItemSetsAndItems(): { sets: AwardItemSet[]; items: AwardItem[] } {
  const sets: AwardItemSet[] = [];
  const items: AwardItem[] = [];

  OFFICIAL_RUBRIC_TEMPLATES.forEach((tmpl) => {
    const setRecord: AwardItemSet = {
      id: tmpl.setId,
      name: tmpl.setName,
      award_id: tmpl.awardId,
      total_max_score: 100,
      is_complete: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sets.push(setRecord);

    tmpl.items.forEach((itemDef, idx) => {
      const itemRecord: AwardItem = {
        id: `${tmpl.setId}-item-${idx + 1}`,
        item_set_id: tmpl.setId,
        name: itemDef.name,
        description: itemDef.description,
        max_score: itemDef.wajaran,
        sort_order: idx + 1,
        rubric_levels: itemDef.rubric_levels,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      items.push(itemRecord);
    });
  });

  return { sets, items };
}

// Interpretation of score based on KKBDA institutional rubric standard
export function getScoreInterpretation(score: number): {
  label: string;
  badgeVariant: 'success' | 'info' | 'warning' | 'neutral' | 'danger' | 'gold';
  colorClass: string;
  min: number;
  max: number;
} {
  if (score >= 90) {
    return {
      label: 'Cemerlang',
      badgeVariant: 'gold',
      colorClass: 'bg-gold/20 text-gold-900 border-gold/40',
      min: 90,
      max: 100,
    };
  }
  if (score >= 80) {
    return {
      label: 'Sangat Baik',
      badgeVariant: 'success',
      colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      min: 80,
      max: 89.9,
    };
  }
  if (score >= 70) {
    return {
      label: 'Baik',
      badgeVariant: 'info',
      colorClass: 'bg-blue-50 text-blue-800 border-blue-300',
      min: 70,
      max: 79.9,
    };
  }
  if (score >= 60) {
    return {
      label: 'Memuaskan',
      badgeVariant: 'warning',
      colorClass: 'bg-amber-50 text-amber-800 border-amber-300',
      min: 60,
      max: 69.9,
    };
  }
  return {
    label: 'Belum Mencapai Tahap Anugerah',
    badgeVariant: 'neutral',
    colorClass: 'bg-gray-100 text-gray-600 border-gray-300',
    min: 0,
    max: 59.9,
  };
}
