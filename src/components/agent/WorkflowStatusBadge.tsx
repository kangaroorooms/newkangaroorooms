import React from 'react';
import { WorkflowStatus } from '../../types/assistedManagement.types';

interface WorkflowStatusBadgeProps {
  status: WorkflowStatus;
  className?: string;
}

/**
 * Workflow Status Badge
 * 
 * Displays the workflow status of an assisted request with appropriate color coding.
 * 
 * Status colors:
 * - NEW: Blue
 * - CONTACTED: Purple
 * - SEARCHING: Yellow
 * - PROPERTIES_SHARED: Green
 * - VISITS_SCHEDULED: Orange
 * - COMPLETED: Emerald
 * - CANCELLED: Red
 */
export function WorkflowStatusBadge({ status, className = '' }: WorkflowStatusBadgeProps) {
  const getStatusColor = (status: WorkflowStatus): string => {
    const colors: Record<WorkflowStatus, string> = {
      [WorkflowStatus.NEW]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      [WorkflowStatus.CONTACTED]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      [WorkflowStatus.SEARCHING]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      [WorkflowStatus.PROPERTIES_SHARED]: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
      [WorkflowStatus.VISITS_SCHEDULED]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      [WorkflowStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      [WorkflowStatus.CANCELLED]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800';
  };

  const getStatusIcon = (status: WorkflowStatus): string => {
    const icons: Record<WorkflowStatus, string> = {
      [WorkflowStatus.NEW]: '●',
      [WorkflowStatus.CONTACTED]: '●',
      [WorkflowStatus.SEARCHING]: '●',
      [WorkflowStatus.PROPERTIES_SHARED]: '●',
      [WorkflowStatus.VISITS_SCHEDULED]: '●',
      [WorkflowStatus.COMPLETED]: '●',
      [WorkflowStatus.CANCELLED]: '●'
    };
    return icons[status] || '●';
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(status)} ${className}`}>
      <span className="text-[8px]">{getStatusIcon(status)}</span>
      {status}
    </span>
  );
}
