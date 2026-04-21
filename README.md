# Caskify

Native PostgreSQL manager for Linux.

`Caskify` is a Linux-first desktop client for PostgreSQL built with `Wails`, `Go`, `React`, and `TypeScript`. It focuses on fast startup, native desktop integration, secure local credential storage, and a practical workflow for developers who work with PostgreSQL every day.

## Beta Status

Current release target: `1.0.0-beta2`

This beta is intended for real-world testing before the stable `1.0.0` release. Core workflows are implemented and usable, but you should still expect rough edges and report issues you find.

Beta2 focuses on the new source-driven workflow split:

- `Local Databases`: auto-discovered native PostgreSQL with direct browse
- `Docker Databases`: detected PostgreSQL containers with direct browse
- `Cloud Connections`: saved manual profiles scoped to a single database

## Core Features

- Multiple PostgreSQL connection profiles
- Secure password storage through Linux keyring integration
- Database, schema, table, and view browser
- Table data viewer with pagination, sorting, and filtering
- Row insert, edit, and delete workflows
- SQL query editor with shortcuts and autocomplete hints
- Saved queries and query history
- Table structure, indexes, and foreign key inspection
- Database backup and restore helpers
- AppImage, `.deb`, `.rpm`, and Arch packaging support

## Why Caskify

- Native Linux desktop app instead of a browser wrapper
- Lightweight runtime compared to Electron or Java-based database clients
- Focused on PostgreSQL instead of trying to be a universal database toolbox
- Designed around common developer workflows: inspect tables, edit rows, run queries, save snippets

## Installation

### AppImage

```bash
chmod +x caskify_1.0.0-beta2_amd64.AppImage
./caskify_1.0.0-beta2_amd64.AppImage
```

### Debian / Ubuntu

```bash
sudo dpkg -i caskify_1.0.0-beta2_amd64.deb
```

### Fedora / RHEL / openSUSE

```bash
sudo rpm -i caskify_1.0.0-beta2-1.x86_64.rpm
```

### Arch Linux

Build from the generated `PKGBUILD` package output or install through your preferred AUR workflow once the package is published.

## Quick Start

### Test a local PostgreSQL server

Use these connection values as a baseline:

- `Host`: `localhost`
- `Port`: `5432`
- `Database`: `postgres` or your own database
- `SSL Mode`: `disable`

After startup, Local databases should appear automatically in the sidebar. Use `Browse` to open the database tree without creating a visible saved connection.

### Test a Supabase database

Use the database credentials from **Project Settings -> Database**:

- `Host`: your Supabase database host
- `Port`: `5432`
- `Database`: usually `postgres`
- `SSL Mode`: `require`

Cloud profiles are database-scoped in beta2. One saved connection should represent one target database.

### Test a Docker PostgreSQL container

Run a sample PostgreSQL container:

```bash
docker run --name caskify-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=app_db \
  -p 55432:5432 \
  -d postgres:16
```

Then verify:

```bash
docker ps
```

The container should appear under `Docker Databases`. Use `Browse` to inspect all databases currently available in that container.

### Basic smoke test queries

```sql
select version();
select current_database();
```

```sql
select table_schema, table_name
from information_schema.tables
order by table_schema, table_name
limit 20;
```

## Development

### Requirements

- Go `1.21+`
- Node.js `18+`
- `pnpm`
- `libgtk-3-dev`
- `libwebkit2gtk-4.1-dev`
- `libsecret-1-dev`

### Install dependencies

```bash
pnpm --dir frontend install
go mod download
```

### Run in development

```bash
wails dev
```

### Build frontend

```bash
pnpm --dir frontend build
```

### Run tests

```bash
rtk go test ./...
pnpm --dir frontend build
```

## Packaging

Use the packaging script to create Linux artifacts:

```bash
VERSION=1.0.0-beta2 bash build/packaging/release.sh appimage
VERSION=1.0.0-beta2 bash build/packaging/release.sh deb
VERSION=1.0.0-beta2 bash build/packaging/release.sh rpm
VERSION=1.0.0-beta2 bash build/packaging/release.sh arch
```

## Keyboard Shortcuts

- `Ctrl+T`: open a new query tab
- `Ctrl+W`: close the active tab
- `Ctrl+Enter`: run query
- `Ctrl+S`: save query
- `Ctrl+R` or `F5`: refresh active workspace
- `Ctrl+/`: toggle SQL line comment

## Known Beta Limitations

- Large query results are preview-capped to keep the app responsive
- Docker source updates still rely on polling and manual refresh instead of native Docker event streaming
- The Linux packaging workflow is production-oriented, but beta distribution still needs broader distro validation
- Some UX areas are still being refined for the stable `1.0.0` release

## Feedback

If you find a bug during beta testing, include:

- Linux distro and desktop environment
- Caskify version
- PostgreSQL target type: local, VPS, Docker, Supabase, or other hosted service
- Steps to reproduce
- Error message or screenshot if available

## License

MIT
