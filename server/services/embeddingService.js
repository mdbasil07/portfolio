/**
 * Embedding Service — Local Python Microservice Connector
 * ─────────────────────────────────────────────────────────
 * Calls the local FastAPI embedding service (all-MiniLM-L6-v2)
 * running on http://localhost:8001.
 *
 * Zero cost. No OpenAI. No vendor lock-in.
 */
import axios from "axios";
import crypto from "crypto";

const EMBED_URL = process.env.EMBEDDING_SERVICE_URL || "http://localhost:8001/embed";

// ── In-memory cache ──────────────────────────────────────────────────────────
const embeddingCache = new Map();

/**
 * Generate a deterministic cache key from text.
 */
function cacheKey(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}

/**
 * Get the embedding vector for a given text string from the local
 * Python microservice.
 *
 * @param {string} text
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
    if (!text || typeof text !== "string" || !text.trim()) {
        throw new Error("Embedding input text must be a non-empty string");
    }

    const key = cacheKey(text);

    if (embeddingCache.has(key)) {
        return embeddingCache.get(key);
    }

    const response = await axios.post(EMBED_URL, {
        text: text.slice(0, 8000), // safety limit
    });

    const vector = response.data.embedding;

    embeddingCache.set(key, vector);
    return vector;
}

/**
 * Compute cosine similarity between two embedding vectors.
 * Returns a value in [-1, 1]; higher is more similar.
 *
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number}
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
}

/**
 * Clear the embedding cache (useful for tests / memory management).
 */
export function clearEmbeddingCache() {
    embeddingCache.clear();
}
