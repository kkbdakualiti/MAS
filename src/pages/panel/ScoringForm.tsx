import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ArrowLeft, Save, Send, CheckCircle2, Lock, AlertCircle, Edit3, Info, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { generateCandidateIdentifier } from '@/utils/formatters';
import { getTemplateForAward, getScoreInterpretation } from '@/lib/rubricTemplates';
import type { PanelCandidate, Award as AwardType, AwardItem, Evaluation } from '@/lib/types';
import toast from 'react-hot-toast';

export default function ScoringForm() {
  const { awardId, candidateId } = useParams<{ awardId: string; candidateId: string }>();
  const navigate = useNavigate();
  const { user, profile, activeYear } = useAuth();

  const [award, setAward] = useState<AwardType | null>(null);
  const [candidate, setCandidate] = useState<PanelCandidate | null>(null);
  const [items, setItems] = useState<AwardItem[]>([]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scores, setScores] = useState<Record<string, number | ''>>({});
  const [rawScores, setRawScores] = useState<Record<string, number | ''>>({});
  const [comments, setComments] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user || !awardId || !candidateId || !activeYear) return;
      setLoading(true);

      await localDB.syncAssignmentsFromCloud();
      await localDB.syncCandidatesFromCloud();

      const assignedIds = localDB.getAssignedAwardIds(user.id, user.email, activeYear.id);
      if (!assignedIds.includes(awardId)) {
        toast.error('Akses ditolak: Anda tidak ditugaskan untuk menilai kategori ini.');
        navigate('/panel');
        setLoading(false);
        return;
      }

      const awardData = localDB.getAwards().find((a) => a.id === awardId) || null;
      setAward(awardData);

      const candData = localDB.getCandidateById(candidateId);
      if (awardData?.name.toLowerCase().includes('pdp')) {
        const asgn = localDB.getEvaluatorAssignment(user.id, user.email, awardId, activeYear.id);
        if (asgn?.division && candData?.division && candData.division.toUpperCase() !== asgn.division.toUpperCase()) {
          toast.error(`Akses Disekat: Calon ini (${candData.division}) adalah sulit dan hanya boleh dinilai oleh Ketua Program ${candData.division}.`);
          navigate(`/panel/award/${awardId}`);
          setLoading(false);
          return;
        }
      }
      setCandidate(candData);

      const itemSets = localDB.getItemSets();
      const assignedSet = itemSets.find((s) => s.award_id === awardId) || itemSets[0];
      let itemsList: AwardItem[] = [];
      if (assignedSet) {
        itemsList = localDB.getItemsBySet(assignedSet.id);
      }
      if (itemsList.length === 0) {
        const tmpl = getTemplateForAward(awardId, awardData?.name);
        if (tmpl) {
          itemsList = tmpl.items.map((itemDef, idx) => ({
            id: `${tmpl.setId}-item-${idx + 1}`,
            item_set_id: tmpl.setId,
            name: itemDef.name,
            description: itemDef.description,
            max_score: itemDef.wajaran,
            sort_order: idx + 1,
            rubric_levels: itemDef.rubric_levels,
            created_at: '',
            updated_at: '',
          }));
        }
      }
      setItems(itemsList);

      const evalData = localDB.getEvaluation(candidateId, user.id);
      if (evalData) {
        setEvaluation(evalData);
        setComments(evalData.comments || '');
        const initialScores: Record<string, number | ''> = {};
        const initialRawScores: Record<string, number | ''> = {};
        if (evalData.scores) {
          evalData.scores.forEach((s) => {
            initialScores[s.award_item_id] = s.score ?? '';
            if (s.raw_score !== undefined && s.raw_score !== null) {
              initialRawScores[s.award_item_id] = s.raw_score;
            } else if (typeof s.score === 'number' && s.max_score > 0) {
              initialRawScores[s.award_item_id] = Math.round((s.score / s.max_score) * 5);
            }
          });
        }
        setScores(initialScores);
        setRawScores(initialRawScores);
      } else {
        setEvaluation({
          id: `eval-${Date.now()}`,
          panel_candidate_id: candidateId,
          panel_id: user.id,
          award_id: awardId,
          award_year_id: activeYear.id,
          total_score: null,
          status: 'draft',
          comments: '',
          submitted_at: null,
          created_at: '',
          updated_at: '',
        });
      }
      setLoading(false);
      return;
    }

    loadData();
  }, [user, awardId, candidateId, activeYear]);

  // Live total calculation: round to 2 decimals
  const rawTotal = items.reduce((sum, item) => {
    const val = scores[item.id];
    return sum + (typeof val === 'number' ? val : 0);
  }, 0);
  const totalScore = parseFloat(rawTotal.toFixed(2));
  const totalMaxScore = items.reduce((sum, item) => sum + item.max_score, 0);

  // Score interpretation
  const interpretation = getScoreInterpretation(totalScore);
  const isLocked = evaluation?.status === 'submitted';

  // Handler for selecting Rubric Scale (1-5 or 0)
  const handleRubricSelect = (itemId: string, maxScore: number, rawVal: number) => {
    if (isLocked) return;
    const computedScore = parseFloat(((rawVal / 5) * maxScore).toFixed(2));
    setRawScores((prev) => ({ ...prev, [itemId]: rawVal }));
    setScores((prev) => ({ ...prev, [itemId]: computedScore }));
    setErrors((prev) => ({ ...prev, [itemId]: '' }));
  };

  // Handler for manual score adjustment
  const handleScoreChange = (itemId: string, maxScore: number, rawValue: string) => {
    if (isLocked) return;

    if (rawValue === '') {
      setScores((prev) => ({ ...prev, [itemId]: '' }));
      setRawScores((prev) => ({ ...prev, [itemId]: '' }));
      setErrors((prev) => ({ ...prev, [itemId]: '' }));
      return;
    }

    const num = parseFloat(rawValue);
    if (isNaN(num)) return;

    if (num < 0) {
      setErrors((prev) => ({ ...prev, [itemId]: 'Markah tidak boleh negatif.' }));
      setScores((prev) => ({ ...prev, [itemId]: 0 }));
      setRawScores((prev) => ({ ...prev, [itemId]: 0 }));
    } else if (num > maxScore) {
      setErrors((prev) => ({ ...prev, [itemId]: `Markah tidak boleh melebihi ${maxScore}.` }));
      setScores((prev) => ({ ...prev, [itemId]: maxScore }));
      setRawScores((prev) => ({ ...prev, [itemId]: 5 }));
    } else {
      setErrors((prev) => ({ ...prev, [itemId]: '' }));
      setScores((prev) => ({ ...prev, [itemId]: num }));
      const derivedRaw = parseFloat(((num / maxScore) * 5).toFixed(1));
      setRawScores((prev) => ({ ...prev, [itemId]: Math.round(derivedRaw) }));
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !evaluation || isLocked) return;
    setSavingDraft(true);
    try {
      const itemScores = items
        .filter((item) => scores[item.id] !== '' && scores[item.id] !== undefined)
        .map((item) => ({
          award_item_id: item.id,
          score: Number(scores[item.id]) || 0,
          raw_score: typeof rawScores[item.id] === 'number' ? Number(rawScores[item.id]) : null,
          max_score: item.max_score,
        }));
      localDB.saveEvaluationScores(evaluation.id, itemScores, comments);
      setEvaluation((prev) => (prev ? { ...prev, total_score: totalScore, comments } : null));

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.full_name || 'Panel Penilai',
            user_role: 'panel',
            action: 'Simpan Draf Penilaian',
            details: `Menyimpan draf markah untuk calon ${candidate?.candidate_name}`,
            entity_type: 'evaluation',
            entity_id: evaluation.id,
          });
        } catch {}
      }

      toast.success('Draf berjaya disimpan.');
    } catch (err: any) {
      toast.error('Ralat menyimpan draf.');
    } finally {
      setSavingDraft(false);
    }
  };

  const validateBeforeSubmit = () => {
    for (const item of items) {
      const val = scores[item.id];
      if (val === '' || val === undefined) {
        toast.error('Sila lengkapkan semua kriteria rubrik sebelum menghantar penilaian.');
        return false;
      }
    }
    return true;
  };

  const handlePromptSubmit = () => {
    if (validateBeforeSubmit()) {
      setConfirmSubmitOpen(true);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user || !evaluation || !candidate || !activeYear) return;
    setSubmitting(true);
    try {
      const itemScores = items.map((item) => ({
        award_item_id: item.id,
        score: Number(scores[item.id]) || 0,
        raw_score: typeof rawScores[item.id] === 'number' ? Number(rawScores[item.id]) : null,
        max_score: item.max_score,
      }));
      localDB.saveEvaluationScores(evaluation.id, itemScores, comments);
      localDB.submitEvaluation({
        evaluationId: evaluation.id,
        candidateId: candidate.id,
        awardId: awardId!,
        yearId: activeYear.id,
        totalScore,
        candidateName: candidate.candidate_name,
        staffNumber: candidate.staff_number,
        division: candidate.division,
        comments,
      });
      setEvaluation((prev) => (prev ? { ...prev, status: 'submitted', total_score: totalScore, comments } : null));

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.full_name || 'Panel Penilai',
            user_role: 'panel',
            action: 'Hantar Penilaian',
            details: `Menghantar markah penilaian (Jumlah: ${totalScore}) untuk calon ${candidate.candidate_name}`,
            entity_type: 'evaluation',
            entity_id: evaluation.id,
          });
        } catch {}
      }

      toast.success('Penilaian berjaya dihantar.');
      setConfirmSubmitOpen(false);
      navigate(`/panel/award/${awardId}`);
    } catch (err: any) {
      toast.error('Ralat menghantar penilaian.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-gray-400">Memuatkan borang pemarkahan rubrik...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Borang Pemarkahan Rubrik Calon"
        subtitle={`Kategori: ${award?.name || 'Anugerah'} • Sesi Tahun ${activeYear?.year || '-'}`}
        actions={
          <Button variant="secondary" onClick={() => navigate(`/panel/award/${awardId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Senarai Calon
          </Button>
        }
      />

      {/* Candidate Banner Card */}
      <Card className="mb-6 bg-gradient-to-r from-navy via-navy-900 to-navy text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gold uppercase tracking-wider block">Calon Dinilai</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                KKBDA Apresiasi
              </span>
            </div>
            <h2 className="text-2xl font-extrabold mt-1 tracking-tight">{candidate?.candidate_name}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/80 mt-2">
              <span>
                Bahagian: <strong className="text-gold font-bold">{candidate?.division}</strong>
              </span>
              {candidate?.staff_number && (
                <span>
                  No. Staf: <strong className="text-white font-mono">{candidate?.staff_number}</strong>
                </span>
              )}
              {candidate?.position && (
                <span>
                  Jawatan: <strong className="text-white">{candidate?.position}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLocked ? (
              <Badge variant="success" className="text-sm px-4 py-1.5 flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> SELESAI & DIKUNCI
              </Badge>
            ) : (
              <Badge variant="warning" className="text-sm px-4 py-1.5">
                STATUS: DRAF PENILAIAN
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Scoring Items List: Kriteria & Kotak Markah Sahaja */}
      <div className="space-y-4 mb-24">
        {items.map((item, idx) => {
          const val = scores[item.id];
          const err = errors[item.id];

          return (
            <Card key={item.id} className="p-6 transition-all border border-gray-200 shadow-sm hover:shadow-md bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-white bg-navy px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      KRITERIA {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gold px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/30">
                      Wajaran: {item.max_score}%
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug">{item.name}</h3>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.description}</p>
                  )}
                </div>

                {/* Kotak Markah Kriteria */}
                <div className="flex items-center gap-3 bg-surface px-4 py-3 rounded-2xl border border-gray-200 shrink-0 self-start sm:self-center">
                  <div className="text-right">
                    <label htmlFor={`score-${item.id}`} className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                      Markah Kriteria
                    </label>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        id={`score-${item.id}`}
                        type="number"
                        min="0"
                        max={item.max_score}
                        step="0.5"
                        value={val !== undefined ? val : ''}
                        onChange={(e) => handleScoreChange(item.id, item.max_score, e.target.value)}
                        disabled={isLocked}
                        placeholder="0"
                        className="w-20 text-center font-mono font-black text-2xl py-1 rounded-xl border border-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/20 bg-white focus:outline-none transition-all"
                      />
                      <span className="font-mono text-gray-500 font-bold text-base">/ {item.max_score}</span>
                    </div>
                  </div>
                </div>
              </div>

              {err && (
                <p className="text-xs text-red-600 mt-3 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {err}
                </p>
              )}
            </Card>
          );
        })}

        {/* Ulasan Panel Penilai */}
        <Card className="p-6 border border-gray-200 bg-white shadow-sm">
          <h3 className="font-bold text-navy text-base mb-1 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-gold" />
            ULASAN PANEL PENILAI
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Sila nyatakan ulasan, justifikasi kekuatan calon atau cadangan penambahbaikan bagi penilaian anugerah ini.
          </p>
          <textarea
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            disabled={isLocked}
            placeholder="cth. Calon menunjukkan inisiatif yang sangat kreatif, bimbingan yang konsisten dan impak yang nyata kepada pembangunan institusi..."
            className="w-full text-sm p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy disabled:bg-gray-100 disabled:cursor-not-allowed leading-relaxed"
          />
        </Card>
      </div>

      {/* Sticky Bottom Bar for Live Total, Interpretation & Actions */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-2xl z-20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">JUMLAH KESELURUHAN</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono text-navy">{totalScore}</span>
              <span className="text-gray-400 font-mono text-base font-bold">/ {totalMaxScore}</span>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 block">INTERPRETASI TAHAP</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold border ${interpretation.colorClass}`}>
              <Sparkles className="w-3 h-3 mr-1 text-gold" />
              {interpretation.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isLocked ? (
            <>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                loading={savingDraft}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-1" />
                SIMPAN DRAF
              </Button>
              <Button
                variant="primary"
                onClick={handlePromptSubmit}
                loading={submitting}
                className="flex-1 sm:flex-none"
              >
                <Send className="w-4 h-4 mr-1" />
                HANTAR PENILAIAN
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Penilaian Telah Diserahkan & Dikunci
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog on Submit */}
      <ConfirmDialog
        isOpen={confirmSubmitOpen}
        onClose={() => setConfirmSubmitOpen(false)}
        onConfirm={handleFinalSubmit}
        title="HANTAR PENILAIAN?"
        message={`Adakah anda pasti mahu menghantar penilaian ini?\n\nCalon: ${candidate?.candidate_name}\nJumlah Markah: ${totalScore} / ${totalMaxScore}\nTahap: ${interpretation.label}\n\nSelepas dihantar, penilaian ini akan DIKUNCI dan anda tidak boleh mengubah markah lagi.`}
        confirmText="YA, HANTAR"
        cancelText="BATAL"
        variant="primary"
        loading={submitting}
      />
    </DashboardLayout>
  );
}
