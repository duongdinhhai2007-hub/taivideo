import os
import glob
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import yt_dlp
import gallery_dl

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DOWNLOAD_DIR = "temp_downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

class RequestData(BaseModel):
    action: str
    url: str
    platform: str = None
    quality: str = None
    formatId: str = None

@app.get("/health")
def health_check():
    cookies_exist = os.path.exists("cookies.txt")
    return {"status": "ok", "cookies_loaded": cookies_exist}

@app.post("/api/download")
def handle_download(data: RequestData, background_tasks: BackgroundTasks):
    url = data.url
    action = data.action

    if not url:
        return {"success": False, "message": "Thiếu đường dẫn URL."}

    ydl_opts_base = {
        'cookiefile': 'cookies.txt' if os.path.exists('cookies.txt') else None,
        'noplaylist': True,
        'quiet': True,
    }

    if action == "analyze":
        try:
            # Kiểm tra nếu là dạng ảnh TikTok / gallery
            if "/photo/" in url or "gallery-dl" in url:
                return {
                    "success": True,
                    "title": "Bài viết dạng ảnh / Slide TikTok",
                    "formats": [{"id": "best", "label": "Tải toàn bộ ảnh chuẩn HD"}]
                }

            with yt_dlp.YoutubeDL(ydl_opts_base) as ydl:
                info = ydl.extract_info(url, download=False)
                title = info.get('title', 'Video đã tải')
                
                formats = [
                    {"id": "best", "label": "Tốt nhất (Mặc định MP4)"},
                    {"id": "720", "label": "HD 720p"},
                    {"id": "360", "label": "SD 360p"}
                ]
                
                return {
                    "success": True,
                    "title": title,
                    "formats": formats
                }
        except Exception as e:
            error_msg = str(e)
            if "Unsupported URL" in error_msg:
                return {"success": False, "message": "Đường dẫn không được hỗ trợ hoặc đây là định dạng bài đăng ảnh đặc biệt."}
            return {"success": False, "message": f"Không thể phân tích: {error_msg}"}

    elif action == "download":
        try:
            for f in glob.glob(os.path.join(DOWNLOAD_DIR, "*")):
                try:
                    os.remove(f)
                except:
                    pass

            # Xử lý tải bằng gallery-dl nếu là link ảnh TikTok
            if "/photo/" in url:
                os.system(f"gallery-dl -d {DOWNLOAD_DIR} '{url}'")
                files = glob.glob(os.path.join(DOWNLOAD_DIR, "*"))
                if files:
                    download_url = f"/download-file?file={os.path.basename(files[0])}"
                    return {
                        "success": True,
                        "downloadUrl": download_url,
                        "filename": os.path.basename(files[0])
                    }
                raise Exception("Không thể tải xuống bài viết ảnh này.")

            ydl_opts = {
                **ydl_opts_base,
                'format': 'bestvideo+bestaudio/best',
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(DOWNLOAD_DIR, '%(id)s.%(ext)s'),
            }

            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                base, _ = os.path.splitext(filename)
                mp4_filename = base + ".mp4"
                
                if not os.path.exists(mp4_filename):
                    files = glob.glob(os.path.join(DOWNLOAD_DIR, "*"))
                    if files:
                        mp4_filename = files[0]
                    else:
                        raise Exception("Không tìm thấy file sau khi tải về.")

                download_url = f"/download-file?file={os.path.basename(mp4_filename)}"
                
                return {
                    "success": True,
                    "downloadUrl": download_url,
                    "filename": os.path.basename(mp4_filename)
                }
        except Exception as e:
            return {"success": False, "message": f"Lỗi từ hệ thống tải: {str(e)}"}

    return {"success": False, "message": "Hành động không hợp lệ."}

@app.get("/download-file")
def download_file(file: str):
    file_path = os.path.join(DOWNLOAD_DIR, file)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=file)
    raise HTTPException(status_code=404, detail="File không tồn tại hoặc đã bị xóa.")
