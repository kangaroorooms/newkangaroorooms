import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { HealthStatus as HealthStatusType } from '../../utils/operationalInsights';

interface HealthStatusProps {
  status: HealthStatusType;
  message: string;
  guidance?: string;
  compact?: boolean;
}

/**
 * Operational health status indicator
 * Shows status + actionable message + optional guidance
 * Converts raw metrics into human-readable insights
 */
export function HealthStatus({
  status,
  message,
  guidance,
  compact = false,
}: HealthStatusProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'watch':
        return <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
      case 'issue':
        return <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      default:
        return <HelpCircle className="h-5 w-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBackgroundColor = () => {
    switch (status) {
      case 'healthy':
        return 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-900/20';
      case 'watch':
        return 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/20';
      case 'issue':
        return 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20';
      default:
        return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-800 dark:text-emerald-200';
      case 'watch':
        return 'text-amber-800 dark:text-amber-200';
      case 'issue':
        return 'text-red-800 dark:text-red-200';
      default:
        return 'text-slate-800 dark:text-slate-200';
    }
  };

  const getGuidanceTextColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-700 dark:text-emerald-300';
      case 'watch':
        return 'text-amber-700 dark:text-amber-300';
      case 'issue':
        return 'text-red-700 dark:text-red-300';
      default:
        return 'text-slate-700 dark:text-slate-300';
    }
  };

  if (compact) {
    return (
      <div className={`flex items-start gap-3 rounded-lg border p-3 ${getBackgroundColor()}`}>
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${getTextColor()}`}>{message}</p>
          {guidance && (
            <p className={`mt-1 text-xs ${getGuidanceTextColor()}`}>{guidance}</p>
          )}
        </div>
      </div>
    );
  }

  // Default (expanded) layout
  return (
    <div className={`rounded-lg border p-4 ${getBackgroundColor()}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${getTextColor()}`}>{message}</p>
          {guidance && (
            <p className={`mt-2 text-sm ${getGuidanceTextColor()}`}>{guidance}</p>
          )}
        </div>
      </div>
    </div>
  );
}
