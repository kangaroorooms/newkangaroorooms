import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  MapPin,
  Star,
  Check,
  Shield,
  Wifi,
  Car,
  Coffee,
  Wind,
  Tv,
  Phone,
  Mail,
  Lock,
  Crown,
  Clock,
  CheckCircle2,
  ChevronRight,
  Share2,
  Heart,
  ArrowRight,
  Zap,
  X,
  Loader2,
  MessageCircle,
  Sparkles
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchRoomById, clearCurrentRoom } from "../store/slices/rooms.slice";
import {
  fetchVisibility,
  clearVisibility,
} from "../store/slices/subscription.slice";
import {
  fetchReviewsForRoom,
  fetchRatingStats,
  fetchUserReview,
  selectReviewsForRoom,
  selectRatingStatsForRoom,
  selectUserReviewForRoom,
} from "../store/slices/reviews.slice";
import {
  toggleFavorite,
  selectIsFavorited,
  selectIsToggling,
} from "../store/slices/favorites.slice";

import { BookingModal } from "../components/BookingModal";
import { RoomCard } from "../components/RoomCard";
import { SubscriptionGate } from "../components/SubscriptionGate";
import { UnlockProgressMeter } from "../components/UnlockProgressMeter";
import { PreLimitAlert } from "../components/PreLimitAlert";
import { DynamicMap } from "../components/DynamicMap";
import { RatingSummary } from "../components/RatingSummary";
import { ReviewForm } from "../components/ReviewForm";
import { ReviewList } from "../components/ReviewList";
import { Button } from "../components/ui/Button";
import { roomsApi } from "../api/rooms.api";
import {
  readContact,
  unlockContact,
  UnlockContactResponse,
} from "../api/contact.api";
import { DemandStats } from "../types/api.types";
import { showToast } from "../store/slices/ui.slice";
import { clearOtpRetryData, openOtpModal } from "../store/slices/otp.slice";
import { ShareModal } from "../components/ShareModal";
import { RoomDetailsSkeleton } from "../components/ui/RoomDetailsSkeleton";
import { PropertyImageGallery } from "../components/PropertyImageGallery";
import { getRoomImage } from "../utils/propertyUtils";
import UnlockConfirmModal from "../components/UnlockConfirmModal";
import {
  AMENITIES_LIST,
  getAmenitiesByCategory,
  CATEGORY_LABELS,
  AMENITY_CATEGORIES,
  type AmenityCategoryKey,
} from "../constants/amenities.config";
import { AmenitiesModal } from "../components/AmenitiesModal";
import { getPropertyUrl, getSafeImageUrl, getPropertyShareUrl } from "../utils/urlConfig";
import { PullToRefreshIndicator } from "../components/PullToRefreshIndicator";
import { usePullToRefresh } from "../hooks/usePullToRefresh";
import { AnimatePresence, motion } from "framer-motion";

const isLocalUrl = (url: string) =>
  /^(https?:)?\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(url);

// Build absolute URL for property (canonical)
const getPublicUrl = (path: string) => {
  const frontendUrl = getPropertyUrl("/").replace(/\/property\/$/, "");
  return `${frontendUrl}${path}`;
};

// Build shareable OG preview URL
const getPublicShareUrl = (propertyId: string) =>
  getPropertyShareUrl(propertyId);

// Get safe image URL with localhost filtering
const getPublicImageUrl = (imageUrl?: string | null) => getSafeImageUrl(imageUrl);

const setMetaTag = (
  attribute: "name" | "property",
  key: string,
  content: string
) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[${attribute}="${key}"]`
  );

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
};

// Helper function to get amenity details by ID
const getAmenityDetails = (amenityId: string) => {
  return AMENITIES_LIST.find((a) => a.id === amenityId);
};

// Helper to map icon names from config to lucide components
const getIconForAmenity = (iconName?: string) => {
  const iconComponentMap: Record<string, any> = {
    Wifi: Wifi,
    Wind: Wind,
    Zap: Zap,
    Shield: Shield,
    Check: Check,
    Lightbulb: Check,
    Bath: Check,
    Droplets: Check,
    Sofa: Check,
    Home: Check,
    Box: Check,
    Laptop: Check,
    Utensils: Check,
    Users: Check,
    Dumbbell: Check,
    TreePine: Check,
    Coffee: Coffee,
    Car: Car,
    Tv: Tv,
  };
  return iconComponentMap[iconName || "Check"] || Check;
};

// Helper to group room amenities by category
const groupAmenitiesByCategory = (amenityIds: string[]): Record<AmenityCategoryKey, string[]> => {
  const grouped: Record<AmenityCategoryKey, string[]> = {
    [AMENITY_CATEGORIES.ESSENTIALS]: [],
    [AMENITY_CATEGORIES.ROOM_FEATURES]: [],
    [AMENITY_CATEGORIES.KITCHEN]: [],
    [AMENITY_CATEGORIES.SAFETY]: [],
    [AMENITY_CATEGORIES.CONVENIENCE]: [],
  };

  amenityIds.forEach((id) => {
    const amenity = getAmenityDetails(id);
    if (amenity && grouped[amenity.category]) {
      grouped[amenity.category].push(id);
    }
  });

  return grouped;
};

// Helper to get top categories (1-2 most populated)
const getTopCategories = (
  groupedAmenities: Record<AmenityCategoryKey, string[]>
): AmenityCategoryKey[] => {
  return (Object.entries(groupedAmenities) as [AmenityCategoryKey, string[]][])
    .filter(([_, ids]) => ids.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 2)
    .map(([category]) => category);
};

const iconMap: Record<string, any> = {
  WiFi: Wifi,
  Parking: Car,
  Kitchen: Coffee,
  AC: Wind,
  TV: Tv,
};

function SectionCard({
  title,
  subtitle,
  children,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4 px-5 md:px-6 pt-5 md:pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="px-5 md:px-6 py-5">{children}</div>
    </section>
  );
}




export function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();

  const {
    currentRoom: room,
    loading,
    rooms,
    error,
  } = useAppSelector((state) => state.rooms);

  const { user, authStatus } = useAppSelector((state) => state.auth);
  const { visibility } = useAppSelector((state) => state.subscription);
  const otpState = useAppSelector((state) => state.otp);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isUnlockConfirmOpen, setIsUnlockConfirmOpen] = useState(false);
  const [isShowAllAmenitiesOpen, setIsShowAllAmenitiesOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
  const [contactData, setContactData] =
    useState<UnlockContactResponse | null>(null);
  const [contactLocked, setContactLocked] = useState<boolean | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [demandStats, setDemandStats] = useState<DemandStats | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsSort, setReviewsSort] = useState<
    "latest" | "highest" | "lowest"
  >("latest");

  const reviewsState = useAppSelector(selectReviewsForRoom(id || ""));
  const statsState = useAppSelector(selectRatingStatsForRoom(id || ""));
  const userReviewState = useAppSelector(selectUserReviewForRoom(id || ""));

  const isFavorited = useAppSelector(selectIsFavorited(id || ""));
  const isTogglingFavorite = useAppSelector(selectIsToggling(id || ""));
 
  const similarRooms = useMemo(
    () =>
      rooms
        .filter((r) => r.city === room?.city && r.id !== room?.id && r.isActive)
        .slice(0, 3),
    [rooms, room?.city, room?.id]
  );

  const brokerageSavings = useMemo(
    () => (room ? Math.round(room.pricePerMonth * 0.5) : 0),
    [room?.pricePerMonth]
  );

  const viewCount = visibility?.viewCount || 0;
  const viewLimit = visibility?.viewLimit ?? 5;
  const finiteViewLimit =
    typeof visibility?.viewLimit === "number" ? visibility.viewLimit : null;
  const remainingContacts =
    finiteViewLimit !== null
      ? Math.max(finiteViewLimit - (visibility?.viewCount || 0), 0)
      : null;
  const usagePercent = viewLimit ? (viewCount / viewLimit) * 100 : 0;
  const displayTodayViews = Math.max(1, demandStats?.todayViews || 0);
  const displayTodayContacts = Math.max(1, demandStats?.todayContacts || 0);
  const isFreePlan = (visibility?.plan || "FREE") === "FREE";
  const isFreeLimitReached =
    isFreePlan && remainingContacts !== null && remainingContacts <= 0;
  const hasActivePlan =
    visibility?.planActive === true ||
    visibility?.plan === "GOLD" ||
    visibility?.plan === "PLATINUM";
  const shouldShowMultiPropertyPressure = isFreePlan && viewCount >= 5;
  const shouldShowActivityTimer =
    demandStats !== null &&
    (displayTodayContacts > 1 || displayTodayViews > 1);

  // Availability helpers (FILLED / AVAILABLE)
  const isBookable = room?.availabilityStatus === "AVAILABLE";
  const isFilled = room?.availabilityStatus === "FILLED";

  const expectedAvailableFrom = isFilled && room?.expectedAvailableFrom
    ? new Date(room.expectedAvailableFrom).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const [isSubscribingAvailability, setIsSubscribingAvailability] = useState(false);
  const [hasSubscribedAvailability, setHasSubscribedAvailability] = useState(false);

  const handleNotifyAvailability = useCallback(async () => {
    if (!room?.id) return;
    if (authStatus !== "AUTHENTICATED") {
      const redirectPath = encodeURIComponent(`/rooms/${room.id}`);
      navigate(`/auth/login?redirect=${redirectPath}`);
      return;
    }

    try {
      setIsSubscribingAvailability(true);
      await roomsApi.subscribeToAvailability(room.id);
      setHasSubscribedAvailability(true);
      dispatch(showToast({ message: "You will be notified when this property becomes available again.", type: "success" }));
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to subscribe";
      dispatch(showToast({ message, type: "error" }));
    } finally {
      setIsSubscribingAvailability(false);
    }
  }, [room?.id, authStatus, dispatch, navigate]);

  // Helper: Redirect to pricing page with return context
  const navigateToUpgrade = useCallback(() => {
    if (!room) return;
    const params = new URLSearchParams({
      city: room.city,
      returnTo: `/rooms/${id}`,
      intent: "unlock_contact",
      roomId: room.id,
    }).toString();
    navigate(`/pricing?${params}`);
  }, [navigate, room, id]);

  const getCtaText = useCallback(() => {
    if (isUnlocking) return "Unlocking...";
    if (remainingContacts !== null && remainingContacts <= 0) {
      return "Continue Without Limits";
    }
    return "Unlock owner contact details now — high demand property";
  }, [isUnlocking, remainingContacts]);

  const getMicroSuccessMessage = useCallback(
    (newViewCount: number): { message: string; type: "success" | "info" } => {
      switch (newViewCount) {
        case 1:
          return {
            message: "Nice — you just contacted a verified owner.",
            type: "info",
          };
        case 3:
          return {
            message: "You're moving faster than most renters.",
            type: "info",
          };
        case 5:
          return {
            message: "You're on track to close a home soon.",
            type: "info",
          };
        default:
          return newViewCount % 2 === 0
            ? {
                message: "You're now connected directly with the owner.",
                type: "success",
              }
            : {
                message: "One step closer to your next home.",
                type: "info",
              };
      }
    },
    []
  );

  useEffect(() => {
    const retryData = (otpState as any).lastRetryData;
    if (retryData?.success && retryData?.data) {
      setContactData(retryData.data);
      setContactLocked(false);
      dispatch(clearOtpRetryData());
    }
  }, [otpState, dispatch]);

  useEffect(() => {
    if (!id) return;

    setContactData(null);
    setContactLocked(null);
    window.scrollTo(0, 0);

    dispatch(fetchRoomById(id));

    return () => {
      dispatch(clearCurrentRoom());
      dispatch(clearVisibility());
      setContactData(null);
      setContactLocked(null);
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (!room?.id) return;

    const price = `₹${room.pricePerMonth.toLocaleString("en-IN")}`;
    const location = [room.location, room.city].filter(Boolean).join(", ");
    const propertyUrl = getPublicUrl(`/property/${room.id}`);
    const imageUrl = getPublicImageUrl(getRoomImage(room));
    const title = `${room.title} - ${price}`;
    const description = `${room.roomType} for rent in ${location} at ${price}/month`;

    document.title = `${title} | Homilivo`;
    setMetaTag("name", "description", description);
    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:image", imageUrl);
    setMetaTag("property", "og:url", propertyUrl);
    setMetaTag("property", "og:type", "website");
    setMetaTag("name", "twitter:card", "summary_large_image");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);
    setMetaTag("name", "twitter:image", imageUrl);
  }, [room]);


  useEffect(() => {
    if (!room?.id || !room?.city || authStatus !== "AUTHENTICATED") return;

    dispatch(
      fetchVisibility({
        propertyId: room.id,
        city: room.city,
      })
    );
  }, [authStatus, room?.id, room?.city, dispatch]);

  // ✅ PRODUCTION FIX: Refresh visibility after successful upgrade
  // Triggered when user returns from pricing page with upgraded=true marker
  useEffect(() => {
    const isUpgraded = searchParams.get("upgraded") === "true";
    if (!isUpgraded || !room?.id || !room?.city) return;

    // Fetch fresh visibility to ensure quota is updated
    dispatch(
      fetchVisibility({
        propertyId: room.id,
        city: room.city,
      })
    );

    // Clean up the query parameter from URL (replaceState prevents nav entry)
    window.history.replaceState({}, "", `/rooms/${id}`);
  }, [searchParams, room?.id, room?.city, id, dispatch]);

  const loadDemandStats = useCallback((roomId: string) => {
    return roomsApi.getDemandStats(roomId);
  }, []);

  useEffect(() => {
    if (!id) return;

    let isActive = true;
    setDemandStats(null);

    loadDemandStats(id)
      .then((stats) => {
        if (isActive) {
          setDemandStats(stats);
        }
      })
      .catch(() => {
        if (isActive) {
          setDemandStats(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id, loadDemandStats]);

  const hydrateContact = useCallback(async () => {
    if (!room?.id) return;

    try {
      const result = await readContact(room.id);
      if (result.success && result.data) {
        setContactData(result.data);
        setContactLocked(false);
      }
    } catch {}
  }, [room?.id]);

  useEffect(() => {
    if (!room?.id) return;
    if (authStatus !== "AUTHENTICATED") return;
    if (!visibility) return;
    if (contactData !== null) return;

    const shouldHydrate = visibility.isUnlocked === true || hasActivePlan === true;

    if (shouldHydrate) {
      hydrateContact();
    }
  }, [room?.id, authStatus, visibility, contactData, hydrateContact, hasActivePlan]);

 


  useEffect(() => {
    if (!id) return;

    setReviewsPage(1);
    setReviewsSort("latest");

    dispatch(
      fetchReviewsForRoom({ roomId: id, page: 1, limit: 10, sort: "latest" })
    );
    dispatch(fetchRatingStats(id));

    if (authStatus === "AUTHENTICATED" && user?.id) {
      dispatch(fetchUserReview(id));
    }
  }, [id, authStatus, user?.id, dispatch]);

  const refreshRoomDetails = useCallback(async () => {
    if (!id) return;

    const roomAction = await dispatch(fetchRoomById(id));
    const refreshedRoom = fetchRoomById.fulfilled.match(roomAction)
      ? roomAction.payload
      : room;

    setDemandStats(null);

    const refreshTasks: Promise<unknown>[] = [
      dispatch(
        fetchReviewsForRoom({
          roomId: id,
          page: reviewsPage,
          limit: 10,
          sort: reviewsSort,
        })
      ),
      dispatch(fetchRatingStats(id)),
      loadDemandStats(id)
        .then((stats) => {
          setDemandStats(stats);
        })
        .catch(() => {
          setDemandStats(null);
        }),
    ];

    if (authStatus === "AUTHENTICATED" && user?.id) {
      refreshTasks.push(dispatch(fetchUserReview(id)));
    }

    if (
      authStatus === "AUTHENTICATED" &&
      refreshedRoom?.id &&
      refreshedRoom.city
    ) {
      refreshTasks.push(
        dispatch(
          fetchVisibility({
            propertyId: refreshedRoom.id,
            city: refreshedRoom.city,
          })
        )
      );
    }

    await Promise.all(refreshTasks);
  }, [
    authStatus,
    dispatch,
    id,
    loadDemandStats,
    reviewsPage,
    reviewsSort,
    room,
    user?.id,
  ]);

  const {
    containerProps,
    ...pullToRefreshState
  } = usePullToRefresh({ onRefresh: refreshRoomDetails });

  const handleBookNow = useCallback(() => {
    if (authStatus !== "AUTHENTICATED") {
      const redirectPath = encodeURIComponent(`/rooms/${id}`);
      navigate(`/auth/login?redirect=${redirectPath}`);
      return;
    }
    setIsBookingModalOpen(true);
  }, [authStatus, navigate, id]);

  const handleShare = useCallback(async () => {
    if (!room || !room.id) return;

    const shareUrl = getPublicShareUrl(room.id);
    const shareTitle = room.title || "Check out this room";
    const shareText = `🏡 Check out this room in ${room.city}
₹${room.pricePerMonth?.toLocaleString?.() || room.pricePerMonth}/month • ${
      room.roomType
    }

No brokerage. Direct owner contact.

👉 ${shareUrl}`;

    try {
      const isMobileDevice = window.innerWidth < 768;

      if (isMobileDevice && navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (shareError: any) {
          if (shareError.name === "AbortError") return;
        }
      }

      setIsShareModalOpen(true);
    } catch (error) {
      dispatch(
        showToast({
          message: "Failed to open share options",
          type: "error",
        })
      );
    }
  }, [room, dispatch]);

  const handleToggleFavorite = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();

      if (authStatus !== "AUTHENTICATED") {
        dispatch(
          showToast({
            message: "Please log in to save favorites",
            type: "info",
          })
        );
        const redirectPath = encodeURIComponent(`/rooms/${id}`);
        navigate(`/auth/login?redirect=${redirectPath}`);
        return;
      }

      if (!id || isTogglingFavorite) return;
      dispatch(toggleFavorite(id));
    },
    [authStatus, dispatch, navigate, id, isTogglingFavorite]
  );

  const performUnlockContact = useCallback(async () => {
    if (authStatus !== "AUTHENTICATED") {
      navigate("/auth/login", {
        state: { from: `/rooms/${id}` },
      });
      return;
    }

    if (!room) return;

    setIsUnlockConfirmOpen(false);
    setIsUnlocking(true);

    try {
      const result = await unlockContact(room.id);

      if (result.success && result.data) {
        setContactData(result.data);
        setContactLocked(false);

        if (result.meta?.alreadyUnlocked) {
          dispatch(
            showToast({
              message: "Owner details ready — reach out anytime.",
              type: "success",
            })
          );
        } else {
          const newViewCount = (visibility?.viewCount || 0) + 1;
          const reward = getMicroSuccessMessage(newViewCount);

          dispatch(showToast(reward));

          dispatch(
            fetchVisibility({
              propertyId: room.id,
              city: room.city,
            })
          );
        }
      } else if (result.error) {
        // Map eligibility service error codes to user-friendly messages
        const errorMessages: Record<string, string> = {
          PHONE_REQUIRED: 'Please add your phone number to unlock contacts',
          PROFILE_INCOMPLETE: 'Please complete your profile before unlocking contacts',
          FREE_LIMIT_REACHED: `You've reached your free unlock limit for ${room?.city}. Upgrade your plan for unlimited unlocks`,
          PROPERTY_NOT_FOUND: 'This property is no longer available',
          USER_NOT_FOUND: 'Unable to verify your account',
          CHECK_FAILED: 'Unable to verify eligibility. Please try again',
          SUBSCRIPTION_REQUIRED: 'Upgrade your plan to unlock this property',
          ALREADY_UNLOCKED: 'You already have access to this contact',
          PREMIUM_ACCESS: 'You have premium access to this contact',
          ACCESS_GRANTED: 'Contact unlocked successfully'
        };

        if (result.error.code === 'PHONE_REQUIRED') {
          dispatch(
            openOtpModal({
              pendingRequest: {
                url: "/contacts/unlock",
                method: "POST",
                data: { roomId: room.id },
              } as any,
            })
          );
          setIsUnlocking(false);
          return;
        }

        if (result.error.code === 'FREE_LIMIT_REACHED' || result.error.code === 'CONTACT_LIMIT_REACHED') {
          navigateToUpgrade();
        } else {
          const userMessage = errorMessages[result.error.code] || result.error.message || 'Failed to unlock contact';
          dispatch(
            showToast({
              message: userMessage,
              type: 'error',
            })
          );
        }
      }
    } catch (err) {
      dispatch(
        showToast({
          message: "Failed to unlock contact",
          type: "error",
        })
      );
    } finally {
      setIsUnlocking(false);
    }
  }, [
    authStatus,
    navigate,
    id,
    room,
    visibility?.viewCount,
    dispatch,
    getMicroSuccessMessage,
  ]);

  const handleUnlockContact = useCallback(() => {
    if (authStatus !== "AUTHENTICATED") {
      navigate("/auth/login", {
        state: { from: `/rooms/${id}` },
      });
      return;
    }

    if (!room) return;
    if (isFreeLimitReached) {
      navigateToUpgrade();
      return;
    }

    setIsUnlockConfirmOpen(true);
  }, [authStatus, navigate, id, room, isFreeLimitReached, navigateToUpgrade]);

  const handleOwnerContactAction = useCallback(
    (action: "call" | "whatsapp") => {
      if (authStatus !== "AUTHENTICATED") {
        navigate("/auth/login", {
          state: { from: `/rooms/${id}` },
        });
        return;
      }

      if (!room) return;
      if (!contactData?.ownerPhone) {
        dispatch(
          showToast({
            message: "Owner contact details are not available yet.",
            type: "info",
          })
        );
        return;
      }

      if (action === "call") {
        window.location.href = `tel:${contactData.ownerPhone}`;
        return;
      }

      const whatsappNumber = contactData.ownerPhone.replace(/\D/g, "");
      const message = encodeURIComponent(
        `Hi, I'm interested in ${room.title} in ${room.city}.`
      );
      window.open(
        `https://wa.me/${whatsappNumber}?text=${message}`,
        "_blank",
        "noopener,noreferrer"
      );
    },
    [authStatus, navigate, id, room, contactData?.ownerPhone, dispatch]
  );

  const mobileActionState = useMemo(() => {
    if (hasActivePlan) return "premium";
    if (contactData || visibility?.isUnlocked === true || contactLocked === false) {
      return "unlocked";
    }
    if (!isFreeLimitReached && !isFilled) return "eligible";
    return "free";
  }, [hasActivePlan, contactData, visibility?.isUnlocked, contactLocked, isFreeLimitReached, isFilled]);

  const mobileActionCopy = useMemo(() => {
    switch (mobileActionState) {
      case "premium":
        return {
          status: "Premium Active",
          subtitle: "Enjoy direct owner access and premium features.",
        };
      case "unlocked":
        return {
          status: "Owner Contact Unlocked",
          subtitle: "You can reach out directly whenever you’re ready.",
        };
      case "eligible":
        return {
          status: "📍 Exact map location is locked",
          subtitle: "View subscription plans to unlock premium features.",
        };
      default:
        return {
          status: "📍 Exact map location is locked",
          subtitle: "View subscription plans to unlock premium features.",
        };
    }
  }, [mobileActionState]);

  if (!id) return null;

  if (loading.fetch || (!room && id && !error)) {
    return <RoomDetailsSkeleton />;
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Property Not Found
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">
            The property you are looking for might have been removed or is
            Pause Listing.
          </p>
          <Link to="/rooms">
            <Button variant="primary">Browse All Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <PullToRefreshIndicator {...pullToRefreshState} />
    <div
      {...containerProps}
      className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 pb-36 sm:pb-32 lg:pb-0"
    >
      <BookingModal
        room={room}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        room={room}
      />

      <UnlockConfirmModal
        isOpen={isUnlockConfirmOpen}
        onClose={() => setIsUnlockConfirmOpen(false)}
        onConfirm={performUnlockContact}
        isUnlocking={isUnlocking}
        todayContacts={displayTodayContacts}
        remainingContacts={remainingContacts}
      />

    

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-sm text-slate-500 dark:text-slate-400">
          <Link
            to="/rooms"
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Properties
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span>{room.city}</span>
          <ChevronRight className="w-4 h-4 text-slate-300" />
          <span className="text-slate-900 dark:text-white truncate max-w-[220px] font-medium">
            {room.title}
          </span>
        </div>

        {/* Mobile Actions */}
        <div className="flex justify-end gap-2 mb-4 md:hidden">
          <button
            className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* <button
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className={`p-2.5 rounded-full transition-all duration-200 ${
              isFavorited
                ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
          </button> */}
          <button
  onClick={handleToggleFavorite}
  disabled={isTogglingFavorite}
  aria-busy={isTogglingFavorite}
  className={`p-2.5 rounded-full transition-all duration-200 disabled:opacity-70 disabled:cursor-wait ${
    isFavorited
      ? "bg-red-100 dark:bg-red-900/30 text-red-500"
      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500"
  }`}
>
  {isTogglingFavorite ? (
    <Loader2 className="w-5 h-5 animate-spin" />
  ) : (
    <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
  )}
</button>
        </div>

        {/* Gallery */}
        <PropertyImageGallery
          images={room.images || []}
          title={room.title}
          isVerified={room.isVerified}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mt-8">
          {/* LEFT */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero */}
            <div className="pb-8 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight mb-2.5">
                    {room.title}
                  </h1>
                  
                  {/* Condensed Meta Info Row */}
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                 <div className="flex items-start gap-2 min-w-0 max-w-full">
  <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />

  <div className="min-w-0 flex flex-col">
    <span className="text-slate-600 dark:text-slate-400 font-medium break-words leading-5">
      {room.location}
    </span>

    {room.landmark && (
      <span className="text-sm text-slate-500 dark:text-slate-500 break-words leading-5">
        • {room.landmark}
      </span>
    )}
  </div>
</div>

                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                      <Star className="w-4 h-4 text-gold fill-gold flex-shrink-0" />
                      <span className="text-slate-900 dark:text-white font-bold">{room.rating}</span>
                      <span className="text-slate-500 dark:text-slate-400">({room.reviewsCount})</span>
                    </span>
                  </div>
                </div>

                <div className="hidden md:flex gap-2 flex-shrink-0">
                  <button
                    onClick={handleShare}
                    className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    title="Share"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

              <button
  onClick={handleToggleFavorite}
  disabled={isTogglingFavorite}
  aria-busy={isTogglingFavorite}
  className={`p-2.5 rounded-full transition-all duration-200 disabled:opacity-70 disabled:cursor-wait ${
    isFavorited
      ? "bg-red-100 dark:bg-red-900/30 text-red-500"
      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-red-500"
  }`}
  title={isFavorited ? "Remove from favorites" : "Add to favorites"}
>
  {isTogglingFavorite ? (
    <Loader2 className="w-5 h-5 animate-spin" />
  ) : (
    <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
  )}
</button>
                </div>
              </div>

              {/* Property Type & Ideal For Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-xs font-semibold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                  {room.roomType}
                </span>

                <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold uppercase tracking-wide border border-amber-200 dark:border-amber-500/20">
                  Ideal for {room.idealFor.join(", ")}
                </span>
              </div>

              {isFilled && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-600" />
                        <span className="font-semibold">🔴 CURRENTLY OCCUPIED</span>
                      </div>

                      <div className="mt-2 text-sm text-slate-700 dark:text-amber-300">
                        {expectedAvailableFrom ? (
                          <>Available from {expectedAvailableFrom}</>
                        ) : (
                          <>Availability date will be updated by the owner.</>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        onClick={handleNotifyAvailability}
                        disabled={isSubscribingAvailability}
                        loading={isSubscribingAvailability}
                        variant="primary"
                        size="sm"
                      >
                        {hasSubscribedAvailability ? "You’re on the list" : "🔔 Notify Me When Available"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* About */}
            <SectionCard
              title="About this place"
              subtitle="Overview and property details"
            >
              <div className="space-y-3">
                <p className={`text-base md:text-[15px] text-slate-600 dark:text-slate-300 leading-7 transition-all ${
                  isAboutExpanded ? '' : 'line-clamp-4'
                }`}>
                  {room.description}
                </p>
                
                {/* Show "Read more" button if description is long */}
                {room.description.split('\n').length > 4 || room.description.length > 300 ? (
                  <button
                    type="button"
                    onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                    className="text-sm font-semibold text-gold hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    {isAboutExpanded ? 'Show less' : 'Read more'}
                    <ChevronRight className={`w-4 h-4 transition-transform ${isAboutExpanded ? 'rotate-90' : ''}`} />
                  </button>
                ) : null}
              </div>
            </SectionCard>

            {/* Amenities */}
            <SectionCard
              title="Amenities"
              subtitle={`What this property offers (${room.amenities.length} total)`}
            >
              {/* Amenities Grid - Show only top 1-2 categories initially */}
              <div className="space-y-5">
                {/* Grouped Amenities */}
                {(() => {
                  const grouped = groupAmenitiesByCategory(room.amenities);
                  const topCategories = getTopCategories(grouped);

                  return (
                    <div className="space-y-6">
                      {topCategories.map((categoryKey) => {
                        const amenityIds = grouped[categoryKey];
                        if (amenityIds.length === 0) return null;

                        return (
                          <div key={categoryKey} className="space-y-3">
                            {/* Category Title */}
                            <div>
                              <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3">
                                {CATEGORY_LABELS[categoryKey]} ({amenityIds.length})
                              </h4>

                              {/* Amenities Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {amenityIds.map((amenityId, i) => {
                                  const amenity = getAmenityDetails(amenityId);
                                  if (!amenity) return null;

                                  const IconComponent = getIconForAmenity(amenity.icon);

                                  return (
                                    <div
                                      key={`${categoryKey}-${i}`}
                                      className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 px-3.5 py-3 transition-colors"
                                      title={amenity.description}
                                    >
                                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                                        <IconComponent className="w-4 h-4 text-gold" />
                                      </div>
                                      <span className="font-medium text-sm text-slate-700 dark:text-slate-200 leading-tight">
                                        {amenity.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Show All Button - Only if more than 6 amenities */}
                {room.amenities.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setIsShowAllAmenitiesOpen(true)}
                    className="w-full py-3 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-center gap-2"
                  >
                    Show all {room.amenities.length} amenities
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Show All Amenities Modal - Grouped by Category */}
           
            </SectionCard>

            {/* Owner Contact */}
            <section id="contact-owner" className="scroll-mt-24">
              <SectionCard
                title="Owner Contact"
                subtitle="Unlock direct contact and exact location"
              >
                {contactData ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            Contact unlocked
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            You can now contact the owner directly
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-3 py-1 text-xs font-medium">
                        <Crown className="w-3.5 h-3.5" />
                        Premium Access
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Owner Name
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {contactData.ownerName}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Phone Number
                        </p>
                        <a
                          href={`tel:${contactData.ownerPhone}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-gold inline-flex items-center gap-2"
                        >
                          {contactData.ownerPhone}
                          <Phone className="w-4 h-4 opacity-60" />
                        </a>
                      </div>

                      <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4">
                        <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">
                          Email Address
                        </p>
                        <a
                          href={`mailto:${contactData.ownerEmail}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-gold inline-flex items-center gap-2 break-all"
                        >
                          {contactData.ownerEmail}
                          <Mail className="w-4 h-4 opacity-60" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          icon: Zap,
                          title: "No Brokerage",
                          desc: `Save ~₹${brokerageSavings.toLocaleString()}`,
                        },
                        {
                          icon: CheckCircle2,
                          title: "Direct Owner",
                          desc: "Talk directly with the owner",
                        },
                        {
                          icon: Lock,
                          title: "Secure Access",
                          desc: "Protected and verified details",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4"
                        >
                          <item.icon className="w-5 h-5 text-gold mb-3" />
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    {demandStats && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            🔥 {displayTodayContacts} people contacted this owner
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            👀 {displayTodayViews} people viewed today
                          </p>
                        </div>
                      </div>
                    )}

                    {visibility && (
                      <div className="space-y-3">
                        <PreLimitAlert
                          viewCount={visibility.viewCount || 0}
                          viewLimit={visibility.viewLimit ?? 5}
                          userName={user?.name?.split(" ")[0]}
                          onUpgrade={navigateToUpgrade}
                        />

                        <UnlockProgressMeter
                          viewCount={visibility.viewCount || 0}
                          viewLimit={visibility.viewLimit ?? 5}
                          city={room.city}
                          plan={visibility.plan}
                        />
                      </div>
                    )}

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-gold mt-0.5" />
                        <div>
                          {isFreeLimitReached ? (
                            <>
                              <p className="font-medium text-slate-900 dark:text-white">
                                🔥 This property is getting high interest
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                🚀 You&apos;ve used all free contacts
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                                Unlock more to continue contacting owners.
                              </p>
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                                This property is in demand — unlock more to continue
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Get exact location, verified owner contact, and skip
                                broker calls.
                              </p>
                              {remainingContacts !== null && (
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                                  ⚠️ Only {remainingContacts} contacts left for this plan
                                </p>
                              )}
                              {remainingContacts !== null && remainingContacts <= 3 && (
                                <p className="text-sm font-medium text-rose-600 dark:text-rose-300 mt-2">
                                  🔥 Almost full — act fast before this property gets taken
                                </p>
                              )}
                            </>
                          )}
                          {demandStats && demandStats.todayContacts > 2 && (
                            <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-2">
                              🔥 This property is getting contacted frequently. Don&apos;t miss out — unlock now.
                            </p>
                          )}
                          {shouldShowMultiPropertyPressure && (
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                              ⚠️ You&apos;ve explored multiple properties. Unlock contacts to start connecting now.
                            </p>
                          )}
                          {shouldShowActivityTimer && (
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                              ⏳ High activity — act within 24 hours
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4">
                        {isFilled ? (
                          <div className="space-y-3">
                            <div className="text-sm text-slate-700 dark:text-amber-300">
                              {expectedAvailableFrom ? (
                                <>Available from {expectedAvailableFrom}</>
                              ) : (
                                <>Availability date will be updated by the owner.</>
                              )}
                            </div>

                            <Button
                              onClick={handleNotifyAvailability}
                              disabled={isSubscribingAvailability}
                              loading={isSubscribingAvailability}
                              variant="primary"
                              fullWidth
                              size="lg"
                            >
                              {hasSubscribedAvailability ? "You’re on the list" : "🔔 Notify Me When Available"}
                            </Button>

                            <p className="mt-3 text-xs text-center text-slate-400 dark:text-slate-500">
                              Secure • Verified • Instant Access
                            </p>
                          </div>
                        ) : (
                          <>
                            <Button
                              onClick={
                                isFreeLimitReached
                                  ? navigateToUpgrade
                                  : handleUnlockContact
                              }
                              disabled={isUnlocking}
                              variant="primary"
                              fullWidth
                              size="lg"
                            >
                              {isFreeLimitReached
                                ? "View Plans"
                                : isUnlocking
                                ? "Unlocking..."
                                : getCtaText()}
                            </Button>

                            <p className="mt-3 text-xs text-center text-slate-400 dark:text-slate-500">
                              Secure • Verified • Instant Access
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </SectionCard>
            </section>

            {/* Map */}
            <SectionCard
              title="Location"
              subtitle="See where this property is located"
            >
              <SubscriptionGate feature="map" city={room.city}>
                <DynamicMap
                  latitude={room.latitude}
                  longitude={room.longitude}
                  title={room.title}
                  location={room.location}
                  city={room.city}
                  isUnlocked={visibility?.canViewMap === true}
                />
              </SubscriptionGate>
            </SectionCard>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 space-y-5">
              {/* Price Card - Enhanced Premium Look */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden">
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold via-yellow-400 to-gold" />
                
                {/* Corner accent */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-gold/5 to-transparent rounded-full blur-xl" />

                <div className="relative space-y-5">
                  {/* Price Section */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Monthly Price
                    </p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                        <span className="text-gold">₹</span>{room.pricePerMonth.toLocaleString()}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        / month
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                     {/* Trust Badges Card - Enhanced */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 flex-shrink-0">
                      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Verified Listing
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Verified by our team
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Quick Response
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Replies typically in 2 hrs
                      </p>
                    </div>
                  </div>
                </div>

                  {/* CTA Button - Enhanced */}
                  <div className="space-y-2.5">
                    {isFilled ? (
                      <Button
                        onClick={handleNotifyAvailability}
                        disabled={isSubscribingAvailability}
                        loading={isSubscribingAvailability}
                        fullWidth
                        size="lg"
                        className="font-semibold"
                      >
                        {hasSubscribedAvailability ? "You’re on the list" : "🔔 Notify Me When Available"}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleBookNow}
                          fullWidth
                          size="lg"
                          className="font-semibold"
                        >
                          Book a Visit
                        </Button>

                        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                          ✓ Secure • Verified • No commitment
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

             
             
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-5xl space-y-8">
            {/* Section Header - Enhanced */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                    Reviews & Ratings
                  </h2>
                  {statsState.loaded && statsState.stats && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        {statsState.stats.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  See what previous tenants are saying about this property
                </p>
              </div>
            </div>

            {/* Rating Summary Card - Enhanced */}
            {statsState.loaded && statsState.stats && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm p-5 md:p-8">
                <RatingSummary
                  averageRating={statsState.stats?.averageRating || 0}
                  totalReviews={statsState.stats?.totalReviews || 0}
                  ratingDistribution={statsState.stats?.ratingDistribution}
                />
              </div>
            )}

            {/* No Reviews State */}
            {statsState.loaded && (!statsState.stats || statsState.stats.totalReviews === 0) && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 p-8 text-center">
                <div className="max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Be the first to review this property and help other users make informed decisions
                  </p>
                </div>
              </div>
            )}

            {/* Write Review Section - Enhanced */}
            {authStatus === "AUTHENTICATED" && user && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm p-5 md:p-8">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {userReviewState.review ? "Your Review" : "Share Your Experience"}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {userReviewState.review
                      ? "You've already reviewed this property"
                      : "Help other tenants by sharing your honest feedback"}
                  </p>
                </div>
                <ReviewForm
                  roomId={id || ""}
                  isLoggedIn={authStatus === "AUTHENTICATED"}
                  hasAlreadyReviewed={!!userReviewState.review}
                  onReviewSubmitted={() => {
                    dispatch(
                      fetchReviewsForRoom({
                        roomId: id || "",
                        page: 1,
                        limit: 10,
                      })
                    );
                    dispatch(fetchRatingStats(id || ""));
                  }}
                  onLoginRequired={() => navigate("/auth/login")}
                />
              </div>
            )}

            {/* Login Prompt for Reviews */}
            {authStatus !== "AUTHENTICATED" && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      Sign in to write a review
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Log in to share your experience and help the community
                    </p>
                  </div>
                  <Link to={`/auth/login?from=/rooms/${id}`}>
                    <Button size="sm" variant="primary">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Reviews List - Enhanced */}
            {(reviewsState.total > 0 || statsState.loaded) && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm p-5 md:p-8">
                <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {reviewsState.total === 0
                        ? "No reviews yet"
                        : `All Reviews (${reviewsState.total})`}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Verified user experiences and ratings
                    </p>
                  </div>
                </div>

                {reviewsState.total > 0 && (
                  <ReviewList
                    reviews={reviewsState.reviews}
                    total={reviewsState.total}
                    page={reviewsPage}
                    pages={reviewsState.pages}
                    loading={reviewsState.loading}
                    sort={reviewsSort}
                    onPageChange={(page) => {
                      setReviewsPage(page);
                      dispatch(
                        fetchReviewsForRoom({
                          roomId: id || "",
                          page,
                          limit: 10,
                          sort: reviewsSort,
                        })
                      );
                    }}
                    onSortChange={(sort) => {
                      setReviewsSort(sort);
                      setReviewsPage(1);
                      dispatch(
                        fetchReviewsForRoom({
                          roomId: id || "",
                          page: 1,
                          limit: 10,
                          sort,
                        })
                      );
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Similar */}
        {similarRooms.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  Similar Properties Nearby
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  More listings in {room.city} you may like
                </p>
              </div>

              <Link
                to="/rooms"
                className="text-gold font-semibold hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarRooms.map((r) => (
                <RoomCard key={r.id} room={r} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={mobileActionState}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="mx-2 mb-2 rounded-[22px] border border-amber-600/30 bg-slate-900 shadow-[0_12px_30px_rgba(2,6,23,0.6)] backdrop-blur-md dark:border-amber-600/20"
            style={{ paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
          >
            <div className="px-3 py-2.5 sm:px-4" style={{ minHeight: 84 }}>
              {/* Keep existing premium/unlocked layout unchanged */}
              {(mobileActionState === "premium" || mobileActionState === "unlocked") ? (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[1.1rem] font-black leading-none tracking-tight text-slate-900 dark:text-white">
                          <span className="text-gold">₹</span>
                          {room.pricePerMonth.toLocaleString()}
                        </p>
                        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          per month
                        </span>
                      </div>
                    </div>

                    <div className="rounded-full border border-amber-200/80 bg-white/85 p-2.5 shadow-sm dark:border-amber-500/20 dark:bg-slate-800/85">
                      <Crown className="h-4 w-4 text-gold" />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2.5">
                    <Button
                      onClick={() => handleOwnerContactAction("call")}
                      size="sm"
                      variant="primary"
                      className="flex-1 min-w-[112px]"
                    >
                      <Phone className="h-4 w-4" />
                      Call Owner
                    </Button>
                    <Button
                      onClick={() => handleOwnerContactAction("whatsapp")}
                      size="sm"
                      variant="secondary"
                      className="flex-1 min-w-[112px]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button onClick={handleBookNow} size="sm" variant="outline" className="flex-1 min-w-[100px]">
                      Book Visit
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Row 1: Price + Crown (compact) */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <p className="text-[1.08rem] font-black leading-none tracking-tight text-amber-50">
                        <span className="text-gold">₹</span>
                        {room.pricePerMonth.toLocaleString()}
                      </p>
                      <span className="text-[11px] font-medium text-slate-400">/ month</span>
                    </div>

                    <div className="rounded-full border border-amber-600/30 bg-slate-900/50 p-2 shadow-sm">
                      <Crown className="h-4 w-4 text-amber-400" />
                    </div>
                  </div>

                  {/* Row 2: Exact location locked + View Plans (gold outline) */}
                  <div className="mt-2 flex items-start justify-between items-center">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-50">
                      <span className="text-amber-400">📍</span>
                      <span className="truncate">Upgrade to view exact map.</span>
                    </div>

                    <div>
                      <Button
                        onClick={navigateToUpgrade}
                        size="sm"
                        variant="ghost"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-amber-500 text-amber-300 bg-transparent"
                      >
                        <Crown className="h-3.5 w-3.5 text-amber-300" />
                        View Plans
                      </Button>
                    </div>
                  </div>

                  {/* Divider + Row 4: Buttons */}
                  <div className="mt-3 border-t border-slate-500/12 pt-1 dark:border-slate-700/30">
                    <div className="flex gap-3">
                      <Button
                        onClick={handleUnlockContact}
                        variant="primary"
                        size="md"
                        className="w-[60%] py-3 rounded-xl text-lg font-semibold flex items-center justify-center gap-2 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900 shadow-sm"
                      >
                        Unlock Owner Contact
                      </Button>

                      <Button
                        onClick={handleBookNow}
                        variant="secondary"
                        size="md"
                        className="w-[40%] py-3 rounded-xl text-lg font-semibold flex items-center justify-center bg-slate-800 text-amber-50"
                      >
                        Book Visit
                      </Button>
                    </div>

                    {/* Bottom benefits */}
                    <div className="mt-3 flex items-center justify-center gap-4 text-sm text-slate-400">
                      <span className="text-amber-400">🛡</span>
                      <span className="truncate">Direct Owner</span>
                      <span className="text-amber-400">•</span>
                      <span className="text-amber-400">🚫</span>
                      <span>No Brokerage</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AmenitiesModal
        isOpen={isShowAllAmenitiesOpen}
        onClose={() => setIsShowAllAmenitiesOpen(false)}
        amenities={room.amenities}
      />
    </div>
    </>
  );
}
