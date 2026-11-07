from typing import Literal
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ProductInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=1, max_length=60)
    description: str = Field(default="", max_length=1000)
    price_cents: int = Field(gt=0, le=10_000_000, strict=True)
    compare_price_cents: int | None = Field(default=None, gt=0, le=10_000_000, strict=True)
    sizes: list[str] = Field(min_length=1, max_length=12)
    color: str = Field(default="", max_length=60)
    stock: int = Field(default=0, ge=0, le=100_000, strict=True)
    image_url: str = Field(default="", max_length=2000)
    atlas: int | None = Field(default=None, ge=0, le=5)
    status: Literal["active", "draft"] = "active"
    featured: bool = False

    @field_validator("name", "description", "color", "category")
    @classmethod
    def trim_text(cls, value):
        return value.strip()

    @field_validator("sizes")
    @classmethod
    def normalize_sizes(cls, values):
        result = list(dict.fromkeys(v.strip().upper() for v in values if v.strip()))
        if not result or any(len(v) > 12 for v in result):
            raise ValueError("Informe ao menos um tamanho válido (até 12 caracteres).")
        return result

    @field_validator("image_url")
    @classmethod
    def valid_image(cls, value):
        if not value:
            return value
        if value.startswith("/uploads/") and ".." not in value and "?" not in value and "#" not in value:
            return value
        parsed = urlsplit(value)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            raise ValueError("Use uma URL HTTP/HTTPS ou uma foto enviada pelo painel.")
        return value

    @model_validator(mode="after")
    def valid_prices(self):
        if self.compare_price_cents is not None and self.compare_price_cents <= self.price_cents:
            raise ValueError("O preço anterior deve ser maior que o preço atual.")
        if len(self.name) < 2:
            raise ValueError("Informe o nome da peça.")
        if not self.category:
            raise ValueError("Escolha uma categoria.")
        return self
