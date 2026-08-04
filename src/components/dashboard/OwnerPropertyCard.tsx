import { useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  FileText,
  Home,
  MapPin,
  MessageSquare,
  PauseCircle,
  RotateCcw,
  Share2,
} from "lucide-react";
import { AvailabilityStatus, Room } from "../../types/api.types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchPropertyNotes } from "../../store/slices/owner.slice";
import { PropertyNotesSection } from "../owner/PropertyNotesSection";
import { formatExpectedAvailabilityCountdown } from "../../utils/availabilityCountdown";

type OwnerPropertyCardProps = {
  room: Room;
  statusBadge: ReactNode;
  onEdit: (room: Room) => void;
  onToggleStatus: (id: string) => void;
  onOpenAvailabilityDialog: (
    room: Room,
    initialStatus: AvailabilityStatus,
  ) => void;
  onViewFeedback: (room: Room) => void;
  onShare: (room: Room) => void;
  isToggling: boolean;
  isAvailabilityUpdating: boolean;
};

export function OwnerPropertyCard({
  room,
  statusBadge,
  onEdit,
  onToggleStatus,
  onOpenAvailabilityDialog,
  onViewFeedback,
  isToggling,
  isAvailabilityUpdating,
  onShare,
}: OwnerPropertyCardProps) {
  const dispatch = useAppDispatch();
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // ✅ CRITICAL FIX: Call useAppSelector at top level (not in event handler)
  const { notesLoading, propertyNotes } = useAppSelector(
    (state) => state.owner,
  );

  const needsCorrection =
    room.reviewStatus?.toUpperCase() === "NEEDS_CORRECTION";

  const primaryImage = useMemo(() => {
    let images = room.images;

    // ✅ Fix: handle string case
    if (typeof images === "string") {
      try {
        images = JSON.parse(images);
      } catch {
        images = [];
      }
    }

    return images?.[0];
  }, [room.images]);

  const weeklyViews = room.demand?.weeklyViews ?? 0;
  const weeklyContacts = room.demand?.weeklyContacts ?? room.contactCount ?? 0;

  const reviewStatus = (room.reviewStatus ?? "PENDING").toUpperCase();
  const showShareIcon = reviewStatus === "APPROVED";
  const availabilityStatus = room.availabilityStatus || "AVAILABLE";
  const isAvailable = availabilityStatus === "AVAILABLE";
  const expectedAvailableFrom =
    room.availabilityStatus === "FILLED"
      ? room.expectedAvailableFrom
        ? new Date(room.expectedAvailableFrom).toLocaleDateString()
        : null
      : null;
  const availabilityCountdownText = formatExpectedAvailabilityCountdown(room);
  const isShareDisabled = showShareIcon && (!room.isActive || !isAvailable);
  const allowedAvailabilityTransitions =
    room.allowedAvailabilityTransitions ?? [];

  const availabilityConfig: Record<
    AvailabilityStatus,
    { label: string; style: CSSProperties; message: string }
  > = {
    AVAILABLE: {
      label: "Available",
      message: "Accepting tenant visit requests.",
      style: {
        background: "rgba(16,185,129,0.1)",
        color: "#059669",
        borderColor: "rgba(16,185,129,0.25)",
      },
    },
    FILLED: {
      label: "Rented Out",
      message:
        "Hidden from tenant search when availability enforcement is enabled.",
      style: {
        background: "rgba(239,68,68,0.1)",
        color: "#dc2626",
        borderColor: "rgba(239,68,68,0.25)",
      },
    },
    OWNER_PAUSED: {
      label: "Pause Listing",
      message: "Temporarily paused by you. Reopen when ready.",
      style: {
        background: "rgba(245,158,11,0.1)",
        color: "#d97706",
        borderColor: "rgba(245,158,11,0.25)",
      },
    },
    NEEDS_RECONFIRMATION: {
      label: "Needs Reconfirmation",
      message: "Please confirm this listing is still available.",
      style: {
        background: "rgba(59,130,246,0.1)",
        color: "#2563eb",
        borderColor: "rgba(59,130,246,0.25)",
      },
    },
  };

  const availabilityActionConfig: Record<
    AvailabilityStatus,
    {
      label: string;
      icon: typeof Home;
      style: CSSProperties;
    }
  > = {
    AVAILABLE: {
      label: "Available Now",
      icon: RotateCcw,
      style: {
        border: "1px solid rgba(16,185,129,0.25)",
        background: "rgba(16,185,129,0.08)",
        color: "#059669",
      },
    },
    FILLED: {
      label: "Next Available Date",
      icon: Home,
      style: {
        border: "1px solid rgba(239,68,68,0.25)",
        background: "rgba(239,68,68,0.08)",
        color: "#ef4444",
      },
    },
    OWNER_PAUSED: {
      label: "Pause Listing",
      icon: PauseCircle,
      style: {
        border: "1px solid rgba(245,158,11,0.25)",
        background: "rgba(245,158,11,0.08)",
        color: "#d97706",
      },
    },
    NEEDS_RECONFIRMATION: {
      label: "Needs Reconfirmation",
      icon: RotateCcw,
      style: {
        border: "1px solid rgba(59,130,246,0.25)",
        background: "rgba(59,130,246,0.08)",
        color: "#2563eb",
      },
    },
  };

  const renderAvailabilityAction = (targetStatus: AvailabilityStatus) => {
    const action = availabilityActionConfig[targetStatus];
    const Icon = action.icon;

    return (
      <button
        key={targetStatus}
        onClick={() => {
          if (isAvailabilityUpdating) return;
          onOpenAvailabilityDialog(room, targetStatus);
        }}
        disabled={isAvailabilityUpdating}
        style={{
          minHeight: 36,
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          cursor: isAvailabilityUpdating ? "not-allowed" : "pointer",
          opacity: isAvailabilityUpdating ? 0.6 : 1,
          fontWeight: 700,
          fontSize: 12,
          ...action.style,
        }}
      >
        <Icon style={{ width: 14, height: 14 }} />
        {action.label}
      </button>
    );
  };

  // ✅ CRITICAL FIX: Fetch notes ONLY on explicit user action (click handler)
  // RULE: UI toggle MUST happen FIRST, then check conditions for API
  // This ensures immediate UI feedback and prevents render-triggered fetching
  const handleViewNotesClick = () => {
    // STEP 1: ALWAYS toggle UI first (immediate feedback - no delay)
    const newOpenState = !isNotesOpen;
    setIsNotesOpen(newOpenState);

    // STEP 2: If closing, don't call API
    if (!newOpenState) {
      return;
    }

    // STEP 3: Opening - check conditions to prevent duplicate API calls
    // ✅ Using state from top-level useAppSelector (not calling inside handler)

    // Guard 1: Don't dispatch if already loading
    if (notesLoading[room.id]) {
      return;
    }

    // Guard 2: Don't dispatch if already cached
    if (propertyNotes[room.id]) {
      return;
    }

    // STEP 4: Fetch notes only if not loading and not cached
    dispatch(fetchPropertyNotes(room.id));
  };

  const compactMetric = (label: string, value: ReactNode, icon?: ReactNode) => (
    <div className="compact-metric">
      <div className="compact-metric-label">
        {icon}
        {label}
      </div>
      <div className="compact-metric-value">{value}</div>
    </div>
  );

  // ✅ STEP 3: Get clear status message based on reviewStatus + isActive
  const getStatusMessage = (): string => {
    const status = (room.reviewStatus ?? "PENDING").toUpperCase();

    switch (status) {
      case "PENDING":
        return "Your property is under review. We'll notify you once it's approved.";
      case "APPROVED":
        if (room.isActive) {
          return availabilityConfig[availabilityStatus].message;
        } else {
          return "Your property is approved but currently hidden. Activate it to make it live.";
        }
      case "NEEDS_CORRECTION":
        return "Your property needs updates. Please review admin feedback and resubmit.";
      case "REJECTED":
        return "Your property was not approved. Please update details and submit again.";
      default:
        return "";
    }
  };

  return (
    <>
      <div
        className={`owner-property-card-compact ${
          needsCorrection ? "owner-property-card-needs-correction" : ""
        }`}
      >
        {needsCorrection && (
          <div className="property-alert-banner">
            <AlertCircle className="w-[14px] h-[14px] flex-shrink-0" />
            <span>
              This listing needs corrections before it can perform at its best.
            </span>
          </div>
        )}

        <div className="owner-property-card-grid">
          <div className="property-card-image-wrapper">
            <img src={primaryImage} alt={room.title} />
          </div>

          <div className="min-w-0">
            <div className="property-card-header">
              <h3 className="owner-property-card-title" title={room.title}>
                {room.title}
              </h3>

              {/* <div className="property-card-header-status">{statusBadge}</div> */}
              <div
                className="property-card-header-status"
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                {statusBadge}

                {/* Show availability badge ONLY for approved properties */}
                {reviewStatus === "APPROVED" && (
                  <span
                    title="Availability"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      minHeight: 24,
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: `1px solid ${availabilityConfig[availabilityStatus].style.borderColor}`,
                      fontSize: 11,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                      ...availabilityConfig[availabilityStatus].style,
                    }}
                  >
                    {availabilityConfig[availabilityStatus].label}
                  </span>
                )}

                {showShareIcon && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!isShareDisabled) {
                        onShare(room);
                      }
                    }}
                    disabled={isShareDisabled}
                    title={
                      isShareDisabled
                        ? "Property is disabled"
                        : "Share property"
                    }
                    aria-label={
                      isShareDisabled
                        ? "Property is disabled"
                        : "Share property"
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 999,
                      border: "1px solid var(--gold-border)",
                      background: isShareDisabled
                        ? "rgba(0,0,0,0.04)"
                        : "transparent",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isShareDisabled
                        ? "#9ca3af"
                        : "var(--text-primary)",
                      cursor: isShareDisabled ? "not-allowed" : "pointer",
                      opacity: isShareDisabled ? 0.55 : 1,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Share2 style={{ width: 15, height: 15 }} />
                  </button>
                )}
              </div>
            </div>

            {/* ✅ STEP 3: Clear status message under title */}
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-secondary)",
                marginTop: 4,
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              {availabilityStatus === "FILLED"
                ? availabilityCountdownText ||
                  (expectedAvailableFrom
                    ? `Expected to reopen on ${expectedAvailableFrom}.`
                    : "Availability date will be updated by the owner.")
                : getStatusMessage()}
            </p>

            <div className="property-location-row">
              <MapPin className="w-[13px] h-[13px] flex-shrink-0" />
              <span title={room.location}>{room.location}</span>
              <span className="opacity-45">•</span>
              <Home className="w-[13px] h-[13px] flex-shrink-0" />
              <span className="whitespace-nowrap">{room.roomType}</span>
            </div>
          </div>

          <div
            className="owner-property-card-meta-row"
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "1.2fr 1fr 1fr",
              gap: 10,
            }}
          >
            {/* Rent */}
            <div className="compact-metric rent">
              <div className="compact-metric-label">Rent</div>
              <div className="compact-metric-value">
                ₹{room.pricePerMonth.toLocaleString()}
                <span style={{ fontSize: 11, marginLeft: 2 }}>/mo</span>
              </div>
            </div>

            {/* Views */}
            {compactMetric(
              "Views",
              weeklyViews.toLocaleString(),
              <Eye style={{ width: 12, height: 12 }} />,
            )}

            {/* Contacts */}
            {compactMetric(
              "Contacts",
              weeklyContacts.toLocaleString(),
              <MessageSquare style={{ width: 12, height: 12 }} />,
            )}
          </div>

          <div className="owner-property-card-actions" style={{ marginTop: 8 }}>
            {/* ✅ STEP 5: Urgent NEEDS_CORRECTION button with highlight */}
            {needsCorrection && (
              <button
                onClick={() => onViewFeedback(room)}
                style={{
                  flex: "1 1 140px",
                  minHeight: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(249, 115, 22, 0.25)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 12px 28px rgba(249, 115, 22, 0.35)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "translateY(0)";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 8px 20px rgba(249, 115, 22, 0.25)";
                }}
              >
                <MessageSquare style={{ width: 14, height: 14 }} />
                Fix & Resubmit
              </button>
            )}

            {/* ✅ STEP 4: REJECTED state */}
            {!needsCorrection &&
              room.reviewStatus?.toUpperCase() === "REJECTED" && (
                <button
                  onClick={() => onEdit(room)}
                  style={{
                    flex: "1 1 140px",
                    minHeight: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 10px",
                    borderRadius: 12,
                    border: "none",
                    background:
                      "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 8px 20px rgba(239, 68, 68, 0.25)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-2px)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 12px 28px rgba(239, 68, 68, 0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 8px 20px rgba(239, 68, 68, 0.25)";
                  }}
                >
                  <Edit style={{ width: 14, height: 14 }} />
                  Edit & Resubmit
                </button>
              )}

            {room.reviewStatus?.toUpperCase() === "APPROVED" && (
              <div className="flex flex-wrap gap-2">
                {allowedAvailabilityTransitions.map(renderAvailabilityAction)}
              </div>
            )}

            {/* ✅ Always show Edit button (for REJECTED/APPROVED states) */}
            {!needsCorrection &&
              room.reviewStatus?.toUpperCase() !== "REJECTED" && (
                <button
                  onClick={() => onEdit(room)}
                  style={{
                    flex: "1 1 96px",
                    minHeight: 36,
                    borderRadius: 12,
                    border: "1px solid var(--gold-border)",
                    background: "var(--gold-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    color: "var(--gold)",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 12,
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform =
                      "translateY(0)";
                  }}
                >
                  <Edit style={{ width: 14, height: 14 }} />
                  Edit
                </button>
              )}
          </div>

          <div style={{ gridColumn: "1 / -1", marginTop: 8 }}>
            {/* ✅ DIVIDER: Clear visual separation */}
            <div
              style={{
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, var(--gold-border), transparent)",
                marginBottom: 10,
              }}
            />

            {/* ✅ NOTES TOGGLE BUTTON: Improved UX */}
            <button
              type="button"
              onClick={handleViewNotesClick}
              aria-expanded={isNotesOpen}
              style={{
                width: "100%",
                minHeight: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "10px 12px",
                borderRadius: 12,
                border: isNotesOpen
                  ? "1px solid var(--gold)"
                  : "1px solid var(--gold-border)",
                background: isNotesOpen
                  ? "rgba(255,215,0,0.06)"
                  : "transparent",
                color: isNotesOpen ? "var(--gold)" : "var(--text-primary)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                transition: "all 0.22s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText
                  style={{ width: 15, height: 15, color: "var(--gold)" }}
                />
                {isNotesOpen ? "Hide Property Notes" : "View Property Notes"}
              </span>
              {isNotesOpen ? (
                <ChevronUp
                  style={{
                    width: 15,
                    height: 15,
                    color: "var(--gold)",
                    flexShrink: 0,
                    transition: "transform 0.22s ease",
                  }}
                />
              ) : (
                <ChevronDown
                  style={{
                    width: 15,
                    height: 15,
                    color: "var(--gold)",
                    flexShrink: 0,
                    transition: "transform 0.22s ease",
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* ✅ NOTES SECTION: Improved UX with better spacing and animation */}
        <div
          aria-hidden={!isNotesOpen}
          style={{
            maxHeight: isNotesOpen ? 2000 : 0,
            overflow: "hidden",
            transition: "max-height 240ms cubic-bezier(0.4, 0, 0.2, 1)",
            visibility: isNotesOpen ? "visible" : "hidden",
            pointerEvents: isNotesOpen ? "auto" : "none",
          }}
        >
          <div
            style={{
              borderTop: "1px solid var(--gold-border)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 100%)",
              padding: "16px 12px",
            }}
          >
            <PropertyNotesSection
              propertyId={room.id}
              propertyTitle={room.title}
              embedded
              autoFetch={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
