from pydantic import BaseModel, ConfigDict, Field


class CartItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_id: str = Field(min_length=1, max_length=50)
    size: str = Field(min_length=1, max_length=12)
    quantity: int = Field(ge=1, le=99, strict=True)


class CheckoutInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    items: list[CartItem] = Field(min_length=1, max_length=50)
