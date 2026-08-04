import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, type LucideIcon } from 'lucide-react';

/**
 * ANALYTICS CHARTS
 * Reusable chart wrappers using Recharts
 * All responsive and dark-mode compatible
 */

// =============================================================================
// LOADING STATE
// =============================================================================

export function AnalyticsLoadingPlaceholder() {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-navy dark:border-white" />
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading analytics...</p>
      </div>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

export function AnalyticsEmptyState({ message = 'Need more data for analysis' }: { message?: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50">
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-400 dark:text-slate-500" />
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}

// =============================================================================
// ERROR STATE
// =============================================================================

export function AnalyticsErrorState({ message = 'Failed to load analytics' }: { message?: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
      <div className="text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">{message}</p>
      </div>
    </div>
  );
}

// =============================================================================
// TREND LINE CHART
// =============================================================================

interface TrendLineChartProps {
  data: Array<{ date: string; [key: string]: any }>;
  lines: Array<{
    key: string;
    name: string;
    color: string;
    yAxis?: 'left' | 'right';
  }>;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export function TrendLineChart({
  data,
  lines,
  height = 300,
  xAxisLabel,
  yAxisLabel,
}: TrendLineChartProps) {
  if (!data || data.length === 0) {
    return <AnalyticsEmptyState />;
  }

  const hasMultipleYAxis = lines.some((l) => l.yAxis === 'right');

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: hasMultipleYAxis ? 60 : 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(226, 232, 240)"
            className="dark:stroke-slate-700"
          />
          <XAxis
            dataKey="date"
            stroke="rgb(100, 116, 139)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgb(100, 116, 139)' }}
            className="dark:stroke-slate-400"
          />
          <YAxis
            yAxisId="left"
            stroke="rgb(100, 116, 139)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgb(100, 116, 139)' }}
            className="dark:stroke-slate-400"
          />
          {hasMultipleYAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgb(100, 116, 139)' }}
              className="dark:stroke-slate-400"
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(15, 23, 42)',
              border: '1px solid rgb(51, 65, 85)',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'rgb(226, 232, 240)' }}
            itemStyle={{ color: 'rgb(226, 232, 240)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '16px' }} />
          {lines.map((line) => (
            <Line
              key={line.key}
              yAxisId={line.yAxis || 'left'}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// AREA CHART
// =============================================================================

interface AreaChartComponentProps {
  data: Array<{ date: string; [key: string]: any }>;
  area: {
    key: string;
    name: string;
    color: string;
    fill?: string;
  };
  height?: number;
}

export function AreaChartComponent({
  data,
  area,
  height = 300,
}: AreaChartComponentProps) {
  if (!data || data.length === 0) {
    return <AnalyticsEmptyState />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={area.color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgb(226, 232, 240)"
            className="dark:stroke-slate-700"
          />
          <XAxis
            dataKey="date"
            stroke="rgb(100, 116, 139)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgb(100, 116, 139)' }}
            className="dark:stroke-slate-400"
          />
          <YAxis
            stroke="rgb(100, 116, 139)"
            style={{ fontSize: '12px' }}
            tick={{ fill: 'rgb(100, 116, 139)' }}
            className="dark:stroke-slate-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(15, 23, 42)',
              border: '1px solid rgb(51, 65, 85)',
              borderRadius: '6px',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'rgb(226, 232, 240)' }}
            itemStyle={{ color: 'rgb(226, 232, 240)' }}
          />
          <Area
            type="monotone"
            dataKey={area.key}
            stroke={area.color}
            fillOpacity={1}
            fill="url(#colorArea)"
            name={area.name}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// BAR CHART
// =============================================================================

interface BarChartComponentProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
}

export function BarChartComponent({
  data,
  color = '#0f172a',
  height = 300,
  orientation = 'vertical',
}: BarChartComponentProps) {
  if (!data || data.length === 0) {
    return <AnalyticsEmptyState />;
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <ResponsiveContainer width="100%" height={height}>
        {orientation === 'vertical' ? (
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(226, 232, 240)"
              className="dark:stroke-slate-700"
            />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={80}
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgb(100, 116, 139)' }}
              className="dark:stroke-slate-400"
            />
            <YAxis
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgb(100, 116, 139)' }}
              className="dark:stroke-slate-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15, 23, 42)',
                border: '1px solid rgb(51, 65, 85)',
                borderRadius: '6px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'rgb(226, 232, 240)' }}
              itemStyle={{ color: 'rgb(226, 232, 240)' }}
            />
            <Bar dataKey="value" fill={color} isAnimationActive={false} />
          </BarChart>
        ) : (
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgb(226, 232, 240)"
              className="dark:stroke-slate-700"
            />
            <XAxis
              type="number"
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgb(100, 116, 139)' }}
              className="dark:stroke-slate-400"
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="rgb(100, 116, 139)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'rgb(100, 116, 139)' }}
              className="dark:stroke-slate-400"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15, 23, 42)',
                border: '1px solid rgb(51, 65, 85)',
                borderRadius: '6px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'rgb(226, 232, 240)' }}
              itemStyle={{ color: 'rgb(226, 232, 240)' }}
            />
            <Bar dataKey="value" fill={color} isAnimationActive={false} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// =============================================================================
// TREND INDICATOR
// =============================================================================

interface TrendIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  label: string;
  value: number | string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({
  direction,
  label,
  value,
  unit = '',
  size = 'md',
}: TrendIndicatorProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const colorClass = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    stable: 'text-slate-600 dark:text-slate-400',
  };

  const bgClass = {
    up: 'bg-emerald-50 dark:bg-emerald-900/20',
    down: 'bg-red-50 dark:bg-red-900/20',
    stable: 'bg-slate-50 dark:bg-slate-900/20',
  };

  const IconComponent = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : AlertCircle;

  return (
    <div className={`rounded-lg ${bgClass[direction]} p-4`}>
      <div className="flex items-center gap-2">
        <IconComponent className={`h-4 w-4 ${colorClass[direction]}`} />
        <span className={`text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400`}>
          {label}
        </span>
      </div>
      <div className={`mt-2 flex items-baseline gap-1 ${sizeClasses[size]}`}>
        <span className="font-bold text-navy dark:text-white">{value}</span>
        {unit && <span className="text-slate-500 dark:text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

// =============================================================================
// METRIC CARD (Reusable from AdminFreshness)
// =============================================================================

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />}
      </div>
      <p className="mt-2 text-2xl font-bold text-navy dark:text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}
