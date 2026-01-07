#!/usr/bin/env sh
set -eu

PKG="@cedar-policy/cedar-wasm"
DEST_ROOT="vendor"
DEST_DIR="$DEST_ROOT/@cedar-policy/cedar-wasm/nodejs"

mkdir -p "$DEST_ROOT"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

# Resolve an exported entrypoint, then find the package root by walking up to package.json on disk
SRC_DIR="$(node -e "
  const fs = require('fs');
  const path = require('path');

  // Use a specific export instead of the package root
  const entry = require.resolve('${PKG}/nodejs'); // or another exported path
  let dir = path.dirname(entry);

  while (true) {
    const pj = path.join(dir, 'package.json');
    if (fs.existsSync(pj)) { console.log(dir); break; }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error('Could not locate package root for ${PKG} from ' + entry);
    dir = parent;
  }
")"

echo "Resolved source package root: $SRC_DIR"
echo "Destination: $DEST_DIR"

# Copy real files (no symlinks) - using -h flag to dereference symlinks
( cd "$SRC_DIR" && tar -chf - . ) | ( cd "$DEST_DIR" && tar -xf - )

# Fail if symlinks still exist in the vendored copy
if find "$DEST_DIR" -type l | read -r _; then
  echo "ERROR: Symlinks found under $DEST_DIR"
  find "$DEST_DIR" -type l -ls
  exit 1
fi

echo "Vendored files (sample):"
find "$DEST_DIR" -maxdepth 2 -type f | head -n 50
