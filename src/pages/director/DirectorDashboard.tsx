import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SearchBar from '@/components/ui/SearchBar';
import Modal from '@/components/ui/Modal';
import {
  Award,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CheckSquare,
  Square,
  Printer,
  Sparkles,
  ClipboardCheck,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileCheck,
  Trophy,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import {
  useCandidateAggregates,
  useManagementSelections,
  useDirectorSelections
} from '@/hooks/useSelections';
import { localDB } from '@/lib/localStore';
import { DIVISIONS } from '@/lib/constants';
import type { CandidateAggregate } from '@/lib/types';
import SecretariatPrintDocument, { type SecretariatPrintItem } from '@/components/report/SecretariatPrintDocument';
import toast from 'react-hot-toast';

export default function DirectorDashboard() {
  const { activeYear, profile } = useAuth();
  const { data: awards = [] } = useAwards();

  // Filters state
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all, mgmt, approved, unapproved
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCategoryProgress, setShowCategoryProgress] = useState<boolean>(false);

  // Finalize All Modal state
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState<boolean>(false);
  const [finalizeNote, setFinalizeNote] = useState<string>('Disahkan dan dimuktamadkan oleh Pengarah berasaskan perakuan dan sokongan pihak Pengurusan (TPA/TPP).');
  const [isSubmittingFinalize, setIsSubmittingFinalize] = useState<boolean>(false);

  // Fetch all candidates across all awards for the active year
  const { data: allCandidates = [], isLoading } = useCandidateAggregates(
    undefined,
    activeYear?.id
  );

  // Fetch all management selections (TPA/TPP)
  const { data: allMgmtSelections = [] } = useManagementSelections(
    undefined,
    activeYear?.id
  );
  const mgmtMap = useMemo(() => {
    return new Map(allMgmtSelections.map((s) => [s.candidate_aggregate_id, s.selected]));
  }, [allMgmtSelections]);

  // Fetch all director selections (Kuasa Muktamad Pengarah)
  const { data: allDirSelections = [], toggle, approve } = useDirectorSelections(
    undefined,
    activeYear?.id
  );
  const dirMap = useMemo(() => {
    return new Map(allDirSelections.map((s) => [s.candidate_aggregate_id, s.selected]));
  }, [allDirSelections]);

  // Global Progress Statistics
  const totalAwardsCount = awards.length;

  // Candidates supported by TPA/TPP
  const mgmtSupportedCandidates = useMemo(() => {
    return allCandidates.filter((c) => !!mgmtMap.get(c.id));
  }, [allCandidates, mgmtMap]);

  // Candidates approved by Director
  const directorApprovedCandidates = useMemo(() => {
    return allCandidates.filter((c) => !!dirMap.get(c.id));
  }, [allCandidates, dirMap]);

  // Candidates supported by TPA/TPP but not yet finalized by Director
  const pendingDirectorCandidates = useMemo(() => {
    return mgmtSupportedCandidates.filter((c) => !dirMap.get(c.id));
  }, [mgmtSupportedCandidates, dirMap]);

  // Awards evaluated count
  const evaluatedAwardsCount = useMemo(() => {
    const evaluatedAwardIds = new Set(allCandidates.map((c) => c.award_id));
    return awards.filter((a) => evaluatedAwardIds.has(a.id)).length;
  }, [awards, allCandidates]);

  // Awards with TPA/TPP endorsement
  const mgmtSupportedAwardsCount = useMemo(() => {
    const supportedAwardIds = new Set(mgmtSupportedCandidates.map((c) => c.award_id));
    return awards.filter((a) => supportedAwardIds.has(a.id)).length;
  }, [awards, mgmtSupportedCandidates]);

  // Awards with Director final approval
  const directorApprovedAwardsCount = useMemo(() => {
    const approvedAwardIds = new Set(directorApprovedCandidates.map((c) => c.award_id));
    return awards.filter((a) => approvedAwardIds.has(a.id)).length;
  }, [awards, directorApprovedCandidates]);

  // Per-category status breakdown
  const categoryStatusList = useMemo(() => {
    return awards.map((award) => {
      const awardCandidates = allCandidates.filter((c) => c.award_id === award.id);
      const isEvaluated = awardCandidates.length > 0;
      const awardMgmtCands = awardCandidates.filter((c) => mgmtMap.get(c.id));
      const awardDirCands = awardCandidates.filter((c) => dirMap.get(c.id));
      const isMgmtDone = awardMgmtCands.length > 0;
      const isDirDone = awardDirCands.length > 0;

      let stage: 'pending_eval' | 'evaluated' | 'mgmt_supported' | 'finalized' = 'pending_eval';
      if (isDirDone) stage = 'finalized';
      else if (isMgmtDone) stage = 'mgmt_supported';
      else if (isEvaluated) stage = 'evaluated';

      return {
        award,
        candidatesCount: awardCandidates.length,
        mgmtCount: awardMgmtCands.length,
        dirCount: awardDirCands.length,
        stage,
        topCandidate: awardCandidates[0] || null,
        supportedCandidate: awardMgmtCands[0] || null,
        finalizedCandidate: awardDirCands[0] || null,
      };
    });
  }, [awards, allCandidates, mgmtMap, dirMap]);

  // Handle single candidate approval toggle with quota handling
  const handleToggleDirectorApproval = async (candidate: CandidateAggregate & { award?: any }) => {
    if (!activeYear) return;

    const isCurrentlyApproved = !!dirMap.get(candidate.id);
    const willBeApproved = !isCurrentlyApproved;

    if (willBeApproved) {
      const isPdp = candidate.award?.name.toLowerCase().includes('pdp');
      if (isPdp) {
        // Bagi Pengurusan PdP Terbaik, benarkan 1 calon bagi setiap bahagian
        const existingApprovedInDivision = allCandidates.find(
          (c) =>
            c.award_id === candidate.award_id &&
            c.division === candidate.division &&
            c.id !== candidate.id &&
            dirMap.get(c.id)
        );
        if (existingApprovedInDivision) {
          await toggle.mutateAsync({
            candidateAggregateId: existingApprovedInDivision.id,
            awardId: candidate.award_id,
            yearId: activeYear.id,
            selected: false,
          });
          toast.success(`Kelulusan bahagian ${candidate.division} dikemas kini kepada ${candidate.candidate_name}.`);
        }
      } else {
        const awardLimit = candidate.award?.max_candidates || 1;
        const currentApprovedInCategory = allCandidates.filter(
          (c) => c.award_id === candidate.award_id && c.id !== candidate.id && dirMap.get(c.id)
        );

        if (awardLimit === 1 && currentApprovedInCategory.length > 0) {
          const prevCand = currentApprovedInCategory[0];
          await toggle.mutateAsync({
            candidateAggregateId: prevCand.id,
            awardId: candidate.award_id,
            yearId: activeYear.id,
            selected: false,
          });
          toast.success(`Kelulusan anugerah "${candidate.award?.name}" dikemas kini kepada ${candidate.candidate_name}.`);
        } else if (currentApprovedInCategory.length >= awardLimit) {
          toast.error(`Kategori "${candidate.award?.name || 'ini'}" hanya membenarkan maksimum ${awardLimit} calon akhir diluluskan.`);
          return;
        }
      }
    }

    await toggle.mutateAsync({
      candidateAggregateId: candidate.id,
      awardId: candidate.award_id,
      yearId: activeYear.id,
      selected: willBeApproved,
    });

    // Save/update final result
    if (willBeApproved) {
      await localDB.saveFinalResults(activeYear.id, [
        { awardId: candidate.award_id, candidateAggregateId: candidate.id, status: 'confirmed' }
      ]);
    }
  };

  // Handle Sahkan & Muktamadkan Semua Calon Disokong TPA/TPP
  const handleConfirmFinalizeAll = async () => {
    if (!activeYear || mgmtSupportedCandidates.length === 0) return;

    setIsSubmittingFinalize(true);
    try {
      const distinctAwardIds = new Set<string>();
      const finalResultsPayload: { awardId: string; candidateAggregateId: string; status: string }[] = [];

      for (const cand of mgmtSupportedCandidates) {
        distinctAwardIds.add(cand.award_id);

        // 1. Toggle director selection to true
        await toggle.mutateAsync({
          candidateAggregateId: cand.id,
          awardId: cand.award_id,
          yearId: activeYear.id,
          selected: true,
          note: finalizeNote,
        });

        finalResultsPayload.push({
          awardId: cand.award_id,
          candidateAggregateId: cand.id,
          status: 'confirmed',
        });
      }

      // 2. Ratify director approvals for each award
      for (const awardId of distinctAwardIds) {
        const candsForAward = mgmtSupportedCandidates.filter((c) => c.award_id === awardId).map((c) => c.id);
        await approve.mutateAsync({
          awardId,
          yearId: activeYear.id,
          candidateAggregateIds: candsForAward,
          note: finalizeNote,
        });
      }

      // 3. Save to local and cloud final_results table
      await localDB.saveFinalResults(activeYear.id, finalResultsPayload);

      // 4. Log audit trail
      localDB.logAudit({
        userId: profile?.id || 'pengarah',
        userName: profile?.full_name || 'SALMIYAH BINTI CHE AHMAD (Pengarah)',
        activeRole: 'director',
        action: 'Pengesahan Muktamad Keputusan Anugerah',
        details: `Pengarah telah mengesahkan dan memuktamadkan semua ${mgmtSupportedCandidates.length} calon yang dinilai dan disokong oleh TPA/TPP bagi Sesi ${activeYear.year || 2026}`,
        entityType: 'final_results',
        entityId: activeYear.id,
      });

      setIsFinalizeModalOpen(false);
      toast.success(
        `Tahniah! Semua ${mgmtSupportedCandidates.length} calon sokongan TPA/TPP telah berjaya disahkan dan dimuktamadkan sebagai pemenang rasmi.`,
        { duration: 5000 }
      );
    } catch (err: any) {
      console.error('Error finalizing all:', err);
      toast.error('Ralat semasa memuktamadkan keputusan: ' + (err?.message || 'Sila cuba lagi.'));
    } finally {
      setIsSubmittingFinalize(false);
    }
  };

  // Filtered candidates list for candidate table
  const filteredCandidates = useMemo(() => {
    return allCandidates
      .filter((c) => {
        // Category filter
        if (selectedAwardId && c.award_id !== selectedAwardId) return false;
        // Division filter
        if (selectedDivision && c.division !== selectedDivision) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = c.candidate_name.toLowerCase().includes(q);
          const matchStaff = c.staff_number?.toLowerCase().includes(q);
          const matchAward = c.award?.name.toLowerCase().includes(q);
          if (!matchName && !matchStaff && !matchAward) return false;
        }
        // Status filter
        const isApproved = !!dirMap.get(c.id);
        const isMgmt = !!mgmtMap.get(c.id);

        if (selectedStatus === 'mgmt' && !isMgmt) return false;
        if (selectedStatus === 'approved' && !isApproved) return false;
        if (selectedStatus === 'unapproved' && isApproved) return false;

        return true;
      })
      .sort((a, b) => Number(b.average_score) - Number(a.average_score));
  }, [allCandidates, selectedAwardId, selectedDivision, selectedStatus, searchQuery, dirMap, mgmtMap]);

  // Data cetakan rasmi Urus Setia
  const printItems: SecretariatPrintItem[] = useMemo(() => {
    return filteredCandidates.map((c) => ({
      id: c.id,
      candidate_name: c.candidate_name,
      staff_number: c.staff_number,
      division: c.division,
      average_score: c.average_score,
      category_name: c.award?.name || 'Kategori Anugerah',
      is_mgmt_approved: !!mgmtMap.get(c.id),
      is_director_approved: !!dirMap.get(c.id),
    }));
  }, [filteredCandidates, mgmtMap, dirMap]);

  return (
    <DashboardLayout>
      <div className="screen-only space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Portal Pemuktamadan & Kelulusan Anugerah (Pengarah)"
          subtitle={`Pantau status kemajuan penilaian semua kategori anugerah dan laksanakan pengesahan muktamad bagi calon-calon yang telah dinilai dan disokong oleh TPA dan TPP.`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCategoryProgress(!showCategoryProgress)}
                className="flex items-center gap-2 text-xs font-semibold"
              >
                <Award className="w-4 h-4 text-gold" />
                {showCategoryProgress ? 'Tutup Ringkasan Kategori' : 'Ringkasan 16 Kategori'}
                {showCategoryProgress ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="gold"
                onClick={() => window.print()}
                className="flex items-center gap-2 shadow-sm font-semibold"
              >
                <Printer className="w-4 h-4" />
                Cetak Senarai ke Urus Setia
              </Button>
            </div>
          }
        />

        {/* 1. KAD METRIK PROGRES KESELURUHAN SISTEM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-navy bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Kategori Dinilai
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-navy">{evaluatedAwardsCount}</span>
                  <span className="text-xs text-gray-500">/ {totalAwardsCount} Kategori</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Panel telah selesai menilai</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-navy/10 flex items-center justify-center text-navy shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-600 bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Calon Dinilai Panel
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-blue-700">{allCandidates.length}</span>
                  <span className="text-xs text-gray-500">Calon</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Markah purata panel tersedia</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-gold bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Disokong TPA & TPP
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-gold-dark">{mgmtSupportedCandidates.length}</span>
                  <span className="text-xs text-gray-500">Calon Disahkan</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Sedia untuk kelulusan Pengarah</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-emerald-600 bg-white shadow-sm hover:shadow transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Dimuktamadkan Pengarah
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-emerald-700">{directorApprovedCandidates.length}</span>
                  <span className="text-xs text-gray-500">/ {mgmtSupportedCandidates.length} Rasmi</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Kuasa muktamad rasmi Pengarah</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* 2. ALIRAN PROGRES KESELURUHAN (PIPELINE STEPPER) */}
        <Card className="p-5 bg-gradient-to-r from-navy via-navy to-navy-900 text-white shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-gold/5 transform skew-x-12 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gold tracking-widest uppercase bg-gold/20 px-2.5 py-0.5 rounded-full">
                  Status Aliran Anugerah • Sesi {activeYear?.year || 2026}
                </span>
                {pendingDirectorCandidates.length === 0 && mgmtSupportedCandidates.length > 0 ? (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Lengkap Dimuktamadkan
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" /> Menunggu Pengesahan Pengarah
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold mt-1 text-white">
                Tahap Kemajuan Penilaian & Pemuktamadan Anugerah
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs text-white/70 block">Kemajuan Pengesahan Akhir:</span>
              <span className="text-xl font-mono font-black text-gold">
                {mgmtSupportedCandidates.length > 0
                  ? `${Math.round((directorApprovedCandidates.length / mgmtSupportedCandidates.length) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Stepper Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Step 1: Penilaian Panel */}
            <div className={`p-3.5 rounded-xl border ${allCandidates.length > 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  Penilaian Panel
                </span>
                {allCandidates.length > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    SELESAI
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/50 bg-white/10 px-2 py-0.5 rounded">
                    BERJALAN
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {allCandidates.length} Calon Dinilai
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Markah purata panel telah dikira secara automatik.
              </p>
            </div>

            {/* Step 2: Sokongan TPA/TPP */}
            <div className={`p-3.5 rounded-xl border ${mgmtSupportedCandidates.length > 0 ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-gold text-navy text-[11px] font-bold flex items-center justify-center">2</span>
                  Sokongan Pengurusan
                </span>
                {mgmtSupportedCandidates.length > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    SELESAI
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                    MENUNGGU TPA/TPP
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {mgmtSupportedCandidates.length} Calon Disahkan TPA/TPP
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                Disahkan oleh WAN NORHASHIMAH (TPA) & Pengurusan.
              </p>
            </div>

            {/* Step 3: Pengesahan Muktamad Pengarah */}
            <div className={`p-3.5 rounded-xl border ${directorApprovedCandidates.length > 0 ? 'bg-emerald-950/60 border-emerald-500/50' : 'bg-white/10 border-gold/40'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center">3</span>
                  Pengesahan Pengarah
                </span>
                {pendingDirectorCandidates.length === 0 && mgmtSupportedCandidates.length > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/30 px-2 py-0.5 rounded">
                    MUKTAMAD RASMI
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gold bg-gold/20 px-2 py-0.5 rounded">
                    KUASA PENGARAH
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white">
                {directorApprovedCandidates.length} Calon Diluluskan
              </p>
              <p className="text-xs text-white/60 mt-0.5">
                {pendingDirectorCandidates.length > 0
                  ? `${pendingDirectorCandidates.length} calon sedia disahkan & dimuktamadkan.`
                  : 'Semua keputusan telah disahkan rasmi.'}
              </p>
            </div>
          </div>
        </Card>

        {/* 3. HERO ACTION BANNER: "PENGESAH FINALIZE" UNTUK SAHKAN SEMUA PILIHAN TPA & TPP */}
        {pendingDirectorCandidates.length > 0 ? (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-gold/15 to-amber-100 border-2 border-gold/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gold text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="font-extrabold text-[11px] tracking-wider uppercase">
                    Tindakan Pengarah Diperlukan
                  </Badge>
                  <span className="text-xs text-amber-900 font-semibold">
                    {pendingDirectorCandidates.length} Calon Menunggu Pengesahan Anda
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-navy mt-1">
                  Sahkan & Muktamadkan Semua Calon Pilihan TPA & TPP
                </h3>
                <p className="text-xs text-navy/80 mt-0.5 max-w-2xl">
                  Pihak Pengurusan (TPA dan TPP) telah selesai memperakukan calon bagi kategori anugerah. Sebagai Pengarah dengan kuasa muktamad, anda boleh mengesahkan dan memuktamadkan semua perakuan ini sekali gus menjadi pemenang rasmi.
                </p>
              </div>
            </div>

            <Button
              variant="gold"
              onClick={() => setIsFinalizeModalOpen(true)}
              className="py-3 px-5 text-sm font-extrabold shadow-lg shadow-gold/25 hover:shadow-xl hover:scale-[1.02] transition-transform shrink-0 flex items-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Sahkan Semua Calon TPA/TPP ({pendingDirectorCandidates.length})
            </Button>
          </div>
        ) : mgmtSupportedCandidates.length > 0 ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-900">
                  Semua Calon Pilihan TPA & TPP Telah Selesai Dimuktamadkan
                </h4>
                <p className="text-xs text-emerald-800">
                  Keputusan rasmi telah disimpan dan disahkan sepenuhnya sebagai pemenang anugerah Kolej Komuniti Bandar Darulaman.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="gold"
                size="sm"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Senarai Rasmi
              </Button>
            </div>
          </div>
        ) : null}

        {/* 4. ACCORDION: STATUS KEMAJUAN MENGIKUT 16 KATEGORI ANUGERAH */}
        {showCategoryProgress && (
          <Card className="p-5 border border-gray-200/80 shadow-md transition-all">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-extrabold text-navy flex items-center gap-2">
                  <Award className="w-4 h-4 text-gold" />
                  Status Kemajuan Mengikut 16 Kategori Anugerah
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pantau kategori yang telah selesai dinilai, disokong pengurusan, atau dimuktamadkan Pengarah.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-500">
                {evaluatedAwardsCount} / {totalAwardsCount} Selesai Dinilai
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {categoryStatusList.map(({ award, stage, candidatesCount, mgmtCount, dirCount, supportedCandidate, finalizedCandidate }) => {
                return (
                  <div
                    key={award.id}
                    onClick={() => {
                      setSelectedAwardId(award.id);
                      setSelectedStatus('all');
                    }}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                      stage === 'finalized'
                        ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70'
                        : stage === 'mgmt_supported'
                        ? 'border-gold/60 bg-gold-50/30 hover:bg-gold-50/60'
                        : stage === 'evaluated'
                        ? 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60'
                        : 'border-gray-200 bg-gray-50/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-gray-400">
                        #{award.sort_order}
                      </span>
                      {stage === 'finalized' ? (
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Muktamad ({dirCount})
                        </span>
                      ) : stage === 'mgmt_supported' ? (
                        <span className="text-[10px] font-extrabold text-gold-dark bg-gold/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-gold" /> Disokong TPA ({mgmtCount})
                        </span>
                      ) : stage === 'evaluated' ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                          Dinilai ({candidatesCount})
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 bg-gray-200/80 px-2 py-0.5 rounded-full">
                          Belum Dinilai
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-navy line-clamp-1" title={award.name}>
                      {award.name}
                    </h4>

                    <div className="mt-2 pt-2 border-t border-gray-200/60 text-[11px] text-gray-600">
                      {finalizedCandidate ? (
                        <p className="truncate font-semibold text-emerald-800">
                          👑 {finalizedCandidate.candidate_name}
                        </p>
                      ) : supportedCandidate ? (
                        <p className="truncate font-semibold text-gold-dark">
                          ⭐ {supportedCandidate.candidate_name}
                        </p>
                      ) : candidatesCount > 0 ? (
                        <p className="text-gray-500 truncate">
                          {candidatesCount} calon dimasukkan
                        </p>
                      ) : (
                        <p className="text-gray-400 italic">Tiada pencalonan</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* 5. FILTER & SEARCH CONTROLS */}
        <Card className="p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">CARI CALON</label>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Nama, No. Staf, Kategori..."
              />
            </div>

            <div>
              <label className="label">FILTER KATEGORI ANUGERAH</label>
              <select
                value={selectedAwardId}
                onChange={(e) => setSelectedAwardId(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Semua Kategori Anugerah ({totalAwardsCount})</option>
                {awards.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.sort_order} - {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">FILTER BAHAGIAN</label>
              <select
                value={selectedDivision}
                onChange={(e) => setSelectedDivision(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">Semua Bahagian</option>
                {DIVISIONS.map((div) => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">STATUS KELULUSAN</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">Semua Calon ({allCandidates.length})</option>
                <option value="mgmt">⭐ Disokong TPA/TPP ({mgmtSupportedCandidates.length})</option>
                <option value="approved">👑 Diluluskan Pengarah ({directorApprovedCandidates.length})</option>
                <option value="unapproved">⏳ Belum Diluluskan ({allCandidates.length - directorApprovedCandidates.length})</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Status Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-xs font-semibold text-gray-500 mr-1">Pilihan Pantas:</span>
            <button
              type="button"
              onClick={() => { setSelectedStatus('all'); setSelectedAwardId(''); }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                selectedStatus === 'all' && !selectedAwardId
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua ({allCandidates.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('mgmt')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedStatus === 'mgmt'
                  ? 'bg-gold text-white shadow-sm'
                  : 'bg-gold/15 text-gold-dark hover:bg-gold/25'
              }`}
            >
              <span>⭐ Disokong TPA/TPP</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-gold-dark font-mono font-black">
                {mgmtSupportedCandidates.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStatus('approved')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedStatus === 'approved'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              <span>👑 Dimuktamadkan Pengarah</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/80 text-emerald-800 font-mono font-black">
                {directorApprovedCandidates.length}
              </span>
            </button>

            {selectedAwardId && (
              <button
                type="button"
                onClick={() => setSelectedAwardId('')}
                className="text-xs text-red-600 hover:underline ml-auto"
              >
                Reset Filter Kategori ({awards.find(a => a.id === selectedAwardId)?.name})
              </button>
            )}
          </div>
        </Card>

        {/* Info Banner */}
        <div className="p-3 bg-navy-50 border border-navy-200/60 rounded-xl text-xs text-navy flex items-center justify-between">
          <span>
            👑 <strong>Kuasa Muktamad Pengarah:</strong> Semak status Pengesahan TPA/TPP di <strong>Lajur 6</strong> dan tentukan Kelulusan Muktamad di <strong>Lajur 7</strong>. Sebarang penandaan disimpan secara automatik.
          </span>
          <Badge variant="gold">Auto Save Aktif</Badge>
        </div>

        {/* 6. JADUAL SENARAI CALON DENGAN 7 LAJUR PIAWAI */}
        {isLoading ? (
          <div className="py-20 text-center text-gray-400">Memuatkan senarai calon anugerah...</div>
        ) : filteredCandidates.length === 0 ? (
          <Card className="text-center py-16 text-gray-400">
            <p className="font-semibold text-gray-600">Tiada calon ditemui mengikut tapisan yang dipilih.</p>
            <p className="text-xs mt-1">Sila tukar pilihan tapisan kategori, status kelulusan, atau carian nama.</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="overflow-hidden p-0 shadow-md">
                <table className="w-full">
                  <thead>
                    <tr className="table-header border-b border-gray-200 bg-gray-50/80">
                      <th className="px-5 py-4 text-left">1. KATEGORI</th>
                      <th className="px-5 py-4 text-left">2. CALON</th>
                      <th className="px-5 py-4 text-left">3. BAHAGIAN</th>
                      <th className="px-5 py-4 text-center">4. MARKAH PANEL</th>
                      <th className="px-5 py-4 text-center">5. MARKAH PURATA</th>
                      <th className="px-5 py-4 text-center">6. PENGESAHAN TPA/TPP</th>
                      <th className="px-5 py-4 text-center">7. KELULUSAN PENGARAH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCandidates.map((cand) => {
                      const isMgmt = !!mgmtMap.get(cand.id);
                      const isApproved = !!dirMap.get(cand.id);

                      return (
                        <tr
                          key={cand.id}
                          className={`transition-colors ${
                            isApproved
                              ? 'bg-emerald-50/40 hover:bg-emerald-50/60'
                              : isMgmt
                              ? 'bg-gold-50/20 hover:bg-gold-50/40'
                              : 'hover:bg-gray-50/50'
                          }`}
                        >
                          {/* 1. KATEGORI */}
                          <td className="px-5 py-4 font-semibold text-navy text-sm">
                            <span className="block">{cand.award?.name || '-'}</span>
                          </td>

                          {/* 2. CALON */}
                          <td className="px-5 py-4">
                            <p className="font-bold text-gray-900 text-sm">{cand.candidate_name}</p>
                            {cand.staff_number && (
                              <p className="text-xs font-mono text-gray-400">No. Staf: {cand.staff_number}</p>
                            )}
                          </td>

                          {/* 3. BAHAGIAN */}
                          <td className="px-5 py-4">
                            <Badge variant="neutral">{cand.division}</Badge>
                          </td>

                          {/* 4. MARKAH PANEL */}
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {(cand.individual_scores || []).map((score: number, sIdx: number) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-navy/10 text-navy border border-navy/20"
                                >
                                  [{score}]
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* 5. MARKAH PURATA */}
                          <td className="px-5 py-4 text-center">
                            <span className="font-mono font-bold text-navy text-base">
                              {Number(cand.average_score).toFixed(2)}
                            </span>
                          </td>

                          {/* 6. PENGESAHAN TPA/TPP */}
                          <td className="px-5 py-4 text-center">
                            {isMgmt ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gold/15 text-gold-dark border border-gold/40">
                                <CheckSquare className="w-4 h-4 text-gold" />
                                <span>DISAHKAN TPA/TPP</span>
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs">— Tiada —</span>
                            )}
                          </td>

                          {/* 7. KELULUSAN PENGARAH */}
                          <td className="px-5 py-4 text-center">
                            {isApproved ? (
                              <button
                                type="button"
                                onClick={() => handleToggleDirectorApproval(cand)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
                                title="Klik untuk batal kelulusan jika perlu"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>DIMUKTAMADKAN</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleDirectorApproval(cand)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-gold text-navy hover:bg-gold hover:text-white transition-all active:scale-95"
                                title="Klik untuk luluskan calon ini"
                              >
                                <Square className="w-4 h-4 text-gold" />
                                <span>SAHKAN</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {filteredCandidates.map((cand) => {
                const isMgmt = !!mgmtMap.get(cand.id);
                const isApproved = !!dirMap.get(cand.id);

                return (
                  <Card
                    key={cand.id}
                    className={`p-4 border-2 transition-all ${
                      isApproved
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-md'
                        : isMgmt
                        ? 'border-gold bg-gold-50/15'
                        : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold text-gold uppercase tracking-wider">
                        {cand.award?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDirectorApproval(cand)}
                        className="p-1"
                      >
                        {isApproved ? (
                          <span className="flex items-center gap-1 text-emerald-700 font-extrabold text-xs bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> LULUS
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-500 font-bold text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            <Square className="w-4 h-4 text-gray-400" /> SAHKAN
                          </span>
                        )}
                      </button>
                    </div>

                    <h3 className="font-extrabold text-gray-900 text-base mb-1">
                      {cand.candidate_name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      Bahagian: <strong className="text-gray-700">{cand.division}</strong>
                    </p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-1">Markah:</span>
                        <div className="flex items-center gap-1">
                          {(cand.individual_scores || []).map((score: number, idx: number) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded font-mono font-bold bg-navy/10 text-navy text-[11px]"
                            >
                              [{score}]
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-gray-400 block mb-1">Purata:</span>
                        <span className="font-mono font-extrabold text-navy text-base">
                          {Number(cand.average_score).toFixed(2)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-gray-400 block mb-1">Pengesahan:</span>
                        {isMgmt ? (
                          <span className="text-gold font-bold text-xs">☑ DISAHKAN</span>
                        ) : (
                          <span className="text-gray-400 text-xs">☐ Tiada</span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* 7. MODAL PENGESAHAN & PEMUKTAMADAN SEMUA CALON SOKONGAN TPA/TPP */}
        <Modal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          title="PENGESAHAN MUKTAMAD KEPUTUSAN ANUGERAH"
          size="lg"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-950 mb-0.5">
                  Kuasa Muktamad Pengarah Kolej Komuniti Bandar Darulaman
                </strong>
                Anda sedang memuktamadkan semua <strong>{mgmtSupportedCandidates.length} calon</strong> yang telah dinilai oleh Panel dan disahkan oleh pihak Pengurusan (TPA/TPP). Keputusan ini akan disimpan secara rasmi ke dalam sistem dan senarai pemenang.
              </div>
            </div>

            {/* Senarai Calon Yang Akan Dimuktamadkan */}
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Kategori Anugerah</th>
                    <th className="px-3 py-2 text-left">Calon</th>
                    <th className="px-3 py-2 text-left">Bahagian</th>
                    <th className="px-3 py-2 text-center">Purata</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mgmtSupportedCandidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-2 font-semibold text-navy">{cand.award?.name}</td>
                      <td className="px-3 py-2 font-bold text-gray-900">{cand.candidate_name}</td>
                      <td className="px-3 py-2 text-gray-600">{cand.division}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold text-navy">
                        {Number(cand.average_score).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-full">
                          Disokong TPA/TPP
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Catatan Pengarah */}
            <div>
              <label className="label">CATATAN KELULUSAN PENGARAH</label>
              <textarea
                value={finalizeNote}
                onChange={(e) => setFinalizeNote(e.target.value)}
                className="input-field h-20 text-xs resize-none"
                placeholder="Catatan muktamad Pengarah untuk rekod rasmi..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={() => setIsFinalizeModalOpen(false)}
                disabled={isSubmittingFinalize}
              >
                Batal
              </Button>
              <Button
                variant="gold"
                onClick={handleConfirmFinalizeAll}
                loading={isSubmittingFinalize}
                className="font-extrabold flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                YA, SAHKAN & MUKTAMADKAN SEMUA
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      {/* Dokumen Cetakan Rasmi Urus Setia */}
      <SecretariatPrintDocument
        title="SENARAI PERAKUAN & KELULUSAN RASMI ANUGERAH APRESIASI STAF KKBDA"
        year={activeYear?.year || 2026}
        items={printItems}
        showDirectorApproval={true}
        managementSigner="WAN NORHASHIMAH BINTI WAN HUSIN"
        directorSigner={profile?.full_name || 'SALMIYAH BINTI CHE AHMAD'}
      />
    </DashboardLayout>
  );
}
