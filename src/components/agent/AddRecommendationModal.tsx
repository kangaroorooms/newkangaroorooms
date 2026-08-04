import React, { useEffect, useState } from 'react';
import { Home, Star } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAllProperties } from '../../store/slices/admin.slice';
import { ModalWrapper } from '../ui/ModalWrapper';

interface AddRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (propertyId: string, priority: number, notes?: string) => void;
  isSubmitting?: boolean;
}

/**
 * Add Recommendation Modal
 * 
 * Modal for adding a property recommendation to an assisted request.
 * Uses property selection with search, priority input, and notes field.
 */
export function AddRecommendationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false
}: AddRecommendationModalProps) {
  const dispatch = useAppDispatch();
  const {
    properties,
    loading
  } = useAppSelector((state) => state.admin);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [priority, setPriority] = useState<number>(3);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllProperties({}));
      setSearchTerm('');
      setSelectedPropertyId(null);
      setPriority(3);
      setNotes('');
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const filteredProperties = properties.filter((p) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    if (selectedPropertyId) {
      onConfirm(selectedPropertyId, priority, notes || undefined);
    }
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
        disabled={!selectedPropertyId || isSubmitting}
        className="w-full px-6 py-2.5 bg-navy dark:bg-slate-200 text-white dark:text-navy font-medium rounded-lg hover:bg-navy/90 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Adding...
          </>
        ) : (
          'Add Recommendation'
        )}
      </button>
    </div>
  );

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Add Property Recommendation"
      description="Select a property to recommend to the tenant"
      size="lg"
      closeButton
      contentClassName="p-0"
      footer={footer}
    >
      <div className="flex h-full flex-col p-4 sm:p-6">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search properties by title, city, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy dark:text-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-slate-100 dark:border-slate-700 rounded-xl mb-4">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy dark:border-white mx-auto"></div>
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => setSelectedPropertyId(property.id)}
                  className={`p-4 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedPropertyId === property.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                      <Home className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy dark:text-white truncate">
                        {property.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {property.city} • {property.location}
                      </p>
                    </div>
                  </div>
                  {selectedPropertyId === property.id && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No properties found matching your search.
            </div>
          )}
        </div>

        <div className="mb-4">
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
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none h-24 resize-none dark:bg-slate-700 dark:text-white"
            placeholder="Add any notes about this recommendation..."
          />
        </div>
      </div>
    </ModalWrapper>
  );
}
