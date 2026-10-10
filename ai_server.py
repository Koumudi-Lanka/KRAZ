
from pathlib import Path
import io
import subprocess
import tempfile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from rembg import remove

BASE_DIR = Path(__file__).resolve().parent
REALESRGAN_DIR = BASE_DIR / "tools" / "realesrgan"
REALESRGAN_EXE = REALESRGAN_DIR / "realesrgan-ncnn-vulkan.exe"
MODEL_DIR = REALESRGAN_DIR / "models"

app = FastAPI(title="KRAZ Local AI Image Tools")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "KRAZ AI backend is running",
    }


async def read_valid_image(file: UploadFile) -> tuple[bytes, str]:
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Choose an image first.",
        )

    allowed_types = {"image/jpeg", "image/png", "image/webp"}

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WebP image.",
        )

    data = await file.read()

    if not data or len(data) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image must be non-empty and under 15 MB.",
        )

    try:
        with Image.open(io.BytesIO(data)) as image:
            image.verify()

        # Check the dimensions separately before processing.
        with Image.open(io.BytesIO(data)) as image:
            if image.width * image.height > 25_000_000:
                raise HTTPException(
                    status_code=400,
                    detail="Image dimensions are too large. Choose a smaller image.",
                )
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    return data, Path(file.filename).suffix.lower()


@app.post("/enhance")
async def enhance_image(file: UploadFile = File(...)):
    data, suffix = await read_valid_image(file)

    if not REALESRGAN_EXE.is_file():
        raise HTTPException(
            status_code=500,
            detail="Real-ESRGAN executable not found.",
        )

    if not MODEL_DIR.is_dir():
        raise HTTPException(
            status_code=500,
            detail="Real-ESRGAN models folder not found.",
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

        if result.returncode != 0 or not output_path.is_file():
            print("Real-ESRGAN error:", result.stderr, result.stdout)
            raise HTTPException(
                status_code=500,
                detail="Image enhancement failed. Check the backend terminal.",
            )

        enhanced_bytes = output_path.read_bytes()

    return Response(
        content=enhanced_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": 'inline; filename="kraz-enhanced.png"'
        },
    )


@app.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    data, _ = await read_valid_image(file)

    try:
        # rembg removes the background and produces a transparent PNG.
        result = remove(data)

        # Verify that the output is a valid image with transparency.
        with Image.open(io.BytesIO(result)) as output_image:
            output_image.load()

            if output_image.mode != "RGBA":
                output_image = output_image.convert("RGBA")

            output_buffer = io.BytesIO()
            output_image.save(output_buffer, format="PNG")
            png_bytes = output_buffer.getvalue()

    except HTTPException:
        raise
    except Exception as exc:
        print("Background removal error:", repr(exc))
        raise HTTPException(
            status_code=500,
            detail="Background removal failed. Check the backend terminal.",
        )

    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": 'inline; filename="kraz-no-background.png"'
        },
    )
