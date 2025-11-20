#!/usr/bin/env python3
"""
Extract SEC Tiebreaker Rules from PDF

Fetches the SEC tiebreaker rules PDF from secsports.com, extracts text content,
and saves it to docs/sec-tiebreaker-rules.txt for AI agent reference.

Usage:
    python scripts/extract-sec-rules.py

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

SEC_TIEBREAKER_URL = "https://www.secsports.com/fbtiebreaker"
TEMP_DIR = Path(__file__).parent.parent / "temp"
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "tiebreaker-rules"
TEMP_PDF = TEMP_DIR / "sec-rules.pdf"
OUTPUT_TXT = OUTPUT_DIR / "sec-tiebreaker-rules.txt"


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
        raise RuntimeError("No PDF URL found in HTML")
    
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


def main():
    """Main execution function."""
    print("SEC Tiebreaker Rules Extraction Script")
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
    print(f"\nFetching HTML from {SEC_TIEBREAKER_URL}...")
    try:
        html = fetch_html(SEC_TIEBREAKER_URL)
        print("✓ HTML fetched")
    except RuntimeError as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    
    print("Searching for PDF URL...")
    try:
        pdf_url = find_pdf_url(html, SEC_TIEBREAKER_URL)
        print(f"✓ Found PDF URL: {pdf_url}")
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



