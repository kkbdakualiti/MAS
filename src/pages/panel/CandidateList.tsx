import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Plus, ArrowLeft, UserPlus, FileEdit, CheckCircle2, Lock, Eye, Info, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { PDP_DIVISIONS } from '@/lib/constants';
import type { PanelCandidate, Evaluation } from '@/lib/types';
import toast from 'react-hot-toast';

interface CandidateWithEval extends PanelCandidate {
  evaluation?: Evaluation;
}

export default function CandidateList() {
  const { awardId } = useParams<{ awardId: string }>();
  const navigate = useNavigate();
  const { user, profile, role, activeRole, activeYear } = useAuth();
  const { data: awards = [] } = useAwards();
  const award = awards.find((a) => a.id === awardId);

  const [candidates, setCandidates] = useState<CandidateWithEval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssigned, setIsAssigned] = useState<boolean>(true);
  const [assignedDivision, setAssignedDivision] = useState<string | null>(null);
  const [selectedDivisionTab, setSelectedDivisionTab] = useState<string>('all');
  const [candidateToDelete, setCandidateToDelete] = useState<CandidateWithEval | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentRole = activeRole || role;

  const canDeleteCandidate = (cand: PanelCandidate) => {
    if (!user) return false;
    if (currentRole === 'admin') return true;
    if (currentRole === 'panel') {
      return cand.created_by === user.id || cand.panel_id === user.id;
    }
    return false;
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete || !user || !currentRole) return;
    setIsDeleting(true);
    try {
      const result = localDB.deleteCandidate(
        candidateToDelete.id,
        user.id,
        currentRole,
        profile?.full_name || user.email || 'Pengguna'
      );

      if (!result.success) {
        toast.error(result.error || 'Gagal memadam calon.');
        setIsDeleting(false);
        return;
      }

      if (isSupabaseConfigured()) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidateToDelete.id);
          if (isUuid) {
            await supabase
              .from('evaluations')
              .delete()
              .eq('panel_candidate_id', candidateToDelete.id);
            await supabase
              .from('panel_candidates')
              .delete()
              .eq('id', candidateToDelete.id);
          }

          await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.full_name || user.email || 'Pengguna',
            user_role: currentRole,
            action: 'Padam Calon',
            details: `Memadam calon: ${candidateToDelete.candidate_name} (${candidateToDelete.division})`,
            entity_type: 'candidate',
            entity_id: candidateToDelete.id,
          });
        } catch (e) {
          console.warn('Supabase audit/delete sync notice:', e);
        }
      }

      toast.success(`Calon "${candidateToDelete.candidate_name}" berjaya dipadam.`);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateToDelete.id));
      setCandidateToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Ralat semasa memadam calon.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchMyCandidates() {
      if (!user || !awardId || !activeYear) return;
      setLoading(true);

      await localDB.syncAssignmentsFromCloud();
      await localDB.syncCandidatesFromCloud();

      const assignedIds = localDB.getAssignedAwardIds(user.id, user.email, activeYear.id);
      const assigned = assignedIds.includes(awardId);

      const asgn = localDB.getEvaluatorAssignment(user.id, user.email, awardId, activeYear.id);
      const division = asgn?.division || profile?.division || (profile?.position?.toUpperCase().includes('SKE') ? 'SKE' : (profile?.position?.toUpperCase().includes('STS') ? 'STS' : (profile?.position?.toUpperCase().includes('STM') ? 'STM' : (profile?.position?.toUpperCase().includes('SAU') ? 'SAU' : (profile?.position?.toUpperCase().includes('DCV') ? 'DCV' : (profile?.position?.toUpperCase().includes('AM') ? 'AM' : null))))));
      if (division) {
        setAssignedDivision(division);
        setSelectedDivisionTab(division);
      }

      setIsAssigned(assigned);
      if (!assigned) {
        setLoading(false);
        return;
      }

      const myCands = localDB.getCandidates(awardId, activeYear.id, user.id || profile?.id);
      const joined = myCands.map((c) => ({
        ...c,
        evaluation: c.evaluations?.[0],
      }));
      setCandidates(joined);
      setLoading(false);
    }

    fetchMyCandidates();
  }, [user, awardId, activeYear]);

  const isPdpCategory = award?.name.toLowerCase().includes('pdp');

  // Enforce confidential program isolation: If panel is assigned to a specific division (e.g. DCV),
  // they CANNOT view candidates from other divisions!
  const filteredCandidates =
    isPdpCategory && assignedDivision && currentRole === 'panel'
      ? candidates.filter((c) => c.division?.toUpperCase() === assignedDivision.toUpperCase())
      : candidates;

  const completedCandidates = filteredCandidates.filter((c) => c.evaluation?.status === 'submitted');

  const displayedCandidates =
    isPdpCategory && selectedDivisionTab !== 'all' && (!assignedDivision || currentRole === 'admin')
      ? filteredCandidates.filter((c) => c.division === selectedDivisionTab)
      : filteredCandidates;

  if (!loading && !isAssigned) {
    return (
      <DashboardLayout>
        <Card className="text-center py-16 max-w-lg mx-auto my-12">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <Badge variant="warning" className="mb-3">Akses Disekat</Badge>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Kategori Tidak Ditugaskan</h3>
          <p className="text-sm text-gray-500 mb-6">
            Anda tidak ditugaskan sebagai panel penilai bagi kategori <strong className="text-navy">{award?.name || 'ini'}</strong> untuk Sesi Tahun {activeYear?.year}. Anda hanya dibenarkan melihat dan menilai kategori yang telah ditetapkan oleh Urus Setia Pentadbir.
          </p>
          <Button variant="primary" onClick={() => navigate('/panel')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Penilaian Saya
          </Button>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={award?.name || 'Senarai Calon Saya'}
        subtitle={
          isPdpCategory
            ? 'Penilaian Pengurusan PdP Terbaik dinilai mengikut bahagian masing-masing (SKE, STS, STM, SAU, DCV, AM) dengan pemenang bagi setiap bahagian.'
            : 'Senarai calon yang anda daftarkan bagi kategori ini. Anda hanya boleh melihat dan menilai calon anda sendiri.'
        }
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/panel')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Papan Utama
            </Button>
            <Button variant="gold" onClick={() => navigate(`/panel/award/${awardId}/add`)}>
              <Plus className="w-4 h-4 mr-1" /> Tambah Calon
            </Button>
          </div>
        }
      />

      {/* PdP Special Notice: Confidential Program-Specific Scope for Panel */}
      {isPdpCategory && (
        assignedDivision && currentRole === 'panel' ? (
          <div className="mb-6 p-4 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center font-extrabold text-sm shrink-0 shadow-md">
                {assignedDivision}
              </div>
              <div>
                <p className="font-bold text-sm text-navy flex items-center gap-2">
                  <span>Akses Khas Ketua Program: Bahagian {assignedDivision}</span>
                  <Badge variant="gold" className="text-[10px] font-bold tracking-wider uppercase">SULIT</Badge>
                </p>
                <p className="text-blue-800 text-xs mt-0.5">
                  Sebagai Ketua Program, anda hanya dibenarkan melihat dan menilai calon bagi program <strong>{assignedDivision}</strong> sahaja. Calon daripada program lain tidak dipaparkan atas faktor kerahsiaan.
                </p>
              </div>
            </div>
            <div className="sm:text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-blue-200 shadow-sm">
              <span className="text-[11px] font-medium text-gray-500 block">Calon {assignedDivision}:</span>
              <span className="text-sm font-extrabold text-navy font-mono">{filteredCandidates.length} Calon</span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-blue-950">
                  Pengurusan PdP Terbaik Mengikut Bahagian
                </span>
                {assignedDivision && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-navy text-gold border border-navy shadow-sm">
                    Bahagian Anda: {assignedDivision}
                  </span>
                )}
              </div>
              Ketua Program (KP) menilai calon dari bahagian masing-masing. Setiap bahagian ({PDP_DIVISIONS.join(', ')}) akan mempunyai pemenang anugerah tersendiri di bawah kategori ini.
            </div>
          </div>
        )
      )}

      {/* Division Tabs for PdP: Only show when Admin or Panel with NO division restriction */}
      {isPdpCategory && (!assignedDivision || currentRole === 'admin') && candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-bold text-gray-500 mr-1">Tapis Bahagian:</span>
          <button
            onClick={() => setSelectedDivisionTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedDivisionTab === 'all'
                ? 'bg-navy text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({candidates.length})
          </button>
          {PDP_DIVISIONS.map((div) => {
            const count = candidates.filter((c) => c.division === div).length;
            return (
              <button
                key={div}
                onClick={() => setSelectedDivisionTab(div)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDivisionTab === div
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {div} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-400">Memuatkan calon anda...</div>
      ) : candidates.length === 0 ? (
        <Card>
          <EmptyState
            title="Tiada Calon Didaftarkan"
            message="Anda belum mendaftarkan mana-mana calon untuk kategori ini. Klik butang 'Tambah Calon' untuk mendaftar dan memulakan pemarkahan."
            icon={UserPlus}
            action={{
              label: '+ Tambah Calon Sekarang',
              onClick: () => navigate(`/panel/award/${awardId}/add`),
            }}
          />
        </Card>
      ) : displayedCandidates.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-xs text-gray-500">
            Tiada calon didaftarkan bagi bahagian <strong>{selectedDivisionTab}</strong>.
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="table-header">
                    <th className="px-5 py-3 text-left">#</th>
                    <th className="px-5 py-3 text-left">Nama Calon</th>
                    <th className="px-5 py-3 text-left">Bahagian</th>
                    <th className="px-5 py-3 text-center">Jumlah Markah</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayedCandidates.map((cand, idx) => {
                    const isSubmitted = cand.evaluation?.status === 'submitted';
                    const score = cand.evaluation?.total_score;

                    return (
                      <tr key={cand.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-gray-400">{idx + 1}</td>
                        <td className="px-5 py-4 font-bold text-gray-900 text-sm">
                          {cand.candidate_name}
                          {cand.position && <p className="text-xs font-normal text-gray-400">{cand.position}</p>}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="neutral">{cand.division}</Badge>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {score !== null && score !== undefined ? (
                            <span className="font-mono font-bold text-navy text-base">
                              {score} / 100
                            </span>
                          ) : (
                            <span className="text-gray-300 font-mono">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isSubmitted ? (
                            <Badge variant="success">SELESAI</Badge>
                          ) : (
                            <Badge variant="warning">DRAF</Badge>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant={isSubmitted ? 'secondary' : 'primary'}
                              size="sm"
                              onClick={() => navigate(`/panel/award/${awardId}/score/${cand.id}`)}
                            >
                              {isSubmitted ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 mr-1" />
                                  Lihat Markah
                                </>
                              ) : (
                                <>
                                  <FileEdit className="w-3.5 h-3.5 mr-1" />
                                  Beri Markah
                                </>
                              )}
                            </Button>

                            {canDeleteCandidate(cand) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCandidateToDelete(cand)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200"
                                title="Padam Calon"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1" />
                                Padam
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {displayedCandidates.map((cand) => {
              const isSubmitted = cand.evaluation?.status === 'submitted';
              const score = cand.evaluation?.total_score;

              return (
                <Card key={cand.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{cand.candidate_name}</h4>
                      <p className="text-xs text-gray-500">Bahagian: {cand.division}</p>
                      {cand.staff_number && (
                        <p className="text-xs font-mono text-gray-400">No. Staf: {cand.staff_number}</p>
                      )}
                    </div>
                    <Badge variant={isSubmitted ? 'success' : 'warning'}>
                      {isSubmitted ? 'SELESAI' : 'DRAF'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                    <span className="font-mono font-bold text-navy text-sm">
                      Markah: {score !== null && score !== undefined ? `${score} / 100` : '-'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant={isSubmitted ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => navigate(`/panel/award/${awardId}/score/${cand.id}`)}
                      >
                        {isSubmitted ? 'Lihat Markah' : 'Beri Markah'}
                      </Button>

                      {canDeleteCandidate(cand) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCandidateToDelete(cand)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Padam Calon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Evaluation Summary Section if completed */}
          {completedCandidates.length > 0 && (
            <Card className="mt-8 bg-green-50/20 border border-green-200/50">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="font-bold text-navy text-base">Ringkasan Penilaian Diserahkan</h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Calon-calon berikut telah selesai dinilai dan markah telah dikunci secara selamat dalam sistem.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {completedCandidates.map((cand) => (
                  <div key={cand.id} className="p-3 bg-white rounded-lg border border-gray-200/60 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-xs">{cand.candidate_name}</p>
                      <p className="text-[11px] text-gray-400">{cand.division}</p>
                    </div>
                    <span className="font-mono font-bold text-navy text-sm">
                      {cand.evaluation?.total_score} / 100
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Modal for Candidate Deletion */}
      <Modal
        isOpen={!!candidateToDelete}
        onClose={() => setCandidateToDelete(null)}
        title="Sahkan Pemadaman Calon"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-200 text-red-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p>
              Adakah anda pasti mahu memadam calon ini? Tindakan ini akan turut memadam rekod penilaian serta markah berkaitan calon ini.
            </p>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl space-y-1.5 text-xs text-gray-700 border border-gray-200/70">
            <p>
              <strong>Nama Calon:</strong> {candidateToDelete?.candidate_name}
            </p>
            <p>
              <strong>Kategori:</strong> {award?.name}
            </p>
            {candidateToDelete?.division && (
              <p>
                <strong>Bahagian:</strong> {candidateToDelete.division}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              variant="secondary"
              onClick={() => setCandidateToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              loading={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Padam Calon
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
