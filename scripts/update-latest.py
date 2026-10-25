#!/usr/bin/env python3
"""Write data/latest.json from the newest public TikTok video.

Fails soft: any lookup problem leaves the existing file in place and exits 0.
Instagram is not queried. Its public profile extract currently requires a login.
"""

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SITE_PATH = ROOT / "data" / "site-data.json"
LATEST_PATH = ROOT / "data" / "latest.json"
NOTE = (
    "Written by scripts/update-latest.py from the public TikTok profile. "
    "The homepage plays this video. A failed lookup leaves this file unchanged. "
    "Do not invent a URL."
)


def keep(message):
    print(message, file=sys.stderr)
    return 0


def tiktok_profile(site):
    for link in site.get("socialLinks") or []:
        if not link or link.get("id") != "tiktok":
            continue
        raw = str(link.get("url") or "").strip()
        parsed = urlparse(raw if "://" in raw else "https://" + raw)
        host = (parsed.hostname or "").lower()
        if host != "tiktok.com" and not host.endswith(".tiktok.com"):
            continue
        parts = [part for part in parsed.path.split("/") if part]
        if not parts or not parts[0].startswith("@"):
            continue
        handle = parts[0][1:]
        if not re.fullmatch(r"[A-Za-z0-9._]+", handle):
            continue
        return handle, "https://www.tiktok.com/@" + handle
    return None, None


def load_json(path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def newest_video(profile_url, handle):
    import yt_dlp

    options = {
        "quiet": True,
        "no_warnings": True,
        "extract_flat": "in_playlist",
        "playlistend": 1,
        "skip_download": True,
    }
    with yt_dlp.YoutubeDL(options) as ydl:
        info = ydl.extract_info(profile_url, download=False)
    entries = list((info or {}).get("entries") or [])
    if not entries:
        return None
    entry = entries[0] or {}
    video_id = str(entry.get("id") or "")
    if not re.fullmatch(r"\d{8,}", video_id):
        return None
    url = str(entry.get("url") or entry.get("webpage_url") or "")
    expected = "https://www.tiktok.com/@" + handle + "/video/" + video_id
    if url.split("?")[0].rstrip("/") != expected:
        # Flat extracts sometimes omit the canonical URL. Accept only this handle.
        uploader = str(entry.get("uploader") or entry.get("uploader_id") or "")
        if uploader.lower() != handle.lower():
            return None
        url = expected
    caption = str(entry.get("description") or entry.get("title") or "").strip()
    posted = ""
    timestamp = entry.get("timestamp")
    if isinstance(timestamp, (int, float)) and timestamp > 0:
        posted = datetime.fromtimestamp(timestamp, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "id": video_id,
        "url": "https://www.tiktok.com/@" + handle + "/video/" + video_id,
        "caption": caption,
        "postedAt": posted,
    }


def main():
    site = load_json(SITE_PATH)
    if not isinstance(site, dict):
        return keep("Site data could not be read. Kept the last video.")
    handle, profile_url = tiktok_profile(site)
    if not handle:
        return keep("No TikTok profile in site data. Kept the last video.")
    try:
        video = newest_video(profile_url, handle)
    except Exception as err:
        return keep("TikTok lookup failed (" + err.__class__.__name__ + "). Kept the last video.")
    if not video:
        return keep("No public TikTok video was returned. Kept the last video.")

    current = load_json(LATEST_PATH) or {}
    if isinstance(current, dict) and current.get("tiktok") == video:
        print("Latest video is unchanged.")
        return 0

    payload = {"_note": NOTE, "tiktok": video}
    text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    LATEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    LATEST_PATH.write_text(text, encoding="utf-8")
    print("Updated latest video to " + video["url"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
