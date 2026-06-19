#!/usr/bin/env bash
# sitemap_grep.sh — discover a site's sitemap(s), expand indexes recursively,
# and grep the full URL inventory for patterns.
#
# Usage: sitemap_grep.sh <site-or-sitemap-url> [pattern ...]
#   sitemap_grep.sh https://www.dhcs.ca.gov medi-cal application
#   sitemap_grep.sh https://example.gov/sitemap.xml '\.pdf$'
#
# With no patterns, dumps the full URL inventory.
# Patterns are case-insensitive extended regex, AND-chained (each narrows).
# Full inventory is also saved to ./sitemap_urls_<host>.txt for reuse.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <site-or-sitemap-url> [pattern ...]" >&2
  exit 1
fi

TARGET="$1"; shift
UA='Mozilla/5.0 (document research)'
MAX_SITEMAPS=200   # safety cap on index expansion

fetch() {
  # fetch URL; transparently gunzip .gz payloads
  local url="$1"
  if [[ "$url" == *.gz ]]; then
    curl -sL -A "$UA" "$url" | gunzip -c 2>/dev/null || true
  else
    curl -sL --compressed -A "$UA" "$url"
  fi
}

extract_locs() { grep -oP '(?<=<loc>)[^<]+' | sed 's/[[:space:]]//g'; }

# --- Step 1: resolve starting sitemap list ---
declare -a SITEMAPS=()
if [[ "$TARGET" == *.xml || "$TARGET" == *.xml.gz ]]; then
  SITEMAPS+=("$TARGET")
  BASE=$(echo "$TARGET" | grep -oP '^https?://[^/]+')
else
  BASE=$(echo "$TARGET" | grep -oP '^https?://[^/]+' || echo "https://$TARGET")
  # robots.txt declarations
  while IFS= read -r sm; do
    [ -n "$sm" ] && SITEMAPS+=("$sm")
  done < <(curl -sL -A "$UA" "$BASE/robots.txt" | grep -i '^sitemap:' | sed 's/^[Ss]itemap:[[:space:]]*//' | tr -d '\r')
  # common fallbacks if robots.txt declared nothing
  if [ ${#SITEMAPS[@]} -eq 0 ]; then
    for p in sitemap.xml sitemap_index.xml sitemap-index.xml sitemap/sitemap.xml; do
      code=$(curl -s -o /dev/null -w '%{http_code}' -A "$UA" -L "$BASE/$p")
      if [ "$code" = "200" ]; then SITEMAPS+=("$BASE/$p"); break; fi
    done
  fi
fi

if [ ${#SITEMAPS[@]} -eq 0 ]; then
  echo "No sitemap found for $TARGET (checked robots.txt and common paths)." >&2
  echo "Fallbacks: agency /forms index page; curl + grep href PDFs; domain-restricted web search." >&2
  exit 3
fi

echo "Sitemaps discovered: ${SITEMAPS[*]}" >&2

# --- Step 2: expand indexes recursively (breadth-first, capped) ---
HOST=$(echo "$BASE" | sed 's|https\?://||; s|/.*||')
INVENTORY="./sitemap_urls_${HOST}.txt"
: > "$INVENTORY"

declare -a QUEUE=("${SITEMAPS[@]}")
SEEN=0
while [ ${#QUEUE[@]} -gt 0 ] && [ $SEEN -lt $MAX_SITEMAPS ]; do
  SM="${QUEUE[0]}"; QUEUE=("${QUEUE[@]:1}"); SEEN=$((SEEN+1))
  BODY=$(fetch "$SM")
  if echo "$BODY" | grep -q '<sitemapindex'; then
    while IFS= read -r child; do
      [ -n "$child" ] && QUEUE+=("$child")
    done < <(echo "$BODY" | extract_locs)
    echo "  index: $SM -> $(echo "$BODY" | extract_locs | wc -l) child sitemaps" >&2
  else
    echo "$BODY" | extract_locs >> "$INVENTORY"
  fi
done

sort -u "$INVENTORY" -o "$INVENTORY"
TOTAL=$(wc -l < "$INVENTORY")
echo "Inventory: $TOTAL URLs -> $INVENTORY" >&2
[ $SEEN -ge $MAX_SITEMAPS ] && echo "NOTE: hit sitemap cap ($MAX_SITEMAPS); inventory may be partial." >&2

# --- Step 3: grep, AND-chaining patterns ---
if [ $# -eq 0 ]; then
  cat "$INVENTORY"
else
  RESULT="$INVENTORY"
  TMPDIR2=$(mktemp -d); trap 'rm -rf "$TMPDIR2"' EXIT
  i=0
  for pat in "$@"; do
    i=$((i+1))
    grep -iE -- "$pat" "$RESULT" > "$TMPDIR2/pass$i" || true
    RESULT="$TMPDIR2/pass$i"
  done
  MATCHES=$(wc -l < "$RESULT")
  echo "Matches: $MATCHES" >&2
  cat "$RESULT"
fi
