import { Bell } from "lucide-react";
import { formatExpectedAvailabilityCountdown } from "../../utils/availabilityCountdown";

type AvailabilityStateBlockProps = {
  availabilityStatus?: string | null;
  expectedAvailableFrom?: string | Date | null;
  availableLabel?: string;
  filledLabel?: string;
  showBadge?: boolean;
  showAvailableButton?: boolean;
  className?: string;
  badgeClassName?: string;
  ctaClassName?: string;
  textClassName?: string;
};

function formatAvailabilityText(
  availabilityStatus: string | null | undefined,
  expectedAvailableFrom: string | Date | null | undefined,
) {
  const roomLike = {
    availabilityStatus: availabilityStatus ?? "AVAILABLE",
    expectedAvailableFrom: expectedAvailableFrom ?? null,
  };

  const countdown = formatExpectedAvailabilityCountdown(roomLike as any);
  if (countdown) {
    return countdown;
  }

  if (expectedAvailableFrom) {
    const parsedDate = new Date(expectedAvailableFrom);
    if (!Number.isNaN(parsedDate.getTime())) {
      return `Expected to reopen on ${parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }
  }

  return "Availability date will be updated by the owner.";
}

export function AvailabilityStateBlock({
  availabilityStatus,
  expectedAvailableFrom,
  availableLabel = "Book Visit",
  filledLabel = "Notify Me When Available",
  showBadge = true,
  showAvailableButton = true,
  className = "",
  badgeClassName = "",
  ctaClassName = "",
  textClassName = "",
}: AvailabilityStateBlockProps) {
  const isFilled = availabilityStatus === "FILLED";
  const availabilityText = formatAvailabilityText(availabilityStatus, expectedAvailableFrom);

  if (!isFilled) {
    if (!showAvailableButton) {
      return null;
    }

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all duration-300 backdrop-blur-md ${className}`}
        style={{
          background: "rgba(212,175,55,0.16)",
          color: "rgba(212,175,55,0.95)",
          border: "1px solid rgba(212,175,55,0.2)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
        }}
      >
        {availableLabel}
      </span>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {showBadge && (
        <div
          className={`flex items-center gap-2 text-sm font-semibold ${badgeClassName}`}
          style={{ color: "#fff" }}
        >
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          <span>Occupied</span>
        </div>
      )}

      <div
        className={`rounded-xl border px-3 py-2 text-[11px] font-medium ${textClassName}`}
        style={{
          background: "rgba(239,68,68,0.12)",
          color: "#ef4444",
          borderColor: "rgba(239,68,68,0.2)",
          boxShadow: "0 6px 24px rgba(0,0,0,0.18)",
        }}
      >
        <div className="flex items-center gap-2">
          <Bell className="h-3.5 w-3.5" />
          <span>{filledLabel}</span>
        </div>
        <p className="mt-2 text-[10px] sm:text-[11px] text-red-700/90 dark:text-red-300/90">
          {availabilityText}
        </p>
      </div>
    </div>
  );
}
