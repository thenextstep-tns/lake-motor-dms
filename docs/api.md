# Lake Motor Group DMS - API Documentation

## Overview
The DMS uses Next.js Server Actions for data mutation and Server Components for data fetching.

## Authentication
RBAC is enforced via `checkPermission(user, role)` in `lib/auth.ts`.
Default Role: `ADMIN`.

## Modules

### 1. Inventory (`app/actions/vehicle.ts`)
- `getVehicles()`: Returns all vehicles.
- `createVehicle(data)`: Creates a new vehicle (Admin only).
- `updateVehicleStatus(vin, status)`: Transitions vehicle state (State Machine enforced).
- `uploadVehicleImage(formData)`: Uploads image to Google Drive (Mocked) and links to Vehicle.

### 2. Service (`app/actions/service.ts`)
- `createServiceTicket(data)`: Opens a new repair ticket.
- `clockIn(ticketId, userId)`: Starts a productive time log.
- `clockOut(userId)`: Ends the current time log.
- `addPart(data)`: Adds a part to a ticket.

### 3. Marketing (`app/actions/marketing.ts`)
- `generateSeoDescription(vin)`: Uses AI (Mocked) to generate listing text.
- `GET /api/feeds/cars-com`: Generates CSV feed for Cars.com.

### 4. Sales (`app/actions/sales.ts`)
- `createDeposit(data)`: Records a deposit.
- `getTasks(userId)`: Returns tasks for a user.

## Data Models
See `prisma/schema.prisma` for full entity relationships.
