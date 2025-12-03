# Frontend Overview

## Admin Portal
- **Dashboard** (`/dashboard`): High-level stats, My Tasks, Recent Deposits.
- **Inventory** (`/inventory`): Kanban board grouped by Status.
- **Vehicle Detail** (`/inventory/[vin]`):
  - Edit vehicle details.
  - Drag & Drop Google Drive Gallery.
  - Toggle Public/Private images.
- **Service** (`/service`): List of active tickets.
- **Ticket Detail** (`/service/[id]`):
  - Tech Clock In/Out.
  - Parts list.
  - Inspection notes.

## Public Site
- **Inventory** (`/public/inventory`): Grid view of "POSTED" vehicles.
- **Vehicle Detail** (`/public/inventory/[vin]`): SEO-optimized listing page with public images only.

## Styling
- **Tailwind CSS**: Used for all styling.
- **Responsive**: Mobile-friendly layouts for Techs (Service) and Customers (Public).
