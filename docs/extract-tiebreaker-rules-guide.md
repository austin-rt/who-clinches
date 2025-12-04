# Tiebreaker Rules Extraction Guide

This guide explains how to extract tiebreaker rules from conference websites using the standard extraction script pattern.

## Overview

The extraction process:
1. Fetches HTML from the conference website
2. Finds the PDF URL in the HTML (or uses direct PDF URL)
3. Downloads the PDF
4. Extracts text using `pdftotext`
5. Cleans PDF artifacts (page numbers, form feeds, excessive whitespace)
6. Saves to `docs/tiebreaker-rules/raw/[conference]-tiebreaker-rules.txt`

## Requirements

- Python 3.6+
- `pdftotext` (from Poppler): `brew install poppler`
- Verify installation: `which pdftotext`

## Script Template

Create a new script `scripts/extract-[conference]-rules.py` using this template:

```python
#!/usr/bin/env python3
"""
Extract [Conference Name] Tiebreaker Rules from PDF

Fetches the [Conference] tiebreaker rules PDF from [website], extracts text content,
cleans PDF artifacts (page numbers, form feeds, excessive whitespace), and saves
it to docs/tiebreaker-rules/raw/[conference]-tiebreaker-rules.txt for AI agent reference.

Usage:
    python scripts/extract-[conference]-rules.py

Requirements:
    - Python 3.6+
    - pdftotext (from Poppler): brew install poppler
    - Verify installation: which pdftotext
"""

import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

[CONFERENCE]_WEB_PAGE = "[URL_TO_WEB_PAGE_OR_PDF]"
[CONFERENCE]_PDF_URL = "[DIRECT_PDF_URL_IF_AVAILABLE]"
TEMP_DIR = Path(__file__).parent.parent / "temp"
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "tiebreaker-rules" / "raw"
TEMP_PDF = TEMP_DIR / "[conference]-rules.pdf"
OUTPUT_TXT = OUTPUT_DIR / "[conference]-tiebreaker-rules.txt"


def check_pdftotext():
    """Check if pdftotext is available in PATH."""
    try:
        subprocess.run(
            ["pdftotext", "-v"],
            capture_output=True,
            check=True,
            timeout=5
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired):
        return False


def fetch_html(url):
    """Fetch HTML content from URL."""
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=30) as response:
            return response.read().decode("utf-8", errors="ignore")
    except (URLError, HTTPError) as e:
        raise RuntimeError(f"Failed to fetch {url}: {e}")


def find_pdf_url(html, base_url):
    """Find PDF URL in HTML by searching for href ending in .pdf or in JSON data."""
    # Primary pattern: href="https://...pdf" or href='https://...pdf'
    pattern = r'href=["\'](https://[^"\']*\.pdf)["\']'
    matches = re.findall(pattern, html, re.IGNORECASE)
    
    if not matches:
        # Also check for iframe src or embed src
        iframe_pattern = r'(?:iframe|embed)[^>]*src=["\'](https://[^"\']*\.pdf)["\']'
        iframe_matches = re.findall(iframe_pattern, html, re.IGNORECASE)
        if iframe_matches:
            matches = iframe_matches
    
    if not matches:
        # Check JSON data structure: "url":"https://...pdf" (handles HTML-encoded quotes)
        json_pattern = r'&quot;url&quot;:\s*&quot;(https://[^&]*\.pdf)&quot;'
        json_matches = re.findall(json_pattern, html, re.IGNORECASE)
        if json_matches:
            matches = json_matches
    
    if not matches:
        # Also check for regular JSON quotes (in case HTML is decoded)
        json_pattern2 = r'["\']url["\']\s*:\s*["\'](https://[^"\']*\.pdf)["\']'
        json_matches2 = re.findall(json_pattern2, html, re.IGNORECASE)
        if json_matches2:
            matches = json_matches2
    
    if not matches:
        # Fallback: any href ending in .pdf (including relative URLs)
        fallback_pattern = r'href=["\']([^"\']*\.pdf)["\']'
        fallback_matches = re.findall(fallback_pattern, html, re.IGNORECASE)
        if fallback_matches:
            matches = fallback_matches
    
    if not matches:
        # Last resort: find any https:// URL ending in .pdf
        url_pattern = r'(https://[^\s"\'<>]+\.pdf)'
        url_matches = re.findall(url_pattern, html, re.IGNORECASE)
        if url_matches:
            matches = url_matches
    
    if not matches:
        # Check for S3/CloudFront URLs (common for Sidearm Sports sites)
        s3_pattern = r'https://[^"\']*s3\.amazonaws\.com[^"\']*\.pdf|https://[^"\']*cloudfront[^"\']*\.pdf|https://[^"\']*sidearm[^"\']*\.pdf'
        s3_matches = re.findall(s3_pattern, html, re.IGNORECASE)
        if s3_matches:
            matches = s3_matches
    
    if not matches:
        return None
    
    # Use the first match
    pdf_url = matches[0]
    
    # Resolve relative URLs to absolute
    if not pdf_url.startswith(("http://", "https://")):
        pdf_url = urljoin(base_url, pdf_url)
    
    return pdf_url


def download_pdf(pdf_url, output_path):
    """Download PDF from URL to file."""
    try:
        req = Request(pdf_url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=60) as response:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(response.read())
        return True
    except (URLError, HTTPError) as e:
        raise RuntimeError(f"Failed to download PDF from {pdf_url}: {e}")


def extract_text_from_pdf(pdf_path, output_path):
    """Extract text from PDF using pdftotext."""
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        result = subprocess.run(
            ["pdftotext", str(pdf_path), str(output_path)],
            capture_output=True,
            text=True,
            check=True,
            timeout=60
        )
        return True
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"pdftotext failed: {e.stderr}")
    except FileNotFoundError:
        raise RuntimeError(
            "pdftotext not found. Install Poppler: brew install poppler"
        )


def clean_extracted_text(input_path):
    """
    Clean PDF extraction artifacts from text file.
    
    Removes:
    - Form feed characters (\f)
    - Standalone page numbers (lines containing only numbers 1-25)
    - Excessive blank lines (normalizes to max 2 consecutive blank lines)
    
    Preserves all actual content.
    """
    # Read the file
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Process lines to remove artifacts
    cleaned_lines = []
    blank_count = 0
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        # Remove form feed characters
        line = line.replace('\f', '')
        stripped = stripped.replace('\f', '')
        
        # Check if this is a standalone page number
        # Page numbers are typically 1-25, and are usually on their own line
        if stripped.isdigit() and 1 <= int(stripped) <= 25:
            # Check context - if it's between content lines or near blank lines, it's likely a page number
            prev_line = lines[i-1].strip() if i > 0 else ''
            next_line = lines[i+1].strip() if i < len(lines) - 1 else ''
            
            # If previous or next line is blank, or if it doesn't make sense in context, remove it
            # Also check if it's not part of a numbered list (which would have a period or be part of text)
            if (not prev_line or not next_line or 
                (prev_line and not prev_line[0].isdigit() and not prev_line.endswith(':'))):
                # This looks like a page number - skip it
                continue
        
        # Track consecutive blank lines
        if not stripped:
            blank_count += 1
            # Allow max 2 consecutive blank lines
            if blank_count <= 2:
                cleaned_lines.append('')
        else:
            blank_count = 0
            cleaned_lines.append(line.rstrip())
    
    # Join back together
    cleaned_content = '\n'.join(cleaned_lines)
    
    # Remove trailing blank lines but keep one at the end
    cleaned_content = cleaned_content.rstrip() + '\n'
    
    # Write back to the same file
    with open(input_path, 'w', encoding='utf-8') as f:
        f.write(cleaned_content)


def main():
    """Main execution function."""
    print("Who Clinches - [Conference Name] Tiebreaker Rules Extraction Script")
    print("=" * 50)
    
    # Check pdftotext availability
    print("Checking for pdftotext...")
    if not check_pdftotext():
        print("ERROR: pdftotext not found in PATH")
        print("Install Poppler: brew install poppler")
        print("Verify installation: which pdftotext")
        sys.exit(1)
    print("✓ pdftotext found")
    
    # Fetch HTML and find PDF URL
    print(f"\nFetching HTML from {[CONFERENCE]_WEB_PAGE}...")
    try:
        html = fetch_html([CONFERENCE]_WEB_PAGE)
        print("✓ HTML fetched")
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    print("Searching for PDF URL...")
    try:
        pdf_url = find_pdf_url(html, [CONFERENCE]_WEB_PAGE)
        if pdf_url:
            print(f"✓ Found PDF URL: {pdf_url}")
        else:
            print("  No PDF URL found in HTML")
            if [CONFERENCE]_PDF_URL:
                print(f"  Using provided PDF URL: {[CONFERENCE]_PDF_URL}")
                pdf_url = [CONFERENCE]_PDF_URL
            else:
                print("ERROR: No PDF URL found and no fallback URL provided")
                sys.exit(1)
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    # Download PDF
    print(f"\nDownloading PDF...")
    try:
        download_pdf(pdf_url, TEMP_PDF)
        print(f"✓ PDF downloaded to {TEMP_PDF}")
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    # Extract text
    print(f"\nExtracting text from PDF...")
    try:
        extract_text_from_pdf(TEMP_PDF, OUTPUT_TXT)
        print(f"✓ Text extracted to {OUTPUT_TXT}")
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    # Clean extracted text (remove PDF artifacts)
    print(f"\nCleaning extracted text...")
    try:
        clean_extracted_text(OUTPUT_TXT)
        print(f"✓ Text cleaned (removed page numbers, form feeds, normalized whitespace)")
    except Exception as e:
        print(f"WARNING: Cleaning failed: {e}")
        print("  Continuing with uncleaned text...")
    
    # Verify output
    if OUTPUT_TXT.exists() and OUTPUT_TXT.stat().st_size > 0:
        size_kb = OUTPUT_TXT.stat().st_size / 1024
        print(f"\n✓ Success! Extracted {size_kb:.1f} KB of text")
        print(f"  Output: {OUTPUT_TXT}")
    else:
        print("\nERROR: Output file is empty or missing")
        sys.exit(1)
    
    print("\nDone!")


if __name__ == "__main__":
    main()
```

## Usage Instructions

1. **Copy the template** to create a new script: `scripts/extract-[conference]-rules.py`

2. **Replace placeholders:**
   - `[Conference Name]` - Full conference name
   - `[conference]` - Lowercase conference abbreviation (e.g., `aac`, `cusa`, `mac`)
   - `[CONFERENCE]` - Uppercase conference abbreviation (e.g., `AAC`, `CUSA`, `MAC`)
   - `[URL_TO_WEB_PAGE_OR_PDF]` - URL to the web page or PDF
   - `[DIRECT_PDF_URL_IF_AVAILABLE]` - Optional direct PDF URL (can be empty string if not available)

3. **Run the script:**
   ```bash
   python scripts/extract-[conference]-rules.py
   ```

4. **Verify output:**
   - Check `docs/tiebreaker-rules/raw/[conference]-tiebreaker-rules.txt`
   - Review the extracted text for completeness

## Alternative: HTML-Only Extraction

If the rules are only available as HTML (not PDF), use a simplified version that extracts text directly from HTML using regex. See `scripts/extract-mac-rules.py` or `scripts/extract-sunbelt-rules.py` for examples.

## Common Patterns

- **Sidearm Sports sites**: Often use S3 URLs like `https://s3.amazonaws.com/sidearm.sites/[site]/documents/...`
- **Direct PDF URLs**: Some conferences host PDFs directly
- **HTML with embedded PDFs**: The script will find PDF URLs in HTML automatically

## Troubleshooting

- **"pdftotext not found"**: Install Poppler: `brew install poppler`
- **"No PDF URL found"**: Check the HTML source manually, or provide a direct PDF URL
- **Empty output**: Verify the PDF downloaded correctly and contains text (some PDFs are image-only)
- **Poor text quality**: Some PDFs may require manual cleanup after extraction

