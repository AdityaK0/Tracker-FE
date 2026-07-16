import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RotateCcw, StickyNote, Target } from 'lucide-react';
import { trashApi } from '../api/endpoints';
import { toast } from '../components/ui/Toaster';
import { timeAgo } from '../utils/date';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import EmptyState from '../components/shared/EmptyState';

export default function TrashPage() {
  const qc = useQueryClient();
  const [confirmEmptyOpen, setConfirmEmptyOpen] = useState(false);
  const [permanentDeleteItem, setPermanentDeleteItem] = useState(null); // { id, type, title }

  const { data: trash, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: trashApi.list,
    staleTime: 10_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['trash'] });
    qc.invalidateQueries({ queryKey: ['notes'] });
    qc.invalidateQueries({ queryKey: ['trackers'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const restoreMutation = useMutation({
    mutationFn: ({ id, type }) =>
      type === 'note' ? trashApi.restoreNote(id) : trashApi.restoreTracker(id),
    onSuccess: (_, { type }) => {
      invalidate();
      toast.success(`${type === 'note' ? 'Note' : 'Tracker'} restored`);
    },
    onError: () => toast.error('Failed to restore'),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: ({ id, type }) =>
      type === 'note' ? trashApi.deleteNotePermanently(id) : trashApi.deleteTrackerPermanently(id),
    onSuccess: () => {
      invalidate();
      setPermanentDeleteItem(null);
      toast.success('Permanently deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const emptyTrashMutation = useMutation({
    mutationFn: trashApi.emptyTrash,
    onSuccess: (data) => {
      invalidate();
      setConfirmEmptyOpen(false);
      toast.success(`Trash emptied — ${data.count} items deleted`);
    },
    onError: () => toast.error('Failed to empty trash'),
  });

  if (isLoading) return <LoadingSpinner />;

  const allItems = [...(trash?.notes ?? []), ...(trash?.trackers ?? [])].sort(
    (a, b) => new Date(b.deleted_at) - new Date(a.deleted_at)
  );
  const isEmpty = allItems.length === 0;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-light text-[#111111] tracking-tighter">Trash</h1>
          <p className="text-[#888888] text-sm font-light mt-0.5">
            {isEmpty ? 'Trash is empty' : `${allItems.length} item${allItems.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setConfirmEmptyOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-100 transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Empty Trash
          </button>
        )}
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted notes and trackers appear here. Items are permanently removed when you empty the trash."
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {allItems.map((item, i) => {
              const Icon = item.type === 'note' ? StickyNote : Target;
              return (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className="card px-5 py-4 flex items-center gap-4 group"
                >
                  <div className="w-9 h-9 bg-[#F2F2F2] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#888888]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-normal text-[#111111] truncate">{item.title}</p>
                    <p className="text-xs text-[#888888] font-light mt-0.5">
                      <span className="capitalize">{item.type}</span> · Deleted {timeAgo(item.deleted_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreMutation.mutate({ id: item.id, type: item.type })}
                      disabled={restoreMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#555555] hover:text-[#111111] hover:bg-[#F2F2F2] transition-colors border border-[#E5E5E5]"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => setPermanentDeleteItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors border border-red-100"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <p className="text-xs text-[#888888] text-center pt-4 font-light">
            Items in trash are not permanently deleted until you choose to delete them.
          </p>
        </div>
      )}

      {/* Empty trash confirm */}
      <ConfirmDialog
        open={confirmEmptyOpen}
        onClose={() => setConfirmEmptyOpen(false)}
        onConfirm={() => emptyTrashMutation.mutate()}
        title="Empty trash?"
        description={`This will permanently delete all ${allItems.length} items. This action cannot be undone.`}
        confirmLabel="Empty Trash"
        isLoading={emptyTrashMutation.isPending}
      />

      {/* Single item permanent delete confirm */}
      <ConfirmDialog
        open={!!permanentDeleteItem}
        onClose={() => setPermanentDeleteItem(null)}
        onConfirm={() => permanentDeleteMutation.mutate({ id: permanentDeleteItem.id, type: permanentDeleteItem.type })}
        title="Delete permanently?"
        description={`"${permanentDeleteItem?.title}" will be permanently deleted and cannot be recovered.`}
        confirmLabel="Delete Forever"
        isLoading={permanentDeleteMutation.isPending}
      />
    </div>
  );
}
