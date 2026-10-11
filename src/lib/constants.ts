// ============================================================
// e-APRESIASI KKBDA — Constants
// ============================================================

import type { AwardProcessStatus, UserRole } from './types';

// App info
export const APP_NAME = 'e-APRESIASI KKBDA';
export const APP_FULL_NAME = 'Sistem Penilaian Anugerah Apresiasi Staf';
export const APP_ORG = 'Kolej Komuniti Bandar Darulaman';
export const APP_TAGLINE = 'Mengiktiraf Kecemerlangan • Menghargai Sumbangan • Membudayakan Prestasi';

// Colors
export const COLORS = {
  navy: '#0A1F44',
  gold: '#C9962D',
  black: '#111111',
  white: '#FFFFFF',
  surface: '#F5F6F8',
} as const;

// Roles
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Urusetia / Admin',
  panel: 'Panel Penilai',
  management: 'Pengurusan (TPA/TPP)',
  director: 'Pengarah',
};

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin',
  panel: '/panel',
  management: '/management',
  director: '/director',
};

// Process statuses
export const STATUS_LABELS: Record<AwardProcessStatus, string> = {
  setup: 'Setup',
  evaluation_open: 'Penilaian Dibuka',
  evaluation_in_progress: 'Penilaian Sedang Berjalan',
  evaluation_completed: 'Penilaian Panel Selesai',
  management_review: 'Semakan TPA/TPP',
  management_completed: 'Cadangan TPA/TPP Selesai',
  pending_director: 'Menunggu Keputusan Pengarah',
  director_selected: 'Calon Akhir Dipilih',
  director_approved: 'Disahkan Pengarah',
  final: 'Keputusan Akhir',
};

export const STATUS_COLORS: Record<AwardProcessStatus, string> = {
  setup: 'bg-gray-100 text-gray-700',
  evaluation_open: 'bg-blue-100 text-blue-700',
  evaluation_in_progress: 'bg-yellow-100 text-yellow-700',
  evaluation_completed: 'bg-green-100 text-green-700',
  management_review: 'bg-purple-100 text-purple-700',
  management_completed: 'bg-purple-200 text-purple-800',
  pending_director: 'bg-orange-100 text-orange-700',
  director_selected: 'bg-teal-100 text-teal-700',
  director_approved: 'bg-emerald-100 text-emerald-700',
  final: 'bg-gold-100 text-gold-800',
};

// Default categories
export const DEFAULT_CATEGORIES = [
  'Ikon Sukarelawan',
  'Ikon Kokurikulum',
  'Mentor Keusahawanan',
  'Ikon Pembelajaran & Pengajaran',
  'Ikon Penyelidikan',
  'Ikon Penerbitan',
  'Ikon PSH',
  'Ikon Kolaborasi',
  'Pensyarah Harapan',
  'Pensyarah Cemerlang',
  'Penasihat Akademik Terbaik',
  'Pengurusan PdP Terbaik',
  'Kehadiran Terbaik',
  'Staf Sokongan Terbaik',
  'Ikon Pengurusan',
  'Ikon Inovasi',
  'Anugerah Ketua Program Terbaik',
];

// Department divisions specifically for Pengurusan PdP Terbaik
export const PDP_DIVISIONS = ['SKE', 'STS', 'STM', 'SAU', 'DCV', 'AM'];

// Division options
export const DIVISIONS = [
  'SKE',
  'STS',
  'SAU',
  'STM',
  'DCV',
  'AM',
  'Administration',
  'PSH',
];

// Evaluation statuses
export const EVAL_STATUS_LABELS: Record<string, string> = {
  draft: 'Draf',
  submitted: 'Selesai',
};

export const EVAL_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-700',
  submitted: 'bg-green-100 text-green-700',
};

// Management selection statuses
export const MGMT_STATUS = {
  NOT_REVIEWED: 'Belum Disemak',
  CANDIDATE_SELECTED: 'Calon Dicadangkan',
  REVIEW_COMPLETED: 'Semakan Selesai',
};

// Pagination
export const PAGE_SIZE = 20;
