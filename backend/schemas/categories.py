from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=60)

    @field_validator("name")
    @classmethod
    def trim_name(cls, value):
        value = " ".join(value.split())
        if not value:
            raise ValueError("Informe o nome da categoria.")
        return value
