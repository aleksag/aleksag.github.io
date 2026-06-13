#!/usr/bin/env bash
# =============================================================
# fetch_data.sh — Download Systek staff data and photos
# for offline / fully-static hosting.
#
# Usage:  bash fetch_data.sh
#
# Requires: curl, jq (brew install jq)
# =============================================================
set -euo pipefail

SANITY_PROJECT="s9j0sgbs"
SANITY_DATASET="production"
API_URL="https://${SANITY_PROJECT}.api.sanity.io/v2026-01-08/data/query/${SANITY_DATASET}?query=*%5B_type%20%3D%3D%20%22staff%22%5D"
CDN_BASE="https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}"
OUT_DIR="$(dirname "$0")/data"

mkdir -p "$OUT_DIR/images"

echo "Fetching staff data from Sanity..."
curl -sSL "$API_URL" -o "$OUT_DIR/staff.json"

echo "Parsing image references..."
# Extract image asset refs and hotspot data
jq -r '.result[] | select(.name != null and .image.asset._ref != null) |
  [._id, .image.asset._ref, (.image.hotspot.x // ""), (.image.hotspot.y // "")] |
  @tsv' "$OUT_DIR/staff.json" > "$OUT_DIR/_refs.tsv"

echo "Downloading photos..."
while IFS=$'\t' read -r id ref fpx fpy; do
  # ref format: image-HASH-WIDTHxHEIGHT-FORMAT
  hash=$(echo "$ref" | cut -d'-' -f2)
  dims=$(echo "$ref" | cut -d'-' -f3)
  fmt=$(echo "$ref" | cut -d'-' -f4)
  fmt=${fmt:-jpg}

  # Build URL with focal point crop
  url="${CDN_BASE}/${hash}-${dims}.${fmt}?w=600&h=750&fit=crop&auto=format&q=80"
  if [ -n "$fpx" ] && [ -n "$fpy" ]; then
    url="${url}&fp-x=${fpx}&fp-y=${fpy}"
  fi

  out_file="${OUT_DIR}/images/${id}.jpg"
  if [ -f "$out_file" ]; then
    echo "  [skip] $id (already exists)"
  else
    echo "  [dl]   $id"
    curl -sSL "$url" -o "$out_file" || echo "  [warn] Failed to download $id"
    sleep 0.05   # be polite to the CDN
  fi
done < "$OUT_DIR/_refs.tsv"

rm -f "$OUT_DIR/_refs.tsv"

echo "Writing manifest.json..."
jq -r '[.result[] | select(.name != null and .image.asset._ref != null) | {key: ._id, value: ("data/images/" + ._id + ".jpg")}] | from_entries' \
  "$OUT_DIR/staff.json" > "$OUT_DIR/manifest.json"

echo ""
echo "Done! Files written to: $OUT_DIR"
echo "Staff JSON: $OUT_DIR/staff.json"
echo "Images:     $OUT_DIR/images/"
echo "Manifest:   $OUT_DIR/manifest.json"
echo ""
echo "The game will automatically use local files when you serve it."
