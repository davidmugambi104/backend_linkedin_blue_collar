from pathlib import Path
from typing import Dict, List

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class AIAssistant:
    def __init__(self, csv_path: str = "training/faq_data.csv"):
        backend_root = Path(__file__).resolve().parents[2]
        self.csv_path = backend_root / csv_path
        self.df = pd.DataFrame(columns=["question", "answer", "category"])
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.question_matrix = None
        self._load_or_train()

    def _load_or_train(self) -> None:
        if not self.csv_path.exists():
            self.df = pd.DataFrame(columns=["question", "answer", "category"])
            return

        self.df = pd.read_csv(self.csv_path)
        if self.df.empty:
            return

        self.df["question"] = self.df["question"].astype(str).str.lower().str.strip()
        self.df["answer"] = self.df["answer"].astype(str).str.strip()

        if "category" not in self.df.columns:
            self.df["category"] = "general"
        else:
            self.df["category"] = self.df["category"].fillna("general").astype(str)

        self.question_matrix = self.vectorizer.fit_transform(self.df["question"].tolist())

    def get_answer(self, query: str, threshold: float = 0.2, top_k: int = 3) -> List[Dict]:
        query_value = (query or "").lower().strip()
        if not query_value or self.question_matrix is None or self.df.empty:
            return []

        query_vector = self.vectorizer.transform([query_value])
        similarities = cosine_similarity(query_vector, self.question_matrix).flatten()

        ranked_indices = similarities.argsort()[::-1][:top_k]
        results = []

        for idx in ranked_indices:
            score = float(similarities[idx])
            if score < threshold:
                continue

            row = self.df.iloc[idx]
            results.append(
                {
                    "question": row["question"],
                    "answer": row["answer"],
                    "category": row.get("category", "general"),
                    "similarity": round(score, 4),
                    "context": self.get_context(idx),
                }
            )

        return results

    def get_context(self, idx: int) -> List[Dict]:
        if self.df.empty:
            return []

        related = []
        start = max(0, idx - 2)
        end = min(len(self.df), idx + 3)

        for pointer in range(start, end):
            if pointer == idx:
                continue

            row = self.df.iloc[pointer]
            answer = str(row["answer"])
            related.append(
                {
                    "question": row["question"],
                    "answer_preview": f"{answer[:100]}..." if len(answer) > 100 else answer,
                }
            )

        return related


def suggest_actions(query: str) -> List[str]:
    text = (query or "").lower()

    if "profile" in text:
        return [
            "Open profile settings",
            "Update skills and experience",
            "Verify profile details",
        ]

    if "job" in text:
        return [
            "Browse open jobs",
            "Filter jobs by skill",
            "Review latest applications",
        ]

    if "message" in text or "chat" in text:
        return [
            "Open inbox",
            "Start a new conversation",
            "Use a professional greeting",
        ]

    return [
        "Go to dashboard",
        "Open messages",
        "Review account settings",
    ]
