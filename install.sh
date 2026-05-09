#!/usr/bin/env bash
set -euo pipefail

APP_NAME="Tplayer"
REPO="Twarga/Tplayer"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/tplayer"
BIN_DIR="$HOME/.local/bin"
APPIMAGE_PATH="$INSTALL_DIR/Tplayer.AppImage"
ICON_PATH="$INSTALL_DIR/tplayer.png"
DESKTOP_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
DESKTOP_FILE="$DESKTOP_DIR/tplayer.desktop"
ICON_URL="https://twarga.github.io/Tplayer/assets/logo.png"

info() {
  printf '\033[1;34m==>\033[0m %s\n' "$1"
}

warn() {
  printf '\033[1;33mwarning:\033[0m %s\n' "$1" >&2
}

fail() {
  printf '\033[1;31merror:\033[0m %s\n' "$1" >&2
  exit 1
}

need() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

detect_arch() {
  case "$(uname -m)" in
    x86_64 | amd64) printf 'x64' ;;
    *) fail "Unsupported Linux architecture: $(uname -m). Tplayer currently ships an x64 AppImage." ;;
  esac
}

latest_appimage_url() {
  curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" |
    grep -Eo '"browser_download_url": "[^"]+\.AppImage"' |
    head -n 1 |
    sed -E 's/"browser_download_url": "([^"]+)"/\1/'
}

main() {
  [ "$(uname -s)" = "Linux" ] || fail "This installer only supports Linux."
  detect_arch >/dev/null
  need curl
  need grep
  need sed

  info "Finding latest Tplayer AppImage"
  APPIMAGE_URL="$(latest_appimage_url)"
  [ -n "$APPIMAGE_URL" ] || fail "Could not find an AppImage on the latest GitHub Release."

  info "Installing to $INSTALL_DIR"
  mkdir -p "$INSTALL_DIR" "$BIN_DIR" "$DESKTOP_DIR"

  TMP_FILE="$(mktemp)"
  trap 'rm -f "$TMP_FILE"' EXIT

  info "Downloading $APP_NAME"
  curl -fL "$APPIMAGE_URL" -o "$TMP_FILE"
  chmod +x "$TMP_FILE"
  mv "$TMP_FILE" "$APPIMAGE_PATH"

  info "Installing icon"
  if ! curl -fsSL "$ICON_URL" -o "$ICON_PATH"; then
    warn "Could not download icon. The app will still run."
    ICON_PATH="$APPIMAGE_PATH"
  fi

  info "Creating tplayer command"
  ln -sf "$APPIMAGE_PATH" "$BIN_DIR/tplayer"

  info "Creating desktop launcher"
  cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Tplayer
Comment=Local-first desktop music player
Exec=$APPIMAGE_PATH
Icon=$ICON_PATH
Terminal=false
Type=Application
Categories=Audio;AudioVideo;Player;
StartupWMClass=Tplayer
EOF

  if command -v update-desktop-database >/dev/null 2>&1; then
    update-desktop-database "$DESKTOP_DIR" >/dev/null 2>&1 || true
  fi

  printf '\n'
  info "Tplayer installed"
  printf 'Run it with: %s\n' "$BIN_DIR/tplayer"

  case ":$PATH:" in
    *":$BIN_DIR:"*) ;;
    *) warn "$BIN_DIR is not in PATH. Add it to your shell profile to run 'tplayer' from anywhere." ;;
  esac
}

main "$@"
