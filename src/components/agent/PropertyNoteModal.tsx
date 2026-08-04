import React, { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { AgentNote } from '../../types/agent.types';
import { ModalWrapper } from '../ui/ModalWrapper';
interface PropertyNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
  propertyTitle: string;
  existingNote?: AgentNote | null;
  isSubmitting?: boolean;
}
export function PropertyNoteModal({
  isOpen,
  onClose,
  onSave,
  propertyTitle,
  existingNote = null,
  isSubmitting = false
}: PropertyNoteModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const isEditing = !!existingNote;
  useEffect(() => {
    if (isOpen) {
      setContent(existingNote?.content || '');
      setError('');
    }
  }, [isOpen, existingNote]);
  if (!isOpen) return null;
  const handleSubmit = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError('Note content is required');
      return;
    }
    if (trimmedContent.length < 3) {
      setError('Note must be at least 3 characters');
      return;
    }
    if (trimmedContent.length > 2000) {
      setError('Note must be less than 2000 characters');
      return;
    }
    setError('');
    await onSave(trimmedContent);
  };
  const footer = (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button onClick={onClose} disabled={isSubmitting} className="w-full px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 sm:w-auto">
        Cancel
      </button>
      <button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="w-full px-6 py-2.5 bg-navy dark:bg-slate-200 text-white dark:text-navy font-medium rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:w-auto">
        {isSubmitting ? <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {isEditing ? 'Saving...' : 'Creating...'}
          </> : isEditing ? 'Save Changes' : 'Create Note'}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Note' : 'Add Note'}
      description={propertyTitle}
      size="md"
      closeButton
      contentClassName="p-0"
      footer={footer}
    >
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-700/30">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{propertyTitle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Visible to the owner and assigned tenants</p>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Note Content
        </label>
        <textarea value={content} onChange={(e) => {
          setContent(e.target.value);
          if (error) setError('');
        }} placeholder="Add your note about this property..." className={`w-full p-4 border rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none resize-none h-40 dark:bg-slate-700 dark:text-white ${error ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-600'}`} disabled={isSubmitting} />

        <div className="flex justify-between items-center mt-2">
          {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : <p className="text-xs text-slate-400 dark:text-slate-500">
              {content.length}/2000 characters
            </p>}
        </div>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50/80 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            <strong>Note:</strong> This note will be visible to the property owner and assigned tenants. Only you can edit or delete it.
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
}