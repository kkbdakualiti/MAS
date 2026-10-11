import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DataTable from '@/components/ui/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { localDB, isSupabaseConfigured, matchesYear } from '@/lib/localStore';
import { supabase } from '@/lib/supabase';
import { ROLE_LABELS } from '@/lib/constants';
import type { Profile, UserRole, Award, Evaluator, EvaluatorAssignment } from '@/lib/types';
import {
  Users,
  UserPlus,
  Edit2,
  Key,
  Shield,
  Search,
  Filter,
  Layers,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  Lock,
  AtSign,
  Mail,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface UserListItem extends Profile {
  assignedAwards?: Award[];
  isEvaluator?: boolean;
}

const ALL_ROLES: { key: UserRole; label: string; desc: string }[] = [
  { key: 'panel', label: 'Panel Penilai', desc: 'Menilai calon mengikut kategori yang ditugaskan' },
  { key: 'management', label: 'Pengurusan (TPA / TPP)', desc: 'Menyemak perakuan calon dan pemilihan peringkat pengurusan' },
  { key: 'director', label: 'Pengarah Kolej', desc: 'Membuat pengesahan akhir penerima anugerah' },
  { key: 'admin', label: 'Urusetia Anugerah (Admin)', desc: 'Mengurus sistem, pengguna, kategori, dan laporan' },
];

export default function UserManagement() {
  const { data: awards = [] } = useAwards();
  const { createUserWithCredentials, adminResetUserPassword, toggleUserStatus } = useAuth();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form Fields - Pengguna hanya menggunakan Username / ID Login & Kata Laluan
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formPosition, setFormPosition] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRoles, setFormRoles] = useState<UserRole[]>(['panel']);
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formDivision, setFormDivision] = useState('');

  // Password Reset Modal State
  const [resetModalTarget, setResetModalTarget] = useState<UserListItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Status Confirmation Dialog
  const [statusConfirmTarget, setStatusConfirmTarget] = useState<UserListItem | null>(null);

  const loadAllUsers = async () => {
    setLoading(true);
    let loadedProfiles: Profile[] = [];
    let loadedEvaluators: Evaluator[] = [];
    let loadedAssignments: EvaluatorAssignment[] = [];

    // 1. Segerakkan tugasan anugerah dari Supabase Cloud (system_settings)
    await Promise.all([
      localDB.syncAssignmentsFromCloud().catch(() => {}),
      localDB.syncCandidatesFromCloud().catch(() => {}),
    ]);

    // 2. Baca terus dari Supabase jika configured
    if (isSupabaseConfigured()) {
      try {
        const [profRes, evRes, asgRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('evaluators').select('*'),
          supabase.from('evaluator_assignments').select('*'),
          supabase.from('user_roles').select('*'),
        ]);

        const dbProfiles = (profRes.data || []) as Profile[];
        const dbEvaluators = (evRes.data || []) as Evaluator[];
        const dbAssignments = (asgRes.data || []) as EvaluatorAssignment[];
        const dbUserRoles = (rolesRes.data || []) as { user_id: string; role: UserRole }[];

        if (dbProfiles.length > 0) {
          loadedProfiles = dbProfiles.map((p) => {
            const roles = dbUserRoles.filter((r) => r.user_id === p.id).map((r) => r.role);
            return {
              ...p,
              roles: roles.length > 0 ? roles : p.roles || [p.role],
            };
          });
          // Simpan ke localDB cache supaya sentiasa tersedia
          loadedProfiles.forEach((lp) => localDB.saveProfile(lp));
        }
        if (dbEvaluators.length > 0) loadedEvaluators = dbEvaluators;
        if (dbAssignments.length > 0) loadedAssignments = dbAssignments;
      } catch {}
    }

    // 3. Gabungkan evaluators dari localDB terlebih dahulu
    const localEvals = localDB.getEvaluators();
    localEvals.forEach((le) => {
      if (!loadedEvaluators.some((e) => e.id === le.id || (e.email && le.email && e.email.toLowerCase() === le.email.toLowerCase()))) {
        loadedEvaluators.push(le);
      }
    });

    // 4. Gabungkan profiles dari localDB jika ada rekod luar talian
    const localProfiles = localDB.getProfiles();
    const map = new Map<string, Profile>();

    // Supabase profiles diutamakan
    loadedProfiles.forEach((sp) => {
      map.set(sp.email.toLowerCase(), sp);
    });

    // Local profiles jika belum wujud dalam map
    localProfiles.forEach((lp) => {
      const cleanEmail = lp.email.toLowerCase();
      if (!map.has(cleanEmail)) {
        map.set(cleanEmail, lp);
      }
    });

    // Evaluator records yang mungkin belum ada profile
    loadedEvaluators.forEach((ev) => {
      if (ev.is_dummy) return;
      const cleanEmail = ev.email.toLowerCase();
      if (!map.has(cleanEmail)) {
        const assignedRoles = localDB.getUserRoles(ev.id);
        const derivedUsername = cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '');
        map.set(cleanEmail, {
          id: ev.profile_id || ev.id,
          full_name: ev.name,
          email: ev.email,
          username: derivedUsername,
          role: 'panel',
          roles: assignedRoles.length > 0 ? assignedRoles : ['panel'],
          phone: ev.phone || null,
          position: ev.position || 'Panel Penilai',
          is_active: ev.is_active,
          is_dummy: ev.is_dummy,
          activation_status: 'active',
          created_at: ev.created_at || new Date().toISOString(),
        });
      }
    });

    // Gabungkan assignments dari localDB
    try {
      const rawLocalAsgns = localStorage.getItem('kkbda_assignments');
      if (rawLocalAsgns) {
        const parsed = JSON.parse(rawLocalAsgns) as EvaluatorAssignment[];
        parsed.forEach((pa) => {
          if (!loadedAssignments.some((la) => la.evaluator_id === pa.evaluator_id && la.award_id === pa.award_id && la.award_year_id === pa.award_year_id)) {
            loadedAssignments.push(pa);
          }
        });
      }
    } catch {}

    const combined = Array.from(map.values()).map((prof) => {
      const ev = loadedEvaluators.find(
        (e) =>
          e.profile_id === prof.id ||
          e.id === prof.id ||
          (e.email && prof.email && e.email.toLowerCase() === prof.email.toLowerCase())
      );
      let assignedAwards: Award[] = [];

      try {
        const directAwardIds = localDB.getAssignedAwardIds(prof.id, prof.email, 'year-2026');
        if (directAwardIds.length > 0) {
          assignedAwards = awards.filter((aw) => directAwardIds.includes(aw.id));
        }
      } catch {}

      if (assignedAwards.length === 0) {
        const targetEvalIds = new Set([prof.id, ev?.id, prof.username, prof.email].filter(Boolean));
        const evAsgns = loadedAssignments.filter((a) => targetEvalIds.has(a.evaluator_id));
        assignedAwards = awards.filter((aw) => evAsgns.some((a) => a.award_id === aw.id));
      }

      const rawUname = prof.username || prof.email.split('@')[0];
      return {
        ...prof,
        username: rawUname.toLowerCase().replace(/[^a-z0-9._-]/g, ''),
        roles: prof.roles && prof.roles.length > 0 ? prof.roles : [prof.role || 'panel'],
        assignedAwards,
        isEvaluator: !!ev,
      };
    });

    setUsers(combined);
    setEvaluators(loadedEvaluators);
    setAssignments(loadedAssignments);
    setLoading(false);
  };

  useEffect(() => {
    loadAllUsers();
  }, [awards]);

  const handleToggleRoleCheckbox = (r: UserRole) => {
    if (formRoles.includes(r)) {
      if (formRoles.length === 1) {
        toast.error('Pengguna mesti mempunyai sekurang-kurangnya satu peranan.');
        return;
      }
      setFormRoles(formRoles.filter((item) => item !== r));
    } else {
      setFormRoles([...formRoles, r]);
    }
  };

  const handleToggleCategoryCheckbox = (catId: string) => {
    if (formCategoryIds.includes(catId)) {
      setFormCategoryIds(formCategoryIds.filter((id) => id !== catId));
    } else {
      setFormCategoryIds([...formCategoryIds, catId]);
    }
  };

  const openAddModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormIsActive(true);
    setFormPosition('');
    setFormPhone('');
    setFormRoles(['panel']);
    setFormCategoryIds([]);
    setFormDivision('');
    setModalOpen(true);
  };

  const openEditModal = (u: UserListItem) => {
    setEditingUserId(u.id);
    setFormName(u.full_name);
    const rawUname = u.username || u.email.split('@')[0];
    setFormUsername(rawUname.toLowerCase().replace(/[^a-z0-9._-]/g, ''));
    setFormPassword('');
    setFormConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormIsActive(u.is_active);
    setFormPosition(u.position || '');
    setFormPhone(u.phone || '');
    setFormRoles(u.roles && u.roles.length > 0 ? u.roles : [u.role]);

    // Cari tugasan kategori & bahagian panel secara komprehensif
    // 1. Utamakan anugerah yang telah dipadankan pada baris pengguna (u.assignedAwards)
    let catIds: string[] = [];
    if (u.assignedAwards && u.assignedAwards.length > 0) {
      catIds = u.assignedAwards.map((a) => a.id);
    }

    // 2. Jika belum ada, cari terus daripada localDB.getAssignedAwardIds (menyemak Cloud Sync & localStorage)
    if (catIds.length === 0) {
      try {
        const localAwardIds = localDB.getAssignedAwardIds(u.id, u.email, 'year-2026');
        if (localAwardIds.length > 0) {
          catIds = localAwardIds;
        }
      } catch {}
    }

    // 3. Fallback semakan jadual assignments
    const ev = evaluators.find(
      (e) =>
        e.profile_id === u.id ||
        e.id === u.id ||
        (e.email && u.email && e.email.toLowerCase() === u.email.toLowerCase())
    );
    const targetEvalIds = new Set([u.id, ev?.id, u.username, u.email].filter(Boolean));
    const asgns = assignments.filter((a) => targetEvalIds.has(a.evaluator_id));

    if (catIds.length === 0) {
      catIds = asgns.map((a) => a.award_id);
    }
    const div = u.division || asgns[0]?.division || (u.position?.toUpperCase().includes('SKE') ? 'SKE' : (u.position?.toUpperCase().includes('STS') ? 'STS' : (u.position?.toUpperCase().includes('STM') ? 'STM' : (u.position?.toUpperCase().includes('SAU') ? 'SAU' : (u.position?.toUpperCase().includes('DCV') ? 'DCV' : (u.position?.toUpperCase().includes('AM') ? 'AM' : ''))))));

    setFormCategoryIds(catIds);
    setFormDivision(div);
    setModalOpen(true);
  };

  const openResetModal = (u: UserListItem) => {
    setResetModalTarget(u);
    setResetNewPassword('');
    setResetConfirmPassword('');
    setResetShowPassword(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validasi Nama Penuh
    const cleanFullName = formName.trim();
    if (!cleanFullName) {
      toast.error('Nama penuh pengguna wajib diisi.');
      return;
    }

    // 2. Validasi Username / ID Login
    const rawUsername = formUsername.trim();
    if (!rawUsername) {
      toast.error('Username diperlukan.');
      return;
    }
    if (rawUsername.includes('@')) {
      toast.error('Username tidak boleh mengandungi simbol @.');
      return;
    }
    if (rawUsername.includes(' ')) {
      toast.error('Username tidak boleh mengandungi ruang.');
      return;
    }
    const cleanUsername = rawUsername.toLowerCase();
    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      toast.error('Username hanya boleh mengandungi huruf kecil, nombor, titik (.), dash (-), atau underscore (_).');
      return;
    }

    // 3. E-mel dalaman Supabase Auth dijana secara automatik berdasarkan username (tiada e-mel diperlukan daripada pengguna)
    const cleanEmail = `${cleanUsername}@auth.eapresiasi.local`;

    // 4. Validasi Peranan
    if (formRoles.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya satu peranan.');
      return;
    }

    // 5. Validasi Kata Laluan jika mendaftar pengguna baru
    if (!editingUserId) {
      if (!formPassword) {
        toast.error('Sila masukkan kata laluan untuk akaun pengguna.');
        return;
      }
      if (formPassword.length < 6) {
        toast.error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
        return;
      }
      if (formPassword !== formConfirmPassword) {
        toast.error('Kata laluan dan sahkan kata laluan tidak sepadan.');
        return;
      }
    }

    setSaving(true);

    if (editingUserId) {
      // PENGEMASKINIAN PENGGUNA SEDIA ADA
      const existing = users.find((u) => u.id === editingUserId);
      if (existing) {
        // Semak keunikan username jika diubah
        const isDuplicateUsername = users.some(
          (u) => u.id !== editingUserId && u.username?.toLowerCase() === cleanUsername
        );
        if (isDuplicateUsername) {
          toast.error('Username ini telah digunakan oleh pengguna lain. Sila gunakan username lain.');
          setSaving(false);
          return;
        }

        try {
          // 1. Kemaskini dalam public.profiles
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({
              full_name: cleanFullName,
              username: cleanUsername,
              position: formPosition.trim() || null,
              phone: formPhone.trim() || null,
              division: formDivision.trim() || null,
              role: formRoles[0],
              is_active: formIsActive,
            })
            .eq('id', editingUserId);

          if (profileErr) {
            console.warn('Profile Supabase update warning:', profileErr.message);
          }

          // 2. Kemaskini public.user_roles
          try {
            await supabase.from('user_roles').delete().eq('user_id', editingUserId);
            const roleInserts = formRoles.map((r) => ({ user_id: editingUserId, role: r }));
            await supabase.from('user_roles').insert(roleInserts);
          } catch {}

          // 3. Kemaskini evaluators dalam Supabase jika ada sambungan
          let evalId = editingUserId;
          try {
            const { data: evData } = await supabase
              .from('evaluators')
              .select('id')
              .or(`profile_id.eq.${editingUserId},email.eq.${cleanEmail}`)
              .maybeSingle();

            if (evData?.id) {
              evalId = evData.id;
              await supabase
                .from('evaluators')
                .update({
                  name: cleanFullName,
                  position: formPosition.trim() || 'Panel Penilai',
                  phone: formPhone.trim() || null,
                  is_active: formIsActive,
                })
                .eq('id', evalId);
            } else if (formRoles.includes('panel')) {
              const { data: newEv } = await supabase
                .from('evaluators')
                .insert({
                  profile_id: editingUserId,
                  name: cleanFullName,
                  email: cleanEmail,
                  position: formPosition.trim() || 'Panel Penilai',
                  phone: formPhone.trim() || null,
                  is_active: formIsActive,
                })
                .select('id')
                .maybeSingle();
              if (newEv?.id) evalId = newEv.id;
            }
          } catch {}

          // 4. KEMASKINI EVALUATOR DALAM LOCALDB (Sistem Step B)
          const localEvals = localDB.getEvaluators();
          const existingEvalIdx = localEvals.findIndex(
            (e) =>
              e.profile_id === editingUserId ||
              e.id === editingUserId ||
              e.id === evalId ||
              (e.email && e.email.toLowerCase() === cleanEmail.toLowerCase())
          );
          const currentLocalEvId = existingEvalIdx !== -1 ? localEvals[existingEvalIdx].id : evalId;
          const updatedLocalEval: Evaluator = {
            id: currentLocalEvId,
            profile_id: editingUserId,
            name: cleanFullName,
            email: cleanEmail,
            position: formPosition.trim() || 'Panel Penilai',
            phone: formPhone.trim() || null,
            is_active: formIsActive,
            is_dummy: false,
            created_at: existingEvalIdx !== -1 ? localEvals[existingEvalIdx].created_at : new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          if (existingEvalIdx !== -1) {
            localEvals[existingEvalIdx] = updatedLocalEval;
          } else {
            localEvals.push(updatedLocalEval);
          }
          localStorage.setItem('kkbda_evaluators', JSON.stringify(localEvals));

          // 5. KEMASKINI TUGASAN KATEGORI DALAM LOCALDB & SUPABASE (KRITIKAL!)
          const activeYearId = 'year-2026';
          let allLocalAsgns: EvaluatorAssignment[] = [];
          try {
            const raw = localStorage.getItem('kkbda_assignments');
            if (raw) allLocalAsgns = JSON.parse(raw);
          } catch {}

          // Bersihkan tugasan lama untuk pengguna/evaluator ini
          const targetIds = new Set(
            [editingUserId, evalId, currentLocalEvId, cleanUsername, cleanEmail].filter(Boolean) as string[]
          );
          allLocalAsgns = allLocalAsgns.filter(
            (a) =>
              !(
                Array.from(targetIds).some((tid) => tid.toLowerCase() === (a.evaluator_id || '').toLowerCase()) &&
                matchesYear(a.award_year_id, activeYearId)
              )
          );

          if (formRoles.includes('panel') && formCategoryIds.length > 0) {
            formCategoryIds.forEach((awardId) => {
              targetIds.forEach((tid) => {
                allLocalAsgns.push({
                  id: `asgn-${Date.now()}-${tid}-${awardId}`,
                  evaluator_id: tid,
                  award_id: awardId,
                  award_year_id: activeYearId,
                  division: formDivision.trim() || null,
                  created_at: new Date().toISOString(),
                });
              });
            });
          }
          localStorage.setItem('kkbda_assignments', JSON.stringify(allLocalAsgns));

          // SEGERAKKAN KE SUPABASE CLOUD (system_settings) SUPAYA TUGASAN DIKEMAS KINI DI SEMUA GAJET/KOMPUTER
          await localDB.saveAssignmentsToCloud(
            Array.from(targetIds),
            formRoles.includes('panel') ? formCategoryIds : [],
            formDivision.trim() || null
          );
          await localDB.saveCandidatesToCloud();

          // 6. Kemaskini cache Profile & Roles localDB
          const updatedProfile: Profile = {
            ...existing,
            full_name: cleanFullName,
            username: cleanUsername,
            position: formPosition.trim() || null,
            phone: formPhone.trim() || null,
            division: formDivision.trim() || null,
            role: formRoles[0],
            roles: formRoles,
            is_active: formIsActive,
          };
          localDB.saveProfile(updatedProfile);
          localDB.setUserRoles(editingUserId, formRoles);

          // 7. Jika sesi pengguna aktif sedang dibuka untuk pengguna ini, kemaskini serta-merta
          const storedSession = localStorage.getItem('kkbda_user_session');
          if (storedSession) {
            try {
              const parsed = JSON.parse(storedSession);
              if (parsed.userId === editingUserId) {
                localStorage.setItem(
                  'kkbda_user_session',
                  JSON.stringify({ ...parsed, username: cleanUsername, full_name: cleanFullName })
                );
              }
            } catch {}
          }

          toast.success('Maklumat dan tugasan anugerah pengguna berjaya dikemaskini.');
          setModalOpen(false);
          await loadAllUsers();
        } catch (err: any) {
          toast.error(`Ralat semasa mengemaskini: ${err.message}`);
          setSaving(false);
          return;
        }
      }
    } else {
      // PENCIPTAAN PENGGUNA BAHARU
      // Semak sama ada Username / ID Login telah wujud dalam sistem
      const isDuplicateUsername = users.some(
        (u) =>
          u.username?.toLowerCase() === cleanUsername ||
          u.email.toLowerCase() === cleanEmail
      );
      if (isDuplicateUsername) {
        toast.error(`Username / ID Login "${cleanUsername}" telah wujud dalam sistem. Sila gunakan username lain atau kemaskini rekod pengguna sedia ada.`);
        setSaving(false);
        return;
      }

      if (formPassword && formPassword.length < 6) {
        toast.error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
        setSaving(false);
        return;
      }

      // PANGGIL EDGE FUNCTION (FLOW DATA PRODUCTION WAJIB)
      const res = await createUserWithCredentials({
        full_name: cleanFullName,
        email: cleanEmail,
        username: cleanUsername,
        password: formPassword || undefined,
        roles: formRoles,
        position: formPosition.trim() || undefined,
        phone: formPhone.trim() || undefined,
        is_active: formIsActive,
        awardCategoryIds: formRoles.includes('panel') ? formCategoryIds : [],
        division: formDivision.trim() || undefined,
      });

      // KRITIKAL: JIKA PENCIPTAAN AUTH GAGAL -> STOP SELURUH PROSES. JANGAN FALLBACK KE LOCALSTORAGE!
      if (!res.success) {
        let errMsg = res.error || 'Gagal mendaftarkan pengguna dalam Supabase Auth.';
        if (
          errMsg.toLowerCase().includes('email') ||
          errMsg.toLowerCase().includes('e-mel') ||
          errMsg.includes('already been registered')
        ) {
          errMsg = `Username / ID Login "${cleanUsername}" telah wujud dalam sistem. Sila pilih username lain.`;
        }
        toast.error(errMsg);
        setSaving(false);
        return;
      }

      // Simpan ke cache localDB untuk kemaskini jadual serta-merta
      const newUserId = res.user_id || `user-${Date.now()}`;
      const newProfile: Profile = {
        id: newUserId,
        full_name: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        position: formPosition.trim() || null,
        phone: formPhone.trim() || null,
        role: formRoles[0],
        roles: formRoles,
        is_active: formIsActive,
        activation_status: 'active',
        created_at: new Date().toISOString(),
      };
      localDB.saveProfile(newProfile);
      localDB.setUserRoles(newUserId, formRoles);

      if (formRoles.includes('panel')) {
        const newEval = localDB.createEvaluator({
          name: cleanFullName,
          email: cleanEmail,
          position: formPosition.trim() || 'Panel Penilai',
          phone: formPhone.trim() || undefined,
        });
        localDB.updateEvaluator(newEval.id, { profile_id: newUserId, is_active: formIsActive });

        if (formCategoryIds.length > 0) {
          localDB.setEvaluatorCategories(newEval.id, formCategoryIds, 'year-2026');
          const newTargetIds = [newUserId, cleanUsername, cleanEmail, newEval.id].filter(Boolean) as string[];
          await localDB.saveAssignmentsToCloud(newTargetIds, formCategoryIds);
          await localDB.saveCandidatesToCloud();
          if (formDivision.trim()) {
            formCategoryIds.forEach((catId) => {
              localDB.setAssignmentDivision(catId, 'year-2026', newEval.id, formDivision.trim());
            });
          }
        }
      }

      toast.success('Pengguna berjaya ditambah.');
    }

    setSaving(false);
    setModalOpen(false);
    await loadAllUsers();
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTarget) return;

    if (!resetNewPassword || !resetConfirmPassword) {
      toast.error('Sila lengkapkan semua ruangan kata laluan.');
      return;
    }

    if (resetNewPassword.length < 6) {
      toast.error('Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toast.error('Kata laluan baru dan pengesahan kata laluan tidak sepadan.');
      return;
    }

    setResettingPassword(true);
    const res = await adminResetUserPassword(resetModalTarget.id, resetNewPassword);

    if (res.success) {
      toast.success(`Kata laluan untuk ${resetModalTarget.full_name} berjaya dikemaskini.`);
      setResetModalTarget(null);
      setResetNewPassword('');
      setResetConfirmPassword('');
    } else {
      toast.error(res.error || 'Gagal menetapkan semula kata laluan.');
    }

    setResettingPassword(false);
  };

  const handleConfirmToggleStatus = async () => {
    if (!statusConfirmTarget) return;
    const newStatus = !statusConfirmTarget.is_active;
    const res = await toggleUserStatus(statusConfirmTarget.id, newStatus);
    if (res.success) {
      toast.success(newStatus ? 'Akaun pengguna telah diaktifkan.' : 'Akaun pengguna telah dinyahaktifkan.');
      await loadAllUsers();
    } else {
      toast.error(res.error || 'Gagal mengubah status akaun.');
    }
    setStatusConfirmTarget(null);
  };

  // Filtered List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      filterRole === 'all' ||
      (u.roles && u.roles.includes(filterRole as UserRole)) ||
      u.role === filterRole;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && u.is_active) ||
      (filterStatus === 'inactive' && !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Table Columns
  const columns = [
    {
      key: 'name',
      label: 'Nama & Jawatan',
      render: (item: UserListItem) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-navy/10 text-navy font-bold flex items-center justify-center text-sm shrink-0 border border-navy/20">
            {item.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-navy flex items-center gap-2">
              {item.full_name}
              {item.is_dummy && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                  DUMMY
                </span>
              )}
            </div>
            {item.position && (
              <div className="text-xs text-gray-500 mt-0.5">
                {item.position}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      label: 'Username / ID Login',
      render: (item: UserListItem) => (
        <div className="font-mono text-xs text-navy font-extrabold bg-navy/5 px-2.5 py-1 rounded-lg w-fit border border-navy/15">
          {item.username || item.email.split('@')[0]}
        </div>
      ),
    },
    {
      key: 'roles',
      label: 'Peranan',
      render: (item: UserListItem) => (
        <div className="flex flex-wrap gap-1">
          {(item.roles || [item.role]).map((r) => (
            <Badge
              key={r}
              variant={
                r === 'admin'
                  ? 'danger'
                  : r === 'director'
                  ? 'gold'
                  : r === 'management'
                  ? 'warning'
                  : 'info'
              }
            >
              {ROLE_LABELS[r] || r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'categories',
      label: 'Tugasan Panel',
      render: (item: UserListItem) => {
        const isPanel = item.roles?.includes('panel') || item.role === 'panel';
        if (!isPanel) {
          return <span className="text-xs text-gray-400 italic">-</span>;
        }
        if (!item.assignedAwards || item.assignedAwards.length === 0) {
          return (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              0 Kategori
            </span>
          );
        }
        return (
          <div className="space-y-1">
            <span className="text-xs font-bold text-navy bg-navy/5 px-2 py-0.5 rounded">
              {item.assignedAwards.length} Kategori
            </span>
            <p className="text-[11px] text-gray-500 truncate max-w-xs" title={item.assignedAwards.map((a) => a.name).join(', ')}>
              {item.assignedAwards.map((a) => a.name).join(', ')}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: UserListItem) => (
        <div>
          {item.is_active ? (
            <Badge variant="success">Aktif</Badge>
          ) : (
            <Badge variant="danger">Tidak Aktif</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Tindakan',
      render: (item: UserListItem) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs py-1 px-2.5"
            onClick={() => openEditModal(item)}
            title="Edit Maklumat & Peranan"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1" />
            Edit
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="text-xs py-1 px-2.5 text-amber-700 border border-amber-300 hover:bg-amber-50"
            onClick={() => openResetModal(item)}
            title="Reset Kata Laluan Pengguna"
          >
            <Key className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className={`text-xs py-1 px-2.5 border ${
              item.is_active
                ? 'text-red-600 border-red-200 hover:bg-red-50'
                : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}
            onClick={() => setStatusConfirmTarget(item)}
            title={item.is_active ? 'Nyahaktifkan Akaun' : 'Aktifkan Akaun'}
          >
            {item.is_active ? (
              <>
                <UserX className="w-3.5 h-3.5 mr-1" />
                Nyahaktif
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 mr-1" />
                Aktifkan
              </>
            )}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title="Pengurusan Pengguna"
        subtitle="Daftar, kemaskini peranan, dan kawal selia akaun pengguna e-APRESIASI melalui Supabase Auth"
        actions={
          <Button
            variant="gold"
            onClick={openAddModal}
            className="flex items-center gap-2 shadow-sm font-bold"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Pengguna
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-navy">
          <div>
            <p className="text-xs text-gray-500 font-medium">Jumlah Pengguna</p>
            <h3 className="text-2xl font-extrabold text-navy mt-1">{users.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-navy">
            <Users className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-xs text-gray-500 font-medium">Akaun Aktif</p>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              {users.filter((u) => u.is_active).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <p className="text-xs text-gray-500 font-medium">Tidak Aktif</p>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">
              {users.filter((u) => !u.is_active).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <UserX className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-purple-500">
          <div>
            <p className="text-xs text-gray-500 font-medium">Pengguna Multi-Role</p>
            <h3 className="text-2xl font-extrabold text-purple-600 mt-1">
              {users.filter((u) => (u.roles || []).length > 1).length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mengikut nama, username atau jawatan..."
              className="input-field pl-9 text-xs py-2"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="all">Semua Peranan</option>
              <option value="panel">Panel Penilai</option>
              <option value="management">Pengurusan (TPA/TPP)</option>
              <option value="director">Pengarah</option>
              <option value="admin">Urusetia</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field text-xs py-2"
            >
              <option value="all">Semua Status</option>
              <option value="active">Akaun Aktif</option>
              <option value="inactive">Tidak Aktif</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Card>
        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="Tiada pengguna dijumpai."
        />
      </Card>

      {/* MODAL: TAMBAH / EDIT PENGGUNA */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUserId ? 'Kemaskini Maklumat Pengguna' : 'Tambah Pengguna Baru'}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div className="p-3 bg-navy/5 rounded-xl border border-navy/10 text-xs text-navy flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-navy shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akses & Pengesahan Pengguna:</p>
              <p className="mt-0.5 text-gray-600">
                Pengguna log masuk menggunakan <strong>Username / ID Login</strong> dan <strong>Kata Laluan</strong>. Pengurusan akaun dikawal selia sepenuhnya oleh Urusetia Anugerah.
              </p>
            </div>
          </div>

          {/* FIELD 1: NAMA PENUH */}
          <div>
            <label className="label font-bold text-navy">1. Nama Penuh Pengguna *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input-field text-xs"
              placeholder="Contoh: WAN NORHASHIMAH BINTI WAN HUSIN"
              required
            />
          </div>

          {/* FIELD 2: USERNAME / ID LOGIN */}
          <div>
            <label className="label font-bold text-navy">2. Username / ID Login *</label>
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              className="input-field text-xs font-mono font-bold text-navy"
              placeholder="contoh: tpa"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Mesti unik. Gunakan huruf kecil, nombor, titik, underscore atau dash tanpa ruang.
            </p>
          </div>

          {/* KATA LALUAN & SAHKAN KATA LALUAN (Hanya untuk Tambah Pengguna Baharu) */}
          {!editingUserId ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <label className="label font-bold text-navy">Kata Laluan *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="input-field text-xs pl-9 pr-9"
                    placeholder="Minima 6 aksara"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label font-bold text-navy">Sahkan Kata Laluan *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formConfirmPassword}
                    onChange={(e) => setFormConfirmPassword(e.target.value)}
                    className="input-field text-xs pl-9 pr-9"
                    placeholder="Ulang kata laluan"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-950">Kata Laluan Pengguna</p>
                <p className="text-[11px] text-amber-800">
                  Untuk menukar kata laluan bagi pengguna ini, klik butang di sebelah.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const target = users.find((u) => u.id === editingUserId);
                  if (target) {
                    setModalOpen(false);
                    openResetModal(target);
                  }
                }}
                className="text-xs flex items-center gap-1.5 text-amber-800 border border-amber-300 hover:bg-amber-100 font-bold"
              >
                <Key className="w-3.5 h-3.5" />
                TUKAR KATA LALUAN
              </Button>
            </div>
          )}

          {/* FIELD 3 & 4: JAWATAN & NO TELEFON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">3. Jawatan / Unit (Pilihan)</label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                className="input-field text-xs"
                placeholder="Contoh: Timbalan Pengarah Akademik (TPA)"
              />
            </div>
            <div>
              <label className="label">4. No. Telefon (Pilihan)</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="input-field text-xs"
                placeholder="Contoh: 012-3456789"
              />
            </div>
          </div>

          {/* FIELD 5: STATUS AKAUN */}
          <div>
            <label className="label font-bold text-navy">5. Status Akaun:</label>
            <div className="flex items-center gap-4 mt-1">
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="userStatus"
                  checked={formIsActive === true}
                  onChange={() => setFormIsActive(true)}
                  className="text-navy focus:ring-navy cursor-pointer"
                />
                <span className="font-semibold text-emerald-700">Aktif</span>
                <span className="text-gray-400">(Boleh log masuk)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="userStatus"
                  checked={formIsActive === false}
                  onChange={() => setFormIsActive(false)}
                  className="text-navy focus:ring-navy cursor-pointer"
                />
                <span className="font-semibold text-red-600">Tidak Aktif</span>
                <span className="text-gray-400">(Disekat daripada log masuk)</span>
              </label>
            </div>
          </div>

          {/* FIELD 6: PERANAN PENGGUNA (SOKONG MULTI-ROLE) */}
          <div className="pt-2 border-t border-gray-100">
            <label className="label font-bold text-navy flex items-center justify-between">
              <span>6. Peranan Pengguna (Sokongan Multi-Role):</span>
              <span className="text-[11px] text-gray-500 font-normal">Pilih satu atau lebih peranan</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {ALL_ROLES.map((r) => {
                const isChecked = formRoles.includes(r.key);
                return (
                  <div
                    key={r.key}
                    onClick={() => handleToggleRoleCheckbox(r.key)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                      isChecked
                        ? 'border-navy bg-navy/5 text-navy font-medium ring-1 ring-navy/20'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 rounded text-navy focus:ring-navy cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-bold text-navy">{r.label}</p>
                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FIELD 8: TUGASAN KATEGORI (Hanya jika ada peranan Panel Penilai) */}
          {formRoles.includes('panel') && (
            <div className="pt-3 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="label font-bold text-navy mb-0">
                  8. Tugasan Kategori Anugerah Panel:
                </label>
                <div className="flex gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setFormCategoryIds(awards.map((a) => a.id))}
                    className="text-navy hover:underline font-semibold cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setFormCategoryIds([])}
                    className="text-gray-500 hover:underline cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* KHUSUS UNTUK PENGURUSAN PDP TERBAIK - PILIH PROGRAM */}
              {formCategoryIds.some((id) => {
                const aw = awards.find((a) => a.id === id);
                return aw?.name.toLowerCase().includes('pdp') || id === 'award-12';
              }) ? (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-300/80 space-y-1.5">
                  <label className="label font-bold text-amber-950 text-xs mb-0 flex items-center justify-between">
                    <span>Program / Bahagian bagi Pengurusan PdP Terbaik *</span>
                    <Badge variant="gold" className="text-[10px] uppercase">Wajib bagi PdP</Badge>
                  </label>
                  <p className="text-[11px] text-amber-800 leading-tight">
                    Sila pilih program/unit yang dinilai oleh Ketua Program / Panel ini:
                  </p>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value.toUpperCase())}
                    className="input-field text-xs font-bold text-navy bg-white border-amber-300 focus:border-amber-500"
                    required
                  >
                    <option value="">-- Sila Pilih Program --</option>
                    <option value="SKE">SKE - Sijil Teknologi Elektrik</option>
                    <option value="STS">STS - Sijil Teknologi Penyejukan & Penyamanan Udara</option>
                    <option value="STM">STM - Sijil Teknologi Motosikal</option>
                    <option value="SAU">SAU - Sijil Teknologi Automotif</option>
                    <option value="DCV">DCV - Diploma Multimedia Kreatif</option>
                    <option value="AM">AM - Unit Pengajian Am</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label text-[11px] text-gray-600">Bahagian / Division Panel (Pilihan):</label>
                  <select
                    value={formDivision}
                    onChange={(e) => setFormDivision(e.target.value.toUpperCase())}
                    className="input-field text-xs uppercase"
                  >
                    <option value="">-- Tiada Bahagian Khusus --</option>
                    <option value="SKE">SKE</option>
                    <option value="STS">STS</option>
                    <option value="STM">STM</option>
                    <option value="SAU">SAU</option>
                    <option value="DCV">DCV</option>
                    <option value="AM">AM</option>
                    <option value="ADMINISTRATION">ADMINISTRATION</option>
                    <option value="PSH">PSH</option>
                  </select>
                </div>
              )}

              <p className="text-[11px] text-gray-500 mb-1">
                Tandakan anugerah yang ditugaskan kepada panel ini:
              </p>

              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                {awards.map((aw) => {
                  const isCatSelected = formCategoryIds.includes(aw.id);
                  return (
                    <label
                      key={aw.id}
                      className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                        isCatSelected ? 'bg-gold/15 text-navy font-semibold' : 'hover:bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isCatSelected}
                        onChange={() => handleToggleCategoryCheckbox(aw.id)}
                        className="rounded text-gold focus:ring-gold cursor-pointer"
                      />
                      <span className="flex-1 truncate">{aw.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button variant="gold" type="submit" loading={saving} className="px-6 font-bold cursor-pointer">
              {editingUserId ? 'Simpan Perubahan' : 'Simpan Pengguna'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESET KATA LALUAN PENGGUNA OLEH URUSETIA */}
      <Modal
        isOpen={!!resetModalTarget}
        onClose={() => setResetModalTarget(null)}
        title="Reset Kata Laluan Pengguna"
        size="md"
      >
        <form onSubmit={handleAdminResetPassword} className="space-y-4">
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950">
                Menetapkan semula kata laluan Supabase Auth untuk:
              </p>
              <p className="text-sm font-extrabold text-navy mt-1">
                {resetModalTarget?.full_name}
              </p>
              <p className="text-xs text-navy/70 font-mono mt-0.5">
                Username: {resetModalTarget?.username || resetModalTarget?.email.split('@')[0]}
              </p>
            </div>
          </div>

          <div>
            <label className="label font-bold text-navy">Kata Laluan Baru *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={resetShowPassword ? 'text' : 'password'}
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                className="input-field text-xs pl-9 pr-9"
                placeholder="Sekurang-kurangnya 6 aksara"
                required
              />
              <button
                type="button"
                onClick={() => setResetShowPassword(!resetShowPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {resetShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label font-bold text-navy">Sahkan Kata Laluan Baru *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={resetShowPassword ? 'text' : 'password'}
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                className="input-field text-xs pl-9"
                placeholder="Ulang kata laluan baru"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setResetModalTarget(null)}
              disabled={resettingPassword}
            >
              Batal
            </Button>
            <Button
              variant="gold"
              type="submit"
              loading={resettingPassword}
              className="flex items-center gap-1.5 px-5 font-bold cursor-pointer"
            >
              <Key className="w-4 h-4" />
              SIMPAN KATA LALUAN
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DIALOG: STATUS TOGGLE */}
      <ConfirmDialog
        isOpen={!!statusConfirmTarget}
        onClose={() => setStatusConfirmTarget(null)}
        onConfirm={handleConfirmToggleStatus}
        title={statusConfirmTarget?.is_active ? 'Nyahaktifkan Akaun Pengguna?' : 'Aktifkan Semula Akaun?'}
        message={
          statusConfirmTarget?.is_active
            ? `Adakah anda pasti ingin menyahaktifkan akaun ${statusConfirmTarget?.full_name}? Pengguna ini tidak lagi dibenarkan log masuk ke dalam sistem sehingga diaktifkan semula.`
            : `Adakah anda pasti ingin mengaktifkan semula akaun ${statusConfirmTarget?.full_name}? Pengguna akan dapat mengakses sistem semula.`
        }
        confirmText={statusConfirmTarget?.is_active ? 'Ya, Nyahaktifkan' : 'Ya, Aktifkan'}
        variant={statusConfirmTarget?.is_active ? 'danger' : 'primary'}
      />
    </DashboardLayout>
  );
}
