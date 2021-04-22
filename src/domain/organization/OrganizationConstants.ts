export enum UniversityRoles {
    STUDENT = "STUDENT",
    STAFF = "STAFF",
    REMEDIATOR = "REMEDIATOR",
}

export enum DomainAccess {
    AUTO = "AUTO",
    MANUAL = "MANUAL",
    NONE = "NONE",
}

export enum DomainAccessStatus {
    VERIFIED = "VERIFIED",
    NOT_VERIFIED = "NOT_VERIFIED",
    PENDING = "PENDING",
    REJECTED = "REJECTED",
}

export enum UniversityAccountStatus {
    CREATED = "CREATED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export enum EscalationsHandledBy {
    UNIVERSITY = "UNIVERSITY",
    I_STEM = "I_STEM",
    NONE = "NONE",
}

export enum HandleAccessibilityRequests {
    AUTO = "AUTO",
    MANUAL = "MANUAL",
    ASK_USER = "ASK_USER",
}

export enum OrganizationRequestStatus {
    REQUESTED = "REQUESTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
}

export enum OrganizationRequestedType {
    BUSINESS = "BUSINESS",
    UNIVERSITY = "UNIVERSITY",
}
