import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { localDB, isSupabaseConfigured } from '@/lib/localStore';
import type { AwardItemSet, AwardItem } from '@/lib/types';
import toast from 'react-hot-toast';

export function useItemSets() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['item-sets'],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getItemSets();
      }
      try {
        const { data, error } = await supabase.from('award_item_sets').select('*, award_items(*)').order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          return data as AwardItemSet[];
        }
        return localDB.getItemSets();
      } catch {
        return localDB.getItemSets();
      }
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!isSupabaseConfigured()) {
        const created = localDB.createItemSet(name);
        localDB.saveCandidatesToCloud().catch(() => {});
        return created;
      }
      try {
        const { data, error } = await supabase.from('award_item_sets').insert({ name }).select().single();
        if (error) throw error;
        return data;
      } catch {
        const created = localDB.createItemSet(name);
        localDB.saveCandidatesToCloud().catch(() => {});
        return created;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item-sets'] }); toast.success('Set item berjaya dicipta.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; award_id?: string | null; total_max_score?: number; is_complete?: boolean }) => {
      if (!isSupabaseConfigured()) {
        localDB.updateItemSet(id, input);
        localDB.saveCandidatesToCloud().catch(() => {});
        return;
      }
      try {
        const { error } = await supabase.from('award_item_sets').update(input).eq('id', id);
        if (error) throw error;
      } catch {
        localDB.updateItemSet(id, input);
        localDB.saveCandidatesToCloud().catch(() => {});
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item-sets'] }); toast.success('Set item berjaya dikemas kini.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.deleteItemSet(id);
        localDB.saveCandidatesToCloud().catch(() => {});
        return;
      }
      try {
        const { error } = await supabase.from('award_item_sets').delete().eq('id', id);
        if (error) throw error;
      } catch {
        localDB.deleteItemSet(id);
        localDB.saveCandidatesToCloud().catch(() => {});
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['item-sets'] }); toast.success('Set item berjaya dipadam.'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
}

export function useAwardItems(setId: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['award-items', setId],
    queryFn: async () => {
      if (!isSupabaseConfigured()) {
        return localDB.getItemsBySet(setId);
      }
      try {
        const { data, error } = await supabase.from('award_items').select('*').eq('item_set_id', setId).order('sort_order');
        if (error) throw error;
        if (data && data.length > 0) {
          return data as AwardItem[];
        }
        return localDB.getItemsBySet(setId);
      } catch {
        return localDB.getItemsBySet(setId);
      }
    },
    enabled: !!setId,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; description?: string; max_score: number }) => {
      if (!isSupabaseConfigured()) {
        localDB.createItem(setId, input);
        return;
      }
      try {
        const items = query.data || [];
        const maxOrder = items.reduce((max, i) => Math.max(max, i.sort_order), 0);
        const { error } = await supabase.from('award_items').insert({ ...input, item_set_id: setId, sort_order: maxOrder + 1 });
        if (error) throw error;
      } catch {
        localDB.createItem(setId, input);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-items', setId] });
      qc.invalidateQueries({ queryKey: ['item-sets'] });
      toast.success('Item berjaya ditambah.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; description?: string; max_score?: number; sort_order?: number }) => {
      if (!isSupabaseConfigured()) {
        localDB.updateItem(id, input);
        return;
      }
      try {
        const { error } = await supabase.from('award_items').update(input).eq('id', id);
        if (error) throw error;
      } catch {
        localDB.updateItem(id, input);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-items', setId] });
      qc.invalidateQueries({ queryKey: ['item-sets'] });
      toast.success('Item berjaya dikemas kini.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured()) {
        localDB.deleteItem(id);
        return;
      }
      try {
        const { error } = await supabase.from('award_items').delete().eq('id', id);
        if (error) throw error;
      } catch {
        localDB.deleteItem(id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['award-items', setId] });
      qc.invalidateQueries({ queryKey: ['item-sets'] });
      toast.success('Item berjaya dipadam.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      if (!isSupabaseConfigured()) {
        localDB.reorderItems(setId, items);
        return;
      }
      try {
        for (const item of items) {
          await supabase.from('award_items').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      } catch {
        localDB.reorderItems(setId, items);
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['award-items', setId] }); },
  });

  return { ...query, create, update, remove, reorder };
}
