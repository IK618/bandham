"""
Analogy: The Chat endpoint is like the postal dispatch room and private telegraph wire.
It lists active conversational correspondence threads, retrieves historical message scrolls,
and dispatches real-time text between mutually accepted matrimonial connections.
"""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_current_user, get_db
from backend.app.models.user import User
from backend.app.models.profile import Profile
from backend.app.models.safety import Block
from backend.app.models.chat import Conversation, ConversationParticipant, Message, MessageStatusEnum
from backend.app.schemas.interaction import ConversationResponse, MessageCreate, MessageResponse
from backend.app.api.v1.endpoints.interests import profile_to_card

router = APIRouter(prefix="/chat", tags=["Real-Time Chat & Messaging"])


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_my_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lists all active chat threads in which the user is a participant."""
    query = (
        select(Conversation)
        .join(ConversationParticipant)
        .where(ConversationParticipant.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
    )
    conversations = (await db.execute(query)).scalars().all()
    if not conversations:
        return []

    conv_ids = [conv.id for conv in conversations]

    # Batch fetch partner participants and profiles in a single join query
    p_stmt = (
        select(ConversationParticipant, Profile)
        .join(Profile, Profile.user_id == ConversationParticipant.user_id, isouter=True)
        .where(
            ConversationParticipant.conversation_id.in_(conv_ids),
            ConversationParticipant.user_id != current_user.id
        )
    )
    p_rows = (await db.execute(p_stmt)).all()
    partner_profiles = {row[0].conversation_id: row[1] for row in p_rows}

    # Batch fetch the single latest message for each conversation thread
    last_msg_stmt = (
        select(Message)
        .distinct(Message.conversation_id)
        .where(Message.conversation_id.in_(conv_ids))
        .order_by(Message.conversation_id, Message.created_at.desc())
    )
    last_messages = (await db.execute(last_msg_stmt)).scalars().all()
    last_msg_map = {msg.conversation_id: msg for msg in last_messages}

    responses: List[ConversationResponse] = []
    for conv in conversations:
        partner_prof = partner_profiles.get(conv.id)
        last_msg = last_msg_map.get(conv.id)

        last_msg_content = ""
        if last_msg:
            last_msg_content = "This message was deleted" if last_msg.is_deleted else last_msg.content

        responses.append(
            ConversationResponse(
                id=str(conv.id),
                partner_profile=profile_to_card(partner_prof) if partner_prof else None,
                last_message=MessageResponse(
                    id=str(last_msg.id),
                    conversation_id=str(last_msg.conversation_id),
                    sender_id=str(last_msg.sender_id),
                    content=last_msg_content,
                    status=last_msg.status,
                    created_at=last_msg.created_at,
                    is_deleted=last_msg.is_deleted,
                    deleted_at=last_msg.deleted_at
                ) if last_msg else None,
                unread_count=0,
                updated_at=conv.updated_at
            )
        )

    return responses


@router.get("/conversations/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves paginated message history for a specific conversation thread."""
    conv_uuid = uuid.UUID(conversation_id)

    # Verify membership
    membership = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id == current_user.id
        )
    )
    if not membership.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized: You are not a participant in this conversation.")

    # Check if communication is blocked with the other participant
    partner_part = (await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id != current_user.id
        )
    )).scalars().first()

    if partner_part:
        is_blocked = (await db.execute(
            select(Block).where(
                or_(
                    and_(Block.blocker_id == current_user.id, Block.blocked_user_id == partner_part.user_id),
                    and_(Block.blocker_id == partner_part.user_id, Block.blocked_user_id == current_user.id)
                )
            )
        )).scalars().first()
        if is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Messaging unavailable: Communication between these accounts is restricted."
            )

    query = (
        select(Message)
        .where(Message.conversation_id == conv_uuid)
        .order_by(Message.created_at.asc())
        .limit(limit)
    )
    messages = (await db.execute(query)).scalars().all()

    # Mark unread messages as READ
    for m in messages:
        if m.sender_id != current_user.id and m.status != MessageStatusEnum.READ:
            m.status = MessageStatusEnum.READ
    await db.commit()

    return [
        MessageResponse(
            id=str(m.id),
            conversation_id=str(m.conversation_id),
            sender_id=str(m.sender_id),
            content="This message was deleted" if m.is_deleted else m.content,
            status=m.status,
            created_at=m.created_at,
            is_deleted=m.is_deleted,
            deleted_at=m.deleted_at
        )
        for m in messages
    ]


@router.delete("/conversations/{conversation_id}/messages/{message_id}", status_code=status.HTTP_200_OK)
async def delete_message(
    conversation_id: str,
    message_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes own sent message in first person. Retains record for audit/investigation."""
    try:
        conv_uuid = uuid.UUID(conversation_id)
        msg_uuid = uuid.UUID(message_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format.")

    # Verify conversation membership
    membership = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id == current_user.id
        )
    )
    if not membership.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized: Not a participant in this conversation.")

    # Find the message
    msg = (await db.execute(
        select(Message).where(
            Message.id == msg_uuid,
            Message.conversation_id == conv_uuid
        )
    )).scalars().first()

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    # Enforce first-person deletion: Users can only delete their own chat!
    if msg.sender_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Permission denied: You can only delete your own sent messages."
        )

    now = datetime.now(timezone.utc)
    msg.is_deleted = True
    msg.deleted_at = now
    await db.commit()

    return {
        "message": "Message deleted successfully.",
        "id": str(msg.id),
        "is_deleted": True,
        "deleted_at": now.isoformat()
    }


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sends a new text message into a conversation thread."""
    conv_uuid = uuid.UUID(conversation_id)

    # Verify membership
    membership = await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id == current_user.id
        )
    )
    if not membership.scalars().first():
        raise HTTPException(status_code=403, detail="Unauthorized: You are not a participant in this conversation.")

    # Check if communication is blocked with the other participant
    partner_part = (await db.execute(
        select(ConversationParticipant).where(
            ConversationParticipant.conversation_id == conv_uuid,
            ConversationParticipant.user_id != current_user.id
        )
    )).scalars().first()

    if partner_part:
        is_blocked = (await db.execute(
            select(Block).where(
                or_(
                    and_(Block.blocker_id == current_user.id, Block.blocked_user_id == partner_part.user_id),
                    and_(Block.blocker_id == partner_part.user_id, Block.blocked_user_id == current_user.id)
                )
            )
        )).scalars().first()
        if is_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Messaging unavailable: Communication between these accounts is restricted."
            )

    msg = Message(
        conversation_id=conv_uuid,
        sender_id=current_user.id,
        content=payload.content,
        status=MessageStatusEnum.SENT
    )
    db.add(msg)

    # Update conversation updated_at
    conv = (await db.execute(select(Conversation).where(Conversation.id == conv_uuid))).scalars().first()
    if conv:
        conv.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(msg)

    return MessageResponse(
        id=str(msg.id),
        conversation_id=str(msg.conversation_id),
        sender_id=str(msg.sender_id),
        content=msg.content,
        status=msg.status,
        created_at=msg.created_at
    )
