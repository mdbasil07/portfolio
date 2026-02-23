from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import hashlib
import math
import re

app = FastAPI()

# Stateless, pure-Python hashing vectorizer to avoid compiled deps.
# Produces fixed-size vectors by hashing tokens into buckets and L2-normalizing.
VECTOR_SIZE = 1024

def tokenize(text: str):
    text = (text or "").lower()
    # simple tokenization: words and numbers
    return re.findall(r"\b[\w/+\-\.]+\b", text)

def text_to_hash_vector(text: str, dim: int = VECTOR_SIZE):
    vec = [0.0] * dim
    tokens = tokenize(text)
    if not tokens:
        return vec
    for t in tokens:
        # stable hash
        h = hashlib.sha256(t.encode("utf-8")).digest()
        # use first 8 bytes as integer
        idx = int.from_bytes(h[:8], "big") % dim
        vec[idx] += 1.0
    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]

class TextInput(BaseModel):
    text: str

@app.get("/")
async def health():
    return {"status": "ok"}

@app.post("/embed")
async def embed_text(data: TextInput):
    text = (data.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > 20000:
        raise HTTPException(status_code=413, detail="text too long")
    try:
        arr = text_to_hash_vector(text, VECTOR_SIZE)
        return {"embedding": arr, "dim": len(arr)}
    except Exception:
        raise HTTPException(status_code=500, detail="embedding failed")