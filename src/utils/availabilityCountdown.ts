import { Room } from '../types/api.types';

// We intentionally round down to whole days before the final label decision.
// That keeps the copy stable for the product: the UI should show "Today",
// "Tomorrow", or "X days" based on the calendar day boundary, not on a
// sub-day clock-time mismatch that would fluctuate during the day.
export function formatExpectedAvailabilityCountdown(room: Pick<Room, 'availabilityStatus' | 'expectedAvailableFrom'>): string | null {
  if (room.availabilityStatus !== 'FILLED' || !room.expectedAvailableFrom) {
    return null;
  }

  const target = new Date(room.expectedAvailableFrom);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return 'Reopening now';
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return 'Reopening today';
  }
  if (diffDays === 1) {
    return 'Reopening tomorrow';
  }

  return `Reopening in ${diffDays} days`;
}
