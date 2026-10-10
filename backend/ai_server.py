
from pathlib import Path
import io
import os
import platform
import subprocess
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from rembg import remove


# --------------------------------------------------
# PATHS
# backend/ai_server.py is inside the backend folder.
# The AI models and tools are in the project root.
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
REALESRGAN_DIR = BASE_DIR / "tools" / "realesrgan"
MODEL_DIR = REALESRGAN_DIR / "models"

if platform.system() == "Windows":
    DEFAULT_EXE = REALESRGAN_DIR / "realesrgan-ncnn-vulkan.exe"
else:
    DEFAULT_EXE = REALESRGAN_DIR / "realesrgan-ncnn-vulkan"

REALESRGAN_EXE = Path(
    os.getenv("REALESRGAN_EXE", str(DEFAULT_EXE))
)


# --------------------------------------------------
# APPLICATION
# --------------------------------------------------

app = FastAPI(title="KRAZ AI Image Tools", version="1.0.0")


# Add local development and deployed frontend origins.
# Additional origins can be configured using CORS_ORIGINS.
allowed_origins = [
    "http://localhost:3000",
    "https://kraz.vercel.app",
]

extra_origins = os.getenv("CORS_ORIGINS", "")
if extra_origins:
    allowed_origins.extend(
        origin.strip().rstrip("/")
        for origin in extra_origins.split(",")
        if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(allowed_origins)),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "KRAZ AI backend is running",
        "enhancement_executable_found": REALESRGAN_EXE.is_file(),
        "models_folder_found": MODEL_DIR.is_dir(),
    }


# --------------------------------------------------
# IMAGE VALIDATION
# --------------------------------------------------

async def read_valid_image(file: UploadFile) -> tuple[bytes, str]:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Choose an image first.",
        )

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WebP image.",
        )

    data = await file.read()

    if not data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty.",
        )

    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be under 15 MB.",
        )

    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()

        with Image.open(io.BytesIO(data)) as image:
            if image.width * image.height > 25_000_000:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Image dimensions are too large. "
                        "Choose a smaller image."
                    ),
                )

    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    return data, Path(file.filename).suffix.lower()


# --------------------------------------------------
# IMAGE ENHANCEMENT
# --------------------------------------------------

@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    data, suffix = await read_valid_image(file)

    if not REALESRGAN_EXE.is_file():
        raise HTTPException(
            status_code=503,
            detail=(
                "The compatible Real-ESRGAN executable is unavailable "
                "on this server."
            ),
        )

    if not MODEL_DIR.is_dir():
        raise HTTPException(
            status_code=503,
            detail="The Real-ESRGAN models folder was not found.",
        )

    if suffix not in {".jpg", ".jpeg", ".png", ".webp"}:
        suffix = ".png"

    with tempfile.TemporaryDirectory(prefix="kraz-") as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / f"input{suffix}"
        output_path = temp_path / "enhanced.png"

        input_path.write_bytes(data)

        command = [
            str(REALESRGAN_EXE),
            "-i", str(input_path),
            "-o", str(output_path),
            "-n", "realesrgan-x4plus",
            "-s", "4",
            "-t", "128",
            "-m", str(MODEL_DIR),
        ]

        try:
            result = subprocess.run(
                command,
                cwd=str(REALESRGAN_DIR),
                capture_output=True,
                text=True,
                timeout=180,
                check=False,
            )

        except subprocess.TimeoutExpired:
            raise HTTPException(
                status_code=504,
                detail="Enhancement timed out. Try a smaller image.",
            )

        except OSError as exc:
            print("Real-ESRGAN launch error:", repr(exc))
            raise HTTPException(
                status_code=503,
                detail="The image enhancement engine could not start.",
            )

        if result.returncode != 0 or not output_path.is_file():
            print("Real-ESRGAN error:", result.stderr, result.stdout)
            raise HTTPException(
                status_code=500,
                detail="Image enhancement failed.",
            )

        enhanced_bytes = output_path.read_bytes()

    return Response(
        content=enhanced_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": (
                'inline; filename="kraz-enhanced.png"'
            )
        },
    )


# --------------------------------------------------
# BACKGROUND REMOVAL
# --------------------------------------------------

@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    data, _ = await read_valid_image(file)

    try:
        result = remove(data)

        with Image.open(io.BytesIO(result)) as output_image:
            output_image.load()
            transparent_image = output_image.convert("RGBA")

            output_buffer = io.BytesIO()
            transparent_image.save(output_buffer, format="PNG")
            png_bytes = output_buffer.getvalue()

    except Exception as exc:
        print("Background removal error:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Background removal failed.",
        )

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": (
                'inline; filename="kraz-no-background.png"'
            )
        },
    )
