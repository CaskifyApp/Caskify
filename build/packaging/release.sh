#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
ROOT_DIR="$(readlink -f "$SCRIPT_DIR/../..")"
DIST_DIR="$ROOT_DIR/dist"
BUILD_BIN="$ROOT_DIR/build/bin/caskpg"
VERSION="${VERSION:-0.1.0}"
DRY_RUN=false

declare -a TARGETS=()
SUPPORTED_TARGETS=(appimage deb rpm arch all)

usage() {
  cat <<'EOF'
Usage:
  ./build/packaging/release.sh appimage
  ./build/packaging/release.sh deb,rpm
  ./build/packaging/release.sh all
  ./build/packaging/release.sh --dry-run all

If no target is given, the script will ask interactively.
EOF
}

is_supported_target() {
  local target="$1"
  for supported in "${SUPPORTED_TARGETS[@]}"; do
    if [[ "$supported" == "$target" ]]; then
      return 0
    fi
  done
  return 1
}

append_target() {
  local target="$1"
  if [[ "$target" == "all" ]]; then
    TARGETS=(appimage deb rpm arch)
    return
  fi

  for existing in "${TARGETS[@]:-}"; do
    if [[ "$existing" == "$target" ]]; then
      return
    fi
  done

  TARGETS+=("$target")
}

parse_targets() {
  local raw="$1"
  IFS=',' read -r -a requested <<< "$raw"
  for target in "${requested[@]}"; do
    if ! is_supported_target "$target"; then
      echo "Unsupported target: $target" >&2
      usage
      exit 1
    fi
    append_target "$target"
  done
}

prompt_targets() {
  echo "Select release target:"
  echo "  1) appimage"
  echo "  2) deb"
  echo "  3) rpm"
  echo "  4) arch"
  echo "  5) all"
  read -r -p "Target [1-5]: " choice

  case "$choice" in
    1) TARGETS=(appimage) ;;
    2) TARGETS=(deb) ;;
    3) TARGETS=(rpm) ;;
    4) TARGETS=(arch) ;;
    5) TARGETS=(appimage deb rpm arch) ;;
    *)
      echo "Invalid selection" >&2
      exit 1
      ;;
  esac
}

run() {
  if $DRY_RUN; then
    echo "[dry-run] $*"
    return 0
  fi

  echo "> $*"
  "$@"
}

ensure_dist_dir() {
  run mkdir -p "$DIST_DIR"
}

ensure_binary() {
  if [[ ! -f "$BUILD_BIN" ]]; then
    run wails build
  fi
}

require_command() {
  local command_name="$1"
  if $DRY_RUN; then
    return 0
  fi
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Missing required command: $command_name" >&2
    return 1
  fi
}

build_appimage() {
  local appdir="$DIST_DIR/AppDir"
  local output="$DIST_DIR/caskpg_${VERSION}_amd64.AppImage"

  require_command appimagetool
  run rm -rf "$appdir"
  run mkdir -p "$appdir/usr/bin" "$appdir/usr/share/applications" "$appdir/usr/share/icons/hicolor/512x512/apps"
  run cp "$BUILD_BIN" "$appdir/usr/bin/caskpg"
  run cp "$ROOT_DIR/build/linux/caskpg.desktop" "$appdir/usr/share/applications/caskpg.desktop"
  run cp "$ROOT_DIR/build/appicon.png" "$appdir/usr/share/icons/hicolor/512x512/apps/caskpg.png"
  run cp "$ROOT_DIR/build/linux/AppRun" "$appdir/AppRun"
  run chmod +x "$appdir/AppRun" "$appdir/usr/bin/caskpg"
  run appimagetool "$appdir" "$output"
}

build_deb() {
  local output="$DIST_DIR/caskpg_${VERSION}_amd64.deb"

  require_command nfpm
  run env VERSION="$VERSION" nfpm package --config "$ROOT_DIR/build/linux/nfpm.yaml" --packager deb --target "$output"
}

build_rpm() {
  local output="$DIST_DIR/caskpg_${VERSION}-1.x86_64.rpm"

  require_command nfpm
  run env VERSION="$VERSION" nfpm package --config "$ROOT_DIR/build/linux/nfpm.yaml" --packager rpm --target "$output"
}

build_arch() {
  local workdir="$DIST_DIR/PKGBUILD/caskpg"

  require_command makepkg
  run rm -rf "$workdir"
  run mkdir -p "$workdir"
  run cp "$BUILD_BIN" "$workdir/caskpg"
  run cp "$ROOT_DIR/build/linux/caskpg.desktop" "$workdir/caskpg.desktop"
  run cp "$ROOT_DIR/build/appicon.png" "$workdir/caskpg.png"

  if $DRY_RUN; then
    echo "[dry-run] sed 's/@VERSION@/$VERSION/g' '$ROOT_DIR/build/linux/PKGBUILD' > '$workdir/PKGBUILD'"
  else
    sed "s/@VERSION@/$VERSION/g" "$ROOT_DIR/build/linux/PKGBUILD" > "$workdir/PKGBUILD"
  fi

  run bash -lc "cd '$workdir' && makepkg --force --nodeps"
}

main() {
  if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then
    usage
    exit 0
  fi

  if [[ ${1:-} == "--dry-run" ]]; then
    DRY_RUN=true
    shift
  fi

  if [[ $# -gt 0 ]]; then
    parse_targets "$1"
  else
    prompt_targets
  fi

  ensure_dist_dir
  ensure_binary

  for target in "${TARGETS[@]}"; do
    case "$target" in
      appimage) build_appimage ;;
      deb) build_deb ;;
      rpm) build_rpm ;;
      arch) build_arch ;;
    esac
  done
}

main "$@"
