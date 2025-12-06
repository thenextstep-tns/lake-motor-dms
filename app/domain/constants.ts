export enum TicketStatus {
    Queue = "Queue",
    Assigned = "Assigned",
    WaitingParts = "Waiting_Parts",
    InProgress = "In_Progress",
    QualityControl = "Quality_Control",
    Completed = "Completed",
}

export enum RepairDifficulty {
    Quick = "Quick",
    Medium = "Medium",
    Difficult = "Difficult",
}

export enum UserRoleType {
    SystemAdmin = "SystemAdmin",
    CompanyOwner = "CompanyOwner",
    LocationManager = "LocationManager",
    SalesManager = "SalesManager",
    ShopManager = "ShopManager",
    Technician = "Technician",
}

export enum ResourceType {
    Vehicle = "Vehicle",
    ServiceTicket = "ServiceTicket",
    Inspection = "Inspection",
    User = "User",
    Company = "Company",
    Lot = "Lot",
}

export enum ActionType {
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete",
    SoftDelete = "soft_delete",
    Manage = "manage", // All permissions
}

export const DEFAULT_ROLES = {
    [UserRoleType.SystemAdmin]: "System Admin",
    [UserRoleType.CompanyOwner]: "Company Owner",
    [UserRoleType.LocationManager]: "Location Manager",
    [UserRoleType.SalesManager]: "Sales Manager",
    [UserRoleType.ShopManager]: "Shop Manager",
    [UserRoleType.Technician]: "Technician",
} as const;
