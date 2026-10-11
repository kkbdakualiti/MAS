import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/utils/formatters';
import type { PanelCandidate, Evaluation, Evaluator, EvaluatorAssignment } from '@/lib/types';
import {
  ShieldAlert,
  Trash2,
  CheckSquare,
  Square,
  AlertTriangle,
  Sparkles,
  Tag,
  CheckCircle2,
  Clock,
  Filter,
  UserCheck,
  Award as AwardIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FullCandidate extends PanelCandidate {
  evaluations?: Evaluation[];
  awardName?: string;
  creatorName?: string;
}

interface FullEvaluation extends Evaluation {
  candidateName?: string;
  awardName?: string;
  panelName?: string;
  division?: string;
}

export default function TestDataManagement() {
  const { user, profile, activeRole, activeYear, loginAsEvaluator } = useAuth();
  const navigate = useNavigate();
  const { data: awards = [] } = useAwards();

  const [activeTab, setActiveTab] = useState<'candidates' | 'scores' | 'accounts' | 'tagging'>('candidates');
  const [candidates, setCandidates] = useState<FullCandidate[]>([]);
  const [evaluations, setEvaluations] = useState<FullEvaluation[]>([]);
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected for deletion
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [selectedEvalIds, setSelectedEvalIds] = useState<string[]>([]);

  // Confirmation modals
  const [isDeleteCandidatesModalOpen, setIsDeleteCandidatesModalOpen] = useState(false);
  const [isDeleteScoresModalOpen, setIsDeleteScoresModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Account dummy management state
  const [accountToDelete, setAccountToDelete] = useState<Evaluator | null>(null);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'all' | 'dummy' | 'real'>('all');

  // Filter state for Tab 4 (Tagging)
  const [filterCategory, setFilterCategory] = useState<string>('');

  const loadAllData = async () => {
    if (!activeYear) return;
    setLoading(true);

    const awardMap = new Map(awards.map((a) => [a.id, a.name]));

    if (!isSupabaseConfigured()) {
      const allCands = localDB.getCandidates('', activeYear.id);
      const allEvalsStored = JSON.parse(localStorage.getItem('kkbda_evaluations') || '[]');
      const allEvaluators = localDB.getEvaluators();
      const allAsgns = localDB.getAssignments('', activeYear.id);
      const evalMap = new Map(allEvaluators.map((e) => [e.id, e.name]));
      const profileMap = new Map(allEvaluators.map((e) => [e.profile_id || '', e.name]));

      const mappedCands: FullCandidate[] = allCands.map((c) => ({
        ...c,
        awardName: awardMap.get(c.award_id) || 'Kategori Anugerah',
        creatorName:
          profileMap.get(c.created_by) || evalMap.get(c.created_by) || 'Panel / Pentadbir',
      }));

      const candMap = new Map(allCands.map((c) => [c.id, c]));

      const mappedEvals: FullEvaluation[] = allEvalsStored.map((e: Evaluation) => {
        const cand = candMap.get(e.panel_candidate_id);
        return {
          ...e,
          candidateName: cand?.candidate_name || 'Calon',
          awardName: awardMap.get(e.award_id) || 'Kategori',
          panelName: profileMap.get(e.panel_id) || evalMap.get(e.panel_id) || 'Panel Penilai',
          division: cand?.division || '-',
          is_dummy: e.is_dummy ?? cand?.is_dummy ?? false,
        };
      });

      setCandidates(mappedCands);
      setEvaluations(mappedEvals);
      setEvaluators(allEvaluators);
      setAssignments(allAsgns);
      setLoading(false);
      return;
    }

    try {
      const [candRes, evalRes, evlRes, asgRes] = await Promise.all([
        supabase
          .from('panel_candidates')
          .select('*, award:awards(name)')
          .eq('award_year_id', activeYear.id),
        supabase
          .from('evaluations')
          .select('*, panel_candidate:panel_candidates(candidate_name, division), award:awards(name)')
          .eq('award_year_id', activeYear.id),
        supabase.from('evaluators').select('*').order('name'),
        supabase.from('evaluator_assignments').select('*').eq('award_year_id', activeYear.id),
      ]);

      setCandidates(
        (candRes.data || []).map((c: any) => ({
          ...c,
          awardName: c.award?.name || 'Kategori Anugerah',
          creatorName: 'Panel Penilai',
        }))
      );
      setEvaluations(
        (evalRes.data || []).map((e: any) => ({
          ...e,
          candidateName: e.panel_candidate?.candidate_name || 'Calon',
          awardName: e.award?.name || 'Kategori',
          panelName: 'Panel Penilai',
          division: e.panel_candidate?.division || '-',
        }))
      );
      setEvaluators((evlRes.data || []) as Evaluator[]);
      setAssignments((asgRes.data || []) as EvaluatorAssignment[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [activeYear, awards]);

  const dummyCandidates = candidates.filter((c) => c.is_dummy === true);
  const dummyEvaluations = evaluations.filter((e) => e.is_dummy === true);
  const dummyAccounts = evaluators.filter((e) => e.is_dummy === true);

  // Toggle selection
  const handleToggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllCandidates = () => {
    setSelectedCandidateIds(dummyCandidates.map((c) => c.id));
  };

  const handleDeselectAllCandidates = () => {
    setSelectedCandidateIds([]);
  };

  const handleToggleEvaluationSelection = (id: string) => {
    setSelectedEvalIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllEvaluations = () => {
    setSelectedEvalIds(dummyEvaluations.map((e) => e.id));
  };

  const handleDeselectAllEvaluations = () => {
    setSelectedEvalIds([]);
  };

  // Toggle dummy tag for candidate
  const handleToggleCandidateDummy = async (candidateId: string, currentDummy: boolean) => {
    const newStatus = !currentDummy;
    if (!isSupabaseConfigured()) {
      localDB.setCandidateDummyStatus(candidateId, newStatus);
      localDB.logAudit({
        userId: user?.id,
        userName: profile?.full_name || 'Urusetia',
        activeRole: activeRole || 'admin',
        action: newStatus ? 'Tanda Calon Ujian' : 'Tanda Calon Sebenar',
        details: `Menukar status calon ID ${candidateId} kepada ${newStatus ? 'DUMMY' : 'SEBENAR'}`,
        entityType: 'candidate',
        entityId: candidateId,
      });
      toast.success(newStatus ? 'Calon ditanda sebagai Data Ujian' : 'Calon dikembalikan ke Data Sebenar');
      await loadAllData();
    } else {
      await supabase.from('panel_candidates').update({ is_dummy: newStatus }).eq('id', candidateId);
      toast.success(newStatus ? 'Calon ditanda sebagai Data Ujian' : 'Calon dikembalikan ke Data Sebenar');
      await loadAllData();
    }
  };

  // Toggle dummy tag for evaluator account
  const handleToggleAccountDummy = (evaluatorId: string, currentDummy: boolean) => {
    const newStatus = !currentDummy;
    localDB.setEvaluatorDummyStatus(evaluatorId, newStatus);
    localDB.logAudit({
      userId: user?.id,
      userName: profile?.full_name || 'Urusetia',
      activeRole: activeRole || 'admin',
      action: newStatus ? 'Tanda Akaun Ujian' : 'Tanda Akaun Sebenar',
      details: `Menukar status akaun panel ID ${evaluatorId} kepada ${newStatus ? 'DUMMY' : 'SEBENAR'}`,
      entityType: 'evaluator',
      entityId: evaluatorId,
    });
    toast.success(newStatus ? 'Akaun panel ditanda sebagai Akaun Ujian' : 'Akaun panel dikembalikan ke Akaun Sebenar');
    loadAllData();
  };

  // Delete Evaluator Account
  const handleOpenDeleteAccountModal = (ev: Evaluator) => {
    setAccountToDelete(ev);
    setIsDeleteAccountModalOpen(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (!accountToDelete || !user) return;
    setIsDeleting(true);
    try {
      const res = localDB.deleteEvaluatorAccount(
        accountToDelete.id,
        user.id,
        'admin',
        profile?.full_name || 'Urusetia'
      );
      if (!res.success) {
        toast.error(res.error || 'Gagal memadam akaun.');
      } else {
        toast.success(`Akaun ujian "${accountToDelete.name}" berjaya dipadam secara selamat.`);
        setIsDeleteAccountModalOpen(false);
        setAccountToDelete(null);
        loadAllData();
      }
    } catch (err: any) {
      toast.error('Ralat: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Launch test as this panel
  const handleLaunchTestPanel = async (ev: Evaluator) => {
    const res = await loginAsEvaluator(ev);
    toast.success(`Memasuki mod ujian sebagai: ${ev.name}`);
    if (res.roles.length > 1) {
      navigate('/select-role');
    } else {
      navigate('/panel');
    }
  };

  // Execution: Delete Selected Candidates
  const handleConfirmDeleteCandidates = async () => {
    if (selectedCandidateIds.length === 0 || !user) return;
    setIsDeleting(true);

    try {
      localDB.deleteDummyCandidates(
        selectedCandidateIds,
        user.id,
        'admin',
        profile?.full_name || 'Urusetia'
      );

      if (isSupabaseConfigured()) {
        try {
          const uuidIds = selectedCandidateIds.filter((id) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          );
          if (uuidIds.length > 0) {
            await supabase.from('panel_candidates').delete().in('id', uuidIds);
          }
        } catch (e) {
          console.warn('Supabase delete candidates notice:', e);
        }
      }

      toast.success(`${selectedCandidateIds.length} calon ujian berjaya dipadam.`);
      setSelectedCandidateIds([]);
      setIsDeleteCandidatesModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memadam calon ujian.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Execution: Delete Selected Evaluations
  const handleConfirmDeleteScores = async () => {
    if (selectedEvalIds.length === 0 || !user) return;
    setIsDeleting(true);

    try {
      localDB.deleteDummyScores(
        selectedEvalIds,
        user.id,
        'admin',
        profile?.full_name || 'Urusetia'
      );

      if (isSupabaseConfigured()) {
        try {
          const uuidIds = selectedEvalIds.filter((id) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
          );
          if (uuidIds.length > 0) {
            await supabase.from('evaluations').delete().in('id', uuidIds);
          }
        } catch (e) {
          console.warn('Supabase delete scores notice:', e);
        }
      }

      toast.success(`${selectedEvalIds.length} rekod markah ujian berjaya dipadam.`);
      setSelectedEvalIds([]);
      setIsDeleteScoresModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memadam markah ujian.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered accounts for Tab 3
  const filteredEvaluators = evaluators.filter((ev) => {
    if (accountFilter === 'dummy') return ev.is_dummy === true;
    if (accountFilter === 'real') return !ev.is_dummy;
    return true;
  });

  const awardMap = new Map(awards.map((a) => [a.id, a.name]));
  const accountStats = accountToDelete ? localDB.getEvaluatorStats(accountToDelete.id) : null;

  return (
    <DashboardLayout>
      <PageHeader
        title="Pengurusan Data Ujian (Dummy Data)"
        subtitle="Modul khas Urusetia bagi mengaudit, menandakan, dan memadam data calon, markah, serta akaun ujian secara terpilih tanpa menjejaskan data sebenar."
      />

      {/* Safety Notice Banner */}
      <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950 text-sm mb-1">
            Polisi Keselamatan Integriti Data Urusetia:
          </p>
          <p className="leading-relaxed">
            Sistem <strong>tidak akan memadam sebarang data secara automatik</strong>. Anda boleh menyemak rekod, menandakannya sebagai <strong>Data Ujian</strong> terlebih dahulu, dan memadamnya secara terpilih setelah membuat pengesahan.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'candidates'
              ? 'border-gold text-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Senarai Calon Ujian</span>
          <Badge variant={dummyCandidates.length > 0 ? 'warning' : 'neutral'} className="ml-1">
            {dummyCandidates.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'scores'
              ? 'border-gold text-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Senarai Markah Ujian</span>
          <Badge variant={dummyEvaluations.length > 0 ? 'warning' : 'neutral'} className="ml-1">
            {dummyEvaluations.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('accounts')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'accounts'
              ? 'border-gold text-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <UserCheck className="w-4 h-4 text-purple-600" />
          <span>Akaun Ujian / Dummy</span>
          <Badge variant={dummyAccounts.length > 0 ? 'warning' : 'neutral'} className="ml-1">
            {dummyAccounts.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('tagging')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'tagging'
              ? 'border-gold text-navy'
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Tag className="w-4 h-4 text-blue-500" />
          <span>Audit & Penandaan Calon</span>
          <Badge variant="gold" className="ml-1">
            {candidates.length} Calon
          </Badge>
        </button>
      </div>

      {/* TAB 1: SENARAI CALON UJIAN */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAllCandidates}
                disabled={dummyCandidates.length === 0}
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Pilih Semua ({dummyCandidates.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeselectAllCandidates}
                disabled={selectedCandidateIds.length === 0}
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Nyahpilih Semua
              </Button>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteCandidatesModalOpen(true)}
              disabled={selectedCandidateIds.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Padam Dipilih ({selectedCandidateIds.length})
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            {dummyCandidates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 text-base">Tiada Data Calon Ujian</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Semua calon dalam sistem kini diklasifikasikan sebagai data sebenar. Jika ada calon ujian, anda boleh menandakannya di tab <strong>"Audit & Penandaan Calon"</strong>.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 w-10 text-center">Pilih</th>
                      <th className="px-4 py-3">Nama Calon</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Bahagian</th>
                      <th className="px-4 py-3">Dimasukkan Oleh</th>
                      <th className="px-4 py-3">Tarikh</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {dummyCandidates.map((c) => {
                      const isSelected = selectedCandidateIds.includes(c.id);
                      return (
                        <tr
                          key={c.id}
                          className={`hover:bg-gray-50/60 transition-colors ${isSelected ? 'bg-red-50/40' : ''}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleCandidateSelection(c.id)}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">{c.candidate_name}</span>
                            {c.position && <p className="text-[11px] text-gray-400">{c.position}</p>}
                          </td>
                          <td className="px-4 py-3 font-medium text-navy">{c.awardName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral">{c.division}</Badge>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{c.creatorName}</td>
                          <td className="px-4 py-3 font-mono text-gray-400">
                            {formatDateTime(c.created_at)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              DATA UJIAN
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleToggleCandidateDummy(c.id, true)}
                                title="Keluarkan daripada data ujian dan jadikan data sebenar"
                              >
                                Batal Tanda Ujian
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedCandidateIds([c.id]);
                                  setIsDeleteCandidatesModalOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: SENARAI MARKAH UJIAN */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSelectAllEvaluations}
                disabled={dummyEvaluations.length === 0}
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Pilih Semua ({dummyEvaluations.length})
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDeselectAllEvaluations}
                disabled={selectedEvalIds.length === 0}
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Nyahpilih Semua
              </Button>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteScoresModalOpen(true)}
              disabled={selectedEvalIds.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Padam Dipilih ({selectedEvalIds.length})
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            {dummyEvaluations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 text-base">Tiada Markah Ujian Direkodkan</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Semua rekod pemarkahan kini bersih daripada tanda data ujian.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3 w-10 text-center">Pilih</th>
                      <th className="px-4 py-3">Nama Calon</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Panel Penilai</th>
                      <th className="px-4 py-3 text-center">Markah</th>
                      <th className="px-4 py-3">Tarikh</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {dummyEvaluations.map((ev) => {
                      const isSelected = selectedEvalIds.includes(ev.id);
                      return (
                        <tr
                          key={ev.id}
                          className={`hover:bg-gray-50/60 transition-colors ${isSelected ? 'bg-red-50/40' : ''}`}
                        >
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleEvaluationSelection(ev.id)}
                              className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-900">{ev.candidateName}</td>
                          <td className="px-4 py-3 font-medium text-navy">{ev.awardName}</td>
                          <td className="px-4 py-3 text-gray-700">{ev.panelName}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-navy">
                            {ev.total_score !== null ? `${ev.total_score} / 100` : 'Draf'}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-400">
                            {formatDateTime(ev.created_at)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant={ev.status === 'submitted' ? 'success' : 'warning'}>
                              {ev.status === 'submitted' ? 'SELESAI' : 'DRAF'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setSelectedEvalIds([ev.id]);
                                setIsDeleteScoresModalOpen(true);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Padam
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: AKAUN UJIAN / DUMMY (NEW) */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                variant={accountFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAccountFilter('all')}
              >
                Semua Akaun ({evaluators.length})
              </Button>
              <Button
                variant={accountFilter === 'dummy' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAccountFilter('dummy')}
              >
                Akaun Ujian Sahaja ({dummyAccounts.length})
              </Button>
              <Button
                variant={accountFilter === 'real' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAccountFilter('real')}
              >
                Akaun Sebenar ({evaluators.length - dummyAccounts.length})
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Perlindungan Keselamatan: Hanya akaun yang ditandakan sebagai <strong>DATA UJIAN</strong> boleh dipadam bagi mengelakkan akaun panel sebenar terpadam secara tidak sengaja.
            </p>
          </div>

          <Card className="p-0 overflow-hidden">
            {filteredEvaluators.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 text-base">Tiada Rekod Akaun</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  Tiada akaun yang sepadan dengan tapisan yang dipilih.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">Nama Panel</th>
                      <th className="px-4 py-3">E-mel</th>
                      <th className="px-4 py-3">Sumber</th>
                      <th className="px-4 py-3">Kategori Ditugaskan</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredEvaluators.map((ev) => {
                      const isDummy = !!ev.is_dummy;
                      const myAsgns = assignments.filter((a) => a.evaluator_id === ev.id);
                      const isLegacyDemo = ev.id === 'eval-1' || ev.email === 'panel@kkbda.edu.my';

                      return (
                        <tr
                          key={ev.id}
                          className={`hover:bg-gray-50/60 transition-colors ${isDummy ? 'bg-amber-50/20' : ''}`}
                        >
                          <td className="px-4 py-3">
                            <span className="font-bold text-gray-900">{ev.name}</span>
                            {ev.position && <p className="text-[11px] text-gray-400">{ev.position}</p>}
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-600">{ev.email}</td>
                          <td className="px-4 py-3">
                            {isLegacyDemo ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                <Sparkles className="w-3 h-3" />
                                Demo Awal
                              </span>
                            ) : (
                              <span className="text-gray-500">Pendaftaran Urusetia</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-navy font-mono">
                              {myAsgns.length} Kategori
                            </span>
                            {myAsgns.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {myAsgns.slice(0, 2).map((a) => (
                                  <span key={a.id} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                    {awardMap.get(a.award_id) || a.award_id}
                                  </span>
                                ))}
                                {myAsgns.length > 2 && (
                                  <span className="text-[10px] text-gray-400">+{myAsgns.length - 2} lagi</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isDummy ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                DATA UJIAN
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-900 border border-green-300">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                DATA SEBENAR
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleLaunchTestPanel(ev)}
                                title="Masuk mod ujian sebagai panel ini"
                                className="text-[11px]"
                              >
                                <UserCheck className="w-3 h-3 mr-1 text-gold" />
                                Uji Panel Ini
                              </Button>

                              <Button
                                variant={isDummy ? 'secondary' : 'gold'}
                                size="sm"
                                onClick={() => handleToggleAccountDummy(ev.id, isDummy)}
                                className="text-[11px]"
                              >
                                {isDummy ? 'Tukar ke Sebenar' : 'Tanda sbg Ujian'}
                              </Button>

                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleOpenDeleteAccountModal(ev)}
                                disabled={!isDummy}
                                title={isDummy ? 'Padam akaun ujian ini' : 'Tandakan sebagai Akaun Ujian terlebih dahulu untuk memadam'}
                                className="text-[11px]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: AUDIT & PENANDAAN DATA CALON */}
      {activeTab === 'tagging' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field py-1 text-xs"
              >
                <option value="">Semua Kategori ({candidates.length})</option>
                {awards.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Klik butang togol pada mana-mana calon untuk menukar klasifikasi antara{' '}
              <strong>Data Sebenar</strong> atau <strong>Data Ujian</strong>.
            </p>
          </div>

          <Card className="p-0 overflow-hidden">
            {candidates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <p className="text-xs text-gray-400">Tiada calon didaftarkan dalam sistem.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="table-header">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Nama Calon</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Bahagian</th>
                      <th className="px-4 py-3">Dimasukkan Oleh</th>
                      <th className="px-4 py-3 text-center">Klasifikasi Semasa</th>
                      <th className="px-4 py-3 text-right">Togol Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {candidates
                      .filter((c) => !filterCategory || c.award_id === filterCategory)
                      .map((cand, idx) => {
                        const isDummy = !!cand.is_dummy;
                        return (
                          <tr key={cand.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3 font-mono text-gray-400">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-900">{cand.candidate_name}</span>
                              {cand.position && (
                                <p className="text-[11px] text-gray-400">{cand.position}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-navy">{cand.awardName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="neutral">{cand.division}</Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{cand.creatorName}</td>
                            <td className="px-4 py-3 text-center">
                              {isDummy ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                                  DATA UJIAN
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-900 border border-green-300">
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  DATA SEBENAR
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant={isDummy ? 'secondary' : 'gold'}
                                size="sm"
                                onClick={() => handleToggleCandidateDummy(cand.id, isDummy)}
                              >
                                {isDummy ? 'Tukar ke Data Sebenar' : 'Tanda Sebagai Ujian'}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE CANDIDATES */}
      <Modal
        isOpen={isDeleteCandidatesModalOpen}
        onClose={() => setIsDeleteCandidatesModalOpen(false)}
        title="Pengesahan Pemadaman Calon Ujian"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Amaran Pemadaman Data:</p>
              <p className="mt-1 leading-relaxed">
                Anda akan memadam <strong>{selectedCandidateIds.length}</strong> calon ujian berserta
                semua rekod markah dan penilaian berkaitan calon tersebut. Tindakan ini tidak boleh
                dibatalkan. Teruskan?
              </p>
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-1 text-xs">
            <p className="font-bold text-gray-700 mb-2">Senarai Calon Terpilih:</p>
            {candidates
              .filter((c) => selectedCandidateIds.includes(c.id))
              .map((c) => (
                <div key={c.id} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="font-semibold text-gray-900">{c.candidate_name}</span>
                  <span className="text-gray-500 font-mono">
                    {c.awardName} ({c.division})
                  </span>
                </div>
              ))}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteCandidatesModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeleteCandidates}
              loading={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Ya, Padam ({selectedCandidateIds.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL: DELETE SCORES */}
      <Modal
        isOpen={isDeleteScoresModalOpen}
        onClose={() => setIsDeleteScoresModalOpen(false)}
        title="Pengesahan Pemadaman Markah Ujian"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Amaran Pemadaman Markah:</p>
              <p className="mt-1 leading-relaxed">
                Anda akan memadam <strong>{selectedEvalIds.length}</strong> rekod markah penilaian ujian. Tindakan ini tidak boleh dibatalkan. Teruskan?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteScoresModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeleteScores}
              loading={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Ya, Padam ({selectedEvalIds.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL: DELETE EVALUATOR ACCOUNT (NEW) */}
      <Modal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        title="Pengesahan Pemadaman Akaun Ujian"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Amaran Pemadaman Akaun Ujian:</p>
              <p className="mt-1 leading-relaxed">
                Anda pasti mahu memadam akaun ujian ini? Tindakan ini akan menghapuskan profil akaun ujian serta membatalkan semua penugasan kategori panel tersebut secara selamat.
              </p>
            </div>
          </div>

          {accountToDelete && (
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/70 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="font-bold text-navy text-sm">{accountToDelete.name}</span>
                <Badge variant="warning">Data Ujian</Badge>
              </div>
              <p className="text-gray-600">E-mel: <strong className="text-gray-900">{accountToDelete.email}</strong></p>

              <div className="pt-2 border-t border-gray-200">
                <p className="font-bold text-gray-700 mb-1.5">Statistik Rekod Berkaitan Akaun Ini:</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Pencalonan:</span>
                    <strong className="font-mono text-navy">{accountStats?.nominationsCount || 0}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Penilaian:</span>
                    <strong className="font-mono text-navy">{accountStats?.evaluationsCount || 0}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Markah Kriteria:</span>
                    <strong className="font-mono text-navy">{accountStats?.scoresCount || 0}</strong>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200 flex justify-between">
                    <span className="text-gray-500">Tugasan Kategori:</span>
                    <strong className="font-mono text-navy">{accountStats?.assignmentsCount || 0}</strong>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                🛡️ <strong>Jaminan Keselamatan:</strong> Kategori anugerah, rubrik pemarkahan, akaun panel lain, dan calon panel lain <strong>TIDAK AKAN TERJEJAS</strong>.
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteAccountModalOpen(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeleteAccount}
              loading={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Ya, Sahkan Padam Akaun Ujian
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
