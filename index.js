// Full updated index.js (Home component) - mobile-edge-clipping fixes applied (row neutralized + safe-area padding)
import { useEffect, useState, useRef, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "./_app";

/* -------------------------
   Helpers (unchanged)
   ------------------------- */
function secondsToHHMM(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const parts = val.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return val;
  }
  if (typeof val === "number") {
    const totalMinutes = Math.floor(val / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  return null;
}

function normalizeJoinRows(rows = []) {
  const map = new Map();

  rows.forEach((r, idx) => {
    const vid = r.id;
    if (!vid) return;

    if (!map.has(vid)) {
      map.set(vid, {
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        address: r.address,
        latitude: r.latitude,
        longitude: r.longitude,
        primary_image: r.primary_image,
        phone: r.phone,
        website: r.website,
        price_range: r.price_range,
        opening_time: r.opening_time,
        closing_time: r.closing_time,
        is_featured: r.is_featured,
        is_active: r.is_active,
        created_at: r.created_at,
        updated_at: r.updated_at,
        city_id: r.city_id,
        distance: r.distance ?? null,
        deals: [],
        area: r.area,
        category: r.category,
        avg_rating: r.avg_rating ?? null,
        review_count: r.review_count ?? 0,
        bookmarked: !!r.bookmarked,
      });
    }

    const hasDeal =
      r.deal_description ||
      r.start_time ||
      r.end_time ||
      r.day_of_week ||
      r.priority ||
      r.deal_id;

    if (hasDeal) {
      const dealId = r.deal_id ?? `deal-${vid}-${idx}`;
      map.get(vid).deals.push({
        id: dealId,
        day_of_week: r.day_of_week,
        start_time: r.start_time,
        end_time: r.end_time,
        deal_description: r.deal_description,
        priority: r.priority,
        is_active: r.deal_is_active ?? r.is_active ?? 1,
      });
    }
  });

  return Array.from(map.values());
}

function parseHHMM(str) {
  if (!str || typeof str !== "string" || !str.includes(":")) return null;
  const [hStr, mStr] = str.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatCountdown(diffMs) {
  if (diffMs <= 0) return null;
  const totalMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function getStatusInfo(rawStart, rawEnd) {
  const startTime = parseHHMM(secondsToHHMM(rawStart));
  const endTime = parseHHMM(secondsToHHMM(rawEnd));
  if (!startTime || !endTime) return null;

  const now = new Date();
  const diffStart = startTime - now;
  const diffEnd = endTime - now;

  if (now >= startTime && now <= endTime) {
    const countdown = formatCountdown(diffEnd);
    if (diffEnd <= 15 * 60 * 1000) {
      return {
        label: countdown ? `Ending in ${countdown}` : "Ending Soon",
        tone: "danger",
        color: "#d92d20",
        bg: "#fff1f1",
        sortOrder: 1,
        group: "ending",
      };
    }
    if (diffEnd <= 60 * 60 * 1000) {
      return {
        label: countdown ? `Ending in ${countdown}` : "Ending Soon",
        tone: "warning",
        color: "#c26a00",
        bg: "#fff6e8",
        sortOrder: 1,
        group: "ending",
      };
    }
    return {
      label: countdown ? `Live Now • Ends in ${countdown}` : "Live Now",
      tone: "success",
      color: "#1c7c45",
      bg: "#eefbf3",
      sortOrder: 0,
      group: "live",
    };
  }

  if (diffStart > 0 && diffStart <= 60 * 60 * 1000) {
    const countdown = formatCountdown(diffStart);
    return {
      label: countdown ? `Starts in ${countdown}` : "Starting Soon",
      tone: "warning",
      color: "#9a6700",
      bg: "#fff9e6",
      sortOrder: 2,
      group: "starting",
    };
  }

  if (diffStart > 0) {
    const countdown = formatCountdown(diffStart);
    return {
      label: countdown ? `Later • In ${countdown}` : "Later Today",
      tone: "info",
      color: "#1250aa",
      bg: "#eff5ff",
      sortOrder: 3,
      group: "later",
    };
  }

  return {
    label: "Ended Today",
    tone: "muted",
    color: "#59636e",
    bg: "#f4f5f7",
    sortOrder: 4,
    group: "ended",
  };
}

function sortVenues(venues, sortBy) {
  const sorted = [...venues];

  if (sortBy === "nearest") {
    return sorted.sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
  }

  if (sortBy === "rating") {
    return sorted.sort((a, b) => {
      const ratingDelta = (b.avg_rating ?? 0) - (a.avg_rating ?? 0);
      if (ratingDelta !== 0) return ratingDelta;
      return (a.distance ?? 9999) - (b.distance ?? 9999);
    });
  }

  if (sortBy === "saved") {
    return sorted.sort((a, b) => {
      const saveDelta = Number(!!b.bookmarked) - Number(!!a.bookmarked);
      if (saveDelta !== 0) return saveDelta;
      return (a.distance ?? 9999) - (b.distance ?? 9999);
    });
  }

  return sorted.sort((a, b) => {
    const aS = getStatusInfo(
      a.deals?.[0]?.start_time ?? a.start_time,
      a.deals?.[0]?.end_time ?? a.end_time
    );
    const bS = getStatusInfo(
      b.deals?.[0]?.start_time ?? b.start_time,
      b.deals?.[0]?.end_time ?? b.end_time
    );

    const aO = aS?.sortOrder ?? 99;
    const bO = bS?.sortOrder ?? 99;
    if (aO !== bO) return aO - bO;

    return (a.distance ?? 9999) - (b.distance ?? 9999);
  });
}

function groupVenues(sorted) {
  const groups = {
    live: { label: "Live Deals Near You", venues: [] },
    ending: { label: "Ending Soon", venues: [] },
    starting: { label: "Starting Soon", venues: [] },
    later: { label: "Later Today", venues: [] },
    ended: { label: "Ended Today", venues: [] },
    none: { label: "All Venues", venues: [] },
  };

  sorted.forEach((v) => {
    const s = getStatusInfo(
      v.deals?.[0]?.start_time ?? v.start_time,
      v.deals?.[0]?.end_time ?? v.end_time
    );
    const key = s?.group ?? "none";
    groups[key].venues.push(v);
  });

  return Object.values(groups).filter((g) => g.venues.length > 0);
}

function getClientId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem("hh_client_id");
  if (existing) return existing;
  const newId = `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`;
  window.localStorage.setItem("hh_client_id", newId);
  return newId;
}

function buildVenueMapUrl(venue) {
  return venue.latitude && venue.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${venue.name} ${venue.address || ""}`
      )}`;
}

function buildVenueShareUrl(venue) {
  if (typeof window === "undefined") return "";
  const base = window.location.origin;
  return `${base}/?venue=${encodeURIComponent(venue.id)}`;
}

async function shareVenue(venue) {
  const shareUrl = buildVenueShareUrl(venue);
  const shareData = {
    title: `${venue.name} on Happy Hours`,
    text: `Check out ${venue.name}${venue.address ? `, ${venue.address}` : ""}`,
    url: shareUrl,
  };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return { ok: true, mode: "native" };
    } catch (error) {
      if (error?.name === "AbortError") {
        return { ok: false, mode: "cancelled" };
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareUrl);
    return { ok: true, mode: "copied" };
  }

  return { ok: false, mode: "unsupported" };
}

function mergeUniqueVenues(current, incoming) {
  const map = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => {
    map.set(item.id, { ...map.get(item.id), ...item });
  });
  return Array.from(map.values());
}

/* -------------------------
   Small UI components
   ------------------------- */

function StarRating({ rating, max = 5, size = 16, interactive = false, onRate }) {
  const [hovered, setHovered] = useState(0);

  return (
    <span style={{ display: "inline-flex", gap: "2px" }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <span
          key={star}
          style={{
            fontSize: `${size}px`,
            cursor: interactive ? "pointer" : "default",
            color: star <= (interactive ? hovered || rating : rating) ? "#f5a623" : "#ddd",
            transition: "color 0.1s",
          }}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => interactive && onRate && onRate(star)}
        >
          ★
        </span>
      ))}
    </span>
  );
}

function RatingBadge({ avgRating, reviewCount, size = "sm" }) {
  if (!avgRating && !reviewCount) {
    return (
      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
        No reviews yet
      </span>
    );
  }

  if (!avgRating && reviewCount > 0) {
    return (
      <span style={{ fontSize: size === "sm" ? "11px" : "13px", color: "var(--text-muted)" }}>
        {reviewCount} review{reviewCount !== 1 ? "s" : ""}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      <StarRating rating={Math.round(avgRating)} size={size === "sm" ? 13 : 16} />
      <span style={{ fontSize: size === "sm" ? "12px" : "14px", fontWeight: "700", color: "#f5a623" }}>
        {avgRating?.toFixed(1)}
      </span>
      <span style={{ fontSize: size === "sm" ? "11px" : "13px", color: "var(--text-muted)" }}>
        ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
      </span>
    </span>
  );
}

const QUICK_TAGS = [
  "Cheap drinks", "Great vibe", "Good music", "Crowded",
  "Friendly staff", "Slow service", "Good food", "Nice ambience",
  "Value for money", "Must visit",
];

/* -------------------------
   ReviewsSection, BookmarkButton, QuickActionButton
   (kept as in original)
   ------------------------- */

function ReviewsSection({ venueId }) {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [formRating, setFormRating] = useState(0);
  const [formName, setFormName] = useState("");
  const [formText, setFormText] = useState("");
  const [formTags, setFormTags] = useState([]);
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  async function loadReviews(p = 1, append = false) {
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews?page=${p}&page_size=5`);
      if (!res.ok) throw new Error("Failed to load reviews");
      const data = await res.json();

      setReviews((prev) => (append ? [...prev, ...data.reviews] : data.reviews));
      setTotal(data.total);
      setAvgRating(data.avg_rating);
      setReviewCount(data.review_count);
      setHasMore(data.has_more);
      setPage(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews(1);
  }, [venueId]);

  function toggleTag(tag) {
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    if (!formRating) {
      setFormError("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_name: formName.trim() || "Anonymous",
          rating: formRating,
          review_text: formText.trim() || null,
          tags: formTags,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const data = await res.json();

      setAvgRating(data.avg_rating);
      setReviewCount(data.review_count);
      setSubmitSuccess(true);
      setShowForm(false);
      setFormRating(0);
      setFormName("");
      setFormText("");
      setFormTags([]);
      loadReviews(1);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      setFormError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "20px", borderTop: "1.5px solid var(--border)", paddingTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", gap: "12px" }}>
        <div>
          <p style={{ fontWeight: "700", margin: 0, fontSize: "15px", color: "var(--text)" }}>Reviews</p>
          <div style={{ marginTop: "4px" }}>
            <RatingBadge avgRating={avgRating} reviewCount={reviewCount} size="md" />
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: "#0d6efd",
            color: "#fff",
            border: "none",
            borderRadius: "999px",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "Write Review"}
        </button>
      </div>

      {submitSuccess && (
        <div
          style={{
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: "12px",
            padding: "8px 12px",
            marginBottom: "12px",
            fontSize: "13px",
            color: "#065f46",
          }}
        >
          Review submitted. Thanks for your feedback.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--surface)",
            borderRadius: "14px",
            padding: "14px",
            marginBottom: "16px",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ fontWeight: "600", marginBottom: "8px", fontSize: "14px", color: "var(--text)" }}>
            Your Rating *
          </p>
          <StarRating rating={formRating} size={28} interactive onRate={setFormRating} />

          <div style={{ marginTop: "12px" }}>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              maxLength={100}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1.5px solid var(--border)",
                fontSize: "13px",
                marginBottom: "8px",
                background: "var(--card-bg)",
                color: "var(--text)",
              }}
            />
            <textarea
              placeholder="Share your experience... (optional)"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              maxLength={1000}
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1.5px solid var(--border)",
                fontSize: "13px",
                resize: "vertical",
                background: "var(--card-bg)",
                color: "var(--text)",
              }}
            />
          </div>

          <div style={{ marginTop: "10px" }}>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>Quick tags:</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {QUICK_TAGS.map((tag) => (
                <span
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: "5px 10px",
                    borderRadius: "999px",
                    fontSize: "11px",
                    cursor: "pointer",
                    fontWeight: "600",
                    background: formTags.includes(tag) ? "#0d6efd" : "var(--surface2)",
                    color: formTags.includes(tag) ? "#fff" : "var(--text)",
                    border: `1.5px solid ${formTags.includes(tag) ? "#0d6efd" : "var(--border)"}`,
                    transition: "all 0.15s",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {formError && <p style={{ color: "#dc3545", fontSize: "12px", marginTop: "8px" }}>{formError}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "12px",
              background: "#198754",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: "700",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {loading && reviews.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No reviews yet. Be the first.</p>
      ) : (
        <div>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{
                background: "var(--card-bg)",
                border: "1.5px solid var(--border)",
                borderRadius: "14px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>
                    {r.reviewer_name || "Anonymous"}
                  </span>
                  <div style={{ marginTop: "2px" }}>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(r.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              {r.review_text && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "8px 0 6px" }}>
                  {r.review_text}
                </p>
              )}

              {r.tags && r.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        background: "#e3f2fd",
                        color: "#1565c0",
                        borderRadius: "999px",
                        padding: "3px 8px",
                        fontSize: "11px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => loadReviews(page + 1, true)}
              disabled={loading}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1.5px solid var(--border)",
                borderRadius: "12px",
                padding: "10px",
                fontSize: "13px",
                color: "var(--text)",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              {loading ? "Loading..." : `Load more reviews (${total - reviews.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function BookmarkButton({ active, busy, onToggle, compact = false }) {
  return (
    <button
      onClick={(event) => onToggle?.(event)}
      disabled={busy}
      style={{
        border: active ? "1px solid #f6c344" : "1px solid rgba(255,255,255,0.65)",
        background: active ? "#fff5cc" : "rgba(255,255,255,0.92)",
        color: active ? "#9a6700" : "#374151",
        borderRadius: compact ? "999px" : "14px",
        padding: compact ? "6px 10px" : "10px 14px",
        fontSize: compact ? "12px" : "13px",
        fontWeight: "700",
        cursor: busy ? "not-allowed" : "pointer",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        backdropFilter: "blur(8px)",
      }}
      type="button"
    >
      {busy ? "Saving..." : active ? "★ Saved" : "☆ Save"}
    </button>
  );
}

function QuickActionButton({ label, onClick, href, variant = "secondary" }) {
  const style = {
    background: variant === "primary" ? "#111827" : "var(--surface)",
    color: variant === "primary" ? "#fff" : "var(--text)",
    border: `1px solid ${variant === "primary" ? "#111827" : "var(--border)"}`,
    borderRadius: "12px",
    fontWeight: "700",
    padding: "10px 12px",
    fontSize: "12px",
    textAlign: "center",
    textDecoration: "none",
    flex: 1,
    cursor: "pointer",
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {label}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} style={style}>
      {label}
    </button>
  );
}

/* -------------------------
   VenueModal & VenueCard
   (kept same, with class names for CSS targeting)
   ------------------------- */

function VenueModal({ venue, onClose, onToggleBookmark, bookmarkBusy, onShareVenue }) {
  if (!venue) return null;

  const primaryDeal = venue.deals?.[0] ?? null;
  const rawStart = primaryDeal?.start_time ?? venue.start_time;
  const rawEnd = primaryDeal?.end_time ?? venue.end_time;
  const status = getStatusInfo(rawStart, rawEnd);

  const displayImage = venue.primary_image
    ? venue.primary_image.startsWith("http")
      ? venue.primary_image
      : `/${venue.primary_image}`
    : "/images/default-bar.jpg";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.62)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--modal-bg)",
          borderRadius: "24px",
          maxWidth: "560px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: "relative", height: "240px", overflow: "hidden", borderRadius: "24px 24px 0 0" }}>
          <img
            src={displayImage}
            style={{ width: "100%", height: "240px", objectFit: "cover" }}
            alt={venue.name}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/520x240?text=No+Photo";
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.05))" }} />
          {status && (
            <div
              style={{
                position: "absolute",
                top: "14px",
                left: "14px",
                background: status.bg,
                color: status.color,
                borderRadius: "999px",
                padding: "7px 14px",
                fontSize: "12px",
                fontWeight: "800",
                zIndex: 2,
                border: `1px solid ${status.color}20`,
              }}
            >
              {status.label}
            </div>
          )}
          <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", gap: "8px", zIndex: 2 }}>
            <BookmarkButton
              active={!!venue.bookmarked}
              busy={bookmarkBusy}
              compact
              onToggle={() => onToggleBookmark(venue)}
            />
            <button
              onClick={onClose}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "none",
                color: "#fff",
                borderRadius: "999px",
                width: "34px",
                height: "34px",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ position: "absolute", left: "20px", right: "20px", bottom: "16px", color: "#fff", zIndex: 2 }}>
            <h4 style={{ fontWeight: "800", marginBottom: "4px" }}>{venue.name}</h4>
            <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>{venue.address}</p>
          </div>
        </div>

        <div style={{ padding: "20px" }}>
          <div style={{ marginBottom: "12px" }}>
            <RatingBadge avgRating={venue.avg_rating} reviewCount={venue.review_count} size="md" />
          </div>

          <div className="d-flex gap-2 flex-wrap mb-3">
            {venue.area && (
              <span className="badge" style={{ background: "#eaf3ff", color: "#1550a3", borderRadius: "999px", padding: "8px 12px" }}>
                {venue.area}
              </span>
            )}
            {venue.price_range && (
              <span className="badge" style={{ background: "#fff5e8", color: "#9a6700", borderRadius: "999px", padding: "8px 12px" }}>
                {venue.price_range}
              </span>
            )}
            {venue.category && (
              <span className="badge" style={{ background: "#eefbf3", color: "#1c7c45", borderRadius: "999px", padding: "8px 12px" }}>
                {venue.category}
              </span>
            )}
            {venue.distance != null && (
              <span className="badge" style={{ background: "#f4f5f7", color: "#364152", borderRadius: "999px", padding: "8px 12px" }}>
                {parseFloat(venue.distance).toFixed(1)} km away
              </span>
            )}
          </div>

          {venue.deals && venue.deals.length > 0 && (
            <div className="mb-3">
              <p style={{ fontWeight: "800", marginBottom: "8px", color: "var(--text)" }}>Happy Hour Deals</p>
              {venue.deals.map((d, i) => (
                <div
                  key={d.id ?? i}
                  style={{
                    background: "#f8fffb",
                    border: "1.5px solid #b7ebcd",
                    borderRadius: "14px",
                    padding: "10px 12px",
                    marginBottom: "8px",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "700", color: "#157347" }}>
                    {d.deal_description || "Special Deal"}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    {secondsToHHMM(d.start_time) || "--"} - {secondsToHHMM(d.end_time) || "--"}
                    {d.day_of_week ? ` • ${d.day_of_week}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {venue.phone && (
            <p style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text)" }}>
              <a href={`tel:${venue.phone}`}>{venue.phone}</a>
            </p>
          )}

          {venue.website && (
            <p style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text)" }}>
              <a href={venue.website} target="_blank" rel="noreferrer">
                {venue.website}
              </a>
            </p>
          )}

          <div className="d-flex gap-2 mt-2">
            <QuickActionButton label="Directions" href={buildVenueMapUrl(venue)} variant="primary" />
            {venue.phone && <QuickActionButton label="Call" href={`tel:${venue.phone}`} />}
          </div>

          <div className="d-flex gap-2 mt-2 flex-wrap">
            <div style={{ flex: "1 1 140px" }}>
              <QuickActionButton label={venue.bookmarked ? "Saved" : "Save"} onClick={() => onToggleBookmark(venue)} />
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <QuickActionButton label="Share" onClick={() => onShareVenue(venue)} />
            </div>
            {venue.website && (
              <div style={{ flex: "1 1 140px" }}>
                <QuickActionButton label="Website" href={venue.website} />
              </div>
            )}
            {venue.website && (
              <div style={{ flex: "1 1 140px" }}>
                <QuickActionButton label="Menu / Link" href={venue.website} />
              </div>
            )}
          </div>

          <ReviewsSection venueId={venue.id} />
        </div>
      </div>
    </div>
  );
}

function VenueCard({
  v,
  uploadingVenueId,
  uploadSuccess,
  onUpload,
  onViewDetails,
  onToggleBookmark,
  bookmarkBusy,
  onShareVenue,
}) {
  const primaryDeal = v.deals?.[0] ?? null;
  const rawStart = primaryDeal?.start_time ?? v.start_time;
  const rawEnd = primaryDeal?.end_time ?? v.end_time;
  const startStr = secondsToHHMM(rawStart);
  const endStr = secondsToHHMM(rawEnd);
  const openStr = secondsToHHMM(v.opening_time);
  const closeStr = secondsToHHMM(v.closing_time);
  const status = getStatusInfo(rawStart, rawEnd);
  const dealText = primaryDeal?.deal_description || v.deal_description;
  const displayImage = v.primary_image
    ? v.primary_image.startsWith("http")
      ? v.primary_image
      : `/${v.primary_image}`
    : "/images/default-bar.jpg";

  return (
    <div className="col-12 col-md-6 col-xl-4 mb-4">
      <div
        className="card venue-card h-100 border-0"
        style={{
          borderRadius: "22px",
          overflow: "visible", // allow drop shadows and small overhangs without clipping
          background: "var(--card-bg)",
          boxShadow: "0 14px 40px rgba(15,23,42,0.08)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          cursor: "pointer",
          border: "1px solid rgba(148, 163, 184, 0.14)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 18px 44px rgba(15,23,42,0.12)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 14px 40px rgba(15,23,42,0.08)";
        }}
        onClick={() => onViewDetails(v)}
      >
        <div className="venue-image-wrap" style={{ position: "relative", overflow: "hidden", borderTopLeftRadius: "22px", borderTopRightRadius: "22px" }}>
          <img
            className="venue-card-img"
            src={displayImage}
            style={{ width: "100%", objectFit: "cover", display: "block" }}
            alt={v.name || "venue"}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/400x220?text=No+Photo";
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.08) 65%)",
              pointerEvents: "none",
            }}
          />
          {status && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                background: status.bg,
                color: status.color,
                borderRadius: "999px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: "800",
                border: `1px solid ${status.color}1a`,
                zIndex: 10,
              }}
            >
              {status.label}
            </div>
          )}

          <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10 }}>
            <BookmarkButton
              active={!!v.bookmarked}
              busy={bookmarkBusy}
              compact
              onToggle={(e) => {
                e.stopPropagation();
                onToggleBookmark(v);
              }}
            />
          </div>

          <label
            htmlFor={`upload-${v.id}`}
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              background: "rgba(8, 15, 30, 0.75)",
              color: "#fff",
              borderRadius: "999px",
              padding: "7px 12px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: uploadingVenueId === v.id ? "not-allowed" : "pointer",
              userSelect: "none",
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {uploadingVenueId === v.id ? "Uploading..." : uploadSuccess[v.id] ? "Uploaded" : "Add Photo"}
          </label>
          <input
            id={`upload-${v.id}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            style={{ display: "none" }}
            disabled={uploadingVenueId === v.id}
            onChange={(e) => {
              e.stopPropagation();
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = "";
              onUpload(v.id, file);
            }}
          />

          <div style={{ position: "absolute", left: "16px", right: "16px", bottom: "14px", color: "#fff", zIndex: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "flex-end" }}>
              <div style={{ minWidth: 0 }}>
                <h5 style={{ fontWeight: "800", marginBottom: "4px", fontSize: "18px", lineHeight: 1.2 }}>
                  {v.name}
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    margin: 0,
                    color: "rgba(255,255,255,0.85)",
                    display: "-webkit-box",
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {v.address || "No address available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body card-body-custom" style={{ padding: "14px", background: "var(--card-bg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: "6px" }}>
                <RatingBadge avgRating={v.avg_rating} reviewCount={v.review_count} size="sm" />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {v.area && (
                  <span className="badge" style={{ background: "#eef5ff", color: "#1550a3", fontSize: "11px", borderRadius: "999px", padding: "7px 10px" }}>
                    {v.area}
                  </span>
                )}
                {v.price_range && (
                  <span className="badge" style={{ background: "#fff5e8", color: "#9a6700", fontSize: "11px", borderRadius: "999px", padding: "7px 10px" }}>
                    {v.price_range}
                  </span>
                )}
                {v.category && (
                  <span className="badge" style={{ background: "#eefbf3", color: "#1c7c45", fontSize: "11px", borderRadius: "999px", padding: "7px 10px" }}>
                    {v.category}
                  </span>
                )}
              </div>
            </div>
            {v.distance != null && (
              <div
                style={{
                  whiteSpace: "nowrap",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#1250aa",
                  background: "#eef5ff",
                  borderRadius: "999px",
                  padding: "8px 10px",
                }}
              >
                {parseFloat(v.distance).toFixed(1)} km
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginBottom: "10px",
            }}
          >
            <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "10px 10px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "700", textTransform: "uppercase" }}>
                Venue Hours
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: "700" }}>
                {openStr || "--"} - {closeStr || "--"}
              </div>
            </div>
            <div style={{ background: "var(--surface)", borderRadius: "14px", padding: "10px 10px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontWeight: "700", textTransform: "uppercase" }}>
                Happy Hour
              </div>
              <div style={{ fontSize: "13px", color: "var(--text)", fontWeight: "700" }}>
                {startStr || "--"} - {endStr || "--"}
              </div>
            </div>
          </div>

          <div
            style={{
              background: dealText ? status?.bg || "#f0fff4" : "var(--surface)",
              border: `1.5px solid ${dealText ? status?.color || "#198754" : "var(--border)"}`,
              borderRadius: "16px",
              padding: "12px",
              marginBottom: "12px",
              minHeight: "68px",
            }}
          >
            <div style={{ fontSize: "11px", color: dealText ? status?.color || "#198754" : "var(--text-muted)", fontWeight: "800", textTransform: "uppercase", marginBottom: "6px" }}>
              Deal Highlight
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: "700",
                color: dealText ? status?.color || "#198754" : "var(--text-muted)",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {dealText || "No active deals right now"}
            </p>
          </div>

          <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm"
              style={{
                background: "#111827",
                color: "#fff",
                border: "1px solid #111827",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "12px",
                flex: 1,
                padding: "10px 12px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(v);
              }}
            >
              View Details
            </button>
            <button
              className="btn btn-sm"
              style={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "12px",
                padding: "10px 12px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onShareVenue(v);
              }}
            >
              Share
            </button>
            <a
              href={buildVenueMapUrl(v)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm"
              style={{
                background: "#eef5ff",
                color: "#1550a3",
                border: "1px solid #bfd7ff",
                borderRadius: "12px",
                fontWeight: "700",
                fontSize: "12px",
                flex: 1,
                textAlign: "center",
                padding: "10px 12px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------
   Main Page (Home) - mobile-first + sliding panel overlay (fixed on small screens)
   ------------------------- */

export default function Home() {
  const { dark, toggleTheme } = useContext(ThemeContext);

  /* state hooks (unchanged) */
  const [venues, setVenues] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);
  const [uploadingVenueId, setUploadingVenueId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [tick, setTick] = useState(0);
  const [clientId, setClientId] = useState("");
  const [bookmarkBusyMap, setBookmarkBusyMap] = useState({});
  const [shareMessage, setShareMessage] = useState("");

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    areas: [],
    price_ranges: [],
  });

  const [activeCategory, setActiveCategory] = useState("");
  const [activeArea, setActiveArea] = useState("");
  const [activePriceRange, setActivePriceRange] = useState("");
  const [activeDistance, setActiveDistance] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortBy, setSortBy] = useState("live");
  const [viewMode, setViewMode] = useState("discover");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const sentinelRef = useRef(null);
  const coordsRef = useRef(null);

  // top drawer state & touch handlers
  const [panelOpen, setPanelOpen] = useState(true); // start open
  const touchStartYRef = useRef(null);
  const touchEndYRef = useRef(null);

  useEffect(() => {
    setClientId(getClientId());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  function buildQuery({ cityId, lat, lng, category, area, priceRange, pageNum, pageSize = 12 }) {
    const p = new URLSearchParams();
    if (cityId) p.set("city_id", cityId);
    if (lat != null) p.set("lat", lat);
    if (lng != null) p.set("lng", lng);
    if (category) p.set("category", category);
    if (area) p.set("area", area);
    if (priceRange) p.set("price_range", priceRange);
    if (clientId) p.set("client_id", clientId);
    p.set("page", pageNum);
    p.set("page_size", pageSize);
    return p.toString();
  }

  async function fetchFilters(cityId) {
    try {
      const qs = cityId ? `?city_id=${cityId}` : "";
      const res = await fetch(`/api/filters${qs}`);
      if (res.ok) {
        const data = await res.json();
        setFilterOptions({
          categories: Array.isArray(data.categories) ? data.categories : [],
          areas: Array.isArray(data.areas) ? data.areas : [],
          price_ranges: Array.isArray(data.price_ranges) ? data.price_ranges : [],
        });
      }
    } catch (e) {
      console.warn("Could not load filters:", e);
    }
  }

  function deriveFilterOptions(venueList) {
    const categories = [...new Set(venueList.map((v) => v.category).filter(Boolean))].sort();
    const areas = [...new Set(venueList.map((v) => v.area).filter(Boolean))].sort();
    const price_ranges = [...new Set(venueList.map((v) => v.price_range).filter(Boolean))].sort();
    return { categories, areas, price_ranges };
  }

  async function fetchVenues({
    cityId,
    lat,
    lng,
    category,
    area,
    priceRange,
    pageNum = 1,
    append = false,
  }) {
    if (append) setLoadingMore(true);
    else setLoading(true);

    setErr(null);

    try {
      const qs = buildQuery({ cityId, lat, lng, category, area, priceRange, pageNum });
      const res = await fetch(`/api/venues?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      let newVenues = [];
      let newTotal = 0;
      let newHasMore = false;

      if (Array.isArray(data)) {
        newVenues = data[0]?.deals !== undefined ? data : normalizeJoinRows(data);
        newTotal = newVenues.length;
      } else {
        const raw = data.venues ?? [];
        newVenues = raw[0]?.deals !== undefined ? raw : normalizeJoinRows(raw);
        newTotal = data.total ?? newVenues.length;
        newHasMore = data.has_more ?? false;
      }

      setVenues((prev) => (append ? mergeUniqueVenues(prev, newVenues) : newVenues));
      setTotal(newTotal);
      setHasMore(newHasMore);
      setPage(pageNum);

      setFilterOptions((prev) => {
        const hasData =
          prev.categories.length > 0 ||
          prev.areas.length > 0 ||
          prev.price_ranges.length > 0;

        if (hasData) return prev;
        return deriveFilterOptions(append ? [...venues, ...newVenues] : newVenues);
      });
    } catch (e) {
      setErr(e.message || "Error loading venues");
      if (!append) setVenues([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function fetchBookmarks() {
    if (!clientId) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch(`/api/bookmarks?client_id=${encodeURIComponent(clientId)}&page=1&page_size=50`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = data.venues ?? [];
      const bookmarkedVenues = raw[0]?.deals !== undefined ? raw : normalizeJoinRows(raw);
      setVenues(bookmarkedVenues);
      setTotal(data.total ?? bookmarkedVenues.length);
      setHasMore(false);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Error loading bookmarks");
      setVenues([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    if (!clientId) return;

    async function init() {
      let loadedCities = [];
      try {
        const res = await fetch("/api/cities");
        if (res.ok) {
          const data = await res.json();
          loadedCities = Array.isArray(data) ? data : [];
          setCities(loadedCities);
        }
      } catch (e) {
        console.error("Could not load cities:", e);
      }

      if (!navigator.geolocation) {
        setErr("Geolocation not supported. Please select a city.");
        if (loadedCities.length > 0) {
          const cid = String(loadedCities[0].id);
          setSelectedCityId(cid);
          fetchFilters(cid);
          fetchVenues({ cityId: cid, pageNum: 1 });
        } else {
          setLoading(false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          coordsRef.current = { latitude, longitude };
          fetchFilters(null);
          fetchVenues({ lat: latitude, lng: longitude, pageNum: 1 });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setErr("Location unavailable. Please select a city.");
          if (loadedCities.length > 0) {
            const cid = String(loadedCities[0].id);
            setSelectedCityId(cid);
            fetchFilters(cid);
            fetchVenues({ cityId: cid, pageNum: 1 });
          } else {
            setLoading(false);
          }
        },
        { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }

    init();
  }, [clientId]);

  useEffect(() => {
    if (!sentinelRef.current || viewMode !== "discover") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const c = coordsRef.current;
          fetchVenues({
            cityId: selectedCityId || undefined,
            lat: c?.latitude,
            lng: c?.longitude,
            category: activeCategory || undefined,
            area: activeArea || undefined,
            priceRange: activePriceRange || undefined,
            pageNum: page + 1,
            append: true,
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, selectedCityId, activeCategory, activeArea, activePriceRange, viewMode, clientId]);

  function onCityChange(e) {
    const cid = e.target.value || "";
    setSelectedCityId(cid);
    setViewMode("discover");
    setActiveCategory("");
    setActiveArea("");
    setActivePriceRange("");
    setActiveDistance(null);
    setActiveStatusFilter("");
    setFilterOptions({ categories: [], areas: [], price_ranges: [] });
    setPage(1);
    setHasMore(false);
    setTotal(0);

    if (!cid) {
      const c = coordsRef.current;
      if (c) {
        fetchFilters(null);
        fetchVenues({ lat: c.latitude, lng: c.longitude, pageNum: 1 });
      } else {
        setVenues([]);
      }
      return;
    }

    fetchFilters(cid);
    fetchVenues({ cityId: cid, pageNum: 1 });
  }

  function onCategoryChange(value) {
    setActiveCategory(value);
    setViewMode("discover");
    const c = coordsRef.current;
    fetchVenues({
      cityId: selectedCityId || undefined,
      lat: selectedCityId ? undefined : c?.latitude,
      lng: selectedCityId ? undefined : c?.longitude,
      category: value || undefined,
      area: activeArea || undefined,
      priceRange: activePriceRange || undefined,
      pageNum: 1,
      append: false,
    });
  }

  function onAreaChange(value) {
    setActiveArea(value);
    setViewMode("discover");
    const c = coordsRef.current;
    fetchVenues({
      cityId: selectedCityId || undefined,
      lat: selectedCityId ? undefined : c?.latitude,
      lng: selectedCityId ? undefined : c?.longitude,
      category: activeCategory || undefined,
      area: value || undefined,
      priceRange: activePriceRange || undefined,
      pageNum: 1,
      append: false,
    });
  }

  function onPriceChange(value) {
    setActivePriceRange(value);
    setViewMode("discover");
    const c = coordsRef.current;
    fetchVenues({
      cityId: selectedCityId || undefined,
      lat: selectedCityId ? undefined : c?.latitude,
      lng: selectedCityId ? undefined : c?.longitude,
      category: activeCategory || undefined,
      area: activeArea || undefined,
      priceRange: value || undefined,
      pageNum: 1,
      append: false,
    });
  }

  async function handleImageUpload(venueId, file) {
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      alert("Only JPEG, PNG, or WEBP images allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Max 5MB.");
      return;
    }

    setUploadingVenueId(venueId);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/venues/${venueId}/upload-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.detail || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setVenues((prev) =>
        prev.map((v) => (v.id === venueId ? { ...v, primary_image: data.image_url } : v))
      );
      setSelectedVenue((prev) => (prev?.id === venueId ? { ...prev, primary_image: data.image_url } : prev));

      setUploadSuccess((prev) => ({ ...prev, [venueId]: true }));
      setTimeout(() => {
        setUploadSuccess((prev) => ({ ...prev, [venueId]: false }));
      }, 3000);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploadingVenueId(null);
    }
  }

  async function handleToggleBookmark(venue) {
    if (!clientId || !venue?.id) return;

    const venueId = venue.id;
    setBookmarkBusyMap((prev) => ({ ...prev, [venueId]: true }));

    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          venue_id: venueId,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Bookmark update failed");
      }

      const data = await res.json();
      const nextSaved = !!data.bookmarked;

      setVenues((prev) => {
        const updated = prev.map((item) =>
          item.id === venueId ? { ...item, bookmarked: nextSaved } : item
        );
        return viewMode === "saved" && !nextSaved ? updated.filter((item) => item.id !== venueId) : updated;
      });

      setSelectedVenue((prev) => (prev?.id === venueId ? { ...prev, bookmarked: nextSaved } : prev));
    } catch (e) {
      alert(e.message || "Could not update bookmark");
    } finally {
      setBookmarkBusyMap((prev) => ({ ...prev, [venueId]: false }));
    }
  }

  async function handleShareVenue(venue) {
    try {
      const result = await shareVenue(venue);
      if (result.mode === "copied") {
        setShareMessage("Share link copied to clipboard.");
        setTimeout(() => setShareMessage(""), 2500);
      } else if (result.mode === "unsupported") {
        setShareMessage("Sharing is not supported on this device.");
        setTimeout(() => setShareMessage(""), 2500);
      }
    } catch (error) {
      setShareMessage("Could not share this venue right now.");
      setTimeout(() => setShareMessage(""), 2500);
    }
  }

  function switchViewMode(nextMode) {
    setViewMode(nextMode);
    setPage(1);
    setHasMore(false);

    if (nextMode === "saved") {
      fetchBookmarks();
      return;
    }

    const c = coordsRef.current;
    fetchVenues({
      cityId: selectedCityId || undefined,
      lat: selectedCityId ? undefined : c?.latitude,
      lng: selectedCityId ? undefined : c?.longitude,
      category: activeCategory || undefined,
      area: activeArea || undefined,
      priceRange: activePriceRange || undefined,
      pageNum: 1,
      append: false,
    });
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div className="spinner-border text-warning" role="status" />
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Finding happy hours near you...
        </p>
      </div>
    );
  }

  const searchableVenues = venues.filter((v) => {
    if (!activeSearch.trim()) return true;
    const haystack = [v.name, v.address, v.area, v.category, v.price_range, v.deal_description, v.deals?.[0]?.deal_description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(activeSearch.trim().toLowerCase());
  });

  const clientFiltered = searchableVenues.filter((v) => {
    if (activeDistance !== null && (v.distance == null || parseFloat(v.distance) > activeDistance)) return false;

    if (activeStatusFilter) {
      const s = getStatusInfo(
        v.deals?.[0]?.start_time ?? v.start_time,
        v.deals?.[0]?.end_time ?? v.end_time
      );
      if ((s?.group ?? "none") !== activeStatusFilter) return false;
    }

    return true;
  });

  const sortedVenues = sortVenues(clientFiltered, sortBy);
  const groups = groupVenues(sortedVenues);

  const liveCount = sortedVenues.filter((v) => {
    const s = getStatusInfo(
      v.deals?.[0]?.start_time ?? v.start_time,
      v.deals?.[0]?.end_time ?? v.end_time
    );
    return s?.group === "live" || s?.group === "ending";
  }).length;

  const savedCount = venues.filter((v) => v.bookmarked).length;

  /* -------------------------
     Responsive CSS + sliding panel overlay (fixed on small screens)
     + safe-area & mobile padding to avoid left-edge clipping
     ------------------------- */
  const responsiveStyles = `
    /* global */
    html, body, #__next { margin: 0; padding: 0; box-sizing: border-box; -webkit-text-size-adjust: 100%; }
    *, *:before, *:after { box-sizing: inherit; }

    /* safe area (iOS) fallback and default side padding */
    :root {
      --safe-left: env(safe-area-inset-left, 12px);
      --safe-right: env(safe-area-inset-right, 12px);
    }

    .container-fluid.app-root {
      padding-left: calc(12px + var(--safe-left));
      padding-right: calc(12px + var(--safe-right));
    }

    /* panel */
    .sliding-panel {
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      z-index: 999;
      transition: transform 280ms cubic-bezier(.2,.9,.2,1), box-shadow 200ms;
      will-change: transform;
      pointer-events: auto;
      display: block;
    }

    .sliding-panel.open { transform: translateY(0); }
    .sliding-panel.closed { transform: translateY(calc(-100% + 64px)); }

    .sliding-panel .panel-inner {
      height: auto;
      margin: 0 8px;
      border-radius: 14px;
      padding: 10px;
      border: 1px solid rgba(148,163,184,0.12);
      background: var(--panel-bg, #fff);
      box-shadow: 0 12px 34px rgba(15,23,42,0.06);
      position: relative;
      overflow: visible;
    }

    .panel-toggle { position: absolute; right: 12px; top: 12px; z-index: 1000; }
    .panel-handle { position: absolute; left: 50%; transform: translateX(-50%); bottom: 10px; top: auto; width: 56px; height: 24px; }

    .hero h1 { font-size: clamp(18px, 6vw, 28px); margin: 0 0 6px 0; }

    /* VENUE GRID SAFE PADDING: small left/right padding for mobile + keep small column gutters */
    .venue-grid {
      /* default: no extra space on desktop, mobile rules below */
    }

    @media (max-width: 767px) {
      /* give the whole page a small safe padding on mobile (in addition to container-fluid) */
      .page-wrapper { padding-left: 0; padding-right: 0; }

      /* top drawer style: let the panel sit at the top and collapse vertically */
      .sliding-panel {
        top: 0;
        left: 0;
        right: 0;
      }

      .sliding-panel.closed {
        transform: translateY(calc(-100% + 64px));
      }

      /* small safe padding specifically for the venue grid so text & rounded corners aren't flush */
      .venue-grid { padding-left: 12px; padding-right: 12px; }

      /* keep col gutters but small - avoid zeroing gutters completely */
      .venue-grid > [class*="col-"] { padding-left: 6px !important; padding-right: 6px !important; }

      /* ensure cards don't have overflow hidden at root (so shadows & small overlays aren't clipped) */
      .venue-card { overflow: visible !important; }

      /* but keep image wrapper clipping for rounded corners */
      .venue-image-wrap { overflow: hidden; border-top-left-radius: 22px; border-top-right-radius: 22px; }

      /* slightly smaller images on tight screens */
      .venue-card-img { height: 140px; }

      /* make sure text has breathing room */
      .card-body-custom { padding-left: 12px !important; padding-right: 12px !important; }

      /* mobile top drawer handle centered at bottom of the visible strip */
      .panel-handle {
        left: 50%;
        transform: translateX(-50%);
        bottom: 12px;
        top: auto;
        width: 56px;
        height: 24px;
      }
    }

    @media (min-width: 768px) {
      .sliding-panel { position: sticky; top: 10px; }
      .sliding-panel.closed { transform: translateX(0); }
      .panel-handle { display: none; }
      .floating-open-btn { display: none; }
      .panel-inner { margin: 0; border-radius: 24px; padding: 18px; }
      .venue-card-img { height: 220px; }
      .venue-grid > [class*="col-"] { padding-left: 12px !important; padding-right: 12px !important; }
    }
  `;

  // touch handlers for simple vertical swipe detection
  function handleTouchStart(e) {
    touchStartYRef.current = e.touches?.[0]?.clientY ?? null;
    touchEndYRef.current = null;
  }

  function handleTouchMove(e) {
    touchEndYRef.current = e.touches?.[0]?.clientY ?? null;
  }

  function handleTouchEnd() {
    const start = touchStartYRef.current;
    const end = touchEndYRef.current;
    if (start == null || end == null) return;
    const delta = end - start;
    // swipe up -> close panel; swipe down -> open panel
    if (delta < -40) {
      setPanelOpen(false);
    } else if (delta > 40) {
      setPanelOpen(true);
    }
  }

  function togglePanel(e) {
    e?.stopPropagation();
    setPanelOpen((v) => !v);
  }

  return (
    <div
      className="container-fluid app-root px-0"
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
      }}
    >
      <style>{responsiveStyles}</style>

      <div
        className="page-wrapper"
        style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}
      >
        {/* Sliding panel: fixed overlay on small screens, sticky on desktop */}
        <div
          className={`sliding-panel ${panelOpen ? "open" : "closed"}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-hidden={!panelOpen}
        >
          <div className={`panel-inner ${dark ? "dark" : "light"}`}>
            <button className="panel-toggle" aria-label={panelOpen ? "Collapse" : "Open"} onClick={togglePanel}>
              {panelOpen ? "Hide" : "Show"}
            </button>

            {/* hero */}
            <div className="hero" style={{ paddingRight: 72 }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ maxWidth: "720px" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)",
                      color: "var(--text)",
                      borderRadius: "999px",
                      padding: "6px 10px",
                      fontSize: "12px",
                      fontWeight: "800",
                      marginBottom: "10px",
                    }}
                  >
                    <span>Happy Hours</span>
                    <span style={{ opacity: 0.55 }}>•</span>
                    <span>{liveCount} live now</span>
                  </div>
                  <h1>Discover the best nearby happy hour deals.</h1>
                  <p className="lead">
                    Cleaner browsing, faster scanning, and one-tap bookmarking so users can save places before they forget.
                  </p>
                </div>

                <button
                  onClick={toggleTheme}
                  style={{
                    background: dark ? "#f8fafc" : "#111827",
                    color: dark ? "#111827" : "#f8fafc",
                    border: "none",
                    borderRadius: "999px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
                    height: "40px",
                    alignSelf: "flex-start",
                  }}
                >
                  {dark ? "Light" : "Dark"}
                </button>
              </div>

              <div className="row g-2 mt-2 hero-stats">
                <div className="col-6 col-md-3">
                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.72)" }}>
                    <div style={{ fontSize: "11px", color: "#475467", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Total venues</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#101828" }}>{total}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.72)" }}>
                    <div style={{ fontSize: "11px", color: "#475467", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Live now</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#067647" }}>{liveCount}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.72)" }}>
                    <div style={{ fontSize: "11px", color: "#475467", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Saved places</div>
                    <div style={{ fontSize: "22px", fontWeight: "900", color: "#b54708" }}>{savedCount}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="stat-card" style={{ background: "rgba(255,255,255,0.72)" }}>
                    <div style={{ fontSize: "11px", color: "#475467", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Mode</div>
                    <div style={{ fontSize: "18px", fontWeight: "900", color: "#101828" }}>{viewMode === "saved" ? "Saved" : "Discover"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* filters */}
            <div className="filters-bar" style={{ marginTop: 8 }}>
              {shareMessage && (
                <div
                  style={{
                    marginBottom: "12px",
                    background: "#eefbf3",
                    color: "#157347",
                    border: "1px solid #b7ebcd",
                    borderRadius: "14px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    fontWeight: "700",
                  }}
                >
                  {shareMessage}
                </div>
              )}

              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex flex-wrap gap-2">
                  {[
                    { key: "discover", label: "Discover" },
                    { key: "saved", label: "Saved" },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => switchViewMode(item.key)}
                      style={{
                        borderRadius: "999px",
                        border: `1px solid ${viewMode === item.key ? "#111827" : "var(--border)"}`,
                        background: viewMode === item.key ? "#111827" : "var(--surface)",
                        color: viewMode === item.key ? "#fff" : "var(--text)",
                        padding: "8px 12px",
                        fontSize: "13px",
                        fontWeight: "800",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <input
                    value={activeSearch}
                    onChange={(e) => setActiveSearch(e.target.value)}
                    placeholder="Search venues, areas or deals"
                    style={{
                      minWidth: "140px",
                      background: "var(--surface)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      background: "var(--surface)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      padding: "8px 12px",
                      fontSize: "13px",
                      fontWeight: "700",
                    }}
                  >
                    <option value="live">Sort: Best timing</option>
                    <option value="nearest">Sort: Nearest</option>
                    <option value="rating">Sort: Top rated</option>
                    <option value="saved">Sort: Saved first</option>
                  </select>
                </div>
              </div>

              {viewMode === "discover" && (
                <>
                  <div className="row g-2 mb-2">
                    <div className="col-12 col-md-4">
                      <select
                        className="form-select"
                        value={selectedCityId}
                        onChange={onCityChange}
                        style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)", borderRadius: "16px" }}
                      >
                        <option value="">Auto-detect nearest city</option>
                        {cities.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      {err && (
                        <div style={{ color: "var(--text-muted)" }} className="small mt-1">
                          {err}
                        </div>
                      )}
                    </div>

                    {filterOptions.categories.length > 0 && (
                      <div className="col-12 col-md-3">
                        <select
                          className="form-select"
                          value={activeCategory}
                          onChange={(e) => onCategoryChange(e.target.value)}
                          style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)", borderRadius: "16px" }}
                        >
                          <option value="">All Categories</option>
                          {filterOptions.categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {filterOptions.areas.length > 0 && (
                      <div className="col-12 col-md-3">
                        <select
                          className="form-select"
                          value={activeArea}
                          onChange={(e) => onAreaChange(e.target.value)}
                          style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)", borderRadius: "16px" }}
                        >
                          <option value="">All Areas</option>
                          {filterOptions.areas.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {filterOptions.price_ranges.length > 0 && (
                      <div className="col-12 col-md-2">
                        <select
                          className="form-select"
                          value={activePriceRange}
                          onChange={(e) => onPriceChange(e.target.value)}
                          style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)", borderRadius: "16px" }}
                        >
                          <option value="">All Prices</option>
                          {filterOptions.price_ranges.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "800" }}>Distance</span>
                    {[null, 2, 5, 10, 20].map((km) => (
                      <button
                        key={km ?? "all"}
                        onClick={() => setActiveDistance(km)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          border: "1px solid",
                          background: activeDistance === km ? "#0d6efd" : "var(--surface)",
                          color: activeDistance === km ? "#fff" : "var(--text)",
                          borderColor: activeDistance === km ? "#0d6efd" : "var(--border)",
                        }}
                      >
                        {km === null ? "All" : `< ${km} km`}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "800" }}>Status</span>
                    {[
                      { key: "", label: "All" },
                      { key: "live", label: "Live Now" },
                      { key: "ending", label: "Ending Soon" },
                      { key: "starting", label: "Starting Soon" },
                      { key: "later", label: "Later Today" },
                      { key: "ended", label: "Ended" },
                    ].map(({ key, label }) => (
                      <button
                        key={key || "all-status"}
                        onClick={() => setActiveStatusFilter(key)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "800",
                          cursor: "pointer",
                          border: "1px solid",
                          background: activeStatusFilter === key ? "#198754" : "var(--surface)",
                          color: activeStatusFilter === key ? "#fff" : "var(--text)",
                          borderColor: activeStatusFilter === key ? "#198754" : "var(--border)",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="panel-handle" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: "#111827" }}>
                <path d="M5 8l7 8 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* floating open button */}
        {!panelOpen && (
          <button
            className="floating-open-btn"
            aria-label="Open filters"
            onClick={() => setPanelOpen(true)}
            title="Open filters"
            style={{ position: "fixed", right: 12 + (typeof window !== "undefined" ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-right') || 12) : 12), top: 12, zIndex: 1001 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M16 5L8 12l8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* venues content */}
        {sortedVenues.length === 0 && !loading ? (
          <div className="text-center py-5">
            <p style={{ fontSize: "40px" }}>{viewMode === "saved" ? "★" : "🍺"}</p>
            <p style={{ color: "var(--text-muted)" }}>
              {viewMode === "saved"
                ? "No saved venues yet. Tap Save on any venue card to bookmark it."
                : "No venues found. Try adjusting your filters or selecting a city."}
            </p>
          </div>
        ) : viewMode === "saved" ? (
          <div className="row venue-grid g-3">
            {sortedVenues.map((v, index) => (
              <VenueCard
                key={v.id || index}
                v={v}
                uploadingVenueId={uploadingVenueId}
                uploadSuccess={uploadSuccess}
                onUpload={handleImageUpload}
                onViewDetails={setSelectedVenue}
                onToggleBookmark={handleToggleBookmark}
                bookmarkBusy={!!bookmarkBusyMap[v.id]}
                onShareVenue={handleShareVenue}
              />
            ))}
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "2px solid var(--surface2)",
                }}
              >
                <h5 style={{ margin: 0, fontWeight: "800", fontSize: "18px", color: "var(--text)" }}>
                  {group.label}
                </h5>
                <span
                  style={{
                    background: "var(--surface2)",
                    color: "var(--text-muted)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: "800",
                  }}
                >
                  {group.venues.length}
                </span>
              </div>

              <div className="row venue-grid g-3">
                {group.venues.map((v, index) => (
                  <VenueCard
                    key={v.id || index}
                    v={v}
                    uploadingVenueId={uploadingVenueId}
                    uploadSuccess={uploadSuccess}
                    onUpload={handleImageUpload}
                    onViewDetails={setSelectedVenue}
                    onToggleBookmark={handleToggleBookmark}
                    bookmarkBusy={!!bookmarkBusyMap[v.id]}
                    onShareVenue={handleShareVenue}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={sentinelRef} className="text-center py-3">
          {loadingMore && (
            <div>
              <div className="spinner-border spinner-border-sm text-warning me-2" role="status" />
              <span style={{ color: "var(--text-muted)" }} className="small">
                Loading more venues...
              </span>
            </div>
          )}
          {!hasMore && sortedVenues.length > 0 && viewMode === "discover" && (
            <p style={{ color: "var(--text-muted)" }} className="small">
              You&apos;ve seen all {total} venues.
            </p>
          )}
        </div>

        {selectedVenue && (
          <VenueModal
            venue={selectedVenue}
            onClose={() => setSelectedVenue(null)}
            onToggleBookmark={handleToggleBookmark}
            bookmarkBusy={!!bookmarkBusyMap[selectedVenue.id]}
            onShareVenue={handleShareVenue}
          />
        )}
      </div>
    </div>
  );
}