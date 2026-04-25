from fastapi import FastAPI, Query, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pymysql
import os
import uuid
from dotenv import load_dotenv
from decimal import Decimal
import json
import traceback

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/var/www/flexhappyhours/frontend/public/images/venues"
PAGE_SIZE = 12

REVIEW_TAGS = [
    "Cheap drinks", "Great vibe", "Good music", "Crowded",
    "Friendly staff", "Slow service", "Good food", "Nice ambience",
    "Value for money", "Must visit"
]


def get_connection():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def decimal_to_float(val):
    if isinstance(val, Decimal):
        return float(val)
    return val


def ensure_bookmarks_table():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS venue_bookmarks (
                id VARCHAR(36) PRIMARY KEY,
                client_id VARCHAR(120) NOT NULL,
                venue_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_client_venue (client_id, venue_id),
                KEY idx_bookmark_client (client_id),
                KEY idx_bookmark_venue (venue_id)
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


@app.on_event("startup")
def startup_event():
    try:
        ensure_bookmarks_table()
    except Exception as e:
        print(f"[WARN] Could not ensure venue_bookmarks table exists: {e}")
        traceback.print_exc()


def fetch_bookmarked_ids(cur, client_id: Optional[str], venue_ids: List[str]):
    if not client_id or not venue_ids:
        return set()

    placeholders = ",".join(["%s"] * len(venue_ids))
    cur.execute(
        f"""
        SELECT venue_id
        FROM venue_bookmarks
        WHERE client_id = %s AND venue_id IN ({placeholders})
        """,
        tuple([client_id] + venue_ids),
    )
    return {str(row["venue_id"]) for row in cur.fetchall()}


def attach_deals(cur, venue_rows, client_id: Optional[str] = None):
    if not venue_rows:
        return venue_rows

    venue_ids = [str(v["id"]) for v in venue_rows]
    placeholders = ",".join(["%s"] * len(venue_ids))

    cur.execute(
        f"""
        SELECT * FROM happy_hours_deals
        WHERE venue_id IN ({placeholders}) AND is_active = 1
        ORDER BY venue_id, priority ASC
        """,
        tuple(venue_ids),
    )
    deals_by_vid = {}
    for d in cur.fetchall():
        vid = str(d.get("venue_id"))
        deals_by_vid.setdefault(vid, []).append(d)

    ratings_by_vid = {}
    try:
        cur.execute(
            f"""
            SELECT venue_id,
                   ROUND(AVG(rating), 1) AS avg_rating,
                   COUNT(*) AS review_count
            FROM venue_reviews
            WHERE venue_id IN ({placeholders})
            GROUP BY venue_id
            """,
            tuple(venue_ids),
        )
        for r in cur.fetchall():
            ratings_by_vid[str(r["venue_id"])] = {
                "avg_rating": float(r["avg_rating"]) if r["avg_rating"] is not None else None,
                "review_count": r["review_count"],
            }
    except Exception as e:
        print(f"[WARN] Could not fetch ratings (table missing?): {e}")

    bookmarked_ids = fetch_bookmarked_ids(cur, client_id, venue_ids)

    result = []
    for v in venue_rows:
        vid = str(v.get("id"))
        obj = dict(v)
        if "distance" in obj and obj["distance"] is not None:
            obj["distance"] = decimal_to_float(obj["distance"])
        venue_deals = deals_by_vid.get(vid, [])
        obj["deals"] = venue_deals
        primary = venue_deals[0] if venue_deals else None
        obj["start_time"] = primary.get("start_time") if primary else None
        obj["end_time"] = primary.get("end_time") if primary else None
        obj["deal_description"] = primary.get("deal_description") if primary else None
        rating_info = ratings_by_vid.get(vid, {})
        obj["avg_rating"] = rating_info.get("avg_rating", None)
        obj["review_count"] = rating_info.get("review_count", 0)
        obj["bookmarked"] = vid in bookmarked_ids
        result.append(obj)
    return result


class ReviewCreate(BaseModel):
    reviewer_name: str = Field(default="Anonymous", max_length=100)
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = Field(default=None, max_length=1000)
    tags: Optional[List[str]] = []


class BookmarkToggleRequest(BaseModel):
    client_id: str = Field(..., min_length=3, max_length=120)
    venue_id: str = Field(..., min_length=1, max_length=36)


def verify_active_venue(cur, venue_id: str):
    cur.execute(
        """
        SELECT id
        FROM venues
        WHERE id = %s AND is_active = 1
        """,
        (venue_id,),
    )
    if not cur.fetchone():
        raise HTTPException(status_code=404, detail=f"Venue '{venue_id}' not found.")


@app.get("/cities")
def get_cities():
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT id, name FROM cities WHERE is_active = 1 ORDER BY name")
        return cur.fetchall()
    except Exception:
        return []
    finally:
        conn.close()


@app.get("/filters")
def get_filters(city_id: Optional[str] = Query(None)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        where = "WHERE v.is_active = 1"
        params = []
        if city_id:
            where += " AND v.city_id = %s"
            params.append(city_id)

        categories = []
        try:
            cur.execute(
                f"""
                SELECT DISTINCT vc.name
                FROM venues v
                JOIN venue_categories vc ON v.category_id = vc.id
                {where} AND vc.name IS NOT NULL AND vc.name != ''
                ORDER BY vc.name
                """,
                params,
            )
            categories = [r["name"] for r in cur.fetchall()]
        except Exception as e:
            print(f"[WARN] /filters categories query failed: {e}")
            traceback.print_exc()

        areas = []
        try:
            cur.execute(
                f"""
                SELECT DISTINCT a.name
                FROM venues v
                JOIN areas a ON v.area_id = a.id
                {where} AND a.name IS NOT NULL AND a.name != ''
                ORDER BY a.name
                """,
                params,
            )
            areas = [r["name"] for r in cur.fetchall()]
        except Exception as e:
            print(f"[WARN] /filters areas query failed: {e}")
            traceback.print_exc()

        price_ranges = []
        try:
            cur.execute(
                f"""
                SELECT DISTINCT price_range
                FROM venues v
                {where} AND price_range IS NOT NULL AND price_range != ''
                ORDER BY price_range
                """,
                params,
            )
            price_ranges = [r["price_range"] for r in cur.fetchall()]
        except Exception as e:
            print(f"[WARN] /filters price_ranges query failed: {e}")
            traceback.print_exc()

        return {"categories": categories, "areas": areas, "price_ranges": price_ranges}
    except Exception as e:
        print(f"[ERROR] /filters endpoint crashed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/venues/{venue_id}")
def get_venue_detail(venue_id: str, client_id: Optional[str] = Query(None)):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute("SELECT * FROM venues WHERE id = %s AND is_active = 1", (venue_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Venue not found.")
        result = attach_deals(cur, [row], client_id=client_id)
        return result[0]
    finally:
        conn.close()


@app.get("/venues/{venue_id}/deals")
def get_venue_deals(venue_id: str):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT * FROM happy_hours_deals WHERE venue_id = %s AND is_active = 1 ORDER BY priority ASC",
            (venue_id,),
        )
        return cur.fetchall()
    finally:
        conn.close()


@app.get("/venues/{venue_id}/reviews")
def get_reviews(
    venue_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=20),
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "SELECT COUNT(*) AS total FROM venue_reviews WHERE venue_id = %s",
            (venue_id,),
        )
        total = cur.fetchone()["total"]

        cur.execute(
            """
            SELECT id, reviewer_name, rating, review_text, tags, created_at
            FROM venue_reviews
            WHERE venue_id = %s
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
            """,
            (venue_id, page_size, (page - 1) * page_size),
        )
        reviews = cur.fetchall()
        for r in reviews:
            if r["tags"] and isinstance(r["tags"], str):
                try:
                    r["tags"] = json.loads(r["tags"])
                except Exception:
                    r["tags"] = []
            elif r["tags"] is None:
                r["tags"] = []
            r["created_at"] = str(r["created_at"])

        cur.execute(
            """
            SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
            FROM venue_reviews
            WHERE venue_id = %s
            """,
            (venue_id,),
        )
        stats = cur.fetchone()

        return {
            "reviews": reviews,
            "total": total,
            "avg_rating": float(stats["avg_rating"]) if stats["avg_rating"] is not None else None,
            "review_count": stats["review_count"],
            "has_more": (page * page_size) < total,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] GET reviews for venue {venue_id}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/venues/{venue_id}/reviews")
def add_review(venue_id: str, body: ReviewCreate):
    conn = get_connection()
    cur = conn.cursor()
    try:
        verify_active_venue(cur, venue_id)

        tags_json = json.dumps(body.tags or [])
        reviewer = (body.reviewer_name or "Anonymous").strip() or "Anonymous"
        review_text = body.review_text.strip() if body.review_text else None

        cur.execute(
            """
            INSERT INTO venue_reviews (id, venue_id, reviewer_name, rating, review_text, tags)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), str(venue_id), reviewer, body.rating, review_text, tags_json),
        )
        conn.commit()

        cur.execute(
            """
            SELECT ROUND(AVG(rating), 1) AS avg_rating, COUNT(*) AS review_count
            FROM venue_reviews
            WHERE venue_id = %s
            """,
            (venue_id,),
        )
        stats = cur.fetchone()

        return {
            "success": True,
            "avg_rating": float(stats["avg_rating"]) if stats["avg_rating"] is not None else None,
            "review_count": stats["review_count"],
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] POST review for venue {venue_id}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/review-tags")
def get_review_tags():
    return {"tags": REVIEW_TAGS}


@app.post("/bookmarks/toggle")
def toggle_bookmark(body: BookmarkToggleRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        verify_active_venue(cur, body.venue_id)

        cur.execute(
            """
            SELECT id
            FROM venue_bookmarks
            WHERE client_id = %s AND venue_id = %s
            """,
            (body.client_id, body.venue_id),
        )
        existing = cur.fetchone()

        if existing:
            cur.execute("DELETE FROM venue_bookmarks WHERE id = %s", (existing["id"],))
            conn.commit()
            return {
                "success": True,
                "bookmarked": False,
                "venue_id": body.venue_id,
                "message": "Bookmark removed",
            }

        cur.execute(
            """
            INSERT INTO venue_bookmarks (id, client_id, venue_id)
            VALUES (%s, %s, %s)
            """,
            (str(uuid.uuid4()), body.client_id, body.venue_id),
        )
        conn.commit()
        return {
            "success": True,
            "bookmarked": True,
            "venue_id": body.venue_id,
            "message": "Bookmark added",
        }
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        print(f"[ERROR] toggle bookmark failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.get("/bookmarks")
def get_bookmarks(
    client_id: str = Query(..., min_length=3, max_length=120),
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=50),
):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT COUNT(*) AS total
            FROM venue_bookmarks vb
            JOIN venues v ON vb.venue_id = v.id
            WHERE vb.client_id = %s AND v.is_active = 1
            """,
            (client_id,),
        )
        total = cur.fetchone()["total"]

        offset = (page - 1) * page_size
        cur.execute(
            """
            SELECT v.*, vc.name AS category, a.name AS area
            FROM venue_bookmarks vb
            JOIN venues v ON vb.venue_id = v.id
            LEFT JOIN venue_categories vc ON v.category_id = vc.id
            LEFT JOIN areas a ON v.area_id = a.id
            WHERE vb.client_id = %s AND v.is_active = 1
            ORDER BY vb.created_at DESC
            LIMIT %s OFFSET %s
            """,
            (client_id, page_size, offset),
        )
        rows = cur.fetchall()
        result = attach_deals(cur, rows, client_id=client_id)
        return {
            "venues": result,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    except Exception as e:
        print(f"[ERROR] get bookmarks failed: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/venues/{venue_id}/upload-image")
async def upload_venue_image(venue_id: str, file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5MB.")

    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"venue_{venue_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(contents)

    db_image_path = f"images/venues/{filename}"

    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE venues SET primary_image = %s WHERE id = %s",
            (db_image_path, venue_id),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found.")
        return {"success": True, "venue_id": venue_id, "image_url": db_image_path}
    finally:
        conn.close()


@app.get("/venues")
def get_venues(
    lat: float = Query(None),
    lng: float = Query(None),
    city_id: str = Query(None),
    category: str = Query(None),
    area: str = Query(None),
    price_range: str = Query(None),
    client_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(PAGE_SIZE, ge=1, le=50),
):
    conn = get_connection()
    cur = conn.cursor()

    try:
        resolved_city_id = city_id

        if not resolved_city_id:
            if lat is None or lng is None:
                raise HTTPException(status_code=400, detail="Provide lat & lng or city_id.")
            cur.execute(
                """
                SELECT v.city_id,
                (6371 * acos(
                    cos(radians(%s)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(%s)) +
                    sin(radians(%s)) * sin(radians(v.latitude))
                )) AS distance
                FROM venues v
                WHERE v.is_active = 1 AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL
                ORDER BY distance ASC LIMIT 1
                """,
                (lat, lng, lat),
            )
            nearest = cur.fetchone()
            if not nearest or not nearest.get("city_id"):
                return {"venues": [], "total": 0, "page": page, "page_size": page_size, "has_more": False}
            resolved_city_id = nearest["city_id"]

        conditions = ["v.is_active = 1", "v.city_id = %s"]
        params = [resolved_city_id]

        if category:
            conditions.append("vc.name = %s")
            params.append(category)

        if area:
            conditions.append("a.name = %s")
            params.append(area)

        if price_range:
            conditions.append("v.price_range = %s")
            params.append(price_range)

        where_clause = " AND ".join(conditions)
        base_query = """
            FROM venues v
            LEFT JOIN venue_categories vc ON v.category_id = vc.id
            LEFT JOIN areas a ON v.area_id = a.id
        """

        cur.execute(f"SELECT COUNT(*) AS total {base_query} WHERE {where_clause}", params)
        total = cur.fetchone()["total"]

        offset = (page - 1) * page_size

        if lat is not None and lng is not None:
            distance_expr = """
            (6371 * acos(
                cos(radians(%s)) * cos(radians(v.latitude)) * cos(radians(v.longitude) - radians(%s)) +
                sin(radians(%s)) * sin(radians(v.latitude))
            )) AS distance
            """
            cur.execute(
                f"""
                SELECT v.*, vc.name AS category, a.name AS area, {distance_expr}
                {base_query}
                WHERE {where_clause}
                ORDER BY distance ASC
                LIMIT %s OFFSET %s
                """,
                [lat, lng, lat] + params + [page_size, offset],
            )
        else:
            cur.execute(
                f"""
                SELECT v.*, vc.name AS category, a.name AS area
                {base_query}
                WHERE {where_clause}
                ORDER BY v.created_at DESC
                LIMIT %s OFFSET %s
                """,
                params + [page_size, offset],
            )

        venues_rows = cur.fetchall()
        if not venues_rows:
            return {"venues": [], "total": total, "page": page, "page_size": page_size, "has_more": False}

        result = attach_deals(cur, venues_rows, client_id=client_id)

        return {
            "venues": result,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_more": (page * page_size) < total,
        }
    finally:
        conn.close()
        