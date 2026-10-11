// ============================================================
// e-APRESIASI KKBDA — Local Storage Database Engine
// Provides full offline/local persistence when Supabase is not configured
// ============================================================

import type {
  AwardYear,
  Award,
  AwardItemSet,
  AwardItem,
  Evaluator,
  EvaluatorAssignment,
  PanelCandidate,
  Evaluation,
  EvaluationScore,
  CandidateAggregate,
  ManagementSelection,
  DirectorSelection,
  DirectorApproval,
  FinalResult,
  AuditLog,
  SystemSetting,
  AwardStatus,
  UserRole,
  UserRoleRecord,
  Profile,
} from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { generateInitialItemSetsAndItems } from './rubricTemplates';
import { supabase } from './supabase';

export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return !!url && !url.includes('placeholder') && !url.includes('your-project');
};

const STORAGE_KEYS = {
  YEARS: 'kkbda_award_years',
  AWARDS: 'kkbda_awards',
  ITEM_SETS: 'kkbda_item_sets',
  ITEMS: 'kkbda_award_items',
  EVALUATORS: 'kkbda_evaluators',
  ASSIGNMENTS: 'kkbda_assignments',
  CLOUD_ASSIGNMENTS: 'kkbda_cloud_assignments',
  CANDIDATES: 'kkbda_panel_candidates',
  EVALUATIONS: 'kkbda_evaluations',
  SCORES: 'kkbda_evaluation_scores',
  AGGREGATES: 'kkbda_candidate_aggregates',
  MGMT_SELECTIONS: 'kkbda_mgmt_selections',
  DIR_SELECTIONS: 'kkbda_dir_selections',
  DIR_APPROVALS: 'kkbda_dir_approvals',
  FINAL_RESULTS: 'kkbda_final_results',
  AUDIT_LOGS: 'kkbda_audit_logs',
  SETTINGS: 'kkbda_settings',
  AWARD_STATUS: 'kkbda_award_status',
  USER_ROLES: 'kkbda_user_roles',
  PROFILES: 'kkbda_user_profiles',
  AUTH_VAULT: 'kkbda_auth_vault',
};

export const matchesYear = (itemYearId?: string | null, targetYearId?: string | null): boolean => {
  if (!targetYearId || !itemYearId) return true;
  if (itemYearId === targetYearId) return true;
  const cleanItem = String(itemYearId).toLowerCase().trim();
  const cleanTarget = String(targetYearId).toLowerCase().trim();
  if (cleanItem === cleanTarget) return true;
  const is2026Item = cleanItem === 'year-2026' || cleanItem === 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9' || cleanItem.includes('2026');
  const is2026Target = cleanTarget === 'year-2026' || cleanTarget === 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9' || cleanTarget.includes('2026');
  if (is2026Item && is2026Target) return true;
  return false;
};

// Initial Seed Data
function getInitialYears(): AwardYear[] {
  return [
    { id: 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9', year: 2026, is_active: true, created_at: '2026-09-16T22:32:10.631554+00:00' },
    { id: 'year-2026', year: 2026, is_active: true, created_at: '2026-09-14T15:34:33.000Z' },
    { id: 'year-2025', year: 2025, is_active: false, created_at: new Date().toISOString() },
  ];
}

function getInitialAwards(): Award[] {
  return DEFAULT_CATEGORIES.map((name, index) => ({
    id: `award-${index + 1}`,
    name,
    description:
      name === 'Pengurusan PdP Terbaik'
        ? 'Anugerah kecemerlangan dan pengiktirafan sumbangan bagi Pengurusan PdP Terbaik KKBDA mengikut bahagian (SKE, STS, STM, SAU, DCV, AM).'
        : `Anugerah kecemerlangan dan pengiktirafan sumbangan bagi ${name} KKBDA.`,
    sort_order: index + 1,
    is_active: true,
    max_candidates: name === 'Pengurusan PdP Terbaik' ? 6 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function getInitialItemSets(): { sets: AwardItemSet[]; items: AwardItem[] } {
  return generateInitialItemSetsAndItems();
}

export const DEFAULT_OFFICIAL_PROFILES: Profile[] = [
  {
    id: '759f22ba-1983-4e70-8b26-9db997019321',
    username: 'admin',
    full_name: 'Ida Safinar Binti Aziz (UJK)',
    email: 'safinaraziz@gmail.com',
    role: 'admin',
    roles: ['admin'],
    phone: '012-3456789',
    position: 'Pegawai Urusetia Anugerah (UJK)',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-14T15:34:33.000Z',
  },
  {
    id: '5826ff4f-4bd1-413b-a234-e3e05516f23d',
    username: 'tpa',
    full_name: 'WAN NORHASHIMAH BINTI WAN HUSIN',
    email: 'tpa@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel', 'management'],
    phone: '012-3456789',
    position: 'TIMBALAN PENGARAH AKADEMIK',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T06:24:34.000Z',
  },
  {
    id: '502b4a07-cb46-49de-97dd-1258c985f4f2',
    username: 'tpp',
    full_name: 'TS. ILYAS BIN MOHD NAWI',
    email: 'tpp@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel', 'management'],
    phone: '012-3456789',
    position: 'TIMBALAN PENGARAH PENGURUSAN',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T13:52:54.000Z',
  },
  {
    id: '5042db91-d108-4c21-a067-19e01dd9685f',
    username: 'pengarah',
    full_name: 'SALMIYAH BINTI CHE AHMAD',
    email: 'pengarah@auth.eapresiasi.local',
    role: 'director',
    roles: ['director'],
    phone: '012-3456789',
    position: 'PENGARAH KOLEJ KOMUNITI BANDAR DARULAMAN',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T10:19:08.000Z',
  },
  {
    id: 'ec18d837-41da-499e-9c5c-4c8e1803b8b7',
    username: 'kpske',
    full_name: 'TS. SALLEH MURSHIDI BIN BASHARUDIN',
    email: 'kpske@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM SKE',
    division: 'SKE',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T13:54:12.000Z',
  },
  {
    id: '4d09594e-2675-4e39-85e2-4c79ab1826c1',
    username: 'kpsau',
    full_name: 'SYED JAMIL NASRI BIN SYED BAHAROM',
    email: 'kpsau@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM SAU',
    division: 'SAU',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T14:54:58.000Z',
  },
  {
    id: 'b70aa10e-87b9-417f-bd09-850af650556d',
    username: 'kpstm',
    full_name: 'AINUL BARIAH BINTI TALIB',
    email: 'kpstm@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM STM',
    division: 'STM',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T14:57:30.000Z',
  },
  {
    id: '5649095e-1d87-49fa-a9eb-76049abe77d9',
    username: 'kpsts',
    full_name: 'TS. ROSNAH BINTI RAHMAT',
    email: 'kpsts@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM STS',
    division: 'STS',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T14:59:31.000Z',
  },
  {
    id: '782910a5-5b9a-41fe-a39b-049cbc6993cd',
    username: 'kpdcv',
    full_name: 'HJ. MOHD FIRDAUS BIN KAMARUDDIN',
    email: 'kpdcv@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM DCV',
    division: 'DCV',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T15:01:12.000Z',
  },
  {
    id: 'fa833c6f-9987-46e9-a091-49535763bfca',
    username: 'kppam',
    full_name: 'USTAZ ROSMAIDI BIN OTHMAN',
    email: 'kppam@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA PROGRAM PENGAJIAN AM',
    division: 'AM',
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T15:02:44.000Z',
  },
  {
    id: '058f38bd-8d6f-4661-bc9d-9048d12e97a9',
    username: 'colab',
    full_name: 'NOOR AZZAH BINTI ZAKARIA',
    email: 'colab@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'PEGAWAI PERHUBUNGAN INDUSTRI & ALUMNI',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T15:05:33.000Z',
  },
  {
    id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    username: 'kupik',
    full_name: 'MUFFILI BIN MAHADI',
    email: 'kupik@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel'],
    phone: '012-3456789',
    position: 'KETUA UNIT PENYELIDIKAN, INOVASI & KOMERSIAL',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T15:11:49.000Z',
  },
  {
    id: '08c09dec-b399-434a-99eb-bc4127f76cba',
    username: 'ida',
    full_name: 'Ida Safinar Binti Aziz',
    email: 'ida@auth.eapresiasi.local',
    role: 'panel',
    roles: ['panel', 'management'],
    phone: '012-3456789',
    position: 'TPA',
    division: null,
    is_active: true,
    activation_status: 'active',
    created_at: '2026-09-16T01:42:17.000Z',
  },
];

export const DEFAULT_OFFICIAL_EVALUATORS: Evaluator[] = [
  {
    id: 'be5e668f-0e25-4202-a6bb-58885aaa8359',
    profile_id: '5826ff4f-4bd1-413b-a234-e3e05516f23d',
    name: 'WAN NORHASHIMAH BINTI WAN HUSIN',
    email: 'tpa@auth.eapresiasi.local',
    position: 'TIMBALAN PENGARAH AKADEMIK',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T06:24:34.000Z',
    updated_at: '2026-09-16T10:14:16.000Z',
  },
  {
    id: '3ad71c89-1cac-4b25-9f19-e331a64515bd',
    profile_id: '502b4a07-cb46-49de-97dd-1258c985f4f2',
    name: 'TS. ILYAS BIN MOHD NAWI',
    email: 'tpp@auth.eapresiasi.local',
    position: 'TIMBALAN PENGARAH PENGURUSAN',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T13:52:54.000Z',
    updated_at: '2026-09-16T13:52:54.000Z',
  },
  {
    id: '5f7b36fd-32ee-4fcc-8585-a31aab1ab99a',
    profile_id: 'ec18d837-41da-499e-9c5c-4c8e1803b8b7',
    name: 'TS. SALLEH MURSHIDI BIN BASHARUDIN',
    email: 'kpske@auth.eapresiasi.local',
    position: 'KETUA PROGRAM SKE',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T13:54:12.000Z',
    updated_at: '2026-09-16T14:17:41.000Z',
  },
  {
    id: '629ff686-0e75-4a55-b4bc-67571a3c538f',
    profile_id: '4d09594e-2675-4e39-85e2-4c79ab1826c1',
    name: 'SYED JAMIL NASRI BIN SYED BAHAROM',
    email: 'kpsau@auth.eapresiasi.local',
    position: 'KETUA PROGRAM SAU',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T14:54:59.000Z',
    updated_at: '2026-09-16T14:54:59.000Z',
  },
  {
    id: 'cfd4071c-4467-41b2-ac2e-7711eb8cb577',
    profile_id: 'b70aa10e-87b9-417f-bd09-850af650556d',
    name: 'AINUL BARIAH BINTI TALIB',
    email: 'kpstm@auth.eapresiasi.local',
    position: 'KETUA PROGRAM STM',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T14:57:30.000Z',
    updated_at: '2026-09-16T14:57:30.000Z',
  },
  {
    id: 'f62f0437-350d-4177-989f-fd56c75cba5c',
    profile_id: '5649095e-1d87-49fa-a9eb-76049abe77d9',
    name: 'TS. ROSNAH BINTI RAHMAT',
    email: 'kpsts@auth.eapresiasi.local',
    position: 'KETUA PROGRAM STS',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T14:59:31.000Z',
    updated_at: '2026-09-16T14:59:31.000Z',
  },
  {
    id: 'f8d3e1df-ff33-411d-bea0-147630822d42',
    profile_id: '782910a5-5b9a-41fe-a39b-049cbc6993cd',
    name: 'HJ. MOHD FIRDAUS BIN KAMARUDDIN',
    email: 'kpdcv@auth.eapresiasi.local',
    position: 'KETUA PROGRAM DCV',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T15:01:12.000Z',
    updated_at: '2026-09-16T15:01:12.000Z',
  },
  {
    id: '6ecb4429-51a8-4fff-b1fe-f33a719c67d8',
    profile_id: 'fa833c6f-9987-46e9-a091-49535763bfca',
    name: 'USTAZ ROSMAIDI BIN OTHMAN',
    email: 'kppam@auth.eapresiasi.local',
    position: 'KETUA PROGRAM PENGAJIAN AM',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T15:02:44.000Z',
    updated_at: '2026-09-16T15:02:44.000Z',
  },
  {
    id: '97a48d71-5d50-4c9c-bce8-8d99270f5e04',
    profile_id: '058f38bd-8d6f-4661-bc9d-9048d12e97a9',
    name: 'NOOR AZZAH BINTI ZAKARIA',
    email: 'colab@auth.eapresiasi.local',
    position: 'PEGAWAI PERHUBUNGAN INDUSTRI & ALUMNI',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T15:05:33.000Z',
    updated_at: '2026-09-16T15:05:33.000Z',
  },
  {
    id: '6395b5de-78db-4e3b-9199-3b3926421aa0',
    profile_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    name: 'MUFFILI BIN MAHADI',
    email: 'kupik@auth.eapresiasi.local',
    position: 'KETUA UNIT PENYELIDIKAN, INOVASI & KOMERSIAL',
    phone: '012-3456789',
    is_active: true,
    is_dummy: false,
    created_at: '2026-09-16T15:11:49.000Z',
    updated_at: '2026-09-16T15:12:04.000Z',
  },
];

function getInitialProfiles(): Profile[] {
  return DEFAULT_OFFICIAL_PROFILES;
}

function getInitialEvaluators(): Evaluator[] {
  return DEFAULT_OFFICIAL_EVALUATORS;
}

function getInitialAssignments(): EvaluatorAssignment[] {
  const activeYearId = 'year-2026';
  const now = new Date().toISOString();
  return [
    // WAN NORHASHIMAH (TPA) - award-4, award-5, award-6, award-7, award-8
    { id: 'asgn-tpa-4', evaluator_id: 'tpa', award_id: 'award-4', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpa-5', evaluator_id: 'tpa', award_id: 'award-5', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpa-6', evaluator_id: 'tpa', award_id: 'award-6', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpa-7', evaluator_id: 'tpa', award_id: 'award-7', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpa-8', evaluator_id: 'tpa', award_id: 'award-8', award_year_id: activeYearId, division: null, created_at: now },
    // TS. ILYAS (TPP) - award-1, award-2, award-3, award-13, award-14, award-15
    { id: 'asgn-tpp-1', evaluator_id: 'tpp', award_id: 'award-1', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpp-2', evaluator_id: 'tpp', award_id: 'award-2', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpp-3', evaluator_id: 'tpp', award_id: 'award-3', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpp-13', evaluator_id: 'tpp', award_id: 'award-13', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpp-14', evaluator_id: 'tpp', award_id: 'award-14', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-tpp-15', evaluator_id: 'tpp', award_id: 'award-15', award_year_id: activeYearId, division: null, created_at: now },
    // Panels for Pengurusan PdP Terbaik (award-12)
    { id: 'asgn-kpske-12', evaluator_id: 'kpske', award_id: 'award-12', award_year_id: activeYearId, division: 'SKE', created_at: now },
    { id: 'asgn-kpstm-12', evaluator_id: 'kpstm', award_id: 'award-12', award_year_id: activeYearId, division: 'STM', created_at: now },
    { id: 'asgn-kpsts-12', evaluator_id: 'kpsts', award_id: 'award-12', award_year_id: activeYearId, division: 'STS', created_at: now },
    { id: 'asgn-kpdcv-12', evaluator_id: 'kpdcv', award_id: 'award-12', award_year_id: activeYearId, division: 'DCV', created_at: now },
    { id: 'asgn-kppam-12', evaluator_id: 'kppam', award_id: 'award-12', award_year_id: activeYearId, division: 'AM', created_at: now },
    { id: 'asgn-kpsau-12', evaluator_id: 'kpsau', award_id: 'award-12', award_year_id: activeYearId, division: 'SAU', created_at: now },
    // Other panels
    { id: 'asgn-colab-8', evaluator_id: 'colab', award_id: 'award-8', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-5', evaluator_id: 'kupik', award_id: 'award-5', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-6', evaluator_id: 'kupik', award_id: 'award-6', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-16', evaluator_id: 'kupik', award_id: 'award-16', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-prof-5', evaluator_id: '553189ea-d90a-4eeb-820c-6c1603cee752', award_id: 'award-5', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-prof-6', evaluator_id: '553189ea-d90a-4eeb-820c-6c1603cee752', award_id: 'award-6', award_year_id: activeYearId, division: null, created_at: now },
    { id: 'asgn-kupik-prof-16', evaluator_id: '553189ea-d90a-4eeb-820c-6c1603cee752', award_id: 'award-16', award_year_id: activeYearId, division: null, created_at: now },
  ];
}

export const DEFAULT_OFFICIAL_CANDIDATES: PanelCandidate[] = [
  {
    id: 'cand-muffili-penyelidikan',
    award_id: 'award-5',
    award_year_id: 'year-2026',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    candidate_name: 'MUFFILI BIN MAHADI',
    staff_number: null,
    division: 'KUPIK',
    position: 'KETUA UNIT PENYELIDIKAN, INOVASI & KOMERSIAL',
    created_by: '553189ea-d90a-4eeb-820c-6c1603cee752',
    is_dummy: false,
    created_at: '2026-09-20T10:00:00.000Z',
    updated_at: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'cand-shakiroh-penerbitan',
    award_id: 'award-6',
    award_year_id: 'year-2026',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    candidate_name: 'SHAKIROH BINTI YAAKOB',
    staff_number: null,
    division: 'KUPIK',
    position: 'PENSYARAH',
    created_by: '553189ea-d90a-4eeb-820c-6c1603cee752',
    is_dummy: false,
    created_at: '2026-09-20T10:05:00.000Z',
    updated_at: '2026-09-20T10:05:00.000Z',
  },
  {
    id: 'cand-hafizah-inovasi',
    award_id: 'award-16',
    award_year_id: 'year-2026',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    candidate_name: 'HAFIZAH BINTI ABDULLAH @ ALI',
    staff_number: null,
    division: 'KUPIK',
    position: 'PENSYARAH',
    created_by: '553189ea-d90a-4eeb-820c-6c1603cee752',
    is_dummy: false,
    created_at: '2026-09-20T10:10:00.000Z',
    updated_at: '2026-09-20T10:10:00.000Z',
  },
];

export const DEFAULT_OFFICIAL_EVALUATIONS: Evaluation[] = [
  {
    id: 'eval-muffili-penyelidikan',
    panel_candidate_id: 'cand-muffili-penyelidikan',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    award_id: 'award-5',
    award_year_id: 'year-2026',
    total_score: 87,
    status: 'submitted',
    submitted_at: '2026-09-20T10:00:00.000Z',
    created_at: '2026-09-20T10:00:00.000Z',
    updated_at: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'eval-shakiroh-penerbitan',
    panel_candidate_id: 'cand-shakiroh-penerbitan',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    award_id: 'award-6',
    award_year_id: 'year-2026',
    total_score: 88,
    status: 'submitted',
    submitted_at: '2026-09-20T10:05:00.000Z',
    created_at: '2026-09-20T10:05:00.000Z',
    updated_at: '2026-09-20T10:05:00.000Z',
  },
  {
    id: 'eval-hafizah-inovasi',
    panel_candidate_id: 'cand-hafizah-inovasi',
    panel_id: '553189ea-d90a-4eeb-820c-6c1603cee752',
    award_id: 'award-16',
    award_year_id: 'year-2026',
    total_score: 88,
    status: 'submitted',
    submitted_at: '2026-09-20T10:10:00.000Z',
    created_at: '2026-09-20T10:10:00.000Z',
    updated_at: '2026-09-20T10:10:00.000Z',
  },
];

export const DEFAULT_OFFICIAL_SCORES: EvaluationScore[] = [
  { id: 'sc-muffili-1', evaluation_id: 'eval-muffili-penyelidikan', award_item_id: 'set-penyelidikan-item-1', score: 26, max_score: 30, created_at: '2026-09-20T10:00:00.000Z', updated_at: '2026-09-20T10:00:00.000Z' },
  { id: 'sc-muffili-2', evaluation_id: 'eval-muffili-penyelidikan', award_item_id: 'set-penyelidikan-item-2', score: 22, max_score: 25, created_at: '2026-09-20T10:00:00.000Z', updated_at: '2026-09-20T10:00:00.000Z' },
  { id: 'sc-muffili-3', evaluation_id: 'eval-muffili-penyelidikan', award_item_id: 'set-penyelidikan-item-3', score: 22, max_score: 25, created_at: '2026-09-20T10:00:00.000Z', updated_at: '2026-09-20T10:00:00.000Z' },
  { id: 'sc-muffili-4', evaluation_id: 'eval-muffili-penyelidikan', award_item_id: 'set-penyelidikan-item-4', score: 17, max_score: 20, created_at: '2026-09-20T10:00:00.000Z', updated_at: '2026-09-20T10:00:00.000Z' },

  { id: 'sc-shakiroh-1', evaluation_id: 'eval-shakiroh-penerbitan', award_item_id: 'set-penerbitan-item-1', score: 31, max_score: 35, created_at: '2026-09-20T10:05:00.000Z', updated_at: '2026-09-20T10:05:00.000Z' },
  { id: 'sc-shakiroh-2', evaluation_id: 'eval-shakiroh-penerbitan', award_item_id: 'set-penerbitan-item-2', score: 22, max_score: 25, created_at: '2026-09-20T10:05:00.000Z', updated_at: '2026-09-20T10:05:00.000Z' },
  { id: 'sc-shakiroh-3', evaluation_id: 'eval-shakiroh-penerbitan', award_item_id: 'set-penerbitan-item-3', score: 18, max_score: 20, created_at: '2026-09-20T10:05:00.000Z', updated_at: '2026-09-20T10:05:00.000Z' },
  { id: 'sc-shakiroh-4', evaluation_id: 'eval-shakiroh-penerbitan', award_item_id: 'set-penerbitan-item-4', score: 17, max_score: 20, created_at: '2026-09-20T10:05:00.000Z', updated_at: '2026-09-20T10:05:00.000Z' },

  { id: 'sc-hafizah-1', evaluation_id: 'eval-hafizah-inovasi', award_item_id: 'set-ikon-inovasi-item-1', score: 26, max_score: 30, created_at: '2026-09-20T10:10:00.000Z', updated_at: '2026-09-20T10:10:00.000Z' },
  { id: 'sc-hafizah-2', evaluation_id: 'eval-hafizah-inovasi', award_item_id: 'set-ikon-inovasi-item-2', score: 26, max_score: 30, created_at: '2026-09-20T10:10:00.000Z', updated_at: '2026-09-20T10:10:00.000Z' },
  { id: 'sc-hafizah-3', evaluation_id: 'eval-hafizah-inovasi', award_item_id: 'set-ikon-inovasi-item-3', score: 18, max_score: 20, created_at: '2026-09-20T10:10:00.000Z', updated_at: '2026-09-20T10:10:00.000Z' },
  { id: 'sc-hafizah-4', evaluation_id: 'eval-hafizah-inovasi', award_item_id: 'set-ikon-inovasi-item-4', score: 18, max_score: 20, created_at: '2026-09-20T10:10:00.000Z', updated_at: '2026-09-20T10:10:00.000Z' },
];

export const DEFAULT_OFFICIAL_AGGREGATES: CandidateAggregate[] = [
  {
    id: 'agg-muffili-penyelidikan',
    award_id: 'award-5',
    award_year_id: 'year-2026',
    candidate_identifier: 'cand-muffili-penyelidikan',
    candidate_name: 'MUFFILI BIN MAHADI',
    staff_number: null,
    division: 'KUPIK',
    score_count: 1,
    total_score: 87,
    average_score: 87.0,
    individual_scores: [87],
    updated_at: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'agg-shakiroh-penerbitan',
    award_id: 'award-6',
    award_year_id: 'year-2026',
    candidate_identifier: 'cand-shakiroh-penerbitan',
    candidate_name: 'SHAKIROH BINTI YAAKOB',
    staff_number: null,
    division: 'KUPIK',
    score_count: 1,
    total_score: 88,
    average_score: 88.0,
    individual_scores: [88],
    updated_at: '2026-09-20T10:05:00.000Z',
  },
  {
    id: 'agg-hafizah-inovasi',
    award_id: 'award-16',
    award_year_id: 'year-2026',
    candidate_identifier: 'cand-hafizah-inovasi',
    candidate_name: 'HAFIZAH BINTI ABDULLAH @ ALI',
    staff_number: null,
    division: 'KUPIK',
    score_count: 1,
    total_score: 88,
    average_score: 88.0,
    individual_scores: [88],
    updated_at: '2026-09-20T10:10:00.000Z',
  },
];

function getInitialCandidatesAndAggregates(): { candidates: PanelCandidate[]; aggregates: CandidateAggregate[]; mgmtSelections: ManagementSelection[] } {
  return {
    candidates: DEFAULT_OFFICIAL_CANDIDATES,
    aggregates: DEFAULT_OFFICIAL_AGGREGATES,
    mgmtSelections: [],
  };
}


// Helper to get or set storage
function getStorage<T>(key: string, initialFallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialFallback));
      return initialFallback;
    }
    return JSON.parse(raw);
  } catch {
    return initialFallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage quota exceeded:', err);
  }
}

// Initialise DB once
export function initLocalStore() {
  getStorage(STORAGE_KEYS.YEARS, getInitialYears());
  const initialAwards = getInitialAwards();
  const storedAwards = getStorage<Award[]>(STORAGE_KEYS.AWARDS, initialAwards);

  // Ensure any newly added default awards (e.g. award-16, award-17) are merged into storedAwards
  let awardsChanged = false;
  initialAwards.forEach((initAw) => {
    const exists = storedAwards.some(
      (a) => a.id === initAw.id || a.name.toLowerCase().trim() === initAw.name.toLowerCase().trim()
    );
    if (!exists) {
      storedAwards.push(initAw);
      awardsChanged = true;
    }
  });

  // Ensure award-5 name is updated from "Ikon Penyelidikan & Inovasi" to "Ikon Penyelidikan"
  storedAwards.forEach((a) => {
    if (a.id === 'award-5' && (a.name.includes('& Inovasi') || a.name === 'Ikon Penyelidikan & Inovasi')) {
      a.name = 'Ikon Penyelidikan';
      a.description = 'Anugerah kecemerlangan dan pengiktirafan sumbangan bagi Ikon Penyelidikan KKBDA.';
      awardsChanged = true;
    }
  });

  if (awardsChanged) {
    setStorage(STORAGE_KEYS.AWARDS, storedAwards);
  }

  // Consolidation: If split categories "Pengurusan PdP Terbaik - *" exist, consolidate back into single "Pengurusan PdP Terbaik"
  const hasSplitPdp = storedAwards.some((a) => a.name.startsWith('Pengurusan PdP Terbaik -'));
  if (hasSplitPdp) {
    const newAwards: Award[] = [];
    let sortOrder = 1;
    let consolidatedAdded = false;

    for (const award of storedAwards) {
      if (award.name.startsWith('Pengurusan PdP Terbaik -')) {
        if (!consolidatedAdded) {
          newAwards.push({
            id: 'award-12',
            name: 'Pengurusan PdP Terbaik',
            description:
              'Anugerah kecemerlangan dan pengiktirafan sumbangan bagi Pengurusan PdP Terbaik KKBDA mengikut bahagian (SKE, STS, STM, SAU, DCV, AM).',
            sort_order: sortOrder++,
            is_active: true,
            max_candidates: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          consolidatedAdded = true;
        }
      } else {
        newAwards.push({
          ...award,
          sort_order: sortOrder++,
        });
      }
    }
    setStorage(STORAGE_KEYS.AWARDS, newAwards);

    // Migrate any candidates and aggregates with award-pdp-* to award-12
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    let candsChanged = false;
    cands.forEach((c) => {
      if (c.award_id.startsWith('award-pdp-')) {
        c.award_id = 'award-12';
        candsChanged = true;
      }
    });
    if (candsChanged) setStorage(STORAGE_KEYS.CANDIDATES, cands);

    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    let aggsChanged = false;
    aggs.forEach((a) => {
      if (a.award_id.startsWith('award-pdp-')) {
        a.award_id = 'award-12';
        aggsChanged = true;
      }
    });
    if (aggsChanged) setStorage(STORAGE_KEYS.AGGREGATES, aggs);
  }

  const { sets: defaultSets, items: defaultItems } = getInitialItemSets();
  const existingSets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
  const existingItems = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);

  // Ensure all 15 categories have their official rubric sets and items fully populated
  const isItemsValid = Array.isArray(existingItems) && existingItems.length >= 40 && existingItems.every((i) => i.id && !i.id.includes('${'));

  if (!isItemsValid) {
    setStorage(STORAGE_KEYS.ITEM_SETS, defaultSets);
    setStorage(STORAGE_KEYS.ITEMS, defaultItems);
  } else {
    const mergedSets = [...existingSets];
    defaultSets.forEach((dSet) => {
      const idx = mergedSets.findIndex((s) => s.id === dSet.id || s.award_id === dSet.award_id);
      if (idx >= 0) {
        mergedSets[idx] = { ...dSet, ...mergedSets[idx], name: dSet.name, total_max_score: 100, is_complete: true };
      } else {
        mergedSets.push(dSet);
      }
    });
    setStorage(STORAGE_KEYS.ITEM_SETS, mergedSets);

    const mergedItems = [...existingItems];
    defaultItems.forEach((dItem) => {
      const idx = mergedItems.findIndex(
        (i) => i.id === dItem.id || (i.item_set_id === dItem.item_set_id && i.sort_order === dItem.sort_order)
      );
      if (idx >= 0) {
        mergedItems[idx] = { ...mergedItems[idx], ...dItem };
      } else {
        mergedItems.push(dItem);
      }
    });
    setStorage(STORAGE_KEYS.ITEMS, mergedItems);
  }
  // Ensure all 10 official evaluators exist and purge legacy dummy evaluators
  let existingEvaluators = getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, getInitialEvaluators());
  existingEvaluators = existingEvaluators.filter(
    (e) => e.id !== 'eval-1' && e.id !== 'eval-2' && e.id !== 'eval-3' && !e.name.toLowerCase().includes('ahmad bin hashim') && !e.name.toLowerCase().includes('siti rahmah')
  );
  DEFAULT_OFFICIAL_EVALUATORS.forEach((offEval) => {
    const idx = existingEvaluators.findIndex(
      (e) => e.id === offEval.id || (e.email && offEval.email && e.email.toLowerCase() === offEval.email.toLowerCase())
    );
    if (idx >= 0) {
      existingEvaluators[idx] = { ...offEval, ...existingEvaluators[idx], is_dummy: false };
    } else {
      existingEvaluators.push(offEval);
    }
  });
  setStorage(STORAGE_KEYS.EVALUATORS, existingEvaluators);

  // Ensure all 13 official profiles exist in localStorage
  let currentProfiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, getInitialProfiles());
  DEFAULT_OFFICIAL_PROFILES.forEach((offProf) => {
    const idx = currentProfiles.findIndex(
      (p) => p.id === offProf.id || (p.email && offProf.email && p.email.toLowerCase() === offProf.email.toLowerCase()) || (p.username && offProf.username && p.username.toLowerCase() === offProf.username.toLowerCase())
    );
    if (idx >= 0) {
      currentProfiles[idx] = { ...offProf, ...currentProfiles[idx] };
    } else {
      currentProfiles.push(offProf);
    }
  });
  setStorage(STORAGE_KEYS.PROFILES, currentProfiles);

  // Ensure user_roles has entries for official profiles
  const currentRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
  currentProfiles.forEach((prof) => {
    const pRoles = prof.roles || [prof.role];
    pRoles.forEach((r) => {
      const exists = currentRoles.some((cr) => cr.user_id === prof.id && cr.role === r);
      if (!exists) {
        currentRoles.push({
          id: `ur-${prof.id}-${r}`,
          user_id: prof.id,
          role: r,
          created_at: new Date().toISOString(),
        });
      }
    });
  });
  setStorage(STORAGE_KEYS.USER_ROLES, currentRoles);

  // Initialize and merge official assignments
  let currentAsgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
  getInitialAssignments().forEach((initAsgn) => {
    const exists = currentAsgns.some(
      (a) => a.evaluator_id === initAsgn.evaluator_id && a.award_id === initAsgn.award_id && a.award_year_id === initAsgn.award_year_id
    );
    if (!exists) {
      currentAsgns.push(initAsgn);
    }
  });
  setStorage(STORAGE_KEYS.ASSIGNMENTS, currentAsgns);

  // Purge any dummy candidates, aggregates, evaluations, and selections
  const dummyCandIds = new Set(['cand-1', 'cand-2', 'cand-3']);
  const dummyAggIds = new Set(['agg-1', 'agg-2', 'agg-3']);
  const dummyNames = new Set(['ahmad bin ali', 'siti binti rahman', 'farah binti hassan']);

  const currentCands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
  const filteredCands = currentCands.filter(
    (c) => !dummyCandIds.has(c.id) && !dummyNames.has((c.candidate_name || '').toLowerCase().trim())
  );
  setStorage(STORAGE_KEYS.CANDIDATES, filteredCands);

  const currentAggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
  const filteredAggs = currentAggs.filter(
    (a) => !dummyAggIds.has(a.id) && !dummyNames.has((a.candidate_name || '').toLowerCase().trim())
  );
  setStorage(STORAGE_KEYS.AGGREGATES, filteredAggs);

  const currentMgmt = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
  const filteredMgmt = currentMgmt.filter(
    (m) => m.id !== 'ms-1' && !dummyAggIds.has(m.candidate_aggregate_id)
  );
  setStorage(STORAGE_KEYS.MGMT_SELECTIONS, filteredMgmt);

  const currentDir = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
  const filteredDir = currentDir.filter((d) => !dummyAggIds.has(d.candidate_aggregate_id));
  setStorage(STORAGE_KEYS.DIR_SELECTIONS, filteredDir);

  const currentEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
  const filteredEvals = currentEvals.filter((e) => !dummyCandIds.has(e.panel_candidate_id));
  setStorage(STORAGE_KEYS.EVALUATIONS, filteredEvals);

  const currentFinal = getStorage<FinalResult[]>(STORAGE_KEYS.FINAL_RESULTS, []);
  const filteredFinal = currentFinal.filter(
    (f) => !dummyAggIds.has(f.candidate_aggregate_id)
  );
  setStorage(STORAGE_KEYS.FINAL_RESULTS, filteredFinal);

  // Ensure award years are synced in storage with both UUID and year-2026 active
  const currentYears = getStorage<AwardYear[]>(STORAGE_KEYS.YEARS, []);
  let yearsChanged = false;
  getInitialYears().forEach((iy) => {
    if (!currentYears.some((cy) => cy.id === iy.id)) {
      currentYears.unshift(iy);
      yearsChanged = true;
    }
  });
  if (yearsChanged) setStorage(STORAGE_KEYS.YEARS, currentYears);

  // Ensure restored official panel candidates from Muffili (KUPIK) and official panels are merged into storage
  let finalCands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
  let candsChanged = false;
  DEFAULT_OFFICIAL_CANDIDATES.forEach((offCand) => {
    const idx = finalCands.findIndex(
      (c) => c.id === offCand.id || (c.candidate_name.toLowerCase().trim() === offCand.candidate_name.toLowerCase().trim() && c.award_id === offCand.award_id)
    );
    if (idx !== -1) {
      finalCands[idx] = { ...finalCands[idx], ...offCand };
      candsChanged = true;
    } else {
      finalCands.push(offCand);
      candsChanged = true;
    }
  });
  if (candsChanged) setStorage(STORAGE_KEYS.CANDIDATES, finalCands);

  let finalEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
  let evalsChanged = false;
  DEFAULT_OFFICIAL_EVALUATIONS.forEach((offEval) => {
    const idx = finalEvals.findIndex(
      (e) => e.id === offEval.id || e.panel_candidate_id === offEval.panel_candidate_id
    );
    if (idx !== -1) {
      finalEvals[idx] = { ...finalEvals[idx], ...offEval };
      evalsChanged = true;
    } else {
      finalEvals.push(offEval);
      evalsChanged = true;
    }
  });
  if (evalsChanged) setStorage(STORAGE_KEYS.EVALUATIONS, finalEvals);

  let finalScores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
  let scoresChanged = false;
  DEFAULT_OFFICIAL_SCORES.forEach((offSc) => {
    const idx = finalScores.findIndex((s) => s.id === offSc.id);
    if (idx !== -1) {
      finalScores[idx] = { ...finalScores[idx], ...offSc };
      scoresChanged = true;
    } else {
      finalScores.push(offSc);
      scoresChanged = true;
    }
  });
  if (scoresChanged) setStorage(STORAGE_KEYS.SCORES, finalScores);

  let finalAggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
  let aggsChanged2 = false;
  DEFAULT_OFFICIAL_AGGREGATES.forEach((offAgg) => {
    const idx = finalAggs.findIndex(
      (a) => a.id === offAgg.id || (a.candidate_name.toLowerCase().trim() === offAgg.candidate_name.toLowerCase().trim() && a.award_id === offAgg.award_id)
    );
    if (idx !== -1) {
      finalAggs[idx] = { ...finalAggs[idx], ...offAgg };
      aggsChanged2 = true;
    } else {
      finalAggs.push(offAgg);
      aggsChanged2 = true;
    }
  });
  if (aggsChanged2) setStorage(STORAGE_KEYS.AGGREGATES, finalAggs);

  // Clear obsolete demoProfile that may hold legacy dummy accounts
  try {
    const rawDemo = localStorage.getItem('demoProfile');
    if (rawDemo && (rawDemo.includes('Ahmad') || rawDemo.includes('panel@kkbda.edu.my'))) {
      localStorage.removeItem('demoProfile');
    }
  } catch {}
}

// Immediately run initialize
initLocalStore();

// ============================================================
// Local Store CRUD Operations
// ============================================================

export const localDB = {
  // AWARD YEARS
  getYears: (): AwardYear[] => {
    return getStorage<AwardYear[]>(STORAGE_KEYS.YEARS, getInitialYears()).sort((a, b) => b.year - a.year);
  },
  createYear: (year: number): AwardYear => {
    const years = localDB.getYears();
    const newYear: AwardYear = {
      id: `year-${year}`,
      year,
      is_active: false,
      created_at: new Date().toISOString(),
    };
    years.unshift(newYear);
    setStorage(STORAGE_KEYS.YEARS, years);
    return newYear;
  },
  setActiveYear: (id: string): void => {
    const years = localDB.getYears().map((y) => ({
      ...y,
      is_active: y.id === id,
    }));
    setStorage(STORAGE_KEYS.YEARS, years);
  },
  deleteYear: (id: string): void => {
    const years = localDB.getYears().filter((y) => y.id !== id);
    setStorage(STORAGE_KEYS.YEARS, years);
  },

  // AWARDS (CATEGORIES)
  getAwards: (): Award[] => {
    return getStorage<Award[]>(STORAGE_KEYS.AWARDS, getInitialAwards()).sort((a, b) => a.sort_order - b.sort_order);
  },
  createAward: (input: { name: string; description?: string; max_candidates?: number }): Award => {
    const awards = localDB.getAwards();
    const maxOrder = awards.reduce((max, a) => Math.max(max, a.sort_order), 0);
    const newAward: Award = {
      id: `award-${Date.now()}`,
      name: input.name,
      description: input.description || null,
      sort_order: maxOrder + 1,
      is_active: true,
      max_candidates: input.max_candidates || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    awards.push(newAward);
    setStorage(STORAGE_KEYS.AWARDS, awards);
    localDB.saveCandidatesToCloud().catch(() => {});
    return newAward;
  },
  updateAward: (id: string, updates: Partial<Award>): Award | null => {
    const awards = localDB.getAwards();
    const idx = awards.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    awards[idx] = { ...awards[idx], ...updates, updated_at: new Date().toISOString() };
    setStorage(STORAGE_KEYS.AWARDS, awards);
    localDB.saveCandidatesToCloud().catch(() => {});
    return awards[idx];
  },
  deleteAward: (id: string): void => {
    const awards = localDB.getAwards().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.AWARDS, awards);
    localDB.saveCandidatesToCloud().catch(() => {});
  },

  // ITEM SETS
  getItemSets: (): AwardItemSet[] => {
    let sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    let items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);

    const isItemsValid = Array.isArray(items) && items.length >= 40 && items.every((i) => i.id && !i.id.includes('${'));

    if (!sets || sets.length < 10 || !isItemsValid) {
      const { sets: defaultSets, items: defaultItems } = getInitialItemSets();
      setStorage(STORAGE_KEYS.ITEM_SETS, defaultSets);
      setStorage(STORAGE_KEYS.ITEMS, defaultItems);
      sets = defaultSets;
      items = defaultItems;
    }

    return sets.map((s) => ({
      ...s,
      award_items: items.filter((i) => i.item_set_id === s.id).sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
  createItemSet: (name: string): AwardItemSet => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    const newSet: AwardItemSet = {
      id: `set-${Date.now()}`,
      name,
      award_id: null,
      total_max_score: 0,
      is_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      award_items: [],
    };
    sets.unshift(newSet);
    setStorage(STORAGE_KEYS.ITEM_SETS, sets);
    return newSet;
  },
  updateItemSet: (id: string, updates: Partial<AwardItemSet>): void => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    const idx = sets.findIndex((s) => s.id === id);
    if (idx !== -1) {
      sets[idx] = { ...sets[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.ITEM_SETS, sets);
    }
  },
  deleteItemSet: (id: string): void => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []).filter((s) => s.id !== id);
    setStorage(STORAGE_KEYS.ITEM_SETS, sets);
  },

  // AWARD ITEMS
  getItemsBySet: (setId: string): AwardItem[] => {
    return getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []).filter((i) => i.item_set_id === setId).sort((a, b) => a.sort_order - b.sort_order);
  },
  createItem: (setId: string, input: { name: string; description?: string; max_score: number }): AwardItem => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const setItems = items.filter((i) => i.item_set_id === setId);
    const maxOrder = setItems.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const newItem: AwardItem = {
      id: `item-${Date.now()}`,
      item_set_id: setId,
      name: input.name,
      description: input.description || null,
      max_score: input.max_score,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.push(newItem);
    setStorage(STORAGE_KEYS.ITEMS, items);
    return newItem;
  },
  updateItem: (id: string, updates: Partial<AwardItem>): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.ITEMS, items);
    }
  },
  deleteItem: (id: string): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []).filter((i) => i.id !== id);
    setStorage(STORAGE_KEYS.ITEMS, items);
  },
  reorderItems: (setId: string, orderedItems: { id: string; sort_order: number }[]): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const orderMap = new Map(orderedItems.map((o) => [o.id, o.sort_order]));
    const updated = items.map((i) => {
      if (i.item_set_id === setId && orderMap.has(i.id)) {
        return { ...i, sort_order: orderMap.get(i.id)! };
      }
      return i;
    });
    setStorage(STORAGE_KEYS.ITEMS, updated);
  },

  // EVALUATORS
  getEvaluators: (): Evaluator[] => {
    return getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, getInitialEvaluators());
  },
  createEvaluator: (input: { name: string; email: string; position?: string; phone?: string }): Evaluator => {
    const evals = localDB.getEvaluators();
    const newEval: Evaluator = {
      id: `eval-${Date.now()}`,
      profile_id: null,
      name: input.name,
      email: input.email,
      position: input.position || null,
      phone: input.phone || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    evals.push(newEval);
    setStorage(STORAGE_KEYS.EVALUATORS, evals);
    return newEval;
  },
  updateEvaluator: (id: string, updates: Partial<Evaluator>): void => {
    const evals = localDB.getEvaluators();
    const idx = evals.findIndex((e) => e.id === id);
    if (idx !== -1) {
      evals[idx] = { ...evals[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.EVALUATORS, evals);
    }
  },
  deleteEvaluator: (id: string): void => {
    const evals = localDB.getEvaluators().filter((e) => e.id !== id);
    setStorage(STORAGE_KEYS.EVALUATORS, evals);
  },

  // ASSIGNMENTS
  getAssignments: (awardId: string, yearId: string): (EvaluatorAssignment & { evaluator: Evaluator })[] => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    const evals = localDB.getEvaluators();
    const evalMap = new Map(evals.map((e) => [e.id, e]));

    return asgns
      .filter((a) => (!awardId || a.award_id === awardId) && (!yearId || matchesYear(a.award_year_id, yearId)))
      .map((a) => ({
        ...a,
        evaluator: evalMap.get(a.evaluator_id) || {
          id: a.evaluator_id,
          name: 'Panel Penilai',
          email: '',
          position: '',
          phone: '',
          profile_id: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      }));
  },
  // CLOUD ASSIGNMENT SYNC (Menggunakan system_settings Supabase merentasi peranti & pelayar)
  getCloudAssignments: (): Record<string, string[]> => {
    return getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
  },
  setCloudAssignments: (map: Record<string, string[]>): void => {
    setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, map);
  },
  syncAssignmentsFromCloud: async (): Promise<Record<string, string[]>> => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'panel_assignments_sync')
        .maybeSingle();

      // Muat turun panel_divisions_sync jika ada
      let divMap: Record<string, string> = {};
      try {
        const { data: divData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'panel_divisions_sync')
          .maybeSingle();
        if (divData?.value) {
          divMap = JSON.parse(divData.value);
        }
      } catch {}

      if (!error && data?.value) {
        const cloudMap = JSON.parse(data.value) as Record<string, string[]>;
        setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, cloudMap);

        // Segerakkan juga ke dalam STORAGE_KEYS.ASSIGNMENTS
        let asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
        const activeYearId = 'year-2026';

        Object.entries(cloudMap).forEach(([userKey, awardIds]) => {
          if (!userKey || !Array.isArray(awardIds)) return;
          // Buang tugasan lama bagi userKey ini
          asgns = asgns.filter((a) => !(a.evaluator_id.toLowerCase() === userKey.toLowerCase() && a.award_year_id === activeYearId));
          const division = divMap[userKey.toLowerCase()] || divMap[userKey] || null;
          // Masukkan tugasan baharu dari cloud
          awardIds.forEach((awardId) => {
            asgns.push({
              id: `asgn-cloud-${userKey}-${awardId}`,
              evaluator_id: userKey,
              award_id: awardId,
              award_year_id: activeYearId,
              division,
              created_at: new Date().toISOString(),
            });
          });
        });

        setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
        window.dispatchEvent(new Event('kkbda_assignments_changed'));
        return cloudMap;
      }
    } catch (e) {
      console.warn('Cloud assignments sync notice:', e);
    }
    return getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
  },
  saveAssignmentsToCloud: async (userKeys: string[], awardIds: string[], division?: string | null): Promise<boolean> => {
    try {
      const currentMap = localDB.getCloudAssignments();
      userKeys.forEach((key) => {
        if (key) {
          currentMap[key.toLowerCase()] = awardIds;
          currentMap[key] = awardIds;
        }
      });
      setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, currentMap);

      // Simpan ke Supabase system_settings
      const jsonVal = JSON.stringify(currentMap);
      await supabase
        .from('system_settings')
        .upsert(
          { key: 'panel_assignments_sync', value: jsonVal, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      if (division !== undefined) {
        let divMap: Record<string, string> = {};
        try {
          const { data: divData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'panel_divisions_sync')
            .maybeSingle();
          if (divData?.value) {
            divMap = JSON.parse(divData.value);
          }
        } catch {}

        userKeys.forEach((key) => {
          if (key) {
            if (division) {
              divMap[key.toLowerCase()] = division;
              divMap[key] = division;
            } else {
              delete divMap[key.toLowerCase()];
              delete divMap[key];
            }
          }
        });

        await supabase
          .from('system_settings')
          .upsert(
            { key: 'panel_divisions_sync', value: JSON.stringify(divMap), updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
      }

      // Segerakkan ke cloud melalui candidates sync payload untuk cross-device persistence
      localDB.saveCandidatesToCloud().catch(() => {});

      window.dispatchEvent(new Event('kkbda_assignments_changed'));
      return true;
    } catch (e) {
      console.warn('Save assignments to cloud notice:', e);
      return false;
    }
  },

  assignEvaluator: (awardId: string, yearId: string, evaluatorId: string, division?: string | null): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const existingIdx = asgns.findIndex((a) => a.award_id === awardId && matchesYear(a.award_year_id, yearId) && a.evaluator_id === evaluatorId);
    if (existingIdx !== -1) {
      if (division) asgns[existingIdx].division = division;
    } else {
      asgns.push({
        id: `asgn-${Date.now()}`,
        award_id: awardId,
        award_year_id: yearId,
        evaluator_id: evaluatorId,
        division: division || null,
        created_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    const currentAwards = asgns.filter((a) => a.evaluator_id === evaluatorId && matchesYear(a.award_year_id, yearId)).map((a) => a.award_id);
    localDB.saveAssignmentsToCloud([evaluatorId], currentAwards).catch(() => {});
  },
  setAssignmentDivision: (awardId: string, yearId: string, evaluatorId: string, division: string): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const idx = asgns.findIndex((a) => a.award_id === awardId && matchesYear(a.award_year_id, yearId) && a.evaluator_id === evaluatorId);
    if (idx !== -1) {
      asgns[idx].division = division;
      setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    }
  },
  unassignEvaluator: (awardId: string, yearId: string, evaluatorId: string): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []).filter(
      (a) => !(a.award_id === awardId && matchesYear(a.award_year_id, yearId) && a.evaluator_id === evaluatorId)
    );
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    const currentAwards = asgns.filter((a) => a.evaluator_id === evaluatorId && matchesYear(a.award_year_id, yearId)).map((a) => a.award_id);
    localDB.saveAssignmentsToCloud([evaluatorId], currentAwards).catch(() => {});
  },
  setEvaluatorCategories: (evaluatorId: string, awardIds: string[], yearId: string = 'year-2026'): void => {
    let asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    // Remove all assignments for this evaluator and year
    asgns = asgns.filter((a) => !(a.evaluator_id === evaluatorId && matchesYear(a.award_year_id, yearId)));
    // Add new ones
    awardIds.forEach((awardId) => {
      asgns.push({
        id: `asgn-${Date.now()}-${awardId}`,
        award_id: awardId,
        award_year_id: yearId,
        evaluator_id: evaluatorId,
        division: null,
        created_at: new Date().toISOString(),
      });
    });
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    localDB.saveAssignmentsToCloud([evaluatorId], awardIds).catch(() => {});
  },
  getAssignedAwardIds: (userId: string, userEmail?: string, yearId?: string): string[] => {
    const cloudMap = localDB.getCloudAssignments();
    const evals = localDB.getEvaluators();
    const profiles = localDB.getProfiles();

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;

    const evaluator = evals.find(
      (e) =>
        (userId && (e.profile_id === userId || e.id === userId)) ||
        (cleanEmail && e.email && e.email.toLowerCase() === cleanEmail)
    );

    const profile = profiles.find(
      (p) =>
        (userId && p.id === userId) ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) ||
        (derivedUsername && p.username && p.username.toLowerCase() === derivedUsername)
    );

    // Kumpulkan semua kemungkinan kunci pengenalan pengguna ini secara komprehensif
    const candidateKeys = new Set(
      [
        userId,
        evaluator?.id,
        evaluator?.profile_id,
        cleanEmail,
        derivedUsername,
        profile?.id,
        profile?.username,
        profile?.email?.toLowerCase(),
      ].filter(Boolean) as string[]
    );

    // Padankan semua rekod evaluators dan profiles yang berkaitan
    evals.forEach((e) => {
      const match =
        (userId && (e.profile_id === userId || e.id === userId)) ||
        (cleanEmail && e.email && e.email.toLowerCase() === cleanEmail) ||
        (profile && profile.full_name && e.name && e.name.toLowerCase().trim() === profile.full_name.toLowerCase().trim()) ||
        (evaluator && evaluator.name && e.name && e.name.toLowerCase().trim() === evaluator.name.toLowerCase().trim());
      if (match) {
        if (e.id) candidateKeys.add(e.id);
        if (e.profile_id) candidateKeys.add(e.profile_id);
        if (e.email) {
          candidateKeys.add(e.email.toLowerCase());
          candidateKeys.add(e.email.split('@')[0].toLowerCase());
        }
      }
    });

    profiles.forEach((p) => {
      const match =
        (userId && p.id === userId) ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) ||
        (derivedUsername && p.username && p.username.toLowerCase() === derivedUsername) ||
        (evaluator && evaluator.name && p.full_name && p.full_name.toLowerCase().trim() === evaluator.name.toLowerCase().trim());
      if (match) {
        if (p.id) candidateKeys.add(p.id);
        if (p.username) candidateKeys.add(p.username.toLowerCase());
        if (p.email) candidateKeys.add(p.email.toLowerCase());
      }
    });

    const resultAwardIds = new Set<string>();
    let foundInCloud = false;

    // 1. Semak padanan dalam cloudMap (Supabase system_settings sync)
    candidateKeys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (cloudMap[lowerKey] && Array.isArray(cloudMap[lowerKey])) {
        cloudMap[lowerKey].forEach((id) => resultAwardIds.add(id));
        foundInCloud = true;
      }
      if (cloudMap[key] && Array.isArray(cloudMap[key])) {
        cloudMap[key].forEach((id) => resultAwardIds.add(id));
        foundInCloud = true;
      }
    });

    if (foundInCloud) {
      return Array.from(resultAwardIds);
    }

    // 2. Semak padanan dalam kkbda_assignments (localStorage)
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    let foundInAssignments = false;
    asgns.forEach((a) => {
      if (!yearId || matchesYear(a.award_year_id, yearId)) {
        const asgnEvalLower = (a.evaluator_id || '').toLowerCase();
        for (const k of candidateKeys) {
          if (k.toLowerCase() === asgnEvalLower) {
            resultAwardIds.add(a.award_id);
            foundInAssignments = true;
            break;
          }
        }
      }
    });

    if (foundInAssignments) {
      return Array.from(resultAwardIds);
    }

    // 3. Fallback pemetaan rasmi panel KKBDA jika belum ditetapkan secara khusus
    if (resultAwardIds.size === 0) {
      const checkNames = [profile?.full_name, evaluator?.name].filter(Boolean).map((n) => n!.toLowerCase());
      if (checkNames.some((n) => n.includes('ilyas')) || candidateKeys.has('tpp') || candidateKeys.has('tpp@auth.eapresiasi.local')) {
        ['award-1', 'award-2', 'award-3', 'award-13', 'award-14', 'award-15'].forEach((id) => resultAwardIds.add(id));
      } else if (checkNames.some((n) => n.includes('norhashimah')) || candidateKeys.has('tpa') || candidateKeys.has('tpa@auth.eapresiasi.local')) {
        ['award-4', 'award-5', 'award-6', 'award-7', 'award-8'].forEach((id) => resultAwardIds.add(id));
      } else if (checkNames.some((n) => n.includes('salleh')) || candidateKeys.has('kpske') || candidateKeys.has('kpske@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('ainul')) || candidateKeys.has('kpstm') || candidateKeys.has('kpstm@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('rosnah')) || candidateKeys.has('kpsts') || candidateKeys.has('kpsts@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('firdaus')) || candidateKeys.has('kpdcv') || candidateKeys.has('kpdcv@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('rosmaidi')) || candidateKeys.has('kppam') || candidateKeys.has('kppam@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('jamil')) || candidateKeys.has('kpsau') || candidateKeys.has('kpsau@auth.eapresiasi.local')) {
        resultAwardIds.add('award-12');
      } else if (checkNames.some((n) => n.includes('azzah')) || candidateKeys.has('colab') || candidateKeys.has('colab@auth.eapresiasi.local')) {
        resultAwardIds.add('award-8');
      } else if (checkNames.some((n) => n.includes('muffili')) || candidateKeys.has('kupik') || candidateKeys.has('kupik@auth.eapresiasi.local')) {
        ['award-5', 'award-6', 'award-16'].forEach((id) => resultAwardIds.add(id));
      }
    }

    return Array.from(resultAwardIds);
  },
  getEvaluatorAssignment: (userId: string, userEmail: string | undefined, awardId: string, yearId: string): EvaluatorAssignment | null => {
    const evals = localDB.getEvaluators();
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    const evaluator = evals.find(
      (e) =>
        (userId && (e.profile_id === userId || e.id === userId)) ||
        (cleanEmail && e.email && e.email.toLowerCase() === cleanEmail)
    );
    const candidateKeys = new Set(
      [userId, evaluator?.id, evaluator?.profile_id, cleanEmail, derivedUsername].filter(Boolean) as string[]
    );
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    for (const a of asgns) {
      if (a.award_id === awardId && (!yearId || matchesYear(a.award_year_id, yearId))) {
        const asgnEvalLower = (a.evaluator_id || '').toLowerCase();
        for (const k of candidateKeys) {
          if (k.toLowerCase() === asgnEvalLower) {
            let div = a.division;
            if (!div) {
              const prof = localDB.getProfiles().find(p => candidateKeys.has(p.id) || (p.username && candidateKeys.has(p.username)));
              div = prof?.division || (prof?.position?.toUpperCase().includes('SKE') ? 'SKE' : (prof?.position?.toUpperCase().includes('STS') ? 'STS' : (prof?.position?.toUpperCase().includes('STM') ? 'STM' : (prof?.position?.toUpperCase().includes('SAU') ? 'SAU' : (prof?.position?.toUpperCase().includes('DCV') ? 'DCV' : (prof?.position?.toUpperCase().includes('AM') ? 'AM' : null))))));
            }
            return { ...a, division: div || null };
          }
        }
      }
    }

    const cloudAwards = localDB.getAssignedAwardIds(userId, userEmail, yearId);
    if (cloudAwards.includes(awardId)) {
      const prof = localDB.getProfiles().find(p => candidateKeys.has(p.id) || (p.username && candidateKeys.has(p.username)));
      const div = prof?.division || (prof?.position?.toUpperCase().includes('SKE') ? 'SKE' : (prof?.position?.toUpperCase().includes('STS') ? 'STS' : (prof?.position?.toUpperCase().includes('STM') ? 'STM' : (prof?.position?.toUpperCase().includes('SAU') ? 'SAU' : (prof?.position?.toUpperCase().includes('DCV') ? 'DCV' : (prof?.position?.toUpperCase().includes('AM') ? 'AM' : null))))));
      return {
        id: `asgn-cloud-${userId}-${awardId}`,
        evaluator_id: userId,
        award_id: awardId,
        award_year_id: yearId || 'year-2026',
        division: div || null,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  },

  // CANDIDATES & AGGREGATES
  // CANDIDATES & AGGREGATES CLOUD SYNC
  syncCandidatesFromCloud: async (): Promise<void> => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'panel_candidates_sync')
        .maybeSingle();

      if (data?.value) {
        const cloudData = JSON.parse(data.value) as {
          candidates?: PanelCandidate[];
          evaluations?: Evaluation[];
          scores?: EvaluationScore[];
          aggregates?: CandidateAggregate[];
          mgmtSelections?: ManagementSelection[];
          dirSelections?: DirectorSelection[];
          cloudAssignments?: Record<string, string[]>;
          assignments?: EvaluatorAssignment[];
          itemSets?: AwardItemSet[];
          items?: AwardItem[];
          awards?: Award[];
        };

        if (Array.isArray(cloudData.awards) && cloudData.awards.length > 0) {
          const localAwards = getStorage<Award[]>(STORAGE_KEYS.AWARDS, []);
          const awardMap = new Map(localAwards.map((a) => [a.id, a]));
          cloudData.awards.forEach((a) => awardMap.set(a.id, a));
          setStorage(STORAGE_KEYS.AWARDS, Array.from(awardMap.values()).sort((a, b) => a.sort_order - b.sort_order));
        }

        if (cloudData.cloudAssignments && typeof cloudData.cloudAssignments === 'object') {
          const currentMap = getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
          const mergedMap = { ...currentMap, ...cloudData.cloudAssignments };
          setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, mergedMap);
        }

        if (Array.isArray(cloudData.assignments) && cloudData.assignments.length > 0) {
          const localAsgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
          const asgnMap = new Map(localAsgns.map((a) => [`${a.evaluator_id}-${a.award_id}`, a]));
          cloudData.assignments.forEach((a) => asgnMap.set(`${a.evaluator_id}-${a.award_id}`, a));
          setStorage(STORAGE_KEYS.ASSIGNMENTS, Array.from(asgnMap.values()));
        }

        if (Array.isArray(cloudData.candidates) && cloudData.candidates.length > 0) {
          const localCands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
          const candMap = new Map(localCands.map((c) => [c.id, c]));
          cloudData.candidates.forEach((c) => candMap.set(c.id, c));
          setStorage(STORAGE_KEYS.CANDIDATES, Array.from(candMap.values()));
        }

        if (Array.isArray(cloudData.evaluations) && cloudData.evaluations.length > 0) {
          const localEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
          const evalMap = new Map(localEvals.map((e) => [e.id, e]));
          cloudData.evaluations.forEach((e) => evalMap.set(e.id, e));
          setStorage(STORAGE_KEYS.EVALUATIONS, Array.from(evalMap.values()));
        }

        if (Array.isArray(cloudData.scores) && cloudData.scores.length > 0) {
          const localScores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
          const scoreMap = new Map(localScores.map((s) => [s.id, s]));
          cloudData.scores.forEach((s) => scoreMap.set(s.id, s));
          setStorage(STORAGE_KEYS.SCORES, Array.from(scoreMap.values()));
        }

        if (Array.isArray(cloudData.aggregates) && cloudData.aggregates.length > 0) {
          const localAggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
          const aggMap = new Map(localAggs.map((a) => [a.id, a]));
          cloudData.aggregates.forEach((a) => aggMap.set(a.id, a));
          setStorage(STORAGE_KEYS.AGGREGATES, Array.from(aggMap.values()));
        }

        if (Array.isArray(cloudData.mgmtSelections) && cloudData.mgmtSelections.length > 0) {
          const localMgmts = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
          const mgmtMap = new Map(localMgmts.map((m) => [m.id, m]));
          cloudData.mgmtSelections.forEach((m) => mgmtMap.set(m.id, m));
          setStorage(STORAGE_KEYS.MGMT_SELECTIONS, Array.from(mgmtMap.values()));
        }

        if (Array.isArray(cloudData.dirSelections) && cloudData.dirSelections.length > 0) {
          const localDirs = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
          const dirMap = new Map(localDirs.map((d) => [d.id, d]));
          cloudData.dirSelections.forEach((d) => dirMap.set(d.id, d));
          setStorage(STORAGE_KEYS.DIR_SELECTIONS, Array.from(dirMap.values()));
        }

        if (Array.isArray(cloudData.itemSets) && cloudData.itemSets.length > 0) {
          const localSets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
          const setMap = new Map(localSets.map((s) => [s.id, s]));
          cloudData.itemSets.forEach((s) => setMap.set(s.id, s));
          setStorage(STORAGE_KEYS.ITEM_SETS, Array.from(setMap.values()));
        }

        if (Array.isArray(cloudData.items) && cloudData.items.length > 0) {
          const localItems = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
          const itemMap = new Map(localItems.map((i) => [i.id, i]));
          cloudData.items.forEach((i) => itemMap.set(i.id, i));
          setStorage(STORAGE_KEYS.ITEMS, Array.from(itemMap.values()));
        }
      }
    } catch (e) {
      console.warn('Sync candidates from cloud notice:', e);
    }
  },

  saveCandidatesToCloud: async (): Promise<void> => {
    try {
      const candidates = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
      const evaluations = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
      const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
      const aggregates = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
      const mgmtSelections = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
      const dirSelections = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
      const cloudAssignments = getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
      const assignments = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
      const itemSets = localDB.getItemSets();
      const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
      const awards = localDB.getAwards();

      const payload = JSON.stringify({
        candidates,
        evaluations,
        scores,
        aggregates,
        mgmtSelections,
        dirSelections,
        cloudAssignments,
        assignments,
        itemSets,
        items,
        awards,
      });

      await supabase
        .from('system_settings')
        .upsert(
          { key: 'panel_candidates_sync', value: payload, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
    } catch (e) {
      console.warn('Save candidates to cloud notice:', e);
    }
  },

  getCandidates: (awardId?: string, yearId?: string, panelId?: string): (PanelCandidate & { evaluations?: Evaluation[] })[] => {
    let cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    if (awardId) cands = cands.filter((c) => c.award_id === awardId);
    if (yearId) cands = cands.filter((c) => matchesYear(c.award_year_id, yearId));
    if (panelId) {
      const cleanPanelId = panelId.toLowerCase().trim();
      const evalsList = localDB.getEvaluators();
      const profsList = localDB.getProfiles();
      const matchedEval = evalsList.find(
        (e) => e.id === panelId || e.profile_id === panelId || (e.email && e.email.toLowerCase() === cleanPanelId)
      );
      const matchedProf = profsList.find(
        (p) => p.id === panelId || (p.username && p.username.toLowerCase() === cleanPanelId) || (p.email && p.email.toLowerCase() === cleanPanelId)
      );
      const validPanelIds = new Set(
        [
          panelId,
          cleanPanelId,
          matchedEval?.id,
          matchedEval?.profile_id,
          matchedProf?.id,
          matchedProf?.username,
          matchedEval?.email?.toLowerCase(),
          matchedProf?.email?.toLowerCase(),
        ].filter(Boolean) as string[]
      );

      if (
        cleanPanelId.includes('muffili') ||
        cleanPanelId === 'kupik' ||
        cleanPanelId === '553189ea-d90a-4eeb-820c-6c1603cee752' ||
        cleanPanelId === '6395b5de-78db-4e3b-9199-3b3926421aa0'
      ) {
        validPanelIds.add('553189ea-d90a-4eeb-820c-6c1603cee752');
        validPanelIds.add('6395b5de-78db-4e3b-9199-3b3926421aa0');
        validPanelIds.add('kupik');
        validPanelIds.add('kupik@auth.eapresiasi.local');
      }

      cands = cands.filter((c) => validPanelIds.has(c.panel_id) || validPanelIds.has(c.created_by));
    }

    return cands.map((c) => ({
      ...c,
      evaluations: evals.filter((e) => e.panel_candidate_id === c.id),
    }));
  },
  createCandidate: (candidate: Omit<PanelCandidate, 'id' | 'created_at' | 'updated_at'>): PanelCandidate => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const newCand: PanelCandidate = {
      ...candidate,
      id: `cand-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cands.push(newCand);
    setStorage(STORAGE_KEYS.CANDIDATES, cands);

    // Initialise draft evaluation
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    evals.push({
      id: `eval-${Date.now()}`,
      panel_candidate_id: newCand.id,
      panel_id: newCand.panel_id,
      award_id: newCand.award_id,
      award_year_id: newCand.award_year_id,
      total_score: null,
      status: 'draft',
      submitted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.EVALUATIONS, evals);

    localDB.saveCandidatesToCloud().catch(() => {});

    return newCand;
  },
  getCandidateById: (id: string): PanelCandidate | null => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    return cands.find((c) => c.id === id) || null;
  },
  getEvaluation: (candidateId: string, panelId?: string): (Evaluation & { scores: (EvaluationScore & { award_item?: AwardItem })[] }) | null => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const ev = evals.find((e) => e.panel_candidate_id === candidateId && (!panelId || e.panel_id === panelId));
    if (!ev) return null;

    const evalScores = scores
      .filter((s) => s.evaluation_id === ev.id)
      .map((s) => ({
        ...s,
        award_item: itemMap.get(s.award_item_id),
      }));

    return {
      ...ev,
      scores: evalScores,
    };
  },
  saveEvaluationScores: (
    evaluationId: string,
    itemScores: { award_item_id: string; score: number; raw_score?: number | null; max_score: number }[],
    comments?: string | null
  ): void => {
    let scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    for (const item of itemScores) {
      const idx = scores.findIndex((s) => s.evaluation_id === evaluationId && s.award_item_id === item.award_item_id);
      if (idx !== -1) {
        scores[idx].score = item.score;
        if (item.raw_score !== undefined) scores[idx].raw_score = item.raw_score;
        scores[idx].updated_at = new Date().toISOString();
      } else {
        scores.push({
          id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          evaluation_id: evaluationId,
          award_item_id: item.award_item_id,
          score: item.score,
          raw_score: item.raw_score ?? null,
          max_score: item.max_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    setStorage(STORAGE_KEYS.SCORES, scores);

    // Update total score in evaluation
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evIdx = evals.findIndex((e) => e.id === evaluationId);
    if (evIdx !== -1) {
      const total = itemScores.reduce((sum, i) => sum + (i.score || 0), 0);
      evals[evIdx].total_score = total;
      if (comments !== undefined) evals[evIdx].comments = comments;
      evals[evIdx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }
    localDB.saveCandidatesToCloud().catch(() => {});
  },
  submitEvaluation: (params: {
    evaluationId: string;
    candidateId: string;
    awardId: string;
    yearId: string;
    totalScore: number;
    candidateName: string;
    staffNumber?: string | null;
    division: string;
    comments?: string | null;
  }): void => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evIdx = evals.findIndex((e) => e.id === params.evaluationId);
    if (evIdx !== -1) {
      evals[evIdx].status = 'submitted';
      evals[evIdx].total_score = params.totalScore;
      if (params.comments !== undefined) evals[evIdx].comments = params.comments;
      evals[evIdx].submitted_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }

    // Update Candidate Aggregates
    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const identifier = params.staffNumber || `${params.candidateName.toLowerCase().trim()}|${params.division.toLowerCase().trim()}`;
    const aggIdx = aggs.findIndex((a) => a.award_id === params.awardId && matchesYear(a.award_year_id, params.yearId) && a.candidate_identifier === identifier);

    if (aggIdx !== -1) {
      const currentScores = (aggs[aggIdx].individual_scores || []) as number[];
      const newScores = [...currentScores, params.totalScore];
      const newTotal = newScores.reduce((a, b) => a + b, 0);
      aggs[aggIdx].score_count = newScores.length;
      aggs[aggIdx].total_score = newTotal;
      aggs[aggIdx].average_score = parseFloat((newTotal / newScores.length).toFixed(2));
      aggs[aggIdx].individual_scores = newScores;
      aggs[aggIdx].updated_at = new Date().toISOString();
    } else {
      aggs.push({
        id: `agg-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_identifier: identifier,
        candidate_name: params.candidateName,
        staff_number: params.staffNumber || null,
        division: params.division,
        score_count: 1,
        total_score: params.totalScore,
        average_score: parseFloat(params.totalScore.toFixed(2)),
        individual_scores: [params.totalScore],
        updated_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.AGGREGATES, aggs);
    localDB.saveCandidatesToCloud().catch(() => {});
  },

  // CANDIDATE AGGREGATES
  getAggregates: (awardId?: string, yearId?: string): (CandidateAggregate & { award?: Award })[] => {
    let aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const awards = localDB.getAwards();
    const awardMap = new Map(awards.map((a) => [a.id, a]));

    if (awardId) aggs = aggs.filter((a) => a.award_id === awardId);
    if (yearId) aggs = aggs.filter((a) => matchesYear(a.award_year_id, yearId));

    return aggs.map((a) => ({
      ...a,
      award: awardMap.get(a.award_id) || {
        id: a.award_id,
        name: 'Kategori Anugerah',
        description: null,
        sort_order: 1,
        is_active: true,
        max_candidates: 1,
        created_at: '',
        updated_at: '',
      },
    }));
  },

  // MANAGEMENT SELECTIONS
  getManagementSelections: (awardId?: string, yearId?: string): ManagementSelection[] => {
    let sels = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
    if (awardId) sels = sels.filter((s) => s.award_id === awardId);
    if (yearId) sels = sels.filter((s) => matchesYear(s.award_year_id, yearId));
    return sels;
  },
  toggleManagementSelection: (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean; userId: string }): void => {
    const sels = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
    const idx = sels.findIndex((s) => s.candidate_aggregate_id === params.candidateAggregateId && s.award_id === params.awardId && matchesYear(s.award_year_id, params.yearId));
    if (idx !== -1) {
      sels[idx].selected = params.selected;
      sels[idx].selected_by = params.userId;
      sels[idx].selected_at = new Date().toISOString();
    } else {
      sels.push({
        id: `ms-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_aggregate_id: params.candidateAggregateId,
        selected: params.selected,
        selected_by: params.userId,
        selected_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.MGMT_SELECTIONS, sels);
    localDB.saveCandidatesToCloud().catch(() => {});
  },

  // DIRECTOR SELECTIONS
  getDirectorSelections: (awardId?: string, yearId?: string): DirectorSelection[] => {
    let sels = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
    if (awardId) sels = sels.filter((s) => s.award_id === awardId);
    if (yearId) sels = sels.filter((s) => matchesYear(s.award_year_id, yearId));
    return sels;
  },
  toggleDirectorSelection: (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean; note?: string; userId: string }): void => {
    const sels = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
    const idx = sels.findIndex((s) => s.candidate_aggregate_id === params.candidateAggregateId && s.award_id === params.awardId && matchesYear(s.award_year_id, params.yearId));
    if (idx !== -1) {
      sels[idx].selected = params.selected;
      sels[idx].director_note = params.note || null;
      sels[idx].selected_by = params.userId;
      sels[idx].selected_at = new Date().toISOString();
    } else {
      sels.push({
        id: `ds-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_aggregate_id: params.candidateAggregateId,
        selected: params.selected,
        director_note: params.note || null,
        selected_by: params.userId,
        selected_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.DIR_SELECTIONS, sels);
    localDB.saveCandidatesToCloud().catch(() => {});
  },

  // USER PROFILES & ROLES (MULTI-ROLE & PRODUCTION MANAGEMENT)
  getProfiles: (): Profile[] => {
    return getStorage<Profile[]>(STORAGE_KEYS.PROFILES, getInitialProfiles());
  },
  saveProfile: (prof: Profile): void => {
    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const idx = profiles.findIndex((p) => p.id === prof.id || p.email.toLowerCase() === prof.email.toLowerCase());
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...prof };
    } else {
      profiles.push(prof);
    }
    setStorage(STORAGE_KEYS.PROFILES, profiles);
  },
  getUserRoles: (userId: string): UserRole[] => {
    const allRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
    return allRoles.filter((r) => r.user_id === userId).map((r) => r.role);
  },
  setUserRoles: (userId: string, roles: UserRole[]): void => {
    const allRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
    const filtered = allRoles.filter((r) => r.user_id !== userId);
    roles.forEach((role) => {
      filtered.push({
        id: `ur-${Date.now()}-${role}`,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
      });
    });
    setStorage(STORAGE_KEYS.USER_ROLES, filtered);

    // Also synchronize profile record roles
    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const pIdx = profiles.findIndex((p) => p.id === userId);
    if (pIdx >= 0) {
      profiles[pIdx].roles = roles;
      if (roles.length > 0) profiles[pIdx].role = roles[0];
      setStorage(STORAGE_KEYS.PROFILES, profiles);
    }
  },

  // CANDIDATE SAFE DELETION
  deleteCandidate: (
    candidateId: string,
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; error?: string } => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const cand = cands.find((c) => c.id === candidateId);
    if (!cand) return { success: false, error: 'Calon tidak dijumpai.' };

    // Permission check
    if (deletedByRole === 'admin') {
      // Allowed for all
    } else if (deletedByRole === 'panel') {
      if (cand.created_by !== deletedByUserId && cand.panel_id !== deletedByUserId) {
        return { success: false, error: 'Anda hanya dibenarkan memadam calon yang anda masukkan sendiri.' };
      }
    } else {
      return { success: false, error: 'Peranan ini tidak dibenarkan memadam calon.' };
    }

    // 1. Remove candidate
    const remainingCands = cands.filter((c) => c.id !== candidateId);
    setStorage(STORAGE_KEYS.CANDIDATES, remainingCands);

    // 2. Remove evaluations belonging to candidate
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const candEvals = evals.filter((e) => e.panel_candidate_id === candidateId);
    const candEvalIds = new Set(candEvals.map((e) => e.id));
    const remainingEvals = evals.filter((e) => e.panel_candidate_id !== candidateId);
    setStorage(STORAGE_KEYS.EVALUATIONS, remainingEvals);

    // 3. Remove evaluation scores
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const remainingScores = scores.filter((s) => !candEvalIds.has(s.evaluation_id));
    setStorage(STORAGE_KEYS.SCORES, remainingScores);

    // 4. Update or remove CandidateAggregate safely
    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const identifier = cand.staff_number || `${cand.candidate_name.toLowerCase().trim()}|${cand.division.toLowerCase().trim()}`;
    const aggIdx = aggs.findIndex(
      (a) => a.award_id === cand.award_id && matchesYear(a.award_year_id, cand.award_year_id) && a.candidate_identifier === identifier
    );

    if (aggIdx !== -1) {
      const aggId = aggs[aggIdx].id;
      const otherSameCandidates = remainingCands.filter(
        (c) =>
          c.award_id === cand.award_id &&
          matchesYear(c.award_year_id, cand.award_year_id) &&
          (c.staff_number || `${c.candidate_name.toLowerCase().trim()}|${c.division.toLowerCase().trim()}`) === identifier
      );

      if (otherSameCandidates.length === 0) {
        aggs.splice(aggIdx, 1);
        setStorage(STORAGE_KEYS.AGGREGATES, aggs);

        // Safe cascade cleanup for this aggregate
        const mgmts = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
        setStorage(STORAGE_KEYS.MGMT_SELECTIONS, mgmts.filter((m) => m.candidate_aggregate_id !== aggId));

        const dirs = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
        setStorage(STORAGE_KEYS.DIR_SELECTIONS, dirs.filter((d) => d.candidate_aggregate_id !== aggId));

        const finals = getStorage<FinalResult[]>(STORAGE_KEYS.FINAL_RESULTS, []);
        setStorage(STORAGE_KEYS.FINAL_RESULTS, finals.filter((f) => f.candidate_aggregate_id !== aggId));
      } else {
        const remainingCandidateIds = new Set(otherSameCandidates.map((c) => c.id));
        const activeEvals = remainingEvals.filter(
          (e) => remainingCandidateIds.has(e.panel_candidate_id) && e.status === 'submitted' && e.total_score !== null
        );
        const activeScores = activeEvals.map((e) => e.total_score as number);
        const newTotal = activeScores.reduce((a, b) => a + b, 0);

        aggs[aggIdx].score_count = activeScores.length;
        aggs[aggIdx].total_score = newTotal;
        aggs[aggIdx].average_score = activeScores.length > 0 ? parseFloat((newTotal / activeScores.length).toFixed(2)) : 0;
        aggs[aggIdx].individual_scores = activeScores;
        aggs[aggIdx].updated_at = new Date().toISOString();
        setStorage(STORAGE_KEYS.AGGREGATES, aggs);
      }
    }

    // 5. Log audit trail
    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Pengguna',
      activeRole: deletedByRole,
      action: 'Padam Calon',
      details: `Memadam calon: ${cand.candidate_name} (${cand.division})`,
      entityType: 'candidate',
      entityId: candidateId,
    });

    localDB.saveCandidatesToCloud().catch(() => {});

    return { success: true };
  },

  // TEST / DUMMY DATA MANAGEMENT
  setCandidateDummyStatus: (candidateId: string, isDummy: boolean): void => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const idx = cands.findIndex((c) => c.id === candidateId);
    if (idx !== -1) {
      cands[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.CANDIDATES, cands);
    }
  },
  setEvaluationDummyStatus: (evaluationId: string, isDummy: boolean): void => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const idx = evals.findIndex((e) => e.id === evaluationId);
    if (idx !== -1) {
      evals[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }
  },
  deleteDummyCandidates: (
    candidateIds: string[],
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; deletedCount: number } => {
    let count = 0;
    for (const id of candidateIds) {
      const res = localDB.deleteCandidate(id, deletedByUserId, deletedByRole, userName);
      if (res.success) count++;
    }
    return { success: true, deletedCount: count };
  },
  deleteDummyScores: (
    evaluationIds: string[],
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; deletedCount: number } => {
    if (deletedByRole !== 'admin') {
      return { success: false, deletedCount: 0 };
    }
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const evalIdSet = new Set(evaluationIds);

    const remainingEvals = evals.filter((e) => !evalIdSet.has(e.id));
    const remainingScores = scores.filter((s) => !evalIdSet.has(s.evaluation_id));

    setStorage(STORAGE_KEYS.EVALUATIONS, remainingEvals);
    setStorage(STORAGE_KEYS.SCORES, remainingScores);

    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Urusetia',
      activeRole: deletedByRole,
      action: 'Padam Markah Ujian',
      details: `Memadam ${evaluationIds.length} rekod markah/penilaian ujian`,
      entityType: 'evaluation',
    });

    localDB.saveCandidatesToCloud().catch(() => {});

    return { success: true, deletedCount: evaluationIds.length };
  },

  // AUDIT LOGS
  getAuditLogs: (): AuditLog[] => {
    return getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  logAudit: (log: {
    userId?: string | null;
    userName: string;
    activeRole: string;
    action: string;
    details?: string | null;
    entityType?: string | null;
    entityId?: string | null;
  }): void => {
    const logs = getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: log.userId || null,
      user_name: log.userName,
      user_role: log.activeRole,
      action: log.action,
      details: log.details || null,
      entity_type: log.entityType || null,
      entity_id: log.entityId || null,
      created_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  },

  // EVALUATOR / ACCOUNT DUMMY MANAGEMENT
  setEvaluatorDummyStatus: (evaluatorId: string, isDummy: boolean): void => {
    const evals = getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, []);
    const idx = evals.findIndex((e) => e.id === evaluatorId);
    if (idx !== -1) {
      evals[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.EVALUATORS, evals);
    }
  },
  getEvaluatorStats: (evaluatorId: string): {
    nominationsCount: number;
    evaluationsCount: number;
    scoresCount: number;
    assignmentsCount: number;
  } => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);

    const evaluator = localDB.getEvaluators().find((e) => e.id === evaluatorId);
    const idSet = new Set<string>([evaluatorId]);
    if (evaluator?.profile_id) idSet.add(evaluator.profile_id);

    const myCands = cands.filter((c) => idSet.has(c.panel_id) || (c.created_by && idSet.has(c.created_by)));
    const myEvals = evals.filter((e) => idSet.has(e.panel_id));
    const evalIdSet = new Set(myEvals.map((e) => e.id));
    const myScores = scores.filter((s) => evalIdSet.has(s.evaluation_id));
    const myAsgns = asgns.filter((a) => a.evaluator_id === evaluatorId);

    return {
      nominationsCount: myCands.length,
      evaluationsCount: myEvals.length,
      scoresCount: myScores.length,
      assignmentsCount: myAsgns.length,
    };
  },
  deleteEvaluatorAccount: (
    evaluatorId: string,
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; error?: string } => {
    if (deletedByRole !== 'admin') {
      return { success: false, error: 'Hanya Urusetia dibenarkan memadam akaun ujian.' };
    }
    const evals = localDB.getEvaluators();
    const targetEval = evals.find((e) => e.id === evaluatorId);
    if (!targetEval) return { success: false, error: 'Akaun panel tidak dijumpai.' };

    // 1. Remove assignments
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns.filter((a) => a.evaluator_id !== evaluatorId));

    // 2. Remove evaluations & scores
    const idSet = new Set<string>([evaluatorId]);
    if (targetEval.profile_id) idSet.add(targetEval.profile_id);

    const allEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evalsToDelete = allEvals.filter((e) => idSet.has(e.panel_id));
    const evalIdsToDelete = new Set(evalsToDelete.map((e) => e.id));
    setStorage(STORAGE_KEYS.EVALUATIONS, allEvals.filter((e) => !idSet.has(e.panel_id)));

    const allScores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    setStorage(STORAGE_KEYS.SCORES, allScores.filter((s) => !evalIdsToDelete.has(s.evaluation_id)));

    // 3. Remove from evaluators list
    setStorage(STORAGE_KEYS.EVALUATORS, evals.filter((e) => e.id !== evaluatorId));

    // 4. Log audit
    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Urusetia',
      activeRole: deletedByRole,
      action: 'Padam Akaun Ujian',
      details: `Memadam akaun panel ujian: ${targetEval.name} (${targetEval.email})`,
      entityType: 'evaluator',
      entityId: evaluatorId,
    });

    return { success: true };
  },
};
