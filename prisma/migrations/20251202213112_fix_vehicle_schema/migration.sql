-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "vin" TEXT NOT NULL PRIMARY KEY,
    "stockNumber" TEXT,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT,
    "bodyStyle" TEXT,
    "color" TEXT,
    "interiorColor" TEXT,
    "odometer" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT DEFAULT 'Used',
    "titleStatus" TEXT DEFAULT 'Clean',
    "keyId" TEXT,
    "engineSize" TEXT,
    "engineCylinders" INTEGER,
    "transmissionType" TEXT,
    "transmissionSpeeds" INTEGER,
    "driveTrain" TEXT,
    "fuelType" TEXT,
    "doors" INTEGER,
    "cityMpg" INTEGER,
    "highwayMpg" INTEGER,
    "location" TEXT,
    "salesPerson" TEXT,
    "guarantee" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isCertified" BOOLEAN NOT NULL DEFAULT false,
    "isOneOwner" BOOLEAN NOT NULL DEFAULT false,
    "warrantyAvailable" BOOLEAN NOT NULL DEFAULT false,
    "financingAvailable" BOOLEAN NOT NULL DEFAULT false,
    "purchasePrice" DECIMAL NOT NULL DEFAULT 0,
    "salePrice" DECIMAL NOT NULL DEFAULT 0,
    "regularPrice" DECIMAL,
    "cashPrice" DECIMAL,
    "wholesalePrice" DECIMAL,
    "loanValue" DECIMAL,
    "msrp" DECIMAL,
    "tax" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "balance" DECIMAL NOT NULL DEFAULT 0,
    "seoTitle" TEXT,
    "seoKeywords" TEXT,
    "seoDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PURCHASED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Vehicle" ("balance", "color", "createdAt", "guarantee", "keyId", "make", "model", "odometer", "purchasePrice", "salePrice", "status", "tax", "titleStatus", "total", "trim", "updatedAt", "vin", "year") SELECT "balance", "color", "createdAt", "guarantee", "keyId", "make", "model", "odometer", "purchasePrice", "salePrice", "status", "tax", "titleStatus", "total", "trim", "updatedAt", "vin", "year" FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
