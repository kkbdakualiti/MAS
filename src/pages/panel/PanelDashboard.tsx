import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Award, ArrowRight, UserPlus, CheckCircle2, User, Lock, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { Award as AwardType, PanelCandidate } from '@/lib/types';
import toast from 'react-hot-toast';

interface AssignedCategory {
  award: AwardType;
  myCandidates: (PanelCandidate & { score?: number | null; isSubmitted?: boolean })[];
  isOpen: boolean;
  isAssigned: boolean;
  assignedDivision?: string | null;
}

export default function PanelDashboard() {
  const { user, profile, activeYear } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<AssignedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'assigned' | 'all'>('assigned');

  useEffect(() => {
    async function fetchPanelAssignments() {
      if (!user || !activeYear) return;
      setLoading(true);

      try {
        await Promise.all([
          localDB.syncAssignmentsFromCloud().catch(() => {}),
          localDB.syncCandidatesFromCloud().catch(() => {}),
        ]);
      } catch (err) {
        console.warn('Panel dashboard sync notice:', err);
      }

      try {
        const awards = localDB.getAwards().filter((a) => a.is_active);
        const assignedIds = localDB.getAssignedAwardIds(user.id, user.email, activeYear.id);
        const allCandidates = localDB.getCandidates('', activeYear.id, user.id || profile?.id);

        const list: AssignedCategory[] = awards.map((award) => {
          const asgn = localDB.getEvaluatorAssignment(user.id, user.email, award.id, activeYear.id);
          const assignedDivision = asgn?.division || profile?.division || (profile?.position?.toUpperCase().includes('SKE') ? 'SKE' : (profile?.position?.toUpperCase().includes('STS') ? 'STS' : (profile?.position?.toUpperCase().includes('STM') ? 'STM' : (profile?.position?.toUpperCase().includes('SAU') ? 'SAU' : (profile?.position?.toUpperCase().includes('DCV') ? 'DCV' : (profile?.position?.toUpperCase().includes('AM') ? 'AM' : null))))));
          let cands = allCandidates.filter((c) => c.award_id === award.id);
          if (award.name.toLowerCase().includes('pdp') && assignedDivision) {
            cands = cands.filter((c) => !c.division || c.division.toUpperCase() === assignedDivision.toUpperCase());
          }
          const formatted = cands.map((c) => {
            const ev = c.evaluations?.[0];
            return {
              ...c,
              score: ev?.total_score,
              isSubmitted: ev?.status === 'submitted',
            };
          });
          return {
            award,
            myCandidates: formatted,
            isOpen: true,
            isAssigned: assignedIds.includes(award.id),
            assignedDivision,
          };
        });

        setCategories(list);
      } catch (err) {
        console.error('Error computing panel dashboard categories:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPanelAssignments();

    const handleAssignmentsChanged = () => {
      fetchPanelAssignments();
    };

    window.addEventListener('kkbda_assignments_changed', handleAssignmentsChanged);
    window.addEventListener('storage', handleAssignmentsChanged);
    window.addEventListener('focus', handleAssignmentsChanged);

    return () => {
      window.removeEventListener('kkbda_assignments_changed', handleAssignmentsChanged);
      window.removeEventListener('storage', handleAssignmentsChanged);
      window.removeEventListener('focus', handleAssignmentsChanged);
    };
  }, [user, activeYear]);

  const assignedCategories = categories.filter((c) => c.isAssigned);
  const displayedCategories = filterTab === 'assigned' ? assignedCategories : categories;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-gold">Portal Panel Penilai</span>
        <h1 className="text-3xl font-extrabold text-navy mt-1">
          SELAMAT DATANG, {profile?.full_name?.toUpperCase() || 'PANEL PENILAI'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sila pilih kategori anugerah yang ditugaskan kepada anda untuk melihat calon, menambah calon baharu, dan memberi markah bagi Sesi Tahun {activeYear?.year || '-'}.
        </p>
      </div>

      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold text-navy flex items-center gap-2 mr-2">
            <Award className="w-5 h-5 text-gold" />
            PENILAIAN SAYA
          </h3>

          {/* Filter Tab Switcher */}
          <div className="inline-flex p-1 bg-gray-100/90 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterTab('assigned')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'assigned'
                  ? 'bg-white text-navy shadow-sm font-bold'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              Kategori Ditugaskan ({assignedCategories.length})
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'all'
                  ? 'bg-white text-navy shadow-sm font-bold'
                  : 'text-gray-500 hover:text-navy'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              Semua Kategori ({categories.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={assignedCategories.length > 0 ? 'success' : 'warning'}>
            {assignedCategories.length} Kategori Ditugaskan
          </Badge>
          <span className="text-xs text-gray-400">
            (daripada {categories.length} keseluruhan)
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Memuatkan tugasan kategori anda...</div>
      ) : filterTab === 'assigned' && assignedCategories.length === 0 ? (
        <Card className="text-center py-12 max-w-lg mx-auto">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-gray-900 text-base mb-1">Tiada Kategori Ditugaskan</h4>
          <p className="text-xs text-gray-500 mb-4">
            Akaun anda belum ditugaskan untuk sebarang kategori anugerah bagi Sesi Tahun {activeYear?.year || '-'}. Sila hubungi Urus Setia Pentadbir (UJK) untuk penetapan tugasan penilaian.
          </p>
          <Button variant="secondary" size="sm" onClick={() => setFilterTab('all')}>
            Lihat Senarai Semua Kategori
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCategories.map(({ award, myCandidates, isOpen, isAssigned, assignedDivision }) => {
            if (isAssigned) {
              return (
                <div
                  key={award.id}
                  onClick={() => navigate(`/panel/award/${award.id}`)}
                  className="card flex flex-col justify-between hover:shadow-card-hover border-2 border-transparent hover:border-gold/40 transition-all cursor-pointer group bg-white"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-white transition-colors">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="success">
                          DITUGASKAN
                        </Badge>
                        <Badge variant={isOpen ? 'gold' : 'neutral'}>
                          {isOpen ? 'DIBUKA' : 'DITUTUP'}
                        </Badge>
                      </div>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base mb-1 group-hover:text-navy transition-colors">
                      {award.name}
                    </h4>

                    {award.name.toLowerCase().includes('pdp') && (
                      <div className="mb-2.5">
                        {assignedDivision ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-navy text-white shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-gold"></span>
                            Bahagian Dinilai: <span className="text-gold font-extrabold">{assignedDivision}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            ⚠️ Bahagian belum diset oleh Admin
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {award.description || 'Penilaian prestasi staf berasaskan rubrik dan kriteria rasmi KKBDA.'}
                    </p>

                    {/* Display Candidates directly on the card */}
                    <div className="p-3 bg-surface rounded-xl border border-gray-100 mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-700">Senarai Calon Anda ({myCandidates.length}):</span>
                      </div>

                      {myCandidates.length === 0 ? (
                        <p className="text-[11px] text-gray-400 italic">
                          Tiada calon didaftarkan lagi. Klik untuk daftar calon pertama.
                        </p>
                      ) : (
                        <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                          {myCandidates.map((cand) => (
                            <div
                              key={cand.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/panel/award/${award.id}/score/${cand.id}`);
                              }}
                              className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-gray-100 hover:border-gold/60 text-xs transition-all"
                            >
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-gold" />
                                <span className="font-medium text-gray-800">{cand.candidate_name}</span>
                              </div>
                              {cand.isSubmitted ? (
                                <span className="font-mono font-bold text-green-700 text-[11px]">
                                  {cand.score} / 100
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold text-[10px]">
                                  {cand.score ? `${cand.score} (Draf)` : 'Belum Dinilai'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/panel/award/${award.id}/add`)}
                      className="text-xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-gold" />
                      + Tambah Calon
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/panel/award/${award.id}`)}
                      className="text-xs"
                    >
                      Buka & Nilai
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            }

            // UNASSIGNED CATEGORY (Disabled / Inactive)
            return (
              <div
                key={award.id}
                onClick={() => {
                  toast.error('Kategori ini tidak ditugaskan kepada anda oleh Pentadbir.');
                }}
                className="card flex flex-col justify-between border-2 border-dashed border-gray-200 bg-gray-50/75 opacity-70 cursor-not-allowed select-none transition-all hover:bg-gray-100/80"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-200/80 flex items-center justify-center text-gray-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral">
                      <Lock className="w-3 h-3 mr-1 inline text-gray-500" />
                      TIDAK DITUGASKAN
                    </Badge>
                  </div>

                  <h4 className="font-bold text-gray-600 text-base mb-1">
                    {award.name}
                  </h4>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-4">
                    {award.description || 'Penilaian prestasi staf berasaskan rubrik dan kriteria rasmi KKBDA.'}
                  </p>

                  {/* Disabled Notice */}
                  <div className="p-3 bg-white/80 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-start gap-2 mb-4">
                    <Lock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-gray-700 block mb-0.5">Tiada Akses Penilaian</span>
                      Kategori ini tidak ditugaskan kepada anda. Hanya panel yang dilantik dibenarkan mendaftar atau menilai calon.
                    </div>
                  </div>
                </div>

                {/* Deactivated footer */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1 italic text-[11px]">
                    <Lock className="w-3.5 h-3.5 text-gray-400" /> Dinyahaktifkan
                  </span>
                  <span className="px-2.5 py-1 rounded bg-gray-200 text-gray-500 text-[11px] font-semibold">
                    Bukan Panel Kategori Ini
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
