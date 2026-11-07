import re
from urllib.parse import urlsplit
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class ShopSettings(BaseModel):
    model_config = ConfigDict(extra="forbid")
    brand_name: str = Field(default="RP Modas Cereja", min_length=2, max_length=50)
    whatsapp: str = Field(default="", max_length=30)
    instagram_enabled: bool = False
    instagram_profile: str = Field(default="", max_length=200)
    tiktok_enabled: bool = False
    tiktok_profile: str = Field(default="", max_length=200)

    @field_validator("instagram_profile", "tiktok_profile")
    @classmethod
    def normalize_profile(cls, value, info):
        value = value.strip()
        network = "instagram" if info.field_name == "instagram_profile" else "tiktok"
        if "://" in value:
            parsed = urlsplit(value)
            if parsed.scheme != "https" or parsed.hostname not in {network + ".com", "www." + network + ".com"}:
                raise ValueError("Use um perfil da própria rede social ou apenas o @usuário.")
            value = parsed.path.strip("/")
        value = value.removeprefix("@")
        maximum = 30 if network == "instagram" else 24
        if value and not re.fullmatch(r"[A-Za-z0-9_.]{1," + str(maximum) + r"}", value):
            raise ValueError("Informe um nome de usuário válido, sem espaços ou caminhos adicionais.")
        return value

    @model_validator(mode="after")
    def profiles_when_enabled(self):
        if self.instagram_enabled and not self.instagram_profile:
            raise ValueError("Informe o perfil do Instagram ou desative o botão.")
        if self.tiktok_enabled and not self.tiktok_profile:
            raise ValueError("Informe o perfil do TikTok ou desative o botão.")
        return self

    @field_validator("brand_name")
    @classmethod
    def trim_brand(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Informe o nome da marca.")
        return value

    @field_validator("whatsapp")
    @classmethod
    def normalize_phone(cls, value):
        digits = "".join(c for c in value if c in "0123456789")
        if digits and not 10 <= len(digits) <= 15:
            raise ValueError("Informe o número com código do país e DDD, por exemplo 55 + DDD + número.")
        return digits
