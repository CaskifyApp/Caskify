# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Continued beta2 hardening for Local, Docker, and Cloud connection workflows

## [1.0.0-beta2] - 2026-04-21

### Added

- Local PostgreSQL auto-discovery with direct browse workflow
- Docker PostgreSQL detection with source-driven browse support
- Single-database Cloud connection workflow for saved manual profiles
- PostgreSQL type presets with custom fallback in table and column dialogs
- Local-only database creation entrypoint from the sidebar

### Improved

- Improved Docker tree refresh after external database changes
- Improved row editor validation for required primary key fields and UUID inputs
- Improved hidden source profile reuse for Local and Docker workflows
- Improved schema dialogs for testing-friendly defaults
- Improved source readability with connection badges and database type indicators

### Fixed

- Fixed Local browse flow creating visible Cloud connection entries
- Fixed manual primary keys without defaults being hidden during row inserts
- Fixed Cloud connections browsing all databases instead of the selected database only
- Fixed Docker browse flow requiring manual connection setup for detected containers
- Fixed stale Docker database lists after container-side changes

### Known Limitations

- Docker discovery still relies on polling and manual refresh instead of true event-driven updates
- Hidden source-backed profiles are internal implementation details and not yet managed by dedicated cleanup routines
- Release metadata and packaged artifacts still need the final beta2 version bump before publishing

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
