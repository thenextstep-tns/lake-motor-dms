-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "vin" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "color" TEXT,
    "odometer" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PURCHASED',
    "purchasePrice" DECIMAL NOT NULL DEFAULT 0,
    "salePrice" DECIMAL NOT NULL DEFAULT 0,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "keyId" TEXT,
    "titleStatus" TEXT,
    "guarantee" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VehicleImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "driveId" TEXT NOT NULL,
    "publicUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "vehicleVin" TEXT NOT NULL,
    CONSTRAINT "VehicleImage_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle" ("vin") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "oldPrice" DECIMAL NOT NULL,
    "newPrice" DECIMAL NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleVin" TEXT NOT NULL,
    CONSTRAINT "PriceHistory_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle" ("vin") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "vehicleVin" TEXT NOT NULL,
    "techId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ServiceTicket_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle" ("vin") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceTicket_techId_fkey" FOREIGN KEY ("techId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "vendor" TEXT,
    "trackingNumber" TEXT,
    "cost" DECIMAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "ticketId" TEXT NOT NULL,
    CONSTRAINT "Part_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" DATETIME,
    "type" TEXT NOT NULL DEFAULT 'PRODUCTIVE',
    "ticketId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "TimeLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ServiceTicket" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" DECIMAL NOT NULL,
    "method" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "vehicleVin" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deposit_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle" ("vin") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "vehicleVin" TEXT,
    "assignedToId" TEXT,
    CONSTRAINT "Task_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle" ("vin") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
