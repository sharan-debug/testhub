import uuid
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from typing import List, Optional


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class ApiEndpoint(BaseModel):
    curl: str = ""
    description: str = ""


class KeyValueItem(BaseModel):
    key: str = ""
    description: str = ""


class Feature(BaseModel):
    id: str = Field(default_factory=lambda: f"feat_{uuid.uuid4().hex[:12]}")
    name: str
    core_feature_id: str = ""
    description: str = ""
    owner: str = ""
    tags: List[str] = Field(default_factory=list)
    jira_ticket: str = ""
    status: str = "active"
    test_data: str = ""
    test_steps: str = ""
    mocking_steps: str = ""
    apis: List[ApiEndpoint] = Field(default_factory=list)
    mongo_collections: List[KeyValueItem] = Field(default_factory=list)
    redis_keys: List[KeyValueItem] = Field(default_factory=list)
    experiments: List[KeyValueItem] = Field(default_factory=list)
    contributors: List[str] = Field(default_factory=list)
    created_by: str = ""
    updated_by: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)
    last_verified_at: Optional[str] = None
    last_verified_by: Optional[str] = None


class FeatureCreate(BaseModel):
    name: str
    core_feature_id: str = ""
    description: str = ""
    tags: List[str] = Field(default_factory=list)
    jira_ticket: str = ""
    test_data: str = ""
    test_steps: str = ""
    mocking_steps: str = ""
    apis: List[ApiEndpoint] = Field(default_factory=list)
    mongo_collections: List[KeyValueItem] = Field(default_factory=list)
    redis_keys: List[KeyValueItem] = Field(default_factory=list)
    experiments: List[KeyValueItem] = Field(default_factory=list)


class FeatureUpdate(BaseModel):
    name: Optional[str] = None
    core_feature_id: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    jira_ticket: Optional[str] = None
    status: Optional[str] = None
    test_data: Optional[str] = None
    test_steps: Optional[str] = None
    mocking_steps: Optional[str] = None
    apis: Optional[List[ApiEndpoint]] = None
    mongo_collections: Optional[List[KeyValueItem]] = None
    redis_keys: Optional[List[KeyValueItem]] = None
    experiments: Optional[List[KeyValueItem]] = None


class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: str = ""
    role: str = "editor"
    created_at: str = Field(default_factory=now_iso)


class UserRoleUpdate(BaseModel):
    role: str


class LoginIn(BaseModel):
    email: str
    password: str


class RegisterIn(BaseModel):
    email: str
    password: str
    name: str = ""


class CoreFeature(BaseModel):
    id: str = Field(default_factory=lambda: f"cf_{uuid.uuid4().hex[:12]}")
    name: str
    description: str = ""
    status: str = "active"
    created_by: str = ""
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


class CoreFeatureCreate(BaseModel):
    name: str
    description: str = ""


class CoreFeatureUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None
