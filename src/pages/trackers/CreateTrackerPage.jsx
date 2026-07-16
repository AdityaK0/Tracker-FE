import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Target,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { trackersApi } from '../../api/endpoints';
import { cn } from '../../utils/cn';
import { toast } from '../../components/ui/Toaster';
import { format, addDays } from 'date-fns';

const DURATIONS = [
  { label: '7 Days', value: 7 },
  { label: '21 Days', value: 21 },
  { label: '30 Days', value: 30 },
  { label: '50 Days', value: 50 },
  { label: 'Custom', value: 0 },
];

const step1Schema = z.object({
  name: z.string().min(1, 'Name required').max(200),
  description: z.string().optional(),
});

// ── Sortable habit row ───────────────────────────────────────────────────────
function SortableHabit({ habit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 bg-white border border-[#E5E5E5] rounded-xl px-3 py-2.5 group',
        isDragging && 'opacity-50',
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#888888] hover:text-[#555555] touch-none"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="flex-1 text-sm text-[#111111]">{habit.name}</span>
      <button
        onClick={onDelete}
        className="text-[#888888] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function CreateTrackerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState({
    name: '',
    description: '',
  });
  const [duration, setDuration] = useState(30);
  const [customDuration, setCustomDuration] = useState('');
  const [startType, setStartType] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: step1Data,
  });

  const createMutation = useMutation({
    mutationFn: trackersApi.create,
    onSuccess: (data) => {
      toast.success('Tracker created!');
      navigate(`/trackers/${data.id}`);
    },
    onError: () => toast.error('Failed to create tracker'),
  });

  const getStartDate = () => {
    if (startType === 'today') return format(new Date(), 'yyyy-MM-dd');
    if (startType === 'tomorrow')
      return format(addDays(new Date(), 1), 'yyyy-MM-dd');
    return customDate || format(new Date(), 'yyyy-MM-dd');
  };

  const getActualDuration = () =>
    duration === 0 ? parseInt(customDuration || '30', 10) : duration;

  const addHabit = useCallback(() => {
    const name = newHabit.trim();
    if (!name) return;
    setHabits((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, position: prev.length },
    ]);
    setNewHabit('');
  }, [newHabit]);

  const removeHabit = useCallback((id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setHabits((prev) => {
        const oldIdx = prev.findIndex((h) => h.id === active.id);
        const newIdx = prev.findIndex((h) => h.id === over.id);
        return arrayMove(prev, oldIdx, newIdx).map((h, i) => ({
          ...h,
          position: i,
        }));
      });
    }
  };

  const handleCreate = () => {
    const actualDuration = getActualDuration();
    if (actualDuration < 1 || actualDuration > 365) {
      toast.error('Duration must be between 1 and 365 days');
      return;
    }
    createMutation.mutate({
      name: step1Data.name,
      description: step1Data.description || undefined,
      duration_days: actualDuration,
      start_date: getStartDate(),
      habits: habits.map((h, i) => ({ name: h.name, position: i })),
    });
  };

  const steps = ['Details', 'Duration', 'Habits', 'Review'];

  return (
    <div className="max-w-xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => navigate('/trackers')}
          className="btn-ghost p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-light text-[#111111] tracking-tighter">Create Tracker</h1>
          <p className="text-[#888888] text-sm font-light">
            Step {step} of {steps.length}
          </p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors',
                i + 1 < step
                  ? 'bg-[#111111] text-white'
                  : i + 1 === step
                    ? 'bg-[#111111] text-white ring-2 ring-[#111111]/20'
                    : 'bg-[#F2F2F2] text-[#888888] border border-[#E5E5E5]',
              )}
            >
              {i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'text-xs hidden sm:block',
                i + 1 === step ? 'text-[#111111] font-medium' : 'text-[#888888]',
              )}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px',
                  i + 1 < step ? 'bg-[#111111]' : 'bg-[#E5E5E5]',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step panels */}
      <AnimatePresence mode="wait">
        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="card p-4 sm:p-6">
              <h2 className="text-base font-medium text-[#111111] mb-5">
                Tracker Details
              </h2>
              <form
                onSubmit={handleSubmit((d) => {
                  setStep1Data(d);
                  setStep(2);
                })}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-normal text-[#111111] mb-1.5">
                    Tracker name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    className="input-base"
                    placeholder="e.g. 75 Hard Challenge"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-normal text-[#111111] mb-1.5">
                    Description{' '}
                    <span className="text-[#888888]">(optional)</span>
                  </label>
                  <textarea
                    {...register('description')}
                    className="input-base resize-none"
                    rows={3}
                    placeholder="What's this tracker about?"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="btn-primary flex items-center gap-2 py-3 sm:py-2.5"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Duration & Start Date ── */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="card p-4 sm:p-6 space-y-6">
              <h2 className="text-base font-medium text-[#111111]">
                Duration & Start Date
              </h2>

              {/* Duration picker */}
              <div>
                <label className="block text-sm font-normal text-[#111111] mb-3">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-normal border transition-colors',
                        duration === d.value
                          ? 'bg-[#111111] border-[#111111] text-white'
                          : 'bg-white border-[#E5E5E5] text-[#555555] hover:border-[#111111] hover:text-[#111111]',
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                {duration === 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      {/* decrement */}
                      <button
                        type="button"
                        onClick={() =>
                          setCustomDuration((v) =>
                            String(Math.max(1, (parseInt(v) || 1) - 1)),
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#E5E5E5] text-[#555555] hover:text-[#111111] hover:border-[#111111] transition-colors flex-shrink-0"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <input
                        type="number"
                        value={customDuration}
                        onChange={(e) => {
                          const raw = parseInt(e.target.value);
                          if (isNaN(raw)) {
                            setCustomDuration('');
                            return;
                          }
                          setCustomDuration(String(Math.min(365, Math.max(1, raw))));
                        }}
                        className="input-base text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        placeholder="1 – 365"
                        min={1}
                        max={365}
                      />

                      {/* increment */}
                      <button
                        type="button"
                        onClick={() =>
                          setCustomDuration((v) =>
                            String(Math.min(365, (parseInt(v) || 0) + 1)),
                          )
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#E5E5E5] text-[#555555] hover:text-[#111111] hover:border-[#111111] transition-colors flex-shrink-0"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                    </div>

                    {customDuration && (
                      <p className="text-xs text-[#888888] text-center font-light">
                        {parseInt(customDuration)} day{parseInt(customDuration) !== 1 ? 's' : ''} selected · max 365
                      </p>
                    )}
                    {customDuration && parseInt(customDuration) >= 365 && (
                      <p className="text-xs text-[#555555] text-center">Maximum duration is 365 days</p>
                    )}
                  </div>
                )}
              </div>

              {/* Start date picker */}
              <div>
                <label className="block text-sm font-normal text-[#111111] mb-3">
                  Start date
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['today', 'tomorrow', 'custom'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setStartType(type)}
                      className={cn(
                        'py-2.5 rounded-xl text-sm font-normal border capitalize transition-colors',
                        startType === type
                          ? 'bg-[#111111] border-[#111111] text-white'
                          : 'bg-white border-[#E5E5E5] text-[#555555] hover:border-[#111111] hover:text-[#111111]',
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {startType === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="input-base"
                    min={format(new Date(), 'yyyy-MM-dd')}
                  />
                )}
                {startType === 'tomorrow' && (
                  <p className="text-xs text-[#888888] mt-2 font-light">
                    Starts in ~24 hours — tracker will auto-activate
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => {
                    if (duration === 0) {
                      const val = parseInt(customDuration);
                      if (!customDuration || isNaN(val) || val < 1 || val > 365) {
                        toast.error('Enter a duration between 1 and 365 days');
                        return;
                      }
                    }
                    setStep(3);
                  }}
                  className="btn-primary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 3: Habits ── */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="card p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-base font-medium text-[#111111]">
                  Add Habits
                </h2>
                <p className="text-[#888888] text-sm mt-0.5 font-light">
                  These become the columns in your tracker table
                </p>
              </div>

              {/* Add habit input */}
              <div className="flex gap-2">
                <input
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addHabit();
                    }
                  }}
                  className="input-base flex-1"
                  placeholder="e.g. Morning run, Read 10 pages..."
                />
                <button
                  onClick={addHabit}
                  disabled={!newHabit.trim()}
                  className="btn-primary flex items-center gap-1 px-3"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Drag-and-drop habit list */}
              {habits.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={habits.map((h) => h.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {habits.map((habit) => (
                        <SortableHabit
                          key={habit.id}
                          habit={habit}
                          onDelete={() => removeHabit(habit.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="border border-dashed border-[#E5E5E5] rounded-xl p-6 text-center">
                  <p className="text-[#888888] text-sm font-light">
                    Add at least one habit above
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={habits.length === 0}
                  className="btn-primary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="card p-4 sm:p-6 space-y-5">
              <h2 className="text-base font-medium text-[#111111]">
                Review & Create
              </h2>

              <div className="space-y-0 divide-y divide-[#E5E5E5]">
                <div className="flex justify-between py-3">
                  <span className="text-sm text-[#888888]">Name</span>
                  <span className="text-sm text-[#111111] font-medium">
                    {step1Data.name}
                  </span>
                </div>
                {step1Data.description && (
                  <div className="flex justify-between py-3">
                    <span className="text-sm text-[#888888]">Description</span>
                    <span className="text-sm text-[#555555] text-right max-w-[60%] font-light">
                      {step1Data.description}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3">
                  <span className="text-sm text-[#888888]">Duration</span>
                  <span className="text-sm text-[#111111]">
                    {getActualDuration()} days
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-[#888888]">Start date</span>
                  <span className="text-sm text-[#111111]">
                    {format(new Date(getStartDate()), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-sm text-[#888888]">End date</span>
                  <span className="text-sm text-[#111111]">
                    {format(
                      addDays(
                        new Date(getStartDate()),
                        getActualDuration() - 1,
                      ),
                      'MMM d, yyyy',
                    )}
                  </span>
                </div>
                <div className="py-3">
                  <span className="text-sm text-[#888888] block mb-2">
                    Habits ({habits.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {habits.map((h) => (
                      <span
                        key={h.id}
                        className="px-2.5 py-1 bg-[#F2F2F2] text-[#555555] border border-[#E5E5E5] rounded-full text-xs font-light"
                      >
                        {h.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="btn-secondary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="btn-primary flex items-center gap-2 py-3 sm:py-2.5"
                >
                  <Target className="w-4 h-4" />
                  {createMutation.isPending ? 'Creating...' : 'Create Tracker'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
