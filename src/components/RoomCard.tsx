import React, { useCallback, memo } from "react";
import { MapPin, Star, ArrowUpRight, CheckCircle, Heart, Eye, Flame, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Room } from "../types/api.types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { AvailabilityStateBlock } from "./ui/AvailabilityStateBlock";
import {
  toggleFavorite,
  selectIsFavorited,
  selectIsToggling,
} from "../store/slices/favorites.slice";
import { showToast } from "../store/slices/ui.slice";

interface RoomCardProps {
  room: Room;
}

function RoomCardComponent({ room }: RoomCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const roomId = room?.id || "";
  const title = room?.title || "No Title";
  const description = room?.description || "";
  const image = room?.images?.[0] || "/placeholder.png";
  const price = room?.pricePerMonth ?? null;
  const location = room?.location || room?.city || "Unknown Location";
  const rating = room?.rating ?? null;
  const roomType = room?.roomType || "Room";
  const amenities = room?.amenities || [];
  const isPopular = room?.isPopular || false;
  const isVerified = room?.isVerified || false;
  const weeklyViews = Math.max(1, room?.demand?.weeklyViews || 0);
  const weeklyContacts = Math.max(1, room?.demand?.weeklyContacts || 0);
  const availabilityStatus = room?.availabilityStatus || "AVAILABLE";
  const isFilled = availabilityStatus === "FILLED";

  const { authStatus } = useAppSelector((state) => state.auth);
  const isFavorited = useAppSelector(selectIsFavorited(roomId));
  const isToggling = useAppSelector(selectIsToggling(roomId));

  const handleFavoriteClick = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();

      if (authStatus !== "AUTHENTICATED") {
        dispatch(
          showToast({ message: "Please log in to save favourites", type: "info" })
        );
        const redirectPath = encodeURIComponent(`/rooms/${room.id}`);
        navigate(`/auth/login?redirect=${redirectPath}`);
        return;
      }

      if (!room?.id) return;

      dispatch(toggleFavorite(room.id));
    },
    [authStatus, room?.id, dispatch, navigate]
  );

  const genderBadge =
    room?.genderPreference && room.genderPreference !== "ANY"
      ? room.genderPreference === "MALE_ONLY"
        ? { emoji: "♂", label: "Boys Only" }
        : { emoji: "♀", label: "Girls Only" }
      : null;

  return (
    <Link
      to={`/rooms/${roomId}`}
      className="block h-full group focus:outline-none focus-visible:ring-2 rounded-2xl"
      style={{ focusRingColor: "rgba(212,175,55,0.5)" } as React.CSSProperties}
    >
      {/*
        ── Card shell ────────────────────────────────────────────
        Dark-luxury editorial aesthetic: near-black surface,
        gold accent system, measured typography.
        Light mode uses warm-white (#faf9f7) so it doesn't clash
        with the [#f8f6f1] listing background.
      ── */}
      <article
        className="
          relative flex flex-col h-full rounded-2xl overflow-hidden
          bg-white dark:bg-[#111009]
          border border-slate-200/70 dark:border-white/[0.06]
          shadow-sm shadow-slate-200/60 dark:shadow-black/50
          transition-all duration-300 ease-out
          group-hover:-translate-y-1
          group-hover:shadow-xl group-hover:shadow-slate-300/40
          dark:group-hover:shadow-black/70
          group-hover:border-slate-300/60 dark:group-hover:border-white/10
        "
      >
        {/* ── Image ───────────────────────────────────────── */}
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Gradient — heavier at bottom for price legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

          {/* ── Price pill (bottom-left) ── */}
          <div
            className="absolute bottom-3 left-3 flex items-baseline gap-1 rounded-full px-3 py-1.5 shadow-lg"
            style={{
              background: "rgba(13,11,6,0.65)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(212,175,55,0.25)",
            }}
          >
            {price !== null ? (
              <>
                <span
                  className="font-bold text-white text-base leading-none"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  ₹{price.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-300/80 font-medium uppercase tracking-wider">
                  /mo
                </span>
              </>
            ) : (
              <span className="text-[10px] text-slate-300 font-semibold uppercase tracking-wider">
                Price on request
              </span>
            )}
          </div>

          {/* ── Top-left badge stack ── */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isPopular && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-bold tracking-[0.1em] uppercase shadow-md"
                style={{
                  background: "rgba(212,175,55,0.92)",
                  color: "#0d0b06",
                }}
              >
                <Star className="w-2.5 h-2.5 fill-current" />
                Popular
              </span>
            )}
            {isVerified && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-bold tracking-[0.1em] uppercase shadow-md"
                style={{
                  background: "rgba(13,11,6,0.75)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                }}
              >
                <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />
                Verified
              </span>
            )}
            {genderBadge && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-[3px] text-[10px] font-bold tracking-[0.1em] uppercase shadow-md"
                style={{
                  background: "rgba(99,50,140,0.8)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                {genderBadge.emoji} {genderBadge.label}
              </span>
            )}
          </div>

          {/* ── Favourite button (top-right) ── */}
          <button
            onClick={handleFavoriteClick}
            disabled={isToggling}
            aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
            className={`
              absolute top-3 right-3 flex h-8 w-8 items-center justify-center
              rounded-full shadow-md transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
              ${isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"}
              ${
                isFavorited
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-black/30 text-white backdrop-blur-sm hover:bg-white hover:text-red-500"
              }
            `}
            style={
              isFavorited
                ? { boxShadow: "0 0 12px rgba(239,68,68,0.4)" }
                : { border: "1px solid rgba(255,255,255,0.15)" }
            }
          >
            <Heart
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isFavorited ? "fill-current scale-110" : ""
              } ${isToggling ? "animate-pulse" : ""}`}
            />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-4">

          {/* Location + rating row */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin
                className="w-3 h-3 flex-shrink-0"
                style={{ color: "rgba(212,175,55,0.85)" }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                {location}
              </span>
            </div>

            {rating !== null && (
              <div className="flex items-center gap-1 flex-shrink-0 rounded-md px-2 py-0.5 bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06]">
                <Star
                  className="w-3 h-3 fill-current"
                  style={{ color: "rgba(212,175,55,0.9)" }}
                />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  {rating}
                </span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3
            className="text-base font-bold leading-snug mb-1.5 text-slate-900 dark:text-white line-clamp-1 transition-colors duration-200"
            style={{ fontFamily: "'Playfair Display', serif" }}
            title={title}
          >
            {title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-3 flex-1">
            {description || "\u00A0"}
          </p>

          {/* Demand stats */}
          {room?.demand && (
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                <Eye className="w-3 h-3" />
                {weeklyViews.toLocaleString()} views
              </span>
              <span
                className="inline-flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: "rgba(212,175,55,0.7)" }}
              >
                <Flame className="w-3 h-3" />
                {weeklyContacts} contacts
              </span>
            </div>
          )}

          {isFilled && (
            <AvailabilityStateBlock
              availabilityStatus={availabilityStatus}
              expectedAvailableFrom={room.expectedAvailableFrom}
              showAvailableButton={false}
              filledLabel="Notify Me When Available"
              className="mb-3"
            />
          )}

          {/* Divider */}
          <div className="h-px w-full bg-slate-100 dark:bg-white/[0.05] mb-3" />

          {/* Amenity tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {/* Room type — gold-tinted */}
            <span
              className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide"
              style={{
                background: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.2)",
                color: "rgba(212,175,55,0.9)",
              }}
            >
              {roomType}
            </span>

            {amenities.slice(0, 2).map((amenity, i) => (
              <span
                key={i}
                className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]"
              >
                {amenity}
              </span>
            ))}

            {amenities.length > 2 && (
              <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                +{amenities.length - 2}
              </span>
            )}
          </div>

          {/* CTA button */}
          <div
            className="
              w-full flex items-center justify-center gap-1.5
              rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest
              transition-all duration-300
              bg-slate-50 dark:bg-white/[0.04]
              border border-slate-200/70 dark:border-white/[0.07]
              text-slate-600 dark:text-slate-300
              group-hover:border-transparent
            "
            style={{
              // gold fill on hover via box-shadow trick isn't possible in Tailwind
              // so we use a className group-hover override below
            }}
          >
            {/* Hover overlay — gold fill */}
            <span
              className="
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                transition-opacity duration-300 pointer-events-none
              "
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.35)",
              }}
              aria-hidden
            />
            <span className="relative z-10 group-hover:text-[rgba(212,175,55,0.95)] transition-colors duration-300">
              {isFilled ? (
                <span className="inline-flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notify Me When Available
                </span>
              ) : (
                "View Details"
              )}
            </span>
            <ArrowUpRight
              className="relative z-10 w-3.5 h-3.5 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              style={{ color: "inherit" }}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

function areRoomsEqual(
  prevProps: RoomCardProps,
  nextProps: RoomCardProps
): boolean {
  if (prevProps.room === nextProps.room) return true;
  return (
    prevProps.room?.id === nextProps.room?.id &&
    prevProps.room?.title === nextProps.room?.title &&
    prevProps.room?.images?.[0] === nextProps.room?.images?.[0] &&
    prevProps.room?.pricePerMonth === nextProps.room?.pricePerMonth &&
    prevProps.room?.rating === nextProps.room?.rating &&
    prevProps.room?.isPopular === nextProps.room?.isPopular &&
    prevProps.room?.isVerified === nextProps.room?.isVerified
  );
}

export const RoomCard = memo(RoomCardComponent, areRoomsEqual);
