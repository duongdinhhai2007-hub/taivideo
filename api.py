import asyncio
import os
import shutil
import subprocess
import sys
import urllib.request
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import imageio_ffmpeg
import yt_dlp
from fastapi import BackgroundTasks, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

app = FastAPI(title="TaiVideo API")

# allow_credentials phải là False khi allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

WORKSPACE_DIR = Path("temp_downloads")
WORKSPACE_DIR.mkdir(exist_ok=True)

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

# ffmpeg tích hợp sẵn (Render không có ffmpeg hệ thống)
FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

# deno (cài lúc build trên Render vào thư mục .deno) để YouTube hoạt động
DENO_BIN = Path(__file__).parent / ".deno" / "bin"
if DENO_BIN.exists():
    os.environ["PATH"] = str(DENO_BIN) + os.pathsep + os.environ.get("PATH", "")

# Proxy tuỳ chọn (đặt biến môi trường PROXY_URL trên Render nếu IP bị chặn)
PROXY_URL = os.environ.get("PROXY_URL", "").strip()


def prepare_cookie_file() -> Optional[Path]:
    """Tìm cookies.txt (Render Secret File: /etc/secrets/cookies.txt),
    rồi chép sang /tmp để yt-dlp ghi được (thư mục secrets chỉ đọc)."""
    candidates = [
        Path("/etc/secrets/cookies.txt"),
        Path(__file__).parent / "cookies.txt",
    ]
    for src in candidates:
        if src.exists():
            dst = Path("/tmp/cookies_runtime.txt")
            try:
                shutil.copyfile(src, dst)
                return dst
            except Exception:
                return src
    return None


COOKIE_FILE = prepare_cookie_file()


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
    low = url.lower()
    if "v.douyin.com" in low or "vm.tiktok.com" in low or "vt.tiktok.com" in low:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.geturl()
        except Exception as e:
            print("EXPAND URL ERROR:", e)
    return url


def get_ydl_base_opts(url: str) -> dict:
    low = url.lower()
    headers = {"User-Agent": UA}
    if "douyin.com" in low:
        headers["Referer"] = "https://www.douyin.com/"
    opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "http_headers": headers,
        "ffmpeg_location": FFMPEG_PATH,
    }
    if PROXY_URL:
        opts["proxy"] = PROXY_URL
    # Chỉ gửi cookie Douyin cho Douyin (không rò sang site khác)
    if "douyin.com" in low and COOKIE_FILE:
        opts["cookiefile"] = str(COOKIE_FILE)
    return opts


def analyze_url(raw_url: str) -> dict:
    url = expand_short_url(raw_url)
    ydl_opts = get_ydl_base_opts(url)
    ydl_opts["extract_flat"] = False
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            title = info.get("title") or (info.get("description") or "")[:60] or "Video / Media"
            formats = [
                {"id": "1080", "label": "Chất lượng cao nhất (MP4)"},
                {"id": "720", "label": "720p HD (MP4)"},
                {"id": "480", "label": "480p Tiết kiệm (MP4)"},
                {"id": "audio", "label": "Chỉ âm thanh (MP3 192kbps)"},
            ]
            return {"success": True, "title": title, "formats": formats}
    except Exception as e:
        err = str(e)
        print("ANALYZE ERROR:", err)  # xem trong tab Logs của Render
        low = url.lower()
        # Chỉ TikTok/Douyin mới có bài đăng ảnh/slide để gallery-dl xử lý
        if "douyin.com" in low or "tiktok.com" in low:
            return {
                "success": True,
                "title": "Bài đăng ảnh / Media (chưa đọc được thông tin video)",
                "formats": [
                    {"id": "best", "label": "Chất lượng gốc tốt nhất"},
                    {"id": "images", "label": "Tải toàn bộ ảnh (ZIP)"},
                ],
            }
        return {"success": False, "message": err[-300:]}


def run_gallery_dl(url: str, task_dir: Path) -> str:
    """Gọi gallery-dl bằng danh sách tham số (KHÔNG dùng os.system -> tránh injection)."""
    exe = shutil.which("gallery-dl")
    cmd = [exe] if exe else [sys.executable, "-m", "gallery_dl"]
    cmd += ["-d", str(task_dir)]
    if PROXY_URL:
        cmd += ["--proxy", PROXY_URL]
    if "douyin.com" in url.lower() and COOKIE_FILE:
        cmd += ["--cookies", str(COOKIE_FILE)]
    cmd.append(url)
    res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    err = res.stderr.strip().splitlines()[-1] if res.stderr.strip() else ""
    return err


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
    elif quality in {"720", "480", "360"}:
        h = int(quality)
        opts["format"] = (
            f"bestvideo[height<={h}][vcodec^=avc1]+bestaudio[acodec^=mp4a]"
            f"/bestvideo[height<={h}]+bestaudio/best[height<={h}]/best"
        )
        opts["merge_output_format"] = "mp4"
    else:
        # Ưu tiên H.264 + AAC (phát được trên iPhone/Windows), rồi mới tới các codec khác
        opts["format"] = (
            "bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]"
            "/best[vcodec^=avc1]/bestvideo+bestaudio/best"
        )
        opts["merge_output_format"] = "mp4"

    last_error = ""
    if quality != "images":
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([url])
        except Exception as e:
            last_error = str(e)
            print("YTDLP ERROR:", last_error)

    files = [f for f in task_dir.rglob("*") if f.is_file()]
    if not files:
        try:
            err = run_gallery_dl(url, task_dir)
            if not last_error:
                last_error = err
        except Exception as e:
            last_error = last_error or str(e)
            print("GALLERY-DL ERROR:", e)
        files = [f for f in task_dir.rglob("*") if f.is_file()]

    if not files:
        return None, last_error or "Không tìm thấy luồng video/ảnh từ liên kết này."
    if quality != "images":
        media = [f for f in files if f.suffix.lower() in {".mp4", ".mkv", ".webm", ".mov", ".mp3", ".m4a"}]
        if media:
            return max(media, key=lambda f: f.stat().st_size), ""
    if len(files) == 1:
        return files[0], ""

    shutil.make_archive(str(WORKSPACE_DIR / task_dir.name), "zip", task_dir)
    return WORKSPACE_DIR / f"{task_dir.name}.zip", ""


@app.get("/")
@app.get("/health")
def health():
    return {"status": "ok", "cookies_loaded": COOKIE_FILE is not None, "proxy": bool(PROXY_URL)}


@app.post("/api/download")
async def handle_api(payload: ApiPayload, request: Request, background_tasks: BackgroundTasks):
    if payload.action == "analyze":
        return await asyncio.to_thread(analyze_url, payload.url)

    if payload.action == "download":
        task_id = uuid.uuid4().hex[:10]
        task_dir = WORKSPACE_DIR / task_id
        task_dir.mkdir(parents=True, exist_ok=True)

        quality = payload.quality or payload.formatId or "1080"
        result_file, err_msg = await asyncio.to_thread(
            download_media_file, payload.url, quality, task_dir
        )

        if not result_file or not result_file.exists():
            shutil.rmtree(task_dir, ignore_errors=True)
            return {"success": False, "message": f"Lỗi từ hệ thống tải: {err_msg}"}

        background_tasks.add_task(cleanup_later, task_dir, 1800)
        if result_file.suffix == ".zip" and result_file.parent == WORKSPACE_DIR:
            background_tasks.add_task(cleanup_later, result_file, 1800)

        # URL TUYỆT ĐỐI trỏ về Render (frontend ở Vercel nên link tương đối sẽ 404)
        base_url = str(request.base_url).rstrip("/").replace("http://", "https://")
        download_url = f"{base_url}/files/{task_id}/{quote(result_file.name)}"
        return {"success": True, "downloadUrl": download_url, "filename": result_file.name}

    return {"success": False, "message": "Hành động không hợp lệ."}


@app.get("/files/{task_id}/{filename}")
async def serve_downloaded_file(task_id: str, filename: str):
    # Chặn path traversal
    task_id = Path(task_id).name
    filename = Path(filename).name
    file_path = WORKSPACE_DIR / task_id / filename
    if not file_path.exists():
        file_path = WORKSPACE_DIR / filename
    if not file_path.exists():
        return {"success": False, "message": "File đã hết hạn."}
    return FileResponse(path=file_path, filename=filename, media_type="application/octet-stream")
