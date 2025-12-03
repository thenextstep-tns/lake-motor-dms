# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Image Management**: Implemented native Drag-and-Drop for vehicle images in the "Add/Edit Vehicle" form.
- **Image Management**: Added a "Visible/Hidden" toggle for images that persists to the database.
- **Image Optimization**: Implemented thumbnail proxying to prevent Out-of-Memory errors when loading many images.

### Changed
- **UI**: Updated `AddVehicleForm` to remove old "Up/Down" buttons and replace them with drag-and-drop interaction.
- **UI**: Improved the visual style of the visibility toggle badge.
- **Public View**: Updated `VehicleGallery` to filter out hidden images and use thumbnails for the grid view.
