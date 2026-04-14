# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Renamed core product identity from CaskPG to Caskify in app metadata and docs

## [1.0.0-beta1] - 2026-04-12

### Added

- Multiple PostgreSQL connection profile management for Linux desktop workflows
- Database tree browsing for databases, schemas, tables, and views
- Table data browsing with pagination, sorting, filtering, and row selection
- Row insert, edit, and delete dialogs
- SQL query editor with keyboard shortcuts and autocomplete hints
- Saved queries and query history workflows
- Table structure, index, and foreign key inspection
- Database backup and restore helper actions
- Linux packaging support for AppImage, Debian, RPM, and Arch outputs

### Improved

- Hardened credential handling between frontend and backend
- Improved settings dialog layout and scrolling behavior
- Improved welcome screen with connection-focused beta entry points
- Improved connection runtime stability for multi-database usage
- Improved safety checks before restore operations

### Fixed

- Fixed unstable table rendering caused by row virtualization inside native table layout
- Fixed query cancellation flow so the active running query can be cancelled reliably
- Fixed local version metadata for the beta release target
- Fixed query result handling to reduce the risk of UI freezes on very large result sets

### Known Limitations

- Query result previews are intentionally capped to keep the application responsive
- Linux packaging is ready for beta distribution, but wider distro validation is still in progress
- Public beta feedback is still needed for hosted PostgreSQL providers and remote Linux environments
