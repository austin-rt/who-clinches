#!/usr/bin/env python3
"""
Extract Big 12 Tiebreaker Rules from PDF

Fetches the Big 12 tiebreaker rules PDF from big12sports.com, extracts text content,
cleans PDF artifacts (page numbers, form feeds, excessive whitespace), and saves
it to docs/tiebreaker-rules/big12-tiebreaker-rules.txt for AI agent reference.

Usage:
    python scripts/extract-big12-rules.py

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

BIG12_TIEBREAKER_URL = "https://s3.amazonaws.com/big12sports.com/documents/2025/11/4/Big_12_Football_2024_Tiebreaker_Policy.pdf"
BIG12_ALTERNATIVE_URL = "https://big12sports.com/documents/2025/11/4//Big_12_Football_2024_Tiebreaker_Policy.pdf"
TEMP_DIR = Path(__file__).parent.parent / "temp"
OUTPUT_DIR = Path(__file__).parent.parent / "docs" / "tiebreaker-rules"
TEMP_PDF = TEMP_DIR / "big12-rules.pdf"
OUTPUT_TXT = OUTPUT_DIR / "big12-tiebreaker-rules.txt"


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
    print("Who Clinches - Big 12 Tiebreaker Rules Extraction Script")
    print("=" * 50)
    
    # Check pdftotext availability
    print("Checking for pdftotext...")
    if not check_pdftotext():
        print("ERROR: pdftotext not found in PATH")
        print("Install Poppler: brew install poppler")
        print("Verify installation: which pdftotext")
        sys.exit(1)
    print("✓ pdftotext found")
    
    # Download PDF (try primary URL first, then alternative)
    pdf_urls = [BIG12_TIEBREAKER_URL, BIG12_ALTERNATIVE_URL]
    pdf_downloaded = False
    
    for pdf_url in pdf_urls:
        print(f"\nAttempting to download PDF from {pdf_url}...")
        try:
            download_pdf(pdf_url, TEMP_PDF)
            print(f"✓ PDF downloaded to {TEMP_PDF}")
            pdf_downloaded = True
            break
        except RuntimeError as e:
            print(f"  Failed: {e}")
            if pdf_url == pdf_urls[-1]:
                print("ERROR: All PDF URLs failed")
                sys.exit(1)
            print("  Trying alternative URL...")
    
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

