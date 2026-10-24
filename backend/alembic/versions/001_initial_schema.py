"""Initial Bandhan Matrimonial Schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-24 21:00:00

Analogy: This migration script is the concrete foundation pour of our entire digital infrastructure.
It creates all 16 relational tables, establishes PostgreSQL ENUM types, sets foreign key cascade rules,
and builds high-performance B-tree and Trigram fuzzy search indices in a single atomic database transaction.
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable PostgreSQL Extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

    # 2. Create Tables
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("phone_number", sa.String(20), unique=True, index=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.Enum("MEMBER", "MODERATOR", "ADMIN", name="user_role_enum"), nullable=False, index=True),
        sa.Column("status", sa.Enum("PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "DEACTIVATED", "BANNED", name="user_status_enum"), nullable=False, index=True),
        sa.Column("email_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("phone_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("profile_id_display", sa.String(16), unique=True, index=True, nullable=False),
        sa.Column("created_by", sa.Enum("SELF", "PARENT", "SIBLING", "RELATIVE", "FRIEND", name="created_by_enum"), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("gender", sa.Enum("MALE", "FEMALE", "OTHER", name="gender_enum"), nullable=False, index=True),
        sa.Column("date_of_birth", sa.Date(), nullable=False, index=True),
        sa.Column("height_cm", sa.Integer(), nullable=False, index=True),
        sa.Column("marital_status", sa.Enum("NEVER_MARRIED", "DIVORCED", "WIDOWED", "AWAITING_DIVORCE", name="marital_status_enum"), nullable=False, index=True),
        sa.Column("religion", sa.String(64), nullable=False, index=True),
        sa.Column("mother_tongue", sa.String(64), nullable=False, index=True),
        sa.Column("community", sa.String(64), nullable=False, index=True),
        sa.Column("sub_community", sa.String(64), nullable=True),
        sa.Column("gotra", sa.String(64), nullable=True),
        sa.Column("manglik", sa.Enum("YES", "NO", "DONT_KNOW", "ANGSHIK", name="manglik_enum"), nullable=False, index=True),
        sa.Column("highest_education", sa.String(128), nullable=False, index=True),
        sa.Column("education_field", sa.String(128), nullable=False),
        sa.Column("college_name", sa.String(255), nullable=True),
        sa.Column("employment_sector", sa.Enum("PRIVATE", "GOVERNMENT", "DEFENSE", "BUSINESS", "SELF_EMPLOYED", "NOT_WORKING", name="employment_sector_enum"), nullable=False),
        sa.Column("occupation", sa.String(128), nullable=False, index=True),
        sa.Column("annual_income_bracket", sa.String(64), nullable=False, index=True),
        sa.Column("residence_city", sa.String(128), nullable=False, index=True),
        sa.Column("residence_state", sa.String(128), nullable=False, index=True),
        sa.Column("residence_country", sa.String(64), default="India", nullable=False, index=True),
        sa.Column("citizenship", sa.String(64), default="Indian", nullable=False),
        sa.Column("family_type", sa.Enum("NUCLEAR", "JOINT", name="family_type_enum"), nullable=False),
        sa.Column("family_values", sa.Enum("TRADITIONAL", "MODERATE", "LIBERAL", name="family_values_enum"), nullable=False),
        sa.Column("diet", sa.Enum("VEGETARIAN", "NON_VEGETARIAN", "EGGETARIAN", "VEGAN", "JAIN", name="diet_enum"), nullable=False, index=True),
        sa.Column("smoking", sa.Enum("NO", "OCCASIONALLY", "YES", name="smoking_enum"), nullable=False),
        sa.Column("drinking", sa.Enum("NO", "OCCASIONALLY", "YES", name="drinking_enum"), nullable=False),
        sa.Column("bio_narrative", sa.Text(), nullable=False),
        sa.Column("profile_completeness_pct", sa.Integer(), default=50, nullable=False),
        sa.Column("is_searchable", sa.Boolean(), default=True, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    # Trigram Indexes for Fuzzy Search
    op.execute("CREATE INDEX idx_profiles_bio_trgm ON profiles USING gin (bio_narrative gin_trgm_ops);")
    op.execute("CREATE INDEX idx_profiles_occupation_trgm ON profiles USING gin (occupation gin_trgm_ops);")

    op.create_table(
        "partner_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("min_age", sa.Integer(), default=21, nullable=False),
        sa.Column("max_age", sa.Integer(), default=35, nullable=False),
        sa.Column("min_height_cm", sa.Integer(), default=140, nullable=False),
        sa.Column("max_height_cm", sa.Integer(), default=200, nullable=False),
        sa.Column("acceptable_marital_statuses", postgresql.JSONB(), nullable=False),
        sa.Column("acceptable_religions", postgresql.JSONB(), nullable=False),
        sa.Column("acceptable_communities", postgresql.JSONB(), nullable=False),
        sa.Column("acceptable_mother_tongues", postgresql.JSONB(), nullable=False),
        sa.Column("acceptable_countries", postgresql.JSONB(), nullable=False),
        sa.Column("acceptable_cities", postgresql.JSONB(), nullable=False),
        sa.Column("min_education_level", sa.String(64), nullable=True),
        sa.Column("acceptable_employment_sectors", postgresql.JSONB(), nullable=False),
        sa.Column("min_income_bracket", sa.String(64), nullable=True),
        sa.Column("acceptable_diets", postgresql.JSONB(), nullable=False),
        sa.Column("manglik_preference", sa.Enum("STRICT_MATCH", "DOES_NOT_MATTER", name="manglik_preference_enum"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "photos",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("s3_key_original", sa.String(512), nullable=False),
        sa.Column("s3_key_thumbnail", sa.String(512), nullable=False),
        sa.Column("s3_key_watermarked", sa.String(512), nullable=False),
        sa.Column("is_primary", sa.Boolean(), default=False, nullable=False, index=True),
        sa.Column("is_approved", sa.Boolean(), default=False, nullable=False, index=True),
        sa.Column("visibility_mode", sa.Enum("PUBLIC", "MEMBERS_ONLY", "ACCEPTED_ONLY", "ON_REQUEST", name="photo_visibility_enum"), nullable=False),
        sa.Column("sort_order", sa.Integer(), default=0, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "interests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("recipient_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("status", sa.Enum("PENDING", "ACCEPTED", "DECLINED", "CANCELLED", "EXPIRED", name="interest_status_enum"), nullable=False, index=True),
        sa.Column("greeting_message", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("sender_id", "recipient_id", name="uq_interests_sender_recipient"),
    )

    op.create_table(
        "shortlists",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("shortlisted_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("notes", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "shortlisted_user_id", name="uq_shortlists_user_target"),
    )

    op.create_table(
        "contact_views",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("viewer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("target_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("ip_address", sa.String(45), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "conversation_participants",
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_read_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("sender_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("SENT", "DELIVERED", "READ", name="message_status_enum"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "plans",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(64), unique=True, nullable=False),
        sa.Column("duration_months", sa.Integer(), nullable=False),
        sa.Column("price_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), default="INR", nullable=False),
        sa.Column("contact_credits_quota", sa.Integer(), default=0, nullable=False),
        sa.Column("can_initiate_chat", sa.Boolean(), default=False, nullable=False),
        sa.Column("can_view_hidden_photos", sa.Boolean(), default=False, nullable=False),
        sa.Column("priority_boost", sa.Integer(), default=1, nullable=False),
        sa.Column("is_active", sa.Boolean(), default=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("plan_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("plans.id"), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "EXPIRED", "CANCELLED", name="subscription_status_enum"), nullable=False, index=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("contact_credits_remaining", sa.Integer(), default=0, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "payments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("subscription_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("subscriptions.id"), nullable=False, index=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("currency", sa.String(3), default="INR", nullable=False),
        sa.Column("payment_gateway", sa.String(32), default="STUB", nullable=False),
        sa.Column("transaction_ref", sa.String(128), unique=True, index=True, nullable=False),
        sa.Column("status", sa.Enum("PENDING", "COMPLETED", "FAILED", "REFUNDED", name="payment_status_enum"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "verifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("verification_type", sa.Enum("GOVERNMENT_ID", "SELFIE_LIVENESS", "SALARY_SLIP", name="verification_type_enum"), nullable=False),
        sa.Column("document_s3_key", sa.String(512), nullable=False),
        sa.Column("status", sa.Enum("PENDING", "APPROVED", "REJECTED", name="verification_status_enum"), nullable=False, index=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("reviewed_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("reported_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("category", sa.Enum("FAKE_PROFILE", "HARASSMENT", "FINANCIAL_SCAM", "MARRIED_FRAUD", "INAPPROPRIATE_MEDIA", name="report_category_enum"), nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("attached_chat_context", postgresql.JSONB(), nullable=True),
        sa.Column("status", sa.Enum("PENDING", "UNDER_REVIEW", "RESOLVED", "DISMISSED", name="report_status_enum"), nullable=False, index=True),
        sa.Column("resolved_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "blocks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("blocker_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("blocked_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("blocker_id", "blocked_user_id", name="uq_blocks_blocker_blocked"),
    )

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(128), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.Enum("INTEREST_RECEIVED", "INTEREST_ACCEPTED", "CONTACT_VIEWED", "MESSAGE_RECEIVED", "SYSTEM", name="notification_type_enum"), nullable=False),
        sa.Column("reference_link", sa.String(255), nullable=True),
        sa.Column("is_read", sa.Boolean(), default=False, nullable=False, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("action", sa.String(64), nullable=False, index=True),
        sa.Column("resource_type", sa.String(64), nullable=False, index=True),
        sa.Column("resource_id", sa.String(128), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    # Drop tables in reverse order of foreign key dependency
    op.drop_table("audit_logs")
    op.drop_table("notifications")
    op.drop_table("blocks")
    op.drop_table("reports")
    op.drop_table("verifications")
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("plans")
    op.drop_table("messages")
    op.drop_table("conversation_participants")
    op.drop_table("conversations")
    op.drop_table("contact_views")
    op.drop_table("shortlists")
    op.drop_table("interests")
    op.drop_table("photos")
    op.drop_table("partner_preferences")
    op.drop_table("profiles")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS notification_type_enum;")
    op.execute("DROP TYPE IF EXISTS report_status_enum;")
    op.execute("DROP TYPE IF EXISTS report_category_enum;")
    op.execute("DROP TYPE IF EXISTS verification_status_enum;")
    op.execute("DROP TYPE IF EXISTS verification_type_enum;")
    op.execute("DROP TYPE IF EXISTS payment_status_enum;")
    op.execute("DROP TYPE IF EXISTS subscription_status_enum;")
    op.execute("DROP TYPE IF EXISTS message_status_enum;")
    op.execute("DROP TYPE IF EXISTS interest_status_enum;")
    op.execute("DROP TYPE IF EXISTS photo_visibility_enum;")
    op.execute("DROP TYPE IF EXISTS manglik_preference_enum;")
    op.execute("DROP TYPE IF EXISTS drinking_enum;")
    op.execute("DROP TYPE IF EXISTS smoking_enum;")
    op.execute("DROP TYPE IF EXISTS diet_enum;")
    op.execute("DROP TYPE IF EXISTS family_values_enum;")
    op.execute("DROP TYPE IF EXISTS family_type_enum;")
    op.execute("DROP TYPE IF EXISTS employment_sector_enum;")
    op.execute("DROP TYPE IF EXISTS manglik_enum;")
    op.execute("DROP TYPE IF EXISTS marital_status_enum;")
    op.execute("DROP TYPE IF EXISTS gender_enum;")
    op.execute("DROP TYPE IF EXISTS created_by_enum;")
    op.execute("DROP TYPE IF EXISTS user_status_enum;")
    op.execute("DROP TYPE IF EXISTS user_role_enum;")
