"""Code generated by Speakeasy (https://speakeasy.com). DO NOT EDIT."""

from __future__ import annotations
from clerk_backend_api.types import (
    BaseModel,
    Nullable,
    OptionalNullable,
    UNSET,
    UNSET_SENTINEL,
)
from pydantic import model_serializer
from typing import List, Optional
from typing_extensions import NotRequired, TypedDict


class UpdateInstanceOrganizationSettingsRequestBodyTypedDict(TypedDict):
    enabled: NotRequired[Nullable[bool]]
    max_allowed_memberships: NotRequired[Nullable[int]]
    admin_delete_enabled: NotRequired[Nullable[bool]]
    domains_enabled: NotRequired[Nullable[bool]]
    domains_enrollment_modes: NotRequired[List[str]]
    r"""Specify which enrollment modes to enable for your Organization Domains.
    Supported modes are 'automatic_invitation' & 'automatic_suggestion'.
    """
    creator_role_id: NotRequired[Nullable[str]]
    r"""Specify what the default organization role is for an organization creator."""
    domains_default_role_id: NotRequired[Nullable[str]]
    r"""Specify what the default organization role is for the organization domains."""


class UpdateInstanceOrganizationSettingsRequestBody(BaseModel):
    enabled: OptionalNullable[bool] = UNSET

    max_allowed_memberships: OptionalNullable[int] = UNSET

    admin_delete_enabled: OptionalNullable[bool] = UNSET

    domains_enabled: OptionalNullable[bool] = UNSET

    domains_enrollment_modes: Optional[List[str]] = None
    r"""Specify which enrollment modes to enable for your Organization Domains.
    Supported modes are 'automatic_invitation' & 'automatic_suggestion'.
    """

    creator_role_id: OptionalNullable[str] = UNSET
    r"""Specify what the default organization role is for an organization creator."""

    domains_default_role_id: OptionalNullable[str] = UNSET
    r"""Specify what the default organization role is for the organization domains."""

    @model_serializer(mode="wrap")
    def serialize_model(self, handler):
        optional_fields = [
            "enabled",
            "max_allowed_memberships",
            "admin_delete_enabled",
            "domains_enabled",
            "domains_enrollment_modes",
            "creator_role_id",
            "domains_default_role_id",
        ]
        nullable_fields = [
            "enabled",
            "max_allowed_memberships",
            "admin_delete_enabled",
            "domains_enabled",
            "creator_role_id",
            "domains_default_role_id",
        ]
        null_default_fields = []

        serialized = handler(self)

        m = {}

        for n, f in type(self).model_fields.items():
            k = f.alias or n
            val = serialized.get(k)
            serialized.pop(k, None)

            optional_nullable = k in optional_fields and k in nullable_fields
            is_set = (
                self.__pydantic_fields_set__.intersection({n})
                or k in null_default_fields
            )  # pylint: disable=no-member

            if val is not None and val != UNSET_SENTINEL:
                m[k] = val
            elif val != UNSET_SENTINEL and (
                not k in optional_fields or (optional_nullable and is_set)
            ):
                m[k] = val

        return m
