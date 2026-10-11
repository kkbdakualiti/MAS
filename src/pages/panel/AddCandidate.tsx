import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ArrowLeft, UserPlus, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAwards } from '@/hooks/useAwards';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { DIVISIONS } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function AddCandidate() {
  const { awardId } = useParams<{ awardId: string }>();
  const navigate = useNavigate();
  const { user, profile, activeYear } = useAuth();
  const { data: awards = [] } = useAwards();
  const award = awards.find((a) => a.id === awardId);

  const [candidateName, setCandidateName] = useState('');
  const [division, setDivision] = useState('');
  const [assignedDivision, setAssignedDivision] = useState<string | null>(null);
  const [position, setPosition] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !awardId || !activeYear) return;

    async function checkPermission() {
      if (!user || !awardId || !activeYear) return;
      await localDB.syncAssignmentsFromCloud();
      await localDB.syncCandidatesFromCloud();
      const assignedIds = localDB.getAssignedAwardIds(user.id, user.email, activeYear.id);
      if (!assignedIds.includes(awardId)) {
        toast.error('Akses ditolak: Kategori ini tidak ditugaskan kepada anda.');
        navigate('/panel');
        return;
      }
      const asgn = localDB.getEvaluatorAssignment(user.id, user.email, awardId, activeYear.id);
      const div = asgn?.division || (user as any).division || '';
      if (div) {
        setAssignedDivision(div);
        setDivision((prev) => prev || div);
      }
    }
    checkPermission();
  }, [user, awardId, activeYear, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      toast.error('Sila masukkan nama calon.');
      return;
    }
    const effectiveDivision = (assignedDivision || division).trim();
    if (!effectiveDivision) {
      toast.error('Sila pilih bahagian calon (Wajib).');
      return;
    }
    if (!user || !awardId || !activeYear) {
      toast.error('Maklumat sesi tidak lengkap.');
      return;
    }

    setLoading(true);

    try {
      const newCand = localDB.createCandidate({
        award_id: awardId,
        award_year_id: activeYear.id,
        panel_id: user.id,
        candidate_name: candidateName.trim(),
        staff_number: null,
        division: effectiveDivision,
        position: position.trim() || null,
        created_by: user.id,
      });

      if (isSupabaseConfigured()) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            user_name: profile?.full_name || 'Panel Penilai',
            user_role: 'panel',
            action: 'Daftar Calon',
            details: `Mendaftar calon ${candidateName.trim()} (${effectiveDivision}) untuk kategori ${award?.name}`,
            entity_type: 'panel_candidate',
            entity_id: newCand.id,
          });
        } catch {}
      }

      toast.success('Calon berjaya ditambah.');
      setLoading(false);
      navigate(`/panel/award/${awardId}/score/${newCand.id}`);
    } catch (err: any) {
      console.error('Error adding candidate:', err);
      toast.error(err?.message || 'Ralat menambah calon.');
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Daftar Calon Anugerah Baru"
        subtitle={`Kategori: ${award?.name || '-'}`}
        actions={
          <Button variant="secondary" onClick={() => navigate(`/panel/award/${awardId}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali ke Senarai Calon
          </Button>
        }
      />

      <div className="max-w-2xl mx-auto mt-4">
        <Card>
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold/10 text-navy flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-navy text-lg">Maklumat Calon</h3>
              <p className="text-xs text-gray-500">
                Sila isi butiran staf yang ingin anda calonkan untuk penilaian anugerah ini.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">
                NAMA CALON <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="input-field"
                placeholder="cth. Ahmad Bin Ali"
                required
              />
            </div>

            <div>
              <label className="label">
                BAHAGIAN <span className="text-red-500">* (Wajib)</span>
              </label>
              {assignedDivision ? (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-950">
                      Bahagian Ditugaskan Khas:
                    </span>
                    <span className="font-mono font-bold bg-navy text-gold px-3 py-1 rounded-lg text-xs shadow-sm">
                      {assignedDivision}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Keahlian panel anda ditetapkan khusus bagi program <strong>{assignedDivision}</strong>. Calon akan didaftarkan di bawah bahagian ini secara automatik bagi menjaga kerahsiaan antara program.
                  </p>
                  <input type="hidden" name="division" value={assignedDivision} />
                </div>
              ) : (
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">-- Sila Pilih Bahagian Calon --</option>
                  {DIVISIONS.map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="label">JAWATAN (Pilihan)</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input-field"
                placeholder="cth. Pegawai Pendidikan Pengajian Tinggi"
              />
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate(`/panel/award/${awardId}`)}
              >
                Batal
              </Button>
              <Button variant="primary" type="submit" loading={loading}>
                <Save className="w-4 h-4 mr-1" />
                SIMPAN & NILAI
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
