#!/usr/bin/env bash
# fetch_doc.sh — download a document into the per-file folder convention
# and scaffold its CONTEXT.md companion.
#
# Usage: fetch_doc.sh <url> <corpus-root> [folder-slug]
#
# - Follows redirects; records the FINAL url (tracking params stripped).
# - Preserves the server/url filename; folder defaults to slugified filename stem.
# - Pre-fills mechanical metadata (sha256, size, content-type, dates).
# - Leaves semantic sections as TODO markers — the calling agent must read
#   the document and complete them (see references/context-file-spec.md).
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: $0 <url> <corpus-root> [folder-slug]" >&2
  exit 1
fi

URL="$1"
ROOT="$2"
SLUG="${3:-}"

# Strip common ad/tracking params from the recorded URL
clean_url() {
  echo "$1" | sed -E 's/([?&])(gclid|gad_source|gbraid|wbraid|fbclid|msclkid|utm_[a-z]+)=[^&]*//g; s/\?&/\?/; s/&&+/\&/g; s/[?&]$//'
}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# Download, capturing final effective URL and content-type
HDR="$TMP/headers.txt"
OUT="$TMP/payload"
FINAL_URL=$(curl -sL -A 'Mozilla/5.0 (document research)' \
  -o "$OUT" -D "$HDR" -w '%{url_effective}' "$URL")
FINAL_URL=$(clean_url "$FINAL_URL")

CONTENT_TYPE=$(grep -i '^content-type:' "$HDR" | tail -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '\r')
SIZE=$(stat -c%s "$OUT" 2>/dev/null || stat -f%z "$OUT")
SHA=$(sha256sum "$OUT" | awk '{print $1}')
DATE=$(date +%Y-%m-%d)

# Warn if this looks like a landing page rather than a document
case "$CONTENT_TYPE" in
  text/html*) echo "WARNING: content-type is text/html — this may be a landing page, not the document. Inspect it and grep for the real file link." >&2 ;;
esac

# Filename: prefer content-disposition, else URL basename
FNAME=$(grep -i '^content-disposition:' "$HDR" | tail -1 | grep -oP '(?<=filename=)"?[^";\r]+' | tr -d '"' || true)
if [ -z "${FNAME:-}" ]; then
  FNAME=$(basename "${FINAL_URL%%\?*}")
fi
[ -z "$FNAME" ] || [ "$FNAME" = "/" ] && FNAME="document"

# Slug: provided, or derived from filename stem
slugify() { echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/\.[a-z0-9]+$//; s/[^a-z0-9]+/-/g; s/^-+|-+$//g'; }
if [ -z "$SLUG" ]; then SLUG=$(slugify "$FNAME"); fi
[ -z "$SLUG" ] && SLUG="document-$DATE"

DEST="$ROOT/$SLUG"
if [ -e "$DEST" ]; then
  echo "ERROR: $DEST already exists. Pass a distinguishing folder-slug (e.g., ${SLUG}-spanish, ${SLUG}-rev2024)." >&2
  exit 2
fi
mkdir -p "$DEST"
cp "$OUT" "$DEST/$FNAME"

cat > "$DEST/CONTEXT.md" <<EOF
# TODO: Human-readable title (form number)

## What this file is
TODO: document type, issuing agency, form number, language, revision date printed on the document.

## Provenance
- **Source URL:** $FINAL_URL
- **Downloaded:** $DATE
- **Source legitimacy:** TODO: Tier N — domain + verification method (see SOURCES.md)
- **SHA256:** $SHA
- **Size / type:** $SIZE bytes / ${CONTENT_TYPE:-unknown}

## What it's for / when it's used
TODO: who files it, with whom, triggered by what, what happens after.

## Key information an LLM needs
TODO: read the document first (pdftotext / rasterize). Required fields, attachments, deadlines, submission address, fees, signature rules, gotchas.

## Related documents
TODO: companions, instructions, translations, predecessor/successor forms.

## Open questions
TODO: supersession risk, county variants, anything unverified. Write "None" if none.
EOF

echo "Saved:   $DEST/$FNAME"
echo "Context: $DEST/CONTEXT.md  (scaffold — complete the TODO sections after reading the document)"
echo "sha256:  $SHA"
echo "type:    ${CONTENT_TYPE:-unknown}  size: $SIZE bytes"
