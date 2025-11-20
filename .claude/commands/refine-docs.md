# Refine Documentation Structure

## Objective
Ensure all AI documentation files in the `docs/` directory are well-organized and do not exceed 125 lines per file.

## Process

### Step 0: Verify Technical Accuracy (MOST IMPORTANT)
**Before any refinement work, verify all technical claims against the codebase.**

1. **Code is the single source of truth** - Documentation must reflect actual code implementation, not vice versa
2. For each technical claim in documentation:
   - **API endpoints**: Verify against actual route handlers in `app/api/`
   - **Data models**: Verify against schemas in `lib/models/`
   - **Type definitions**: Verify against `lib/api-types.ts` and `lib/types.ts`
   - **Component patterns**: Verify against actual component implementations
   - **State management**: Verify against `app/store/` implementations
   - **Environment variables**: Verify against actual usage in code
   - **Commands and scripts**: Verify against `package.json` scripts and actual script files
   - **Configuration**: Verify against actual config files
3. **Fix inaccuracies immediately**:
   - Update documentation to match code (never change code to match outdated docs)
   - Remove claims about features that no longer exist
   - Add missing information about current implementation
   - Correct type definitions, interfaces, and examples
4. **Use codebase search tools**:
   - Search for actual implementations using `codebase_search`
   - Read source files directly using `read_file`
   - Verify patterns exist in code before documenting them
5. **Only proceed to Step 1 after all technical claims are verified accurate**

### Step 1: Audit Information for Added Value
For each file in the `docs/` directory:
1. Review each section, instruction, or piece of information
2. For each item, ask: **"If given a prompt to execute the related task, how likely am I take the approach being instructed/forbidden?"**
3. Evaluate the likelihood:
   - **Extremely high likelihood** (e.g., 81-100%): Remove - not adding value, already obvious
   - **Extremely low likelihood** (e.g., 0-19%): Remove - not actionable or relevant
   - **Moderate likelihood** (e.g., 20-80%): Keep - reduces ambiguity, adds value
4. **Key principle**: Reducing ambiguity is adding value. If information is not ambiguous, explaining it furter is not adding value.
5. Remove all content that doesn't pass this test

### Step 2: Identify Files Exceeding Limit
- Scan all `.md` files in the `docs/` directory and subdirectories
- Identify files with more than 125 lines
- Process files in order of size (largest first)

### Step 3: Check for Duplicated Information
For each file exceeding 125 lines:
1. Analyze the content for duplicated information across other documentation files
2. If duplication exists:
   - Determine which file has the most similar adjacent content
   - **Keep** the content in the file where adjacent content is most similar
   - **Remove** the duplicated content from all other files
3. Re-check line count after deduplication

### Step 4: Check for Domain Coverage
If file still exceeds 125 lines after Step 3:
1. Identify the primary domain/topic of the content
2. Search for other files that cover the same domain
3. If domain is covered elsewhere but specific information is unique:
   - **Move** the unique content to the file where the domain is most similar
   - Ensure logical flow and organization in the target file
4. Re-check line count after reorganization

### Step 5: Split Files
If file still exceeds 125 lines after Steps 3-4:
1. Analyze the content structure:
   - Identify distinct topics, sections, or concerns
   - Group related content logically
2. Determine split strategy:
   - Split by topic/domain
   - Split by concern (e.g., setup vs usage, theory vs practice)
   - Split by audience or use case
3. Create new files as needed:
   - Use descriptive, clear filenames
   - Create new subdirectories if logical grouping requires it
   - Maintain clear relationships between split files (consider adding cross-references)
4. Ensure each resulting file:
   - Has a clear, focused purpose
   - Is logically organized
   - Does not exceed 125 lines
   - Maintains necessary context for standalone reading

### Step 6: Iterate
- Repeat Steps 1-5 until all files are ≤ 125 lines
- Verify no information is lost during the process
- Ensure cross-references and navigation remain functional
- Maintain documentation quality and readability

## Quality Checks
- All files must be ≤ 125 lines
- No information should be lost
- Content should be logically organized
- Related content should be grouped together
- File names should clearly indicate content
- Cross-references should be updated if files are moved or split

## Notes
- Prioritize keeping related content together
- When splitting, ensure each file can be understood independently
- Update any navigation files (e.g., `navigation-hub.md`) if file structure changes
- Maintain consistency with existing documentation patterns and style

