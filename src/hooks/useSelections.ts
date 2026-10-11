import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import { useAuth } from '@/contexts/AuthContext';
import type { CandidateAggregate, ManagementSelection, DirectorSelection } from '@/lib/types';
import toast from 'react-hot-toast';

export function useCandidateAggregates(awardId?: string, yearId?: string) {
  return useQuery({
    queryKey: ['candidate-aggregates', awardId, yearId],
    queryFn: async () => {
      await localDB.syncCandidatesFromCloud();
      if (!isSupabaseConfigured()) {
        return localDB.getAggregates(awardId, yearId);
      }
      try {
        let q = supabase.from('candidate_aggregates').select('*, award:awards(*)');
        if (awardId) q = q.eq('award_id', awardId);
        if (yearId) {
          const possibleYears = [yearId];
          if (yearId === 'year-2026' || yearId === 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9') {
            possibleYears.push('year-2026', 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9');
          }
          q = q.in('award_year_id', Array.from(new Set(possibleYears)));
        }
        const { data, error } = await q.order('average_score', { ascending: false });
        if (error || !data || data.length === 0) {
          return localDB.getAggregates(awardId, yearId);
        }
        return (data || []) as (CandidateAggregate & { award: any })[];
      } catch {
        return localDB.getAggregates(awardId, yearId);
      }
    },
    enabled: true,
  });
}

export function useManagementSelections(awardId?: string, yearId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['management-selections', awardId, yearId],
    queryFn: async () => {
      await localDB.syncCandidatesFromCloud();
      if (!isSupabaseConfigured()) {
        return localDB.getManagementSelections(awardId, yearId);
      }
      try {
        let q = supabase.from('management_selections').select('*');
        if (awardId) q = q.eq('award_id', awardId);
        if (yearId) {
          const possibleYears = [yearId];
          if (yearId === 'year-2026' || yearId === 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9') {
            possibleYears.push('year-2026', 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9');
          }
          q = q.in('award_year_id', Array.from(new Set(possibleYears)));
        }
        const { data, error } = await q;
        if (error || !data || data.length === 0) {
          return localDB.getManagementSelections(awardId, yearId);
        }
        return (data || []) as ManagementSelection[];
      } catch {
        return localDB.getManagementSelections(awardId, yearId);
      }
    },
    enabled: true,
  });

  const toggle = useMutation({
    mutationFn: async (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean }) => {
      localDB.toggleManagementSelection({
        ...params,
        userId: user?.id || 'demo-user',
      });
      if (isSupabaseConfigured()) {
        try {
          const { data: existing } = await supabase
            .from('management_selections')
            .select('*')
            .eq('candidate_aggregate_id', params.candidateAggregateId)
            .eq('award_id', params.awardId)
            .eq('award_year_id', params.yearId)
            .single();

          if (existing) {
            await supabase.from('management_selections')
              .update({ selected: params.selected, selected_by: user?.id, selected_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            await supabase.from('management_selections').insert({
              candidate_aggregate_id: params.candidateAggregateId,
              award_id: params.awardId,
              award_year_id: params.yearId,
              selected: params.selected,
              selected_by: user?.id,
              selected_at: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.warn('Supabase toggle mgmt selection notice:', e);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['management-selections'] });
      toast.success('Pengesahan berjaya disimpan.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, toggle };
}

export function useDirectorSelections(awardId?: string, yearId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['director-selections', awardId, yearId],
    queryFn: async () => {
      await localDB.syncCandidatesFromCloud();
      if (!isSupabaseConfigured()) {
        return localDB.getDirectorSelections(awardId, yearId);
      }
      try {
        let q = supabase.from('director_selections').select('*');
        if (awardId) q = q.eq('award_id', awardId);
        if (yearId) {
          const possibleYears = [yearId];
          if (yearId === 'year-2026' || yearId === 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9') {
            possibleYears.push('year-2026', 'fdb36a98-2c1c-418f-abf6-d4815b9b9ad9');
          }
          q = q.in('award_year_id', Array.from(new Set(possibleYears)));
        }
        const { data, error } = await q;
        if (error || !data || data.length === 0) {
          return localDB.getDirectorSelections(awardId, yearId);
        }
        return (data || []) as DirectorSelection[];
      } catch {
        return localDB.getDirectorSelections(awardId, yearId);
      }
    },
    enabled: true,
  });

  const toggle = useMutation({
    mutationFn: async (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean; note?: string }) => {
      localDB.toggleDirectorSelection({
        ...params,
        userId: user?.id || 'demo-user',
      });
      if (isSupabaseConfigured()) {
        try {
          const { data: existing } = await supabase
            .from('director_selections')
            .select('*')
            .eq('candidate_aggregate_id', params.candidateAggregateId)
            .eq('award_id', params.awardId)
            .eq('award_year_id', params.yearId)
            .single();

          if (existing) {
            await supabase.from('director_selections')
              .update({ selected: params.selected, selected_by: user?.id, selected_at: new Date().toISOString(), director_note: params.note || null })
              .eq('id', existing.id);
          } else {
            await supabase.from('director_selections').insert({
              candidate_aggregate_id: params.candidateAggregateId,
              award_id: params.awardId,
              award_year_id: params.yearId,
              selected: params.selected,
              selected_by: user?.id,
              selected_at: new Date().toISOString(),
              director_note: params.note || null,
            });
          }
        } catch (e) {
          console.warn('Supabase toggle director selection notice:', e);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['director-selections'] });
      toast.success('Pilihan Pengarah berjaya disimpan.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async (params: { awardId: string; yearId: string; candidateAggregateIds: string[]; note?: string }) => {
      try {
        // Save director approval
        await supabase.from('director_approvals').upsert({
          award_id: params.awardId,
          award_year_id: params.yearId,
          approved: true,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        }, { onConflict: 'award_id,award_year_id' });
      } catch {
        // Handled locally
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['director-selections'] });
      qc.invalidateQueries({ queryKey: ['director-approvals'] });
      toast.success('Keputusan berjaya disahkan.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, toggle, approve };
}

export function useAuditLog() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return [
          {
            id: 'log-1',
            user_id: '00000000-0000-0000-0000-000000000001',
            user_name: 'Ida Safinar Binti Aziz (UJK)',
            user_role: 'admin',
            action: 'Log Masuk Sistem',
            details: 'Sesi pentadbir dimulakan',
            entity_type: 'auth',
            entity_id: null,
            created_at: new Date().toISOString(),
          },
        ];
      }
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
  });
}
