from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import re

app = FastAPI(title="NexusSocial ML Service", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Expanded abuse/violence keyword dictionary with severity ──────────────────
ABUSE_KEYWORDS = {
    "critical": ["kill", "murder", "terrorist", "bomb", "suicide", "shoot", "stab", "rape", "assault", "attack", "die", "death threat", "gun", "knife", "weapon", "execute", "massacre", "slaughter", "genocide"],
    "high": ["hate", "racist", "sexist", "nazi", "fascist", "homophobic", "slur", "abuse", "harass", "bully", "threat", "violence", "extremist", "radicalize", "supremacist", "lynch"],
    "medium": ["stupid", "idiot", "moron", "loser", "ugly", "dumb", "retard", "trash", "worthless", "pathetic", "disgusting", "shut up", "scam", "fraud", "fake", "spam", "porn", "nsfw", "nude", "sex"],
    "low": ["annoying", "boring", "lame", "suck", "hell", "damn", "crap", "wtf"]
}

# Flatten for quick matching
ALL_KEYWORDS = {}
for severity, words in ABUSE_KEYWORDS.items():
    for w in words:
        ALL_KEYWORDS[w.lower()] = severity

SEVERITY_SCORES = {"critical": 95, "high": 75, "medium": 50, "low": 25}

class ProfileData(BaseModel):
    username: str
    bio: str = ""
    avatar: str = ""
    postsCount: int = 0
    followersCount: int = 0
    followingCount: int = 0
    accountAge: int = 0

class ContentData(BaseModel):
    text: str

@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0", "model": "rule-based-v2"}

@app.post("/detect-fake")
async def detect_fake(profile: ProfileData):
    score = 0
    reasons = []

    # Rule 1: No avatar
    if not profile.avatar:
        score += 15
        reasons.append("No profile picture")

    # Rule 2: Short or empty bio
    if len(profile.bio) < 10:
        score += 10
        reasons.append("Empty or very short bio")

    # Rule 3: Suspicious username patterns
    if re.search(r'\d{4,}', profile.username):
        score += 20
        reasons.append("Username contains many numbers")
    if re.search(r'(.)\1{3,}', profile.username):
        score += 15
        reasons.append("Username has repeated characters")

    # Rule 4: New account with no posts
    if profile.accountAge < 1 and profile.postsCount == 0:
        score += 10
        reasons.append("Brand new account with no posts")

    # Rule 5: Ratio imbalance
    if profile.followingCount > 50 and profile.followersCount < 5:
        score += 20
        reasons.append("Following many, few followers (bot-like)")

    # Rule 6: Excessive following
    if profile.followingCount > 200:
        score += 15
        reasons.append("Following unusually many accounts")

    score = min(score, 100)
    is_fake = score >= 50

    return {
        "isFake": is_fake,
        "score": score,
        "confidence": min(score + 10, 100),
        "reasons": reasons,
        "severity": "critical" if score >= 80 else "high" if score >= 60 else "medium" if score >= 40 else "low"
    }

@app.post("/moderate")
async def moderate(data: ContentData):
    text_lower = data.text.lower()
    flagged_words = []
    categories = set()
    max_severity = "low"
    max_score = 0

    for keyword, severity in ALL_KEYWORDS.items():
        if keyword in text_lower:
            flagged_words.append(keyword)
            categories.add(severity)
            sev_score = SEVERITY_SCORES[severity]
            if sev_score > max_score:
                max_score = sev_score
                max_severity = severity

    # Check for ALL CAPS (shouting)
    words = data.text.split()
    caps_ratio = sum(1 for w in words if w.isupper() and len(w) > 2) / max(len(words), 1)
    if caps_ratio > 0.5 and len(words) > 3:
        flagged_words.append("EXCESSIVE_CAPS")
        max_score = max(max_score, 30)

    # Check for excessive exclamation/special chars
    if data.text.count('!') > 5 or data.text.count('?') > 5:
        flagged_words.append("EXCESSIVE_PUNCTUATION")
        max_score = max(max_score, 20)

    is_abusive = max_score >= 50

    return {
        "isAbusive": is_abusive,
        "score": max_score,
        "severity": max_severity,
        "categories": sorted(list(categories)),
        "flaggedWords": flagged_words
    }
