import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pin, Archive, Trash2, Edit3, StickyNote } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { notesApi } from '../../api/endpoints';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/shared/EmptyState';
import SkeletonCard from '../../components/shared/SkeletonCard';
import toast from 'react-hot-toast';
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
      className="card p-4 group hover:border-[#2a2a2a] transition-colors flex flex-col"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-white flex-1 leading-snug">
          {note.title}
        </h3>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onPin(note)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              note.is_pinned
                ? 'text-amber-400'
                : 'text-[#52525b] hover:text-white',
            )}
            title={note.is_pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-md text-[#52525b] hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onArchive(note)}
            className="p-1.5 rounded-md text-[#52525b] hover:text-white transition-colors"
            title={note.is_archived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(note)}
            className="p-1.5 rounded-md text-[#52525b] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {note.content && (
        <p className="text-xs text-[#a1a1aa] line-clamp-3 flex-1 leading-relaxed mb-3">
          {note.content}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#1a1a1a]">
        <span className="text-xs text-[#52525b]">
          {format(new Date(note.updated_at), 'MMM d, yyyy')}
        </span>
        {note.is_pinned && <Pin className="w-3 h-3 text-amber-400" />}
      </div>
    </motion.div>
  );
}

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    onSuccess: () => {
      invalidate();
      toast.success('Note deleted');
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

  const handleDelete = (note) => {
    if (confirm(`Delete "${note.title}"?`)) {
      deleteMutation.mutate(note.id);
    }
  };

  const pinnedNotes = notes?.filter((n) => n.is_pinned) ?? [];
  const unpinnedNotes = notes?.filter((n) => !n.is_pinned) ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Notes</h1>
          <p className="text-[#52525b] text-sm mt-0.5">
            {notes?.length ?? 0} {showArchived ? 'archived ' : ''}notes
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Note
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525b]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9"
            placeholder="Search notes..."
          />
        </div>
        <div className="flex gap-1 bg-[#111111] border border-[#1a1a1a] rounded-lg p-1">
          {[false, true].map((arch) => (
            <button
              key={String(arch)}
              onClick={() => setShowArchived(arch)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-md font-medium transition-colors',
                showArchived === arch
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#52525b] hover:text-white',
              )}
            >
              {arch ? 'Archived' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3 h-3" /> Pinned
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <p className="text-xs font-medium text-[#52525b] uppercase tracking-wider mb-3">
                  Others
                </p>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              className="input-base text-base font-semibold"
              placeholder="Note title..."
            />
            {errors.title && (
              <p className="text-red-400 text-xs mt-1">
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
