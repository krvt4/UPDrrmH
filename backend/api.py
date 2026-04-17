# api.py
import os
import traceback
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

# ✅ Always load the env file from backend/.env (works no matter where you run uvicorn)
load_dotenv("backend/.env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

app = FastAPI()

# CORS (ok for local dev; tighten for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FREE_MODELS = [
    "stepfun/step-3.5-flash:free",
    "z-ai/glm-4.5-air:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "arcee-ai/trinity-large-preview:free",
]

blocked_keywords = [
    "politics", "political", "election", "government", "president",
    "senate", "congress", "law", "policy",
    "religion", "religious", "christian", "muslim", "islam",
    "jewish", "hindu", "buddhist", "church", "mosque",
]

# ✅ Scope keywords: DRRM-H + THIS WEBSITE SECTIONS ONLY
SCOPE_KEYWORDS = [
    "drrm", "drrm-h", "drrmh", "up manila", "joaquin gonzales",
    "bertst", "mci", "triage", "sfatbls", "first aid", "basic life support", "cpr",
    "training", "trainings", "schedule", "date", "dates", "fee", "fees", "registration", "register", "join",
    "news", "updates", "announcement", "events",
    "contact", "email", "message", "inquiry",
    "e-learning", "elearning", "manual", "shop", "cart", "checkout", "order", "profile",
    "website", "page", "link"
]

# ✅ Expanded tone replies
SAFE_SHORT_REPLIES = {
    "yes", "yeah", "yep",
    "no", "nope",
    "ok", "okay", "sure",
    "please", "go on", "continue", "more",
    "i see", "oh", "alright", "noted", "hmm",
}

SMALL_TALK = {
    "hi", "hello", "hey",
    "thanks", "thank you", "ty",
    "bye", "goodbye",
    "good morning", "good afternoon", "good evening",
}

IDENTITY_TERMS = {
    "openai", "chatgpt", "bot", "ai", "robot"
}


def contains_blocked(text: str) -> bool:
    t = (text or "").lower()
    return any(word in t for word in blocked_keywords)


def is_identity_question(text: str) -> bool:
    t = (text or "").lower().strip()
    if not t:
        return False
    # identity questions should not be blocked by scope checks
    if any(term in t for term in IDENTITY_TERMS):
        if "are you" in t or "who are you" in t or "what are you" in t:
            return True
        # also allow simple "are you openai"
        if "openai" in t and "are you" in t:
            return True
    return False


def looks_like_question(text: str) -> bool:
    t = (text or "").lower().strip()
    if not t:
        return False
    starters = ("what", "how", "when", "where", "why", "can you", "could you", "do you", "tell me")
    return "?" in t or t.startswith(starters)


def in_scope(text: str) -> bool:
    t = (text or "").lower().strip()
    if not t:
        return True

    # ✅ allow identity questions through to model (it will answer with scope)
    if is_identity_question(t):
        return True

    # ✅ allow confirmations and short continuations
    if t in SAFE_SHORT_REPLIES:
        return True

    # ✅ allow simple small talk (model will respond gently + redirect)
    if t in SMALL_TALK:
        return True

    # ✅ allow DRRM-H website topics only
    return any(k in t for k in SCOPE_KEYWORDS)


def normalize_recent(recent: List[Dict[str, Any]], keep_last: int = 6) -> List[Dict[str, str]]:
    out: List[Dict[str, str]] = []
    for m in (recent or [])[-keep_last:]:
        role_raw = (m.get("role") or "").lower()
        role = "user" if role_raw == "user" else "assistant"
        content = str(m.get("text") or "")
        out.append({"role": role, "content": content})
    return out


class ChatReq(BaseModel):
    userText: str
    recent: List[Dict[str, Any]] = []
    context: Dict[str, Any] = {}
    kb: Dict[str, Any] = {}


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/drrmh-chat")
def drrmh_chat(req: ChatReq):
    user_text = (req.userText or "").strip()
    if not user_text:
        return {"reply": "Please enter a message."}

    if contains_blocked(user_text):
        return {"reply": "Sorry, I can’t help with that topic. Please ask something related to DRRM-H or this website."}

    # ✅ Hard scope gate BEFORE calling AI
    # ✅ But only refuse if it's a real out-of-scope QUESTION/REQUEST.
    # Small talk + short replies are allowed so the bot can respond naturally.
    if not in_scope(user_text) and looks_like_question(user_text):
        return {
            "reply": (
                "I can only answer questions about **DRRM-H** and the **DRRM-H website** "
                "(trainings, fees, schedules, registration, news, and contact). "
                "Please ask something within that scope."
            )
        }

    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY not found. Expected in: backend/.env",
        )

    # ✅ Add OpenRouter recommended headers (helps avoid auth/policy issues)
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key,
        default_headers={
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "DRRM-H Web App",
        },
    )

    # ✅ Strong system prompt with tone handling
    system_prompt = (
        "You are the DRRM-H website assistant.\n"
        "You MUST answer ONLY about DRRM-H and the content/features of this DRRM-H website.\n\n"
        "Allowed topics:\n"
        "- DRRM-H program info (about, history, mission, vision, values, location)\n"
        "- Trainings: BERTST, MCI & Triage, SFATBLS (what it is, what we do, fees, schedules, registration steps)\n"
        "- News/updates and announcements mentioned on the website\n"
        "- Contact/inquiry instructions shown on the website\n"
        "- Website navigation: where to find pages (training pages, news, profile, shop, e-learning, manuals)\n\n"
        "Tone rules:\n"
        "- Be warm, friendly, and conversational.\n"
        "- If the user says 'okay', 'i see', 'yes', 'continue', etc., respond naturally and guide them with a clarifying question.\n"
        "- If the user asks who/what you are (bot/AI/OpenAI), answer briefly and redirect to DRRM-H topics.\n\n"
        "Refusal rules:\n"
        "- If the user asks anything outside scope (games, jokes, random topics), refuse politely and remind you handle DRRM-H website questions only.\n"
        "- Do NOT provide game play or unrelated content.\n\n"
        "Use the provided KB when available. Keep replies concise and helpful."
    )

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
    messages += normalize_recent(req.recent, keep_last=6)

    if req.kb:
        messages.append({"role": "assistant", "content": f"KB (reference): {req.kb}"})
    if req.context:
        messages.append({"role": "assistant", "content": f"Context (reference): {req.context}"})

    messages.append({"role": "user", "content": user_text})

    last_err: Optional[Exception] = None

    for model in FREE_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.4,
                max_tokens=800,
            )

            reply = (resp.choices[0].message.content or "").strip()
            if reply:
                return {"reply": reply}

            print(f"Model {model} returned empty response — trying next model")

        except Exception as e:
            last_err = e
            print("Model failed:", model, repr(e))
            # ✅ Print full traceback so you can see the real reason for 500
            traceback.print_exc()
            continue

    raise HTTPException(
        status_code=503,
        detail=f"All free models failed. Last error: {repr(last_err)}",
    )
 