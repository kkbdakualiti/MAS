import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { ShieldCheck, Award, AlertTriangle, CheckCircle2, Lock, FileText, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { useCandidateAggregates, useManagementSelections, useDirectorSelections } from '@/hooks/useSelections';
import { localDB } from '@/lib/localStore';
import type { CandidateAggregate } from '@/lib/types';
import SecretariatPrintDocument, { type SecretariatPrintItem } from '@/components/report/SecretariatPrintDocument';
import toast from 'react-hot-toast';

export default function DirectorApprovalPage() {
  const { activeYear } = useAuth();
  const { data: awards = [], isLoading: loadingAwards } = useAwards();
  const [selectedAwardId, setSelectedAwardId] = useState<string>('');

  const activeAwardId = selectedAwardId || (awards[0]?.id ?? '');
  const currentAward = awards.find((a) => a.id === activeAwardId);
  const maxAllowed = currentAward?.max_candidates || 1;

  // Candidates for this category
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidateAggregates(
    activeAwardId,
    activeYear?.id
  );

  // TPA/TPP recommendations
  const { data: mgmtSelections = [] } = useManagementSelections(activeAwardId, activeYear?.id);
  const mgmtRecommendedIds = useMemo(() => {
    return new Set(mgmtSelections.filter((s) => s.selected).map((s) => s.candidate_aggregate_id));
  }, [mgmtSelections]);

  // Director selections
  const { data: dirSelections = [], toggle, approve } = useDirectorSelections(activeAwardId, activeYear?.id);

  // Local state for director choices prior to final confirmation
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [directorNote, setDirectorNote] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);

  // Synchronize when dirSelections load
  useMemo(() => {
    const fromDb = dirSelections.filter((s) => s.selected).map((s) => s.candidate_aggregate_id);
    if (fromDb.length > 0) {
      setSelectedCandidateIds(fromDb);
    }
  }, [dirSelections]);

  // Check if this award category has already been approved
  const isCategoryApproved = dirSelections.some((s) => s.selected && s.selected_at);

  const isPdp = currentAward?.name.toLowerCase().includes('pdp');

  const handleSelect = (candidateId: string) => {
    if (isPdp) {
      const candidateToSelect = candidates.find((c) => c.id === candidateId);
      if (!candidateToSelect) return;

      if (selectedCandidateIds.includes(candidateId)) {
        setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== candidateId));
      } else {
        const existingInDivision = candidates.find(
          (c) => c.division === candidateToSelect.division && selectedCandidateIds.includes(c.id)
        );
        if (existingInDivision) {
          setSelectedCandidateIds([
            ...selectedCandidateIds.filter((id) => id !== existingInDivision.id),
            candidateId,
          ]);
          toast.success(`Calon bagi bahagian ${candidateToSelect.division} dikemas kini.`);
        } else {
          setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
        }
      }
      return;
    }

    if (maxAllowed === 1) {
      // Radio behavior
      setSelectedCandidateIds([candidateId]);
    } else {
      // Checkbox behavior
      if (selectedCandidateIds.includes(candidateId)) {
        setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== candidateId));
      } else {
        if (selectedCandidateIds.length >= maxAllowed) {
          toast.error(`Kategori ini hanya membenarkan maksimum ${maxAllowed} calon akhir dipilih.`);
          return;
        }
        setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
      }
    }
  };

  // Compute selected candidates details
  const selectedCandidatesList = useMemo(() => {
    return candidates.filter((c) => selectedCandidateIds.includes(c.id));
  }, [candidates, selectedCandidateIds]);

  // Check if director choice differs from TPA/TPP
  const isChoiceDifferent = useMemo(() => {
    if (selectedCandidateIds.length === 0) return false;
    return selectedCandidateIds.some((id) => !mgmtRecommendedIds.has(id));
  }, [selectedCandidateIds, mgmtRecommendedIds]);

  // Data cetakan rasmi Urus Setia
  const printItems: SecretariatPrintItem[] = useMemo(() => {
    return candidates.map((c) => ({
      id: c.id,
      candidate_name: c.candidate_name,
      staff_number: c.staff_number,
      division: c.division,
      average_score: c.average_score,
      category_name: currentAward?.name || 'Kategori Anugerah',
      is_mgmt_approved: mgmtRecommendedIds.has(c.id),
      is_director_approved: selectedCandidateIds.includes(c.id),
    }));
  }, [candidates, currentAward, mgmtRecommendedIds, selectedCandidateIds]);

  const handlePromptConfirmation = () => {
    if (selectedCandidateIds.length === 0) {
      toast.error('Sila pilih sekurang-kurangnya seorang calon sebelum membuat pengesahan.');
      return;
    }
    setModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!activeAwardId || !activeYear) return;

    try {
      // 1. Save director choices
      for (const cand of candidates) {
        const isChosen = selectedCandidateIds.includes(cand.id);
        await toggle.mutateAsync({
          candidateAggregateId: cand.id,
          awardId: activeAwardId,
          yearId: activeYear.id,
          selected: isChosen,
          note: isChosen ? directorNote : undefined,
        });
      }

      // 2. Ratify final decision & approve
      await approve.mutateAsync({
        awardId: activeAwardId,
        yearId: activeYear.id,
        candidateAggregateIds: selectedCandidateIds,
        note: directorNote,
      });

      // 3. Save to final_results
      await localDB.saveFinalResults(
        activeYear.id,
        selectedCandidateIds.map((cid) => ({
          awardId: activeAwardId,
          candidateAggregateId: cid,
          status: 'confirmed',
        }))
      );

      setModalOpen(false);
    } catch (err) {
      toast.error('Ralat mengesahkan keputusan.');
    }
  };

  return (
    <DashboardLayout>
      <div className="screen-only space-y-6">
        <PageHeader
          title="Pengesahan Keputusan Anugerah (Kuasa Pengarah)"
          subtitle="Pengarah mempunyai kuasa penuh untuk memilih calon akhir sama ada menerima pengesahan TPA/TPP atau memilih calon lain."
          actions={
            <Button
              variant="gold"
              onClick={() => window.print()}
              className="flex items-center gap-2 shadow-sm font-semibold"
            >
              <Printer className="w-4 h-4" />
              Cetak Senarai ke Urus Setia
            </Button>
          }
        />

      {/* Category Tabs/Selector */}
      <Card className="mb-6">
        <label className="label">PILIH KATEGORI ANUGERAH UNTUK DISEMAK & DISAHKAN:</label>
        <select
          value={activeAwardId}
          onChange={(e) => {
            setSelectedAwardId(e.target.value);
            setSelectedCandidateIds([]);
          }}
          className="input-field font-semibold text-navy bg-navy/5"
        >
          {awards.map((a) => (
            <option key={a.id} value={a.id}>
              #{a.sort_order} - {a.name} ({a.max_candidates} Pemenang)
            </option>
          ))}
        </select>
      </Card>

      {/* Active Category Information Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-navy text-white mb-6">
        <div>
          <span className="text-xs font-bold text-gold uppercase tracking-wider block">Kategori Semasa</span>
          <h2 className="text-xl font-bold mt-0.5">{currentAward?.name}</h2>
          <p className="text-xs text-white/70 mt-1">
            Maksimum Calon Akhir: <strong className="text-gold">{maxAllowed} Calon</strong> ({maxAllowed === 1 ? 'Pemilihan Tunggal / Radio' : 'Pemilihan Berbilang / Checkbox'})
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mgmtRecommendedIds.size > 0 && (
            <Button
              variant="secondary"
              onClick={() => setSelectedCandidateIds(Array.from(mgmtRecommendedIds))}
              className="text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Pilih Cadangan TPA/TPP ({mgmtRecommendedIds.size})
            </Button>
          )}
          <Button
            variant="gold"
            onClick={handlePromptConfirmation}
            className="shadow-lg shadow-gold/20"
          >
            <ShieldCheck className="w-5 h-5 mr-1" />
            SAHKAN KEPUTUSAN
          </Button>
        </div>
      </div>

      {loadingCandidates ? (
        <div className="py-20 text-center text-gray-400">Memuatkan senarai semua calon...</div>
      ) : candidates.length === 0 ? (
        <Card className="text-center py-16 text-gray-400">
          <p>Tiada calon telah dinilai untuk kategori ini lagi.</p>
        </Card>
      ) : (
        <>
          {/* Desktop Table - STRICT SPECIFICATION ORDER:
              1. KATEGORI | 2. CALON | 3. BAHAGIAN | 4. MARKAH | 5. MARKAH PURATA | 6. PENGESAHAN | 7. KELULUSAN PENGARAH
          */}
          <div className="hidden md:block">
            <Card className="overflow-hidden p-0 shadow-md">
              <table className="w-full">
                <thead>
                  <tr className="table-header border-b border-gray-200">
                    <th className="px-5 py-4 text-left">1. KATEGORI</th>
                    <th className="px-5 py-4 text-left">2. CALON</th>
                    <th className="px-5 py-4 text-left">3. BAHAGIAN</th>
                    <th className="px-5 py-4 text-center">4. MARKAH</th>
                    <th className="px-5 py-4 text-center">5. MARKAH PURATA</th>
                    <th className="px-5 py-4 text-center">6. PENGESAHAN</th>
                    <th className="px-5 py-4 text-center">7. KELULUSAN PENGARAH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {candidates.map((cand) => {
                    const isMgmt = mgmtRecommendedIds.has(cand.id);
                    const isChosen = selectedCandidateIds.includes(cand.id);

                    return (
                      <tr
                        key={cand.id}
                        className={`transition-colors ${
                          isChosen
                            ? 'bg-gold/10 font-medium'
                            : isMgmt
                            ? 'bg-purple-50/20'
                            : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {/* 1. KATEGORI */}
                        <td className="px-5 py-4 text-sm font-semibold text-navy">
                          {currentAward?.name}
                        </td>

                        {/* 2. CALON */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{cand.candidate_name}</p>
                              {cand.staff_number && (
                                <p className="text-xs font-mono text-gray-400">No. Staf: {cand.staff_number}</p>
                              )}
                            </div>
                            {isMgmt && (
                              <Badge variant="gold" className="text-[10px] uppercase tracking-wider">
                                Disahkan TPA/TPP
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* 3. BAHAGIAN */}
                        <td className="px-5 py-4">
                          <Badge variant="neutral">{cand.division}</Badge>
                        </td>

                        {/* 4. MARKAH */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {(cand.individual_scores || []).map((score: number, idx: number) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-navy/10 text-navy"
                              >
                                [{score}]
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 5. MARKAH PURATA */}
                        <td className="px-5 py-4 text-center">
                          <span className="font-mono font-extrabold text-navy text-base">
                            {Number(cand.average_score).toFixed(2)}
                          </span>
                        </td>

                        {/* 6. PENGESAHAN */}
                        <td className="px-5 py-4 text-center">
                          {isMgmt ? (
                            <Badge variant="success" className="font-bold">
                              ☑ DISAHKAN
                            </Badge>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>

                        {/* 7. KELULUSAN PENGARAH (Radio or Checkbox) */}
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelect(cand.id)}
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-gold/10 transition-transform active:scale-95"
                          >
                            {maxAllowed === 1 ? (
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  isChosen ? 'border-gold bg-gold' : 'border-gray-300'
                                }`}
                              >
                                {isChosen && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                            ) : (
                              <div
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                  isChosen ? 'border-gold bg-gold text-white' : 'border-gray-300'
                                }`}
                              >
                                {isChosen && '✓'}
                              </div>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4 mb-24">
            {candidates.map((cand) => {
              const isMgmt = mgmtRecommendedIds.has(cand.id);
              const isChosen = selectedCandidateIds.includes(cand.id);

              return (
                <Card
                  key={cand.id}
                  className={`p-5 border-2 transition-all ${
                    isChosen ? 'border-gold bg-gold-50/20 shadow-md' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">
                      {currentAward?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelect(cand.id)}
                      className="p-1"
                    >
                      {maxAllowed === 1 ? (
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isChosen ? 'border-gold bg-gold' : 'border-gray-300'
                          }`}
                        >
                          {isChosen && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                        </div>
                      ) : (
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center font-bold text-xs ${
                            isChosen ? 'border-gold bg-gold text-white' : 'border-gray-300'
                          }`}
                        >
                          {isChosen && '✓'}
                        </div>
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base mb-1">{cand.candidate_name}</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Bahagian: <strong className="text-gray-700">{cand.division}</strong>
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Markah:</span>
                      <div className="flex items-center gap-1">
                        {(cand.individual_scores || []).map((score: number, idx: number) => (
                          <span
                            key={idx}
                            className="px-1 py-0.5 rounded font-mono font-bold bg-navy/10 text-navy text-[11px]"
                          >
                            [{score}]
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-gray-400 block mb-0.5">Purata:</span>
                      <span className="font-mono font-bold text-navy text-sm">
                        {Number(cand.average_score).toFixed(2)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-gray-400 block mb-0.5">Pengesahan:</span>
                      {isMgmt ? (
                        <Badge variant="gold" className="text-[10px]">DISAHKAN</Badge>
                      ) : (
                        <span className="text-gray-400">Belum Disahkan</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Mobile Sticky Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-2xl z-20">
              <Button
                variant="gold"
                onClick={handlePromptConfirmation}
                className="w-full py-3 text-base shadow-lg"
              >
                <ShieldCheck className="w-5 h-5 mr-1" />
                SAHKAN KEPUTUSAN
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal (Requirement #44 & #45) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="PENGESAHAN KEPUTUSAN AKHIR"
        size="lg"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-surface border border-gray-200/60 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Kategori:</span>
              <strong className="text-navy">{currentAward?.name}</strong>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Calon Dipilih Pengarah:</span>
              <strong className="text-gray-900">
                {selectedCandidatesList.map((c) => c.candidate_name).join(', ')}
              </strong>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Markah Purata Calon:</span>
              <span className="font-mono font-bold text-navy">
                {selectedCandidatesList.map((c) => Number(c.average_score).toFixed(2)).join(', ')}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Cadangan Asal TPA/TPP:</span>
              <span className="text-gray-700">
                {candidates
                  .filter((c) => mgmtRecommendedIds.has(c.id))
                  .map((c) => c.candidate_name)
                  .join(', ') || 'Tiada Cadangan'}
              </span>
            </div>
          </div>

          {/* Warning if Director chooses someone other than TPA/TPP recommendation */}
          {isChoiceDifferent && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold text-amber-900 mb-1">
                  Peringatan Pertimbangan Kuasa
                </strong>
                Calon yang dipilih berbeza daripada cadangan TPA/TPP. Sebagai Pengarah, anda mempunyai kuasa muktamad untuk menentukan calon ini. Adakah anda pasti mahu meneruskan?
              </div>
            </div>
          )}

          {/* Optional Director Note */}
          <div>
            <label className="label">CATATAN PENGARAH (Pilihan)</label>
            <textarea
              value={directorNote}
              onChange={(e) => setDirectorNote(e.target.value)}
              className="input-field h-24 resize-none"
              placeholder="cth. Pemilihan dibuat berdasarkan pertimbangan keseluruhan dan sumbangan luar biasa kepada kolej..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              BATAL
            </Button>
            <Button
              variant="gold"
              onClick={handleConfirmApproval}
              loading={approve.isPending}
            >
              YA, SAHKAN
            </Button>
          </div>
        </div>
      </Modal>
      </div>

      {/* Dokumen Cetakan Rasmi Urus Setia */}
      <SecretariatPrintDocument showDirectorApproval={true} items={printItems} />
    </DashboardLayout>
  );
}
