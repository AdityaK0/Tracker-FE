import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Archive, Trash2, Edit3, StickyNote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDate } from '../../utils/date';
import { notesApi, trashApi } from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';
import SkeletonCard from '../../components/shared/SkeletonCard';
import { toast } from '../../components/ui/Toaster';
import { cn } from '../../utils/cn';

const noteSchema = z.object({
  title: z.string().min(1, 'Title required').max(500),
  content: z.string().optional(),
});

function NoteCard({ note, onEdit, onPin, onArchive, onDelete }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card p-4 group hover:bg-[#FAFAFA] hover:border-[#D0D0D0] transition-colors duration-150 flex flex-col"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-[#111111] flex-1 leading-snug">
          {note.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => onPin(note)}
            className={cn(
              'p-1 rounded-sm transition-colors',
              note.is_pinned
                ? 'text-[#111111]'
                : 'text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2]',
            )}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1 rounded-sm text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2] transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onArchive(note)}
            className="p-1 rounded-sm text-[#888888] hover:text-[#111111] hover:bg-[#F2F2F2] transition-colors"
            title={note.is_archived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="p-1 rounded-sm text-[#888888] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {note.content && (
        <p className="text-xs text-[#888888] line-clamp-3 flex-1 leading-relaxed mb-3 font-light">
          {note.content}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#E5E5E5]">
        <span className="text-xs text-[#888888] font-light">
          {formatDate(note.updated_at)}
        </span>
        {note.is_pinned && <Pin className="w-3 h-3 text-[#555555]" />}
      </div>
    </motion.div>
  );
}

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingNote, setDeletingNote] = useState(null);
  const qc = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', search, showArchived],
    queryFn: () =>
      notesApi.list({
        search: search || undefined,
        archived: showArchived,
      }),
    staleTime: 30_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(noteSchema) });

  const invalidate = useCallback(
    () => qc.invalidateQueries({ queryKey: ['notes'] }),
    [qc],
  );

  const createMutation = useMutation({
    mutationFn: (d) => notesApi.create(d.title, d.content),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      reset();
      toast.success('Note created');
    },
    onError: () => toast.error('Failed to create note'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => notesApi.update(id, data),
    onSuccess: () => {
      invalidate();
      setIsModalOpen(false);
      setEditingNote(null);
      reset();
      toast.success('Note updated');
    },
    onError: () => toast.error('Failed to update note'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notesApi.delete(id),
    onSuccess: (_, id) => {
      invalidate();
      toast.success('Note moved to trash', {
        action: { label: 'Undo', onClick: () => trashApi.restoreNote(id).then(invalidate) },
      });
    },
    onError: () => toast.error('Failed to delete note'),
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    reset();
  };

  const openCreate = () => {
    setEditingNote(null);
    reset();
    setIsModalOpen(true);
  };

  const openEdit = (note) => {
    setEditingNote(note);
    setValue('title', note.title);
    setValue('content', note.content ?? '');
    setIsModalOpen(true);
  };

  const onSubmit = (data) => {
    if (editingNote) {
      updateMutation.mutate({
        id: editingNote.id,
        data: { title: data.title, content: data.content },
      });
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePin = (note) => {
    updateMutation.mutate({ id: note.id, data: { is_pinned: !note.is_pinned } });
  };

  const handleArchive = (note) => {
    updateMutation.mutate({
      id: note.id,
      data: { is_archived: !note.is_archived },
    });
  };

  const handleDelete = (note) => setDeletingNote(note);

  const pinnedNotes = notes?.filter((n) => n.is_pinned) ?? [];
  const unpinnedNotes = notes?.filter((n) => !n.is_pinned) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Notes</h1>
          <p className="text-xs text-[#888888] mt-0.5">
            {notes?.length ?? 0} {showArchived ? 'archived ' : ''}notes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 flex-shrink-0 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Note</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
            placeholder="Search notes..."
          />
        </div>
        <div className="flex gap-1 bg-white border border-[#E5E5E5] rounded-md p-1 w-fit">
          {[false, true].map((arch) => (
            <button
              key={String(arch)}
              onClick={() => setShowArchived(arch)}
              className={cn(
                'px-3 py-1 text-xs rounded-sm font-medium transition-colors',
                showArchived === arch
                  ? 'bg-[#111111] text-white'
                  : 'text-[#555555] hover:text-[#111111]',
              )}
            >
              {arch ? 'Archived' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !notes?.length ? (
        <EmptyState
          icon={StickyNote}
          title={showArchived ? 'No archived notes' : 'No notes yet'}
          description={
            showArchived
              ? 'Archived notes will appear here'
              : 'Create your first note to get started'
          }
          action={
            !showArchived ? (
              <button onClick={openCreate} className="btn-primary">
                Create note
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Pinned section */}
          {pinnedNotes.length > 0 && (
            <div className="mb-6">
              <p className="section-label mb-3 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={openEdit}
                      onPin={handlePin}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Other notes */}
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <p className="section-label mb-3">Others</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {unpinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={openEdit}
                      onPin={handlePin}
                      onArchive={handleArchive}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={() => { deleteMutation.mutate(deletingNote.id); setDeletingNote(null); }}
        title="Move to trash?"
        description={`"${deletingNote?.title}" will be moved to trash. You can restore it anytime.`}
        confirmLabel="Move to Trash"
        isLoading={deleteMutation.isPending}
      />

      {/* Create / Edit Modal */}
      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingNote ? 'Edit Note' : 'New Note'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('title')}
              className="input-base text-base font-medium"
              placeholder="Note title..."
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}
          </div>
          <div>
            <textarea
              {...register('content')}
              className="input-base resize-none"
              rows={8}
              placeholder="Write your note here... (Markdown supported)"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={closeModal} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="btn-primary"
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingNote
                  ? 'Update'
                  : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
