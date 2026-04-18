import { useEffect, useState, useRef, useContext } from "react";
import Head from "next/head";
import "bootstrap/dist/css/bootstrap.min.css";
import { ThemeContext } from "./_app";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsToHHMM(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "string") {
    const parts = val.split(":");
    if (parts.length >= 2)
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
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
        id: r.id, name: r.name, slug: r.slug, description: r.description,
        address: r.address, latitude: r.latitude, longitude: r.longitude,
        primary_image: r.primary_image, phone: r.phone, website: r.website,
        price_range: r.price_range, opening_time: r.opening_time,
        closing_time: r.closing_time, is_featured: r.is_featured,
        is_active: r.is_active, created_at: r.created_at, updated_at: r.updated_at,
        city_id: r.city_id, distance: r.distance ?? null, deals: [],
        area: r.area, category: r.category,
        avg_rating: r.avg_rating ?? null, review_count: r.review_count ?? 0,
      });
    }
    const hasDeal = r.deal_description || r.start_time || r.end_time || r.day_of_week || r.priority || r.deal_id;
    if (hasDeal) {
      const dealId = r.deal_id ?? `deal-${vid}-${idx}`;
      map.get(vid).deals.push({
        id: dealId, day_of_week: r.day_of_week, start_time: r.start_time,
        end_time: r.end_time, deal_description: r.deal_description,
        priority: r.priority, is_active: r.deal_is_active ?? r.is_active ?? 1,
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
    if (diffEnd <= 15 * 60 * 1000)
      return { label: countdown ? `🔴 Ending in ${countdown}` : "🔴 Ending Soon", color: "#dc3545", bg: "#fff0f0", sortOrder: 1, group: "ending" };
    if (diffEnd <= 60 * 60 * 1000)
      return { label: countdown ? `🟠 Ending in ${countdown}` : "🟠 Ending Soon", color: "#fd7e14", bg: "#fff5f0", sortOrder: 1, group: "ending" };
    return { label: countdown ? `🟢 Live Now • Ends in ${countdown}` : "🟢 Live Now", color: "#198754", bg: "#f0fff4", sortOrder: 0, group: "live" };
  }
  if (diffStart > 0 && diffStart <= 60 * 60 * 1000) {
    const countdown = formatCountdown(diffStart);
    return { label: countdown ? `🟡 Starts in ${countdown}` : "🟡 Starting Soon", color: "#e6a817", bg: "#fffdf0", sortOrder: 2, group: "starting" };
  }
  if (diffStart > 0) {
    const countdown = formatCountdown(diffStart);
    return { label: countdown ? `🔵 Later • In ${countdown}` : "🔵 Later Today", color: "#0d6efd", bg: "#f0f4ff", sortOrder: 3, group: "later" };
  }
  return { label: "⚫ Ended Today", color: "#6c757d", bg: "#f8f9fa", sortOrder: 4, group: "ended" };
}

function sortVenues(venues) {
  return [...venues].sort((a, b) => {
    const aS = getStatusInfo(a.deals?.[0]?.start_time ?? a.start_time, a.deals?.[0]?.end_time ?? a.end_time);
    const bS = getStatusInfo(b.deals?.[0]?.start_time ?? b.start_time, b.deals?.[0]?.end_time ?? b.end_time);
    const aO = aS?.sortOrder ?? 99;
    const bO = bS?.sortOrder ?? 99;
    if (aO !== bO) return aO - bO;
    return (a.distance ?? 9999) - (b.distance ?? 9999);
  });
}

function groupVenues(sorted) {
  const groups = {
    live:     { label: "🟢 Live Deals Near You", venues: [] },
    ending:   { label: "🔴 Ending Soon", venues: [] },
    starting: { label: "🟡 Starting Soon", venues: [] },
    later:    { label: "🔵 Later Today", venues: [] },
    ended:    { label: "⚫ Ended Today", venues: [] },
    none:     { label: "📋 All Venues", venues: [] },
  };
  sorted.forEach((v) => {
    const s = getStatusInfo(v.deals?.[0]?.start_time ?? v.start_time, v.deals?.[0]?.end_time ?? v.end_time);
    const key = s?.group ?? "none";
    groups[key].venues.push(v);
  });
  return Object.values(groups).filter((g) => g.venues.length > 0);
}

// ─── Star Rating Component ────────────────────────────────────────────────────

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
        >★</span>
      ))}
    </span>
  );
}

function RatingBadge({ avgRating, reviewCount, size = "sm" }) {
  if (!avgRating && !reviewCount) return (
    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>No reviews yet</span>
  );
  if (!avgRating && reviewCount > 0) return (
    <span style={{ fontSize: size === "sm" ? "11px" : "13px", color: "var(--text-muted)" }}>
      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
    </span>
  );
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
      <StarRating rating={Math.round(avgRating)} size={size === "sm" ? 13 : 16} />
      <span style={{ fontSize: size === "sm" ? "12px" : "14px", fontWeight: "600", color: "#f5a623" }}>
        {avgRating?.toFixed(1)}
      </span>
      <span style={{ fontSize: size === "sm" ? "11px" : "13px", color: "var(--text-muted)" }}>
        ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
      </span>
    </span>
  );
}

// ─── Reviews Section ──────────────────────────────────────────────────────────

const QUICK_TAGS = [
  "Cheap drinks", "Great vibe", "Good music", "Crowded",
  "Friendly staff", "Slow service", "Good food", "Nice ambience",
  "Value for money", "Must visit"
];

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
      setReviews((prev) => append ? [...prev, ...data.reviews] : data.reviews);
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

  useEffect(() => { loadReviews(1); }, [venueId]);

  function toggleTag(tag) {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!formRating) { setFormError("Please select a star rating."); return; }
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
      setFormRating(0); setFormName(""); setFormText(""); setFormTags([]);
      loadReviews(1);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (e) {
      setFormError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "20px", borderTop: `1.5px solid var(--border)`, paddingTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <p style={{ fontWeight: "700", margin: 0, fontSize: "15px", color: "var(--text)" }}>⭐ Reviews</p>
          <div style={{ marginTop: "4px" }}>
            <RatingBadge avgRating={avgRating} reviewCount={reviewCount} size="md" />
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            background: "#0d6efd", color: "#fff", border: "none",
            borderRadius: "8px", padding: "6px 14px", fontSize: "13px",
            fontWeight: "600", cursor: "pointer",
          }}
        >
          {showForm ? "✕ Cancel" : "✍️ Write Review"}
        </button>
      </div>

      {submitSuccess && (
        <div style={{ background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: "8px", padding: "8px 12px", marginBottom: "12px", fontSize: "13px", color: "#065f46" }}>
          ✅ Review submitted! Thanks for your feedback.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: "var(--surface)", borderRadius: "10px", padding: "14px", marginBottom: "16px" }}>
          <p style={{ fontWeight: "600", marginBottom: "8px", fontSize: "14px", color: "var(--text)" }}>Your Rating *</p>
          <StarRating rating={formRating} size={28} interactive onRate={setFormRating} />

          <div style={{ marginTop: "12px" }}>
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              maxLength={100}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1.5px solid var(--border)`, fontSize: "13px", marginBottom: "8px", background: "var(--card-bg)", color: "var(--text)" }}
            />
            <textarea
              placeholder="Share your experience... (optional)"
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              maxLength={1000}
              rows={3}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: `1.5px solid var(--border)`, fontSize: "13px", resize: "vertical", background: "var(--card-bg)", color: "var(--text)" }}
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
                    padding: "3px 10px", borderRadius: "20px", fontSize: "11px",
                    cursor: "pointer", fontWeight: "500",
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
              marginTop: "12px", background: "#198754", color: "#fff",
              border: "none", borderRadius: "8px", padding: "8px 20px",
              fontSize: "13px", fontWeight: "600", cursor: submitting ? "not-allowed" : "pointer",
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
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No reviews yet. Be the first! 🎉</p>
      ) : (
        <div>
          {reviews.map((r) => (
            <div key={r.id} style={{
              background: "var(--card-bg)", border: `1.5px solid var(--border)`,
              borderRadius: "10px", padding: "12px", marginBottom: "10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)" }}>{r.reviewer_name || "Anonymous"}</span>
                  <div style={{ marginTop: "2px" }}>
                    <StarRating rating={r.rating} size={13} />
                  </div>
                </div>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {r.review_text && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "8px 0 6px" }}>{r.review_text}</p>
              )}
              {r.tags && r.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {r.tags.map((tag) => (
                    <span key={tag} style={{
                      background: "#e3f2fd", color: "#1565c0",
                      borderRadius: "20px", padding: "2px 8px", fontSize: "11px",
                    }}>{tag}</span>
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
                width: "100%", background: "var(--surface)", border: `1.5px solid var(--border)`,
                borderRadius: "8px", padding: "8px", fontSize: "13px",
                color: "var(--text)", cursor: "pointer", fontWeight: "500",
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

// ─── Venue Detail Modal ───────────────────────────────────────────────────────

function VenueModal({ venue, onClose }) {
  if (!venue) return null;
  const primaryDeal = venue.deals?.[0] ?? null;
  const rawStart = primaryDeal?.start_time ?? venue.start_time;
  const rawEnd = primaryDeal?.end_time ?? venue.end_time;
  const status = getStatusInfo(rawStart, rawEnd);
  const displayImage = venue.primary_image
    ? (venue.primary_image.startsWith("http") ? venue.primary_image : `/${venue.primary_image}`)
    : "/images/default-bar.jpg";

  const mapsUrl = venue.latitude && venue.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${venue.latitude},${venue.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue.name + " " + (venue.address || ""))}`;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}
    >
      <div
        style={{ background: "var(--modal-bg)", borderRadius: "18px", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ position: "relative", height: "220px", overflow: "hidden", borderRadius: "18px 18px 0 0" }}>
          <img
            src={displayImage}
            style={{ width: "100%", height: "220px", objectFit: "cover" }}
            alt={`Happy hour deals at ${venue.name}${venue.area ? ` in ${venue.area}` : ""}`}
            onError={(e) => { e.target.src = "https://via.placeholder.com/520x220?text=No+Photo"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }} />
          {status && (
            <div style={{ position: "absolute", top: "12px", left: "12px", background: status.color, color: "#fff", borderRadius: "20px", padding: "5px 14px", fontSize: "13px", fontWeight: "700", zIndex: 2 }}>
              {status.label}
            </div>
          )}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: "32px", height: "32px", fontSize: "16px", cursor: "pointer", zIndex: 2 }}
          >✕</button>
        </div>

        <div style={{ padding: "20px" }}>
          <h4 style={{ fontWeight: "800", marginBottom: "4px", color: "var(--text)" }}>{venue.name}</h4>
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "6px" }}>{venue.address}</p>

          <div style={{ marginBottom: "12px" }}>
            <RatingBadge avgRating={venue.avg_rating} reviewCount={venue.review_count} size="md" />
          </div>

          <div className="d-flex gap-2 flex-wrap mb-3">
            {venue.area && <span className="badge" style={{ background: "#e3f2fd", color: "#1565c0" }}>📍 {venue.area}</span>}
            {venue.price_range && <span className="badge" style={{ background: "#f3e5f5", color: "#6a1b9a" }}>💰 {venue.price_range}</span>}
            {venue.category && <span className="badge" style={{ background: "#e8f5e9", color: "#2e7d32" }}>🏷️ {venue.category}</span>}
            {venue.distance != null && (
              <span className="badge" style={{ background: "#e3f2fd", color: "#0d6efd" }}>
                📍 {parseFloat(venue.distance).toFixed(1)} km away
              </span>
            )}
          </div>

          {venue.deals && venue.deals.length > 0 && (
            <div className="mb-3">
              <p style={{ fontWeight: "700", marginBottom: "8px", color: "var(--text)" }}>🍹 Happy Hour Deals</p>
              {venue.deals.map((d, i) => (
                <div key={d.id ?? i} style={{ background: "#f0fff4", border: "1.5px solid #198754", borderRadius: "8px", padding: "8px 12px", marginBottom: "6px" }}>
                  <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: "#198754" }}>🎉 {d.deal_description || "Special Deal"}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>
                    ⏰ {secondsToHHMM(d.start_time) || "--"} – {secondsToHHMM(d.end_time) || "--"}
                    {d.day_of_week ? ` • ${d.day_of_week}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {venue.phone && <p style={{ fontSize: "14px", marginBottom: "8px", color: "var(--text)" }}>📞 <a href={`tel:${venue.phone}`}>{venue.phone}</a></p>}
          {venue.website && <p style={{ fontSize: "14px", marginBottom: "12px", color: "var(--text)" }}>🌐 <a href={venue.website} target="_blank" rel="noreferrer">{venue.website}</a></p>}

          <div className="d-flex gap-2 mt-2">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-sm"
              style={{ background: "#0d6efd", color: "#fff", borderRadius: "8px", fontWeight: "600", flex: 1, textAlign: "center" }}>
              🗺️ Get Directions
            </a>
            {venue.phone && (
              <a href={`tel:${venue.phone}`} className="btn btn-sm"
                style={{ background: "#198754", color: "#fff", borderRadius: "8px", fontWeight: "600", flex: 1, textAlign: "center" }}>
                📞 Call Now
              </a>
            )}
          </div>

          <ReviewsSection venueId={venue.id} />
        </div>
      </div>
    </div>
  );
}

// ─── Venue Card ───────────────────────────────────────────────────────────────

function VenueCard({ v, uploadingVenueId, uploadSuccess, onUpload, onViewDetails }) {
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
    ? (v.primary_image.startsWith("http") ? v.primary_image : `/${v.primary_image}`)
    : "/images/default-bar.jpg";

  return (
    <div className="col-md-4 mb-4">
      <div
        className="card h-100 border-0"
        style={{ borderRadius: "14px", overflow: "hidden", background: "var(--card-bg)", boxShadow: "0 4px 16px rgba(0,0,0,0.10)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-5px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.18)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)"; }}
        onClick={() => onViewDetails(v)}
      >
        <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
          <img
            src={displayImage}
            style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }}
            alt={`Happy hour deals at ${v.name}${v.area ? ` in ${v.area}` : ""}`}
            onError={(e) => { e.target.src = "https://via.placeholder.com/400x200?text=No+Photo"; }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)", pointerEvents: "none" }} />
          {status && (
            <div style={{ position: "absolute", top: "10px", left: "10px", background: status.color, color: "#fff", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", fontWeight: "700", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", zIndex: 10 }}>
              {status.label}
            </div>
          )}
          <label
            htmlFor={`upload-${v.id}`}
            style={{ position: "absolute", bottom: "10px", right: "10px", background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: "500", cursor: uploadingVenueId === v.id ? "not-allowed" : "pointer", userSelect: "none", zIndex: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {uploadingVenueId === v.id ? "Uploading..." : uploadSuccess[v.id] ? "✅ Uploaded!" : "📸 Add Photo"}
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
              const file = e.target.files[0];
              if (!file) return;
              e.target.value = "";
              onUpload(v.id, file);
            }}
          />
        </div>

        <div className="card-body" style={{ padding: "16px", minHeight: "180px", background: "var(--card-bg)" }}>
          <h5 style={{ fontWeight: "700", fontSize: "16px", marginBottom: "2px", color: "var(--text)" }}>{v.name}</h5>
          <p style={{ fontSize: "13px", marginBottom: "6px", color: "var(--text-muted)" }}>{v.address || "No address available"}</p>

          <div style={{ marginBottom: "8px" }}>
            <RatingBadge avgRating={v.avg_rating} reviewCount={v.review_count} size="sm" />
          </div>

          <div className="d-flex gap-2 mb-2 flex-wrap">
            {v.area && <span className="badge" style={{ background: "#e3f2fd", color: "#1565c0", fontSize: "11px" }}>📍 {v.area}</span>}
            {v.price_range && <span className="badge" style={{ background: "#f3e5f5", color: "#6a1b9a", fontSize: "11px" }}>💰 {v.price_range}</span>}
            {v.category && <span className="badge" style={{ background: "#e8f5e9", color: "#2e7d32", fontSize: "11px" }}>🏷️ {v.category}</span>}
          </div>

          {v.distance != null && (
            <p style={{ fontSize: "13px", color: "#0d6efd", fontWeight: "600", marginBottom: "6px" }}>
              📍 {parseFloat(v.distance).toFixed(1)} km away
            </p>
          )}

          <div className="d-flex gap-3 mb-3" style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            <span>⏰ {openStr || "--"} – {closeStr || "--"}</span>
            <span>🍹 {startStr || "--"} – {endStr || "--"}</span>
          </div>

          {dealText ? (
            <div style={{ background: status?.bg || "#f0fff4", border: `1.5px solid ${status?.color || "#198754"}`, borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600", color: status?.color || "#198754", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                🎉 {dealText}
              </p>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: `1.5px solid var(--border)`, borderRadius: "8px", padding: "8px 12px", marginBottom: "10px" }}>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>❌ No active deals right now</p>
            </div>
          )}

          <div className="d-flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn btn-sm"
              style={{ background: "#fff3cd", color: "#856404", border: "1.5px solid #ffc107", borderRadius: "8px", fontWeight: "600", fontSize: "12px", flex: 1 }}
              onClick={(e) => { e.stopPropagation(); onViewDetails(v); }}
            >
              👁️ View Details
            </button>
            <a
              href={v.latitude && v.longitude ? `https://www.google.com/maps/dir/?api=1&destination=${v.latitude},${v.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.name + " " + (v.address || ""))}`}
              target="_blank" rel="noreferrer" className="btn btn-sm"
              style={{ background: "#e3f2fd", color: "#1565c0", border: "1.5px solid #90caf9", borderRadius: "8px", fontWeight: "600", fontSize: "12px", flex: 1, textAlign: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              🗺️ Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home({ initialVenues = [] }) {
  const { dark, toggleTheme } = useContext(ThemeContext);

  const [venues, setVenues] = useState(initialVenues);
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [loading, setLoading] = useState(initialVenues.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState(null);
  const [uploadingVenueId, setUploadingVenueId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [tick, setTick] = useState(0);

  const [filterOptions, setFilterOptions] = useState({ categories: [], areas: [], price_ranges: [] });
  const [activeCategory, setActiveCategory] = useState("");
  const [activeArea, setActiveArea] = useState("");
  const [activePriceRange, setActivePriceRange] = useState("");
  const [activeDistance, setActiveDistance] = useState(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(initialVenues.length);

  const sentinelRef = useRef(null);
  const coordsRef = useRef(null);

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
        setFilterOptions(data);
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

  async function fetchVenues({ cityId, lat, lng, category, area, priceRange, pageNum = 1, append = false }) {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setErr(null);
    try {
      const qs = buildQuery({ cityId, lat, lng, category, area, priceRange, pageNum });
      const res = await fetch(`/api/venues?${qs}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      let newVenues = [], newTotal = 0, newHasMore = false;
      if (Array.isArray(data)) {
        newVenues = data[0]?.deals !== undefined ? data : normalizeJoinRows(data);
        newTotal = newVenues.length;
      } else {
        const raw = data.venues ?? [];
        newVenues = raw[0]?.deals !== undefined ? raw : normalizeJoinRows(raw);
        newTotal = data.total ?? newVenues.length;
        newHasMore = data.has_more ?? false;
      }
      const merged = append ? [...venues, ...newVenues] : newVenues;
      setVenues(merged);
      setTotal(newTotal);
      setHasMore(newHasMore);
      setPage(pageNum);
      setFilterOptions((prev) => {
        const hasData = prev.categories.length > 0 || prev.areas.length > 0 || prev.price_ranges.length > 0;
        if (hasData) return prev;
        return deriveFilterOptions(merged);
      });
    } catch (e) {
      setErr(e.message || "Error loading venues");
      if (!append) setVenues([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    async function init() {
      let loadedCities = [];
      try {
        const res = await fetch("/api/cities");
        if (res.ok) {
          const data = await res.json();
          loadedCities = Array.isArray(data) ? data : [];
          setCities(loadedCities);
        }
      } catch (e) { console.error("Could not load cities:", e); }

      if (!navigator.geolocation) {
        setErr("Geolocation not supported. Please select a city.");
        if (loadedCities.length > 0) {
          const cid = String(loadedCities[0].id);
          setSelectedCityId(cid);
          fetchFilters(cid);
          fetchVenues({ cityId: cid, pageNum: 1 });
        } else setLoading(false);
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
          } else setLoading(false);
        },
        { timeout: 15000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const c = coordsRef.current;
          fetchVenues({
            cityId: selectedCityId || undefined,
            lat: c?.latitude, lng: c?.longitude,
            category: activeCategory || undefined,
            area: activeArea || undefined,
            priceRange: activePriceRange || undefined,
            pageNum: page + 1, append: true,
          });
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, selectedCityId, activeCategory, activeArea, activePriceRange]);

  function onCityChange(e) {
    const cid = e.target.value || "";
    setSelectedCityId(cid);
    setActiveCategory(""); setActiveArea(""); setActivePriceRange("");
    setActiveDistance(null); setActiveStatusFilter("");
    setFilterOptions({ categories: [], areas: [], price_ranges: [] });
    if (!cid) {
      const c = coordsRef.current;
      if (c) fetchVenues({ lat: c.latitude, lng: c.longitude, pageNum: 1 });
      else setVenues([]);
      return;
    }
    fetchFilters(cid);
    fetchVenues({ cityId: cid, pageNum: 1 });
  }

  function onFilterChange(type, value) {
    const newCat = type === "category" ? value : activeCategory;
    const newArea = type === "area" ? value : activeArea;
    const newPrice = type === "price" ? value : activePriceRange;
    if (type === "category") setActiveCategory(value);
    if (type === "area") setActiveArea(value);
    if (type === "price") setActivePriceRange(value);
    const c = coordsRef.current;
    fetchVenues({
      cityId: selectedCityId || undefined,
      lat: c?.latitude, lng: c?.longitude,
      category: newCat || undefined,
      area: newArea || undefined,
      priceRange: newPrice || undefined,
      pageNum: 1,
    });
  }

  async function handleImageUpload(venueId, file) {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { alert("Only JPEG, PNG, or WEBP images allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File too large. Max 5MB."); return; }
    setUploadingVenueId(venueId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/venues/${venueId}/upload-image`, { method: "POST", body: formData });
      if (!res.ok) { const e = await res.json(); throw new Error(e.detail || `HTTP ${res.status}`); }
      const data = await res.json();
      setVenues((prev) => prev.map((v) => v.id === venueId ? { ...v, primary_image: data.image_url } : v));
      setUploadSuccess((prev) => ({ ...prev, [venueId]: true }));
      setTimeout(() => setUploadSuccess((prev) => ({ ...prev, [venueId]: false })), 3000);
    } catch (e) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploadingVenueId(null);
    }
  }

  if (loading) return (
    <div className="container mt-5 text-center" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <div className="spinner-border text-warning" role="status" />
      <p className="mt-2" style={{ color: "var(--text-muted)" }}>Finding happy hours near you...</p>
    </div>
  );

  const clientFiltered = venues.filter((v) => {
    if (activeDistance !== null && (v.distance == null || parseFloat(v.distance) > activeDistance)) return false;
    if (activeStatusFilter) {
      const s = getStatusInfo(v.deals?.[0]?.start_time ?? v.start_time, v.deals?.[0]?.end_time ?? v.end_time);
      if ((s?.group ?? "none") !== activeStatusFilter) return false;
    }
    return true;
  });
  const sortedVenues = sortVenues(clientFiltered);
  const groups = groupVenues(sortedVenues);
  const liveCount = sortedVenues.filter((v) => {
    const s = getStatusInfo(v.deals?.[0]?.start_time ?? v.start_time, v.deals?.[0]?.end_time ?? v.end_time);
    return s?.group === "live" || s?.group === "ending";
  }).length;

  // ── JSON-LD Structured Data ──
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Love Happy Hours",
    "url": "https://alpha.lovehappyhours.com",
    "description": "Find live happy hour deals near you — bars, restaurants, and drink specials updated in real time.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://alpha.lovehappyhours.com/?city={city}",
      "query-input": "required name=city"
    }
  };

  return (
    <>
      <Head>
        <title>Happy Hours Near You | Live Drink Deals & Bar Offers</title>
        <meta name="description" content="Find live happy hour deals near you. Real-time drink specials, bar offers, and restaurant deals updated every minute. Discover the best happy hours in your city." />
        <meta name="keywords" content="happy hours near me, happy hour deals, bar deals, drink specials, live happy hours, cheap drinks" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://alpha.lovehappyhours.com/" />

        {/* Open Graph */}
        <meta property="og:title" content="Happy Hours Near You | Live Drink Deals & Bar Offers" />
        <meta property="og:description" content="Find live happy hour deals near you — bars, restaurants, and drink specials updated in real time." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://alpha.lovehappyhours.com/" />
        <meta property="og:site_name" content="Love Happy Hours" />
        <meta property="og:image" content="https://alpha.lovehappyhours.com/images/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Happy Hours Near You | Live Drink Deals" />
        <meta name="twitter:description" content="Find live happy hour deals near you — updated in real time." />
        <meta name="twitter:image" content="https://alpha.lovehappyhours.com/images/og-image.jpg" />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <div className="container mt-4" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h1 style={{ fontWeight: "800", marginBottom: "2px", color: "var(--text)", fontSize: "26px" }}>🍻 Happy Hours</h1>
            {total > 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: "14px", margin: 0 }}>
                🔥 {total} Happy Hour Deal{total !== 1 ? "s" : ""} Near You
                {liveCount > 0 && <span style={{ color: "#198754", fontWeight: "700" }}> • {liveCount} Live Now</span>}
              </p>
            )}
          </div>

          <button
            onClick={toggleTheme}
            style={{
              background: dark ? "#f0f0f0" : "#1a1a2e",
              color: dark ? "#1a1a2e" : "#f0f0f0",
              border: "none", borderRadius: "50px", padding: "8px 18px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              transition: "all 0.3s", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <div className="mb-3">
          <select className="form-select" value={selectedCityId} onChange={onCityChange}
            style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }}>
            <option value="">📍 Auto-detect nearest city</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {err && <div style={{ color: "var(--text-muted)" }} className="small mt-1">⚠️ {err}</div>}
        </div>

        <div className="row g-2 mb-3">
          {filterOptions.categories.length > 0 && (
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={activeCategory} onChange={(e) => onFilterChange("category", e.target.value)}
                style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }}>
                <option value="">🏷️ All Categories</option>
                {filterOptions.categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {filterOptions.price_ranges.length > 0 && (
            <div className="col-md-4">
              <select className="form-select form-select-sm" value={activePriceRange} onChange={(e) => onFilterChange("price", e.target.value)}
                style={{ background: "var(--surface)", color: "var(--text)", borderColor: "var(--border)" }}>
                <option value="">💰 All Prices</option>
                {filterOptions.price_ranges.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Distance Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>📍 Distance:</span>
          {[null, 2, 5, 10, 20].map((km) => (
            <button
              key={km ?? "all"}
              onClick={() => setActiveDistance(km)}
              style={{
                padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                cursor: "pointer", border: "1.5px solid",
                background: activeDistance === km ? "#0d6efd" : "var(--surface)",
                color: activeDistance === km ? "#fff" : "var(--text)",
                borderColor: activeDistance === km ? "#0d6efd" : "var(--border)",
                transition: "all 0.15s",
              }}
            >
              {km === null ? "All" : `< ${km} km`}
            </button>
          ))}
        </div>

        {/* Area Filter Pills */}
        {filterOptions.areas.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>🏙️ Area:</span>
            <button
              onClick={() => onFilterChange("area", "")}
              style={{
                padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                cursor: "pointer", border: "1.5px solid",
                background: activeArea === "" ? "#6a1b9a" : "var(--surface)",
                color: activeArea === "" ? "#fff" : "var(--text)",
                borderColor: activeArea === "" ? "#6a1b9a" : "var(--border)",
                transition: "all 0.15s",
              }}
            >All</button>
            {filterOptions.areas.map((area) => (
              <button
                key={area}
                onClick={() => onFilterChange("area", area)}
                style={{
                  padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                  cursor: "pointer", border: "1.5px solid",
                  background: activeArea === area ? "#6a1b9a" : "var(--surface)",
                  color: activeArea === area ? "#fff" : "var(--text)",
                  borderColor: activeArea === area ? "#6a1b9a" : "var(--border)",
                  transition: "all 0.15s",
                }}
              >
                📍 {area}
              </button>
            ))}
          </div>
        )}

        {/* Status Filter Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>⏱ Status:</span>
          {[
            { key: "", label: "All" },
            { key: "live", label: "🟢 Live Now" },
            { key: "ending", label: "🔴 Ending Soon" },
            { key: "starting", label: "🟡 Starting Soon" },
            { key: "later", label: "🔵 Later Today" },
            { key: "ended", label: "⚫ Ended" },
          ].map(({ key, label }) => (
            <button
              key={key || "all-status"}
              onClick={() => setActiveStatusFilter(key)}
              style={{
                padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                cursor: "pointer", border: "1.5px solid",
                background: activeStatusFilter === key ? "#198754" : "var(--surface)",
                color: activeStatusFilter === key ? "#fff" : "var(--text)",
                borderColor: activeStatusFilter === key ? "#198754" : "var(--border)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {sortedVenues.length === 0 && !loading ? (
          <div className="text-center py-5">
            <p style={{ fontSize: "40px" }}>🍺</p>
            <p style={{ color: "var(--text-muted)" }}>No venues found. Try adjusting your filters or selecting a city.</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", paddingBottom: "8px", borderBottom: `2px solid var(--surface2)` }}>
                <h2 style={{ margin: 0, fontWeight: "700", fontSize: "17px", color: "var(--text)" }}>{group.label}</h2>
                <span style={{ background: "var(--surface2)", color: "var(--text-muted)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: "600" }}>
                  {group.venues.length}
                </span>
              </div>
              <div className="row">
                {group.venues.map((v, index) => (
                  <VenueCard
                    key={v.id || index}
                    v={v}
                    uploadingVenueId={uploadingVenueId}
                    uploadSuccess={uploadSuccess}
                    onUpload={handleImageUpload}
                    onViewDetails={setSelectedVenue}
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
              <span style={{ color: "var(--text-muted)" }} className="small">Loading more venues...</span>
            </div>
          )}
          {!hasMore && sortedVenues.length > 0 && (
            <p style={{ color: "var(--text-muted)" }} className="small">🍺 You've seen all {total} venues!</p>
          )}
        </div>

        {selectedVenue && (
          <VenueModal venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
        )}
      </div>
    </>
  );
}

// ─── SSR: Pre-render initial venues for SEO ───────────────────────────────────
export async function getServerSideProps() {
  try {
    const apiBase = process.env.API_BASE_URL || "http://localhost:8000";
    const res = await fetch(`${apiBase}/api/venues?page=1&page_size=20`);
    if (!res.ok) return { props: { initialVenues: [] } };
    const data = await res.json();
    const raw = Array.isArray(data) ? data : (data.venues ?? []);
    const initialVenues = raw[0]?.deals !== undefined ? raw : raw.map((r) => ({ ...r, deals: [] }));
    return { props: { initialVenues } };
  } catch {
    return { props: { initialVenues: [] } };
  }
}