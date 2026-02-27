This comprehensive architectural plan is designed for the **February 26, 2026** technology landscape. It adheres strictly to the "No External API" and "Own Everything" constraints, focusing on self-hosted, open-source, state-of-the-art (SOTA) solutions.

---

# 🏗️ Project: "Recruiter's Brain" – Backend Architecture & AI Pipeline
**Date:** 26 February 2026
**Constraint Check:** 100% Self-Hosted | No External APIs | Modern SOTA | Pixel Perfect Backend

## 1. High-Level Architecture Overview
We are building a **Modular Monolithic Backend** designed for easy transition to Microservices. The core differentiator is the **Local Inference Engine** and **Synthetic Data Distillation Pipeline**.

### 🛠️ The Tech Stack (2026 Standards)

| Component | Technology Selection | Reasoning (2026 Context) |
| :--- | :--- | :--- |
| **Language** | **Python 3.13** | Performance optimizations (GIL removal in 3.12+, JIT improvements) make it ideal for AI-heavy backends. |
| **Backend Framework** | **FastAPI 0.115+** | Async-native, Pydantic v2 validation, auto-docs. Industry standard for AI wrappers. |
| **Database (Relational)** | **PostgreSQL 17** | Unmatched reliability. Native vector support (`pgvector`) eliminates need for separate vector DB. |
| **Database (Cache)** | **Valkey 8.0** (Redis Fork) | Open-source, high-performance caching for candidate ranking results and session management. |
| **AI Framework** | **PyTorch 2.5+ (Inductor Backend)** | Standard for research. `torch.compile` provides massive speedups for custom models. |
| **Model Serving** | **vLLM 0.7+** | The gold standard for high-throughput LLM serving. PagedAttention handles memory efficiently. |
| **Training/Fine-Tuning** | **Unsloth AI** | 2x-5x faster training, 60% less memory usage. Supports Llama 4/Mistral architectures. |
| **Orchestration** | **Prefect 3.0** | Modern, dynamic workflow orchestration for the data pipeline and training jobs. |
| **Containerization** | **Docker 27+ & Kubernetes** | Standard deployment strategy. |

---

## 2. Phase I: The "Synthetic Data Engine" (Dataset Creation)
**Constraint:** *Create a labeled dataset... No API from others.*

Since no public dataset perfectly fits "Fit Score 0-10" with deep reasoning, we must generate a **"Silver Standard"** dataset using a powerful local teacher model.

### 2.1. Data Ingestion & Cleaning
*   **Tools:** `PyMuPDF` (PDF parsing), `python-docx` (Resume parsing).
*   **Strategy:** Extract text, strip PII (Personally Identifiable Information) using local RegEx and `Microsoft Presidio` (self-hosted) to ensure ethical data handling.
*   **Storage:** Store raw text in `PostgreSQL` `TEXTBLOB` columns.

### 2.2. The Distillation Pipeline (Teacher-Student Model)
We will use a large, capable open-source model (The Teacher) running locally to label the data for the smaller, faster model (The Student).

1.  **Teacher Model:** **Llama 4 (or Mistral Large 2)** – 70B+ Parameters (Quantized to 4-bit for local execution on enterprise GPUs).
2.  **Generation Logic:**
    *   Input: Resume Text + Job Description.
    *   Task: "Analyze this candidate for the job. Output a JSON object containing: `fit_score` (0.0-10.0), `skill_depth_analysis`, `over_claiming_flags`, and `reasoning_summary`."
    *   Output: Structured JSON data.
3.  **Automation:** Use **Prefect** to batch process 10,000+ resume/JD pairs automatically. This creates the "Ground Truth" dataset.

---

## 3. Phase II: Fine-Tuning Strategy (The "Brain")
**Constraint:** *Fine-tune a transformer model... Resume-to-job similarity, ranking.*

We will **not** use a standard classification head. We will fine-tune a **Decoder-only LLM** to act as a "Judge". This is modern, flexible, and allows for explainability (text output + score).

### 3.1. Base Model Selection
**Choice:** **Llama 3.3 (or successor) - 8B/70B Parameters**.
*   *Why?* As of 2026, Llama 3.x remains the most efficient open-weight model. The 8B version is chosen for **"Edge-Ready" inference** (fast, cheap to host), while 70B is used if accuracy is paramount.
*   *We will train the 8B model to mimic the reasoning of the 70B Teacher.*

### 3.2. Training Technique: **Q-LoRA with Unsloth**
*   **Method:** Quantized Low-Rank Adaptation (QLoRA).
*   **Why?** It allows fine-tuning massive models on consumer/enterprise hardware with minimal VRAM usage.
*   **Target Modules:** We target `q_proj`, `v_proj`, `k_proj`, `o_proj` (Attention layers) and `mlp` layers.
*   **Objective:** Causal Language Modeling (CLM). The model learns to output the specific JSON structure defined in Phase I.

### 3.3. The Training Data Structure
```json
{
  "instruction": "Evaluate the candidate's resume against the job description.",
  "input": "[RESUME TEXT] \n\n [JD TEXT]",
  "output": "{
    \"fit_score\": 8.5,
    \"skill_depth\": {\"Python\": \"Expert\", \"React\": \"Intermediate\"},
    \"over_claiming\": \"None detected\",
    \"summary\": \"Strong backend fit, lacks specific cloud experience required.\"
  }"
}
```

---

## 4. Phase III: Inference & Ranking System (Backend Logic)
**Constraint:** *Pixel Perfect Backend... Next.js Frontend.*

### 4.1. The Inference Server (vLLM)
We deploy the fine-tuned model using **vLLM**.
*   **Endpoint:** `POST /v1/completions` (OpenAI compatible format, but hosted locally).
*   **Features:** Continuous Batching (process multiple resumes simultaneously without blocking), PagedAttention (optimized VRAM).

### 4.2. Ranking Algorithm (Business Logic)
The LLM returns a score (0-10). To rank candidates effectively, we implement a **Hybrid Scoring System** in Python:

1.  **LLM Score (Semantic):** The intuition and logic from the fine-tuned model (Weight: 70%).
2.  **Hard Skill Match (Lexical):** Using **RapidFuzz** (Fuzzy string matching) to ensure mandatory keywords exist (Weight: 20%).
3.  **Experience Match (Heuristic):** Regex extraction of years of experience vs. required years (Weight: 10%).

### 4.3. API Endpoints Design (FastAPI)

```python
# pseudo-code structure
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel

class RankingResponse(BaseModel):
    candidate_id: str
    fit_score: float
    rank: int
    skill_analysis: dict
    over_claiming_risks: list[str]

@app.post("/api/v1/screen", response_model=List[RankingResponse])
async def screen_resumes(
    job_description: str,
    resumes: List[UploadFile] = File(...)
):
    # 1. Parse Resumes (PyMuPDF)
    # 2. Batch Inference via vLLM (Async)
    # 3. Hybrid Scoring Logic
    # 4. Sort & Rank
    # 5. Return JSON
    pass
```

---

## 5. Phase IV: Evaluation & Bias Analysis
**Constraint:** *Evaluation metrics, Bias analysis.*

### 5.1. Evaluation Metrics
We split the synthetic dataset into Train/Test. We hold out 10% for evaluation.
1.  **Ranking Correlation:** Calculate **Spearman’s Rank Correlation Coefficient** between the model's ranking and the "Ground Truth" ranking generated by the Teacher model.
2.  **Score Accuracy:** **Mean Absolute Error (MAE)** between predicted score and actual score.
3.  **Skill Extraction:** **F1 Score** (Token level) for extracted skills vs. ground truth skills.

### 5.2. Bias Analysis Module
We build a separate script to test for demographic bias (Gender, Ethnicity proxies).
*   **Method:** Create synthetic resumes with identical skills but varying name pronouns or demographic indicators.
*   **Metric:** **Demographic Parity Difference**.
*   **Implementation:** If the model scores "John" consistently higher than "Jane" for identical content, we implement **Calibrated Equalized Odds** post-processing to correct the scores.

---

## 6. Project Structure (Pixel Perfect Organization)

```text
/recruiter-brain-backend
├── /app
│   ├── /api
│   │   ├── routes.py          # FastAPI endpoints
│   │   └── dependencies.py    # Auth, DB sessions
│   ├── /core
│   │   ├── config.py          # Pydantic settings
│   │   └── security.py        # Input sanitization
│   ├── /models
│   │   ├── db_models.py       # SQLAlchemy ORM (Postgres)
│   │   └── inference.py       # vLLM wrapper logic
│   ├── /services
│   │   ├── parser.py          # PDF/Docx extraction
│   │   ├── ranker.py          # Hybrid scoring logic
│   │   └── trainer.py         # Unsloth fine-tuning script
│   └── main.py                # Entry point
├── /ml_pipeline
│   ├── /data_gen              # Teacher model scripts for data creation
│   ├── /evaluation            # Bias & Metrics scripts
│   └── /checkpoints           # LoRA adapters storage
├── docker-compose.yml         # Postgres, Valkey, vLLM services
├── Dockerfile                 # Python 3.13 environment
└── requirements.txt           # PyTorch, FastAPI, Unsloth, etc.
```

---

## 7. Comparison Strategy (Deliverable)

To prove the model works, we implement three modes in the backend and log the results:

1.  **Baseline 1 (Embedding):**
    *   *Method:* `Sentence-Transformers` (all-MiniLM-L6-v2).
    *   *Logic:* Cosine similarity between Resume Vector and JD Vector.
    *   *Weakness:* Fails to detect "Depth" (e.g., "used Python" vs "Expert in Python" have high similarity).
2.  **Baseline 2 (Zero-Shot LLM):**
    *   *Method:* Base Llama 3.3 8B (No fine-tuning).
    *   *Weakness:* Inconsistent JSON output, hallucinates scores, no alignment with recruiter logic.
3.  **Our Solution (Fine-Tuned):**
    *   *Method:* Fine-tuned Llama 3.3 8B (Q-LoRA).
    *   *Strength:* Precise JSON output, deep reasoning alignment, optimized inference speed.

## 8. Deployment Plan

1.  **Hardware:** 1x GPU Instance (e.g., NVIDIA A6000 or H100 for training). 1x GPU Instance (L4 or T4 for inference).
2.  **Setup:**
    *   Install `cuda 12.4`.
    *   Run `docker-compose up -d` (Spins up Postgres + Valkey).
    *   Run training script (`python -m app.services.trainer`).
    *   Start vLLM server pointing to the fine-tuned adapter.
    *   Start FastAPI backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

This plan is **100% future-proof** (as of Feb 2026), relies on **zero external APIs**, and handles the **"Recruiter's Brain"** logic with state-of-the-art precision using modern distillation and efficient fine-tuning techniques.