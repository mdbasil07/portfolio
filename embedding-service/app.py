from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sklearn.feature_extraction.text import HashingVectorizer
import numpy as np
import typing as t

app = FastAPI()

# Lightweight, CPU-only stateless vectorizer (no heavy ML libs)
# Produces fixed-size vectors (n_features) using hashing trick.
VECTOR_SIZE = 1024
vectorizer = HashingVectorizer(n_features=VECTOR_SIZE, alternate_sign=False, norm='l2', ngram_range=(1,2))

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
        vec = vectorizer.transform([text])
        arr = vec.toarray()[0].astype(float)
        # Convert to plain list for JSON serialization
        return {"embedding": arr.tolist(), "dim": len(arr)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="embedding failed")