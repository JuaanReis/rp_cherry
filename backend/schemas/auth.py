from pydantic import BaseModel, ConfigDict, Field, SecretStr


class LoginInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    password: SecretStr = Field(max_length=512)
