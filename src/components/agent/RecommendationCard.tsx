import React from 'react';
import { Home, Edit2, Trash2, Star, Calendar, MapPin, IndianRupee } from 'lucide-react';
import { RecommendedProperty } from '../../types/assistedManagement.types';

interface RecommendationCardProps {
  recommendation: RecommendedProperty;
  onEdit: (recommendation: RecommendedProperty) => void;
  onDelete: (recommendationId: string) => void;
  isDeleting?: boolean;
}

/**
 * Recommendation Card
 * 
 * Displays a property recommendation with priority, notes, and actions.
 * Used in agent dashboard for managing property recommendations.
 */
export function RecommendationCard({ 
  recommendation, 
  onEdit, 
  onDelete,
  isDeleting = false 
}: RecommendationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    if (priority >= 3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'High Priority';
    if (priority >= 3) return 'Medium-High';
    if (priority >= 2) return 'Medium';
    return 'Low';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-navy dark:text-white flex-shrink-0" />
              <h3 className="font-semibold text-navy dark:text-white truncate">
                {recommendation.property.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3 h-3" />
              <span>{recommendation.property.location}, {recommendation.property.city}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(recommendation.priority)}`}>
              {getPriorityLabel(recommendation.priority)}
            </span>
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <IndianRupee className="w-4 h-4" />
            <span className="font-medium">{recommendation.property.pricePerMonth.toLocaleString()}/month</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Star className="w-4 h-4" />
            <span>Priority: {recommendation.priority}</span>
          </div>
        </div>

        {recommendation.notes && (
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">Notes:</span> {recommendation.notes}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Calendar className="w-3 h-3" />
          <span>Added {formatDate(recommendation.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
        <button
          onClick={() => onEdit(recommendation)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(recommendation.id)}
          disabled={isDeleting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
              Removing...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Remove
            </>
          )}
        </button>
      </div>
    </div>
  );
}
