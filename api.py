import asyncio
import shutil
import subprocess
import sys
import urllib.request
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import yt_dlp
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="TaiVideo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_DIR = Path("temp_downloads")
WORKSPACE_DIR.mkdir(exist_ok=True)


class ApiPayload(BaseModel):
    action: str
    url: str
    platform: Optional[str] = ""
    quality: Optional[str] = "1080"
    formatId: Optional[str] = "1080"


async def cleanup_later(target_path: Path, delay: int = 1800):
    await asyncio.sleep(delay)
    if target_path.is_dir():
        shutil.rmtree(target_path, ignore_errors=True)
    elif target_path.exists():
        target_path.unlink(missing_ok=True)


def expand_short_url(url: str) -> str:
    if "v.douyin.com" in url.lower():
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.geturl()
        except Exception:
            pass
    return url


def get_ydl_base_opts(url: str) -> dict:
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "http_headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Referer": "https://www.douyin.com/",
        },
    }
    cookie_file = Path(__file__).parent / "cookies.txt"
    if "douyin.com" in url.lower() and cookie_file.exists():
        opts["cookiefile"] = str(cookie_file)
    return opts


def analyze_url(raw_url: str) -> dict:
    url = expand_short_url(raw_url)
    ydl_opts = get_ydl_base_opts(url)
    ydl_opts["extract_flat"] = False
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get("title") or info.get("description", "")[:60] or "Video / Media"
            formats = [
                {"id": "1080", "label": "Chất lượng cao nhất (MP4)"},
                {"id": "720", "label": "720p HD (MP4)"},
                {"id": "480", "label": "480p Tiết kiệm (MP4)"},
                {"id": "audio", "label": "Chỉ âm thanh (MP3 192kbps)"},
            ]
            return {"success": True, "title": title, "formats": formats}
    except Exception:
        return {
            "success": True,
            "title": "Bài đăng Douyin / Ảnh / Media",
            "formats": [
                {"id": "best", "label": "Chất lượng gốc tốt nhất"},
                {"id": "images", "label": "Tải toàn bộ ảnh (ZIP)"},
            ],
        }


def download_media_file(raw_url: str, quality: str, task_dir: Path) -> tuple[Optional[Path], str]:
    url = expand_short_url(raw_url)
    opts = get_ydl_base_opts(url)
    opts.update({
        "outtmpl": str(task_dir / "video_%(id)s.%(ext)s"),
        "retries": 5,
        "fragment_retries": 5,
        "restrictfilenames": True,
    })

    if quality == "audio":
        opts["format"] = "bestaudio/best"
        opts["postprocessors"] = [{
            "key": "FFmpegExtractAudio",
            "preferredcodec": "mp3",
            "preferredquality": "192",
        }]
    elif quality in {"720", "480"}:
        h = int(quality)
        opts["format"] = f"bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
        opts["merge_output_format"] = "mp4"
    else:
        opts["format"] = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"
        opts["merge_output_format"] = "mp4"

    last_error = ""
    try:
        if quality != "images":
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
    except Exception as e:
        last_error = str(e)

    files = [f for f in task_dir.rglob("*") if f.is_file()]
    if not files:
        exe = shutil.which("gallery-dl")
        cmd = [exe, "-d", str(task_dir), url] if exe else [sys.executable, "-m", "gallery_dl", "-d", str(task_dir), url]
        cookie_file = Path(__file__).parent / "cookies.txt"
        if "douyin.com" in url.lower() and cookie_file.exists():
            cmd.extend(["--cookies", str(cookie_file)])
        res = subprocess.run(cmd, capture_output=True, text=True)
        if not last_error and res.stderr:
            last_error = res.stderr.strip().splitlines()[-1]
        files = [f for f in task_dir.rglob("*") if f.is_file()]

    if not files:
        return None, last_error or "Không tìm thấy luồng video/ảnh từ liên kết này."
    if len(files) == 1:
        return files[0], ""

    zip_path = WORKSPACE_DIR / f"{task_dir.name}.zip"
    shutil.make_archive(str(WORKSPACE_DIR / task_dir.name), "zip", task_dir)
    return zip_path, ""


@app.get("/")
@app.get("/health")
def health():
    cookie_exists = (Path(__file__).parent / "cookies.txt").exists()
    return {"status": "ok", "cookies_loaded": cookie_exists}


@app.post("/api/download")
async def handle_api(payload: ApiPayload, request: Request, background_tasks: BackgroundTasks):
    if payload.action == "analyze":
        return analyze_url(payload.url)

    if payload.action == "download":
        task_id = uuid.uuid4().hex[:10]
        task_dir = WORKSPACE_DIR / task_id
        task_dir.mkdir(parents=True, exist_ok=True)

        result_file, err_msg = await asyncio.to_thread(
            download_media_file, payload.url, payload.quality or "1080", task_dir
        )

        if not result_file or not result_file.exists():
            shutil.rmtree(task_dir, ignore_errors=True)
            return {
                "success": False,
                "message": f"Lỗi từ hệ thống tải: {err_msg}",
            }

        background_tasks.add_task(cleanup_later, task_dir, 1800)
        if result_file.suffix == ".zip":
            background_tasks.add_task(cleanup_later, result_file, 1800)

        base_url = str(request.base_url).rstrip("/").replace("http://", "https://")
        safe_filename = quote(result_file.name)
        download_url = f"{base_url}/files/{task_id}/{safe_filename}"

        return {
            "success": True,
            "downloadUrl": download_url,
            "filename": result_file.name,
        }

    return {"success": False, "message": "Hành động không hợp lệ."}


@app.get("/files/{task_id}/{filename}")
async def serve_downloaded_file(task_id: str, filename: str):
    file_path = WORKSPACE_DIR / task_id / filename
    if not file_path.exists():
        file_path = WORKSPACE_DIR / filename
    if not file_path.exists():
        return {"success": False, "message": "File đã hết hạn."}
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")