from pydantic import BaseModel, Field, field_validator
from backend.schemas.products import ProductInput


class ImportInput(BaseModel):
    products: list[ProductInput] = Field(max_length=2000)
    categories: list[str] = Field(default_factory=list, max_length=200)

    @field_validator("categories")
    @classmethod
    def valid_categories(cls, values):
        result = [" ".join(value.split()) for value in values]
        if any(not value or len(value) > 60 for value in result):
            raise ValueError("As categorias precisam ter de 1 a 60 caracteres.")
        return result
