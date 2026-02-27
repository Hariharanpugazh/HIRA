from io import BytesIO

from fastapi import HTTPException, UploadFile, status
from docx import Document
from pypdf import PdfReader

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md", "rtf"}


def normalize_text(value: str) -> str:
    return "\n".join(line.strip() for line in value.replace("\r\n", "\n").split("\n") if line.strip())


def _extract_pdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n".join(pages)


def _extract_docx(content: bytes) -> str:
    doc = Document(BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text)


def _extract_text(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError:
        return content.decode("latin-1", errors="ignore")


async def extract_text_from_upload(upload: UploadFile, max_upload_bytes: int) -> str:
    content = await upload.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{upload.filename} is empty.")
    if len(content) > max_upload_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"{upload.filename} exceeds MAX_UPLOAD_BYTES.",
        )

    suffix = (upload.filename or "").lower().rsplit(".", maxsplit=1)[-1]
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"{upload.filename} has unsupported extension '{suffix}'.",
        )
    if suffix == "pdf":
        parsed = _extract_pdf(content)
    elif suffix == "docx":
        parsed = _extract_docx(content)
    else:
        parsed = _extract_text(content)

    cleaned = normalize_text(parsed)
    if not cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{upload.filename} does not contain extractable text.",
        )
    return cleaned
