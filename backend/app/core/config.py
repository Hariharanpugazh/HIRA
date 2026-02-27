from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="recruiter-brain-backend", alias="APP_NAME")
    app_env: str = Field(default="production", alias="APP_ENV")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    api_host: str = Field(default="0.0.0.0", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")
    api_workers: int = Field(default=2, alias="API_WORKERS")
    cors_origins: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")
    api_key_required: bool = Field(default=True, alias="API_KEY_REQUIRED")
    api_key: str = Field(default="change-this-api-key", alias="API_KEY")

    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@postgres:5432/recruiter_brain",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://valkey:6379/0", alias="REDIS_URL")

    llm_base_url: str = Field(default="http://llm:8080/v1", alias="LLM_BASE_URL")
    llm_model: str = Field(default="qwen2.5-1.5b-instruct-q4_k_m", alias="LLM_MODEL")
    llm_timeout_seconds: float = Field(default=45.0, alias="LLM_TIMEOUT_SECONDS")
    llm_enabled: bool = Field(default=True, alias="LLM_ENABLED")
    llm_temperature: float = Field(default=0.1, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=512, alias="LLM_MAX_TOKENS")

    max_upload_bytes: int = Field(default=15_000_000, alias="MAX_UPLOAD_BYTES")
    cache_ttl_seconds: int = Field(default=900, alias="CACHE_TTL_SECONDS")
    max_batch_candidates: int = Field(default=200, alias="MAX_BATCH_CANDIDATES")

    rank_weight_llm: float = Field(default=0.70, alias="RANK_WEIGHT_LLM")
    rank_weight_hard_skill: float = Field(default=0.20, alias="RANK_WEIGHT_HARD_SKILL")
    rank_weight_experience: float = Field(default=0.10, alias="RANK_WEIGHT_EXPERIENCE")
    overclaim_penalty: float = Field(default=1.0, alias="OVERCLAIM_PENALTY")

    @property
    def cors_origins_list(self) -> list[str]:
        if not self.cors_origins:
            return ["http://localhost:3000"]
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
