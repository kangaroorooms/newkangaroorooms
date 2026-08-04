import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ModalWrapper } from '../ui/ModalWrapper';
interface DeleteNoteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  propertyTitle: string;
  isSubmitting?: boolean;
}
export function DeleteNoteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle,
  isSubmitting = false
}: DeleteNoteConfirmModalProps) {
  if (!isOpen) return null;

  const footer = (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button onClick={onClose} disabled={isSubmitting} className="w-full px-6 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 sm:w-auto">
        Cancel
      </button>
      <button onClick={onConfirm} disabled={isSubmitting} className="w-full px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:w-auto">
        {isSubmitting ? <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Deleting...
          </> : 'Delete Note'}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Note"
      description="This action cannot be undone"
      size="md"
      closeButton
      contentClassName="p-0"
      footer={footer}
    >
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h4 className="text-lg font-bold text-navy dark:text-white mb-2">
          Are you sure you want to delete this note?
        </h4>

        <p className="text-slate-500 dark:text-slate-400 mb-2">
          This note for{' '}
          <strong className="text-navy dark:text-white">
            {propertyTitle}
          </strong>{' '}
          will be removed.
        </p>

        <p className="text-sm text-slate-400 dark:text-slate-500">
          The owner and tenants will no longer see this note.
        </p>
      </div>
    </ModalWrapper>
  );
}