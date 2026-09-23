#!/bin/bash
# Construye "Top Gear.app" (macOS) y "TopGear.html" en la carpeta superior.
set -euo pipefail
cd "$(dirname "$0")"
SRC="$(pwd)"
ROOT="$(cd .. && pwd)"
APP="$ROOT/Top Gear.app"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "› Empaquetando el juego en un único HTML"
node build.js "$ROOT/TopGear.html"

echo "› Creando la estructura de la app"
rm -rf "$APP"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources/game"
cp "$ROOT/TopGear.html" "$APP/Contents/Resources/game/index.html"
cp mac/Info.plist "$APP/Contents/Info.plist"
printf 'APPL????' > "$APP/Contents/PkgInfo"

echo "› Dibujando el icono"
swift mac/make_icon.swift "$TMP/icon_1024.png" >/dev/null
ICONSET="$TMP/AppIcon.iconset"
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z $s $s "$TMP/icon_1024.png" --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z $d $d "$TMP/icon_1024.png" --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

echo "› Compilando el ejecutable (Apple Silicon + Intel)"
swiftc -O -swift-version 5 -target arm64-apple-macos12.0 mac/main.swift -o "$TMP/TopGear-arm64"
swiftc -O -swift-version 5 -target x86_64-apple-macos12.0 mac/main.swift -o "$TMP/TopGear-x86_64"
lipo -create "$TMP/TopGear-arm64" "$TMP/TopGear-x86_64" -output "$APP/Contents/MacOS/TopGear"
chmod +x "$APP/Contents/MacOS/TopGear"

echo "› Firmando (firma local ad-hoc)"
codesign --force --deep --sign - "$APP"
touch "$APP"
echo "✓ Listo: $APP"
