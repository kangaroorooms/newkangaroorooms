import React, { useEffect, useState } from 'react';
import { Star, Home, MapPin, IndianRupee } from 'lucide-react';
import { RecommendedProperty } from '../../types/assistedManagement.types';
import { ModalWrapper } from '../ui/ModalWrapper';

interface EditRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (priority: number, notes?: string) => void;
  recommendation: RecommendedProperty | null;
  isSubmitting?: boolean;
}

/**
 * Edit Recommendation Modal
 * 
 * Modal for editing an existing property recommendation.
 * Allows updating priority and notes.
 */
export function EditRecommendationModal({
  isOpen,
  onClose,
  onConfirm,
  recommendation,
  isSubmitting = false
}: EditRecommendationModalProps) {
  const [priority, setPriority] = useState<number>(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen && recommendation) {
      setPriority(recommendation.priority);
      setNotes(recommendation.notes || '');
    }
  }, [isOpen, recommendation]);

  if (!isOpen || !recommendation) return null;

  const handleConfirm = () => {
    onConfirm(priority, notes || undefined);
  };

  const footer = (
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        onClick={onClose}
        className="w-full px-4 py-2.5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 sm:w-auto"
        disabled={isSubmitting}
      >
        Cancel
      </button>
      <button
        onClick={handleConfirm}
        disabled={isSubmitting}
        className="w-full px-6 py-2.5 bg-navy dark:bg-slate-200 text-white dark:text-navy font-medium rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Updating...
          </>
        ) : (
          'Update Recommendation'
        )}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Recommendation"
      description="Update priority and notes for this property"
      size="lg"
      closeButton
      contentClassName="p-0"
      footer={footer}
    >
      <div className="p-4 sm:p-6">
        <div className="mb-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-700/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white dark:bg-slate-600 rounded-lg text-slate-500 dark:text-slate-400">
              <Home className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-navy dark:text-white mb-1">
                {recommendation.property.title}
              </h4>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span>{recommendation.property.location}, {recommendation.property.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <IndianRupee className="w-4 h-4" />
                <span className="font-medium">{recommendation.property.pricePerMonth.toLocaleString()}/month</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Priority (1-5)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <input
              type="number"
              min="1"
              max="5"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 3)}
              className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:text-white"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              (1 = Low, 5 = High)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none h-32 resize-none dark:bg-slate-700 dark:text-white"
            placeholder="Add or update notes about this recommendation..."
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
