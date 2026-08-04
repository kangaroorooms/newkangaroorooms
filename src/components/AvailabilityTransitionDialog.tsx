import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Home, MapPin, PauseCircle, RotateCcw } from 'lucide-react';
import { ModalWrapper } from './ui/ModalWrapper';
import { AvailabilityStatus, Room } from '../types/api.types';

interface AvailabilityTransitionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  initialStatus?: AvailabilityStatus;
  onConfirm: (room: Room, status: AvailabilityStatus, reason?: string, expectedAvailableFrom?: Date | string | null) => void;
  loading?: boolean;
}

function toLocalDateTimeValue(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTimeValue(value: string): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const actionMetadata: Record<AvailabilityStatus, {
  title: string;
  helper: string;
  buttonLabel: string;
  icon: typeof RotateCcw;
}> = {
  AVAILABLE: {
    title: 'Reopen Listing',
    helper: 'Make this property visible to tenants again.',
    buttonLabel: 'Reopen Listing',
    icon: RotateCcw,
  },
  FILLED: {
    title: 'Mark as Next Available Date',
    helper: 'Property has been rented.',
    buttonLabel: 'Mark Next Available Date',
    icon: Home,
  },
  OWNER_PAUSED: {
    title: 'Pause Listing',
    helper: 'Hide this property temporarily.',
    buttonLabel: 'Pause Listing',
    icon: PauseCircle,
  },
  NEEDS_RECONFIRMATION: {
    title: 'Request Reconfirmation',
    helper: 'Ask for the listing availability to be confirmed again.',
    buttonLabel: 'Request Reconfirmation',
    icon: RotateCcw,
  },
};

const statusLabels: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Available',
  FILLED: 'Rented Out',
  OWNER_PAUSED: 'Paused',
  NEEDS_RECONFIRMATION: 'Needs Reconfirmation',
};

export function AvailabilityTransitionDialog({
  isOpen,
  onClose,
  room,
  initialStatus,
  onConfirm,
  loading = false,
}: AvailabilityTransitionDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus | null>(null);
  const [reason, setReason] = useState('');
  const [expectedAvailableFrom, setExpectedAvailableFrom] = useState<string>('');
  const [minimumExpectedAvailableFrom, setMinimumExpectedAvailableFrom] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);

  const currentStatus = room?.availabilityStatus ?? 'AVAILABLE';
  const primaryImage = room?.images?.[0] ?? '';

  useEffect(() => {
    if (!room) return;

    const allowedStatuses = room.allowedAvailabilityTransitions ?? [];
    const nextStatus = initialStatus && allowedStatuses.includes(initialStatus)
      ? initialStatus
      : null;
    setSelectedStatus(nextStatus);
    setReason('');
    setExpectedAvailableFrom(room.expectedAvailableFrom ? toLocalDateTimeValue(room.expectedAvailableFrom) : '');
    setMinimumExpectedAvailableFrom(toLocalDateTimeValue(new Date()));
    setIsNoteOpen(false);
  }, [room, isOpen, initialStatus]);

  const allowedActions = useMemo(
    () => (room?.allowedAvailabilityTransitions ?? []).map((status) => ({
      value: status,
      ...actionMetadata[status],
    })),
    [room],
  );

  const currentSummaryLabel = statusLabels[currentStatus];
  const selectedAction = selectedStatus ? actionMetadata[selectedStatus] : null;
  const requiresExpectedDate = selectedStatus === 'FILLED';
  const expectedAvailableFromDate = parseLocalDateTimeValue(expectedAvailableFrom);
  const now = new Date();
  const expectedDateValidationMessage = requiresExpectedDate
    ? !expectedAvailableFrom.trim()
      ? 'Choose an expected available date and time.'
      : !expectedAvailableFromDate
        ? 'Enter a valid expected available date and time.'
        : expectedAvailableFromDate <= now
          ? 'Expected available date and time must be in the future.'
          : ''
    : '';
  const canSubmit = !loading && !!room && !!selectedStatus && !expectedDateValidationMessage;

  const handleSubmit = () => {
    if (!room || !canSubmit) return;

    onConfirm(room, selectedStatus, reason || undefined, selectedStatus === 'FILLED' ? expectedAvailableFrom || null : null);
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Availability"
      description="Choose the right listing state for this property"
      size="lg"
      className="max-w-[min(100%,748px)]"
      contentClassName="bg-slate-50 dark:bg-slate-900/40"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-navy text-white shadow-sm shadow-slate-900/10 hover:bg-navy-light transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving...' : selectedAction?.buttonLabel ?? 'Choose Action'}
          </button>
        </div>
      }
    >
      {room && (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200/80 bg-white/90 p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200 dark:bg-slate-700/70 dark:ring-slate-700">
                {primaryImage ? (
                  <img src={primaryImage} alt={room.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400 dark:text-slate-500">
                    <Home className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">{room.title}</h3>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {currentSummaryLabel}
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{room.location || room.city}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Choose action</p>

            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {allowedActions.map((option) => {
                const Icon = option.icon;
                const isActive = selectedStatus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    aria-pressed={isActive}
                    className={`min-h-[72px] rounded-xl border p-3 text-left transition-all duration-150 ${isActive ? 'border-gold/80 bg-gold/5 dark:border-gold/60 dark:bg-gold/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'} ${isActive ? 'ring-1 ring-gold/30' : 'hover:border-slate-300 hover:bg-slate-50 dark:hover:border-slate-600 dark:hover:bg-slate-800/90'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-white">{option.title}</span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">{option.helper}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {selectedStatus === 'FILLED' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <CalendarClock className="h-4 w-4 text-gold" />
                  Expected available date
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Pick when the property can reopen.</p>
                <input
                  type="datetime-local"
                  value={expectedAvailableFrom}
                  min={minimumExpectedAvailableFrom}
                  onChange={(e) => setExpectedAvailableFrom(e.target.value)}
                  aria-label="Expected available date and time"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [color-scheme:dark]"
                />
                {expectedDateValidationMessage && (
                  <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{expectedDateValidationMessage}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {selectedStatus && selectedStatus !== 'AVAILABLE' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">Optional Note</span>
                  {!isNoteOpen && (
                    <button
                      type="button"
                      onClick={() => setIsNoteOpen(true)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/70"
                    >
                      Add note
                    </button>
                  )}
                </div>

                {isNoteOpen && (
                  <textarea
                    id="availability-note"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Add a note for your team"
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/25 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {selectedAction && (
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Selected action: {selectedAction.title}
            </p>
          )}
        </div>
      )}
    </ModalWrapper>
  );
}
