"""
Analogy: Think of this Base model as the universal chassis and VIN stamping machine in an automobile plant.
Every vehicle built in the factory automatically gets standard mounting points, manufacturing timestamps,
and a globally unique chassis number, guaranteeing that all cars share the exact same structural genetics.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base class for all SQLAlchemy models in Bandhan."""
    pass


class TimestampMixin:
    """Reusable mixin providing created_at and updated_at UTC timestamps."""
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


class UUIDPrimaryKeyMixin:
    """Reusable mixin providing a UUID v4 primary key."""
    
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )
