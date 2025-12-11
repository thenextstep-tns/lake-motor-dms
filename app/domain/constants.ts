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
    HR = "HR",
    Accountant = "Accountant",
    Detailer = "Detailer",
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
    [UserRoleType.HR]: "HR",
    [UserRoleType.Accountant]: "Accountant",
    [UserRoleType.Detailer]: "Detailer",
} as const;

export const VEHICLE_COLORS = [
    'Beige', 'Black', 'Blue', 'Bronze', 'Brown', 'Burgundy', 'Camel', 'Charcoal', 'Cream',
    'Dark Blue', 'Dark Green', 'Gold', 'Gray', 'Green', 'Light Blue', 'Light Green',
    'Maroon', 'Orange', 'Pearl', 'Pewter', 'Pink', 'Purple', 'Red', 'Silver', 'Tan',
    'Teal', 'White', 'Yellow', 'Other'
];

export const VEHICLE_CATEGORIES = [
    'Compact', 'Station Wagon', 'Convertible', 'Sports', 'Hatchback', 'Pickup',
    'SUV', 'Minivan', 'Sprinter Van', 'Cargo Van', 'Luxury', 'Commercial', 'Other'
];

export const VEHICLE_FUEL_TYPES = [
    'Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Flex Fuel', 'Other'
];

export const VEHICLE_BODY_STYLES = [
    'Sedan', 'Coupe', 'Hatchback', 'Convertible', 'SUV', 'Truck', 'Van', 'Wagon', 'Other'
];

export const VEHICLE_DRIVETRAINS = [
    'FWD', 'RWD', 'AWD', '4WD', '4x4'
];

export const VEHICLE_TRANSMISSION_TYPES = [
    'Automatic', 'Manual', 'CVT', 'DCT', 'Other'
];
