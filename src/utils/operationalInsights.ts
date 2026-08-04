/**
 * Operational Insights Generator
 * Converts raw metrics into human-readable operational guidance
 * Uses only existing data - no fake AI scoring
 */

export type HealthStatus = 'healthy' | 'watch' | 'issue' | 'unknown';

export interface OperationalInsight {
  status: HealthStatus;
  message: string;
  guidance?: string;
}

// =============================================================================
// MARKETPLACE HEALTH INSIGHTS
// =============================================================================

export function getMarketplaceHealthInsight(
  freshPercent: number,
  stalePercent: number,
  deadPercent: number,
  totalActive: number
): OperationalInsight {
  // Determine status based on inventory composition
  if (freshPercent >= 85 && stalePercent <= 10) {
    return {
      status: 'healthy',
      message: `Marketplace healthy. ${totalActive} active listings, ${freshPercent}% recently engaged.`,
    };
  } else if (freshPercent >= 70 && stalePercent <= 20) {
    return {
      status: 'healthy',
      message: `Marketplace stable. ${freshPercent}% fresh inventory across ${totalActive} listings.`,
    };
  } else if (stalePercent > 30 || deadPercent > 20) {
    return {
      status: 'issue',
      message: `Marketplace needs attention. ${stalePercent}% stale, ${deadPercent}% dead listings.`,
      guidance: 'Review stale properties and consider targeted owner engagement.',
    };
  } else if (stalePercent > 20) {
    return {
      status: 'watch',
      message: `Marketplace aging. ${stalePercent}% stale listings, monitor closely.`,
      guidance: 'Consider generating reminders for stale properties.',
    };
  } else {
    return {
      status: 'unknown',
      message: `Marketplace status: ${freshPercent}% fresh, ${stalePercent}% stale, ${deadPercent}% dead.`,
    };
  }
}

// =============================================================================
// RECOVERY EFFECTIVENESS INSIGHTS
// =============================================================================

export function getRecoveryInsight(
  recoveredPercent: number,
  recoveredCount: number
): OperationalInsight {
  if (recoveredCount === 0) {
    return {
      status: 'watch',
      message: 'Recovery system active, awaiting stale property reviews.',
      guidance: 'Mark stale properties as recovered or false positive to enable recovery tracking.',
    };
  }

  if (recoveredPercent >= 70) {
    return {
      status: 'healthy',
      message: `Recovery working well. ${recoveredPercent}% recovery rate (${recoveredCount} listings).`,
    };
  } else if (recoveredPercent >= 50) {
    return {
      status: 'healthy',
      message: `Recovery stable. ${recoveredCount} listings recovered, ${recoveredPercent}% recovery rate.`,
    };
  } else if (recoveredPercent > 0) {
    return {
      status: 'watch',
      message: `Recovery rate low at ${recoveredPercent}% (${recoveredCount} recoveries).`,
      guidance: 'Consider improving owner engagement or adjustment recovery criteria.',
    };
  } else {
    return {
      status: 'watch',
      message: 'Recovery system operational, awaiting data.',
      guidance: 'Initial setup phase - system needs more reviewed listings for trends.',
    };
  }
}

// =============================================================================
// REMINDER EFFECTIVENESS INSIGHTS
// =============================================================================

export function getReminderInsight(
  successRate: number,
  successfulCount: number,
  totalGenerated: number
): OperationalInsight {
  if (totalGenerated === 0) {
    return {
      status: 'healthy',
      message: 'Reminder system ready. No stale inventory detected yet.',
      guidance: 'Reminders will activate when stale properties are identified.',
    };
  }

  if (successRate >= 80) {
    return {
      status: 'healthy',
      message: `Reminders effective. ${successfulCount}/${totalGenerated} generated successfully (${successRate}%).`,
    };
  } else if (successRate >= 60) {
    return {
      status: 'healthy',
      message: `Reminders active. ${successRate}% success rate, ${successfulCount} sent.`,
    };
  } else if (successRate > 0) {
    return {
      status: 'watch',
      message: `Reminder success rate low at ${successRate}% (${successfulCount}/${totalGenerated}).`,
      guidance: 'Review reminder content and timing. Consider targeting specific owner segments.',
    };
  } else {
    return {
      status: 'watch',
      message: 'Reminders generated but none successful yet.',
      guidance: 'Monitor next batch. Possible delivery or content issues.',
    };
  }
}

// =============================================================================
// OWNER RESPONSIVENESS INSIGHTS
// =============================================================================

export function getOwnerResponsivenessInsight(
  responseRate: number,
  responses: number,
  sent: number
): OperationalInsight {
  if (sent === 0) {
    return {
      status: 'healthy',
      message: 'No reminders sent yet. System ready for owner engagement.',
    };
  }

  if (responseRate >= 70) {
    return {
      status: 'healthy',
      message: `Owners responsive. ${responseRate}% reply rate (${responses}/${sent} reminders).`,
    };
  } else if (responseRate >= 40) {
    return {
      status: 'healthy',
      message: `Owners moderately responsive. ${responses} responses to ${sent} reminders (${responseRate}%).`,
    };
  } else if (responseRate > 0) {
    return {
      status: 'watch',
      message: `Owner response rate low at ${responseRate}% (${responses}/${sent}).`,
      guidance: 'Consider different messaging or timing. May indicate unengaged owner segment.',
    };
  } else {
    return {
      status: 'watch',
      message: `No owner responses to ${sent} reminders sent.`,
      guidance: 'Review reminder delivery and content. Possible owner disengagement.',
    };
  }
}

// =============================================================================
// FALSE POSITIVE INSIGHTS
// =============================================================================

export function getFalsePositiveInsight(
  falsePositiveRate: number
): OperationalInsight {
  if (falsePositiveRate === 0) {
    return {
      status: 'healthy',
      message: 'No false positives detected. Freshness scoring accurate.',
    };
  }

  if (falsePositiveRate <= 5) {
    return {
      status: 'healthy',
      message: `False positive rate excellent at ${falsePositiveRate.toFixed(1)}%.`,
    };
  } else if (falsePositiveRate <= 15) {
    return {
      status: 'healthy',
      message: `False positive rate acceptable at ${falsePositiveRate.toFixed(1)}%.`,
    };
  } else if (falsePositiveRate <= 30) {
    return {
      status: 'watch',
      message: `False positive rate elevated at ${falsePositiveRate.toFixed(1)}%.`,
      guidance: 'Review freshness thresholds. May need adjustment for market conditions.',
    };
  } else {
    return {
      status: 'issue',
      message: `High false positive rate: ${falsePositiveRate.toFixed(1)}%.`,
      guidance: 'Urgently review freshness scoring logic. Current thresholds unreliable.',
    };
  }
}

// =============================================================================
// WORKLOAD INSIGHTS
// =============================================================================

export function getWorkloadInsight(
  workload: number,
  activeListings: number
): OperationalInsight {
  if (activeListings === 0) {
    return {
      status: 'healthy',
      message: 'No active review workload.',
      guidance: 'Marketplace may be starting up or unusually quiet.',
    };
  }

  const workloadPercent = (workload / activeListings) * 100;

  if (workloadPercent <= 5) {
    return {
      status: 'healthy',
      message: `Review workload light. ${workload} items for ${activeListings} active listings (${workloadPercent.toFixed(1)}%).`,
    };
  } else if (workloadPercent <= 15) {
    return {
      status: 'healthy',
      message: `Review workload moderate. ${workload} items to review (${workloadPercent.toFixed(1)}% of active).`,
    };
  } else if (workloadPercent <= 30) {
    return {
      status: 'watch',
      message: `Review workload elevated. ${workload} items pending (${workloadPercent.toFixed(1)}%).`,
      guidance: 'Consider expediting reviews or allocating more admin time.',
    };
  } else {
    return {
      status: 'issue',
      message: `Heavy review backlog. ${workload} items pending (${workloadPercent.toFixed(1)}%).`,
      guidance: 'Urgent: allocate resources to reduce backlog.',
    };
  }
}

// =============================================================================
// DATA INTEGRITY INSIGHTS
// =============================================================================

export function getConsistencyInsight(
  isValid: boolean,
  issueCount: number
): OperationalInsight {
  if (isValid && issueCount === 0) {
    return {
      status: 'healthy',
      message: 'Data integrity healthy. No consistency issues detected.',
    };
  } else if (issueCount > 0) {
    return {
      status: 'issue',
      message: `Data integrity warning. ${issueCount} consistency issue(s) detected.`,
      guidance: 'Review recommendations below. May impact analytics reliability.',
    };
  } else {
    return {
      status: 'watch',
      message: 'Data integrity unknown. Insufficient snapshot data.',
      guidance: 'System accumulating historical snapshots for trend analysis.',
    };
  }
}

// =============================================================================
// HELPER: EMPTY STATE MESSAGING
// =============================================================================

export function getEmptyStateMessage(section: string, daysAvailable: number, daysRequired: number): string {
  const daysRemaining = daysRequired - daysAvailable;

  switch (section) {
    case 'recovery':
      return `Recovery analytics accumulating data. ${daysAvailable}/${daysRequired} days complete, ${daysRemaining} day(s) remaining for accurate trends.`;
    case 'reminders':
      return `Reminder analytics initializing. ${daysAvailable}/${daysRequired} days of data collected.`;
    case 'false-positives':
      return `False positive analysis accumulating baseline. ${daysAvailable}/${daysRequired} days complete.`;
    case 'workload':
      return `Workload trends building. ${daysAvailable}/${daysRequired} days of historical data gathered.`;
    default:
      return `Accumulating data for trends. ${daysAvailable}/${daysRequired} days available.`;
  }
}
