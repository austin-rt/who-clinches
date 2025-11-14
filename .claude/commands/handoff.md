# handoff

## Objective

Generate a handoff prompt optimized for AI consumption. Take the user's input following this command, summarize and reformat it into a clear, structured prompt that can be handed off to another AI agent. Write the prompt to a markdown file in the `temp/handoffs/` directory.

## Critical Requirements

1. **File output** - Write prompt to a .md file in `temp/handoffs/` directory
2. **AI-optimized language** - Use clear, direct instructions suitable for AI agent consumption
3. **Preserve context** - Maintain all essential information from user input
4. **Structured format** - Organize information logically for maximum clarity
5. **Action-oriented** - Frame as clear directives, not descriptions
6. **Plain text content** - File content should be plain text with no markdown formatting inside

## Processing Rules

### Summarization

- Extract key objectives and requirements
- Remove redundant or verbose language
- Consolidate related information
- Preserve technical details and constraints
- Maintain critical context and background

### Reformating

- Use imperative mood ("do X" not "X should be done")
- Group related requirements together
- List constraints and prerequisites clearly
- Separate objectives from implementation details
- Use consistent terminology throughout

### Structure

Organize the prompt with clear sections:

1. **Objective** - Primary goal in one sentence
2. **Context** - Background information if needed
3. **Requirements** - Specific constraints or rules
4. **Expected Output** - What the AI should produce
5. **Constraints** - Limitations or boundaries

## Output Format

Write the prompt to a markdown file in `temp/handoffs/` directory. Use a descriptive filename based on the handoff content (e.g., `temp/handoffs/documentation-update.md`, `temp/handoffs/feature-implementation.md`). File content should be plain text with no markdown formatting inside. No code syntax highlighting, no special characters beyond standard punctuation.

**File location:** `temp/handoffs/[descriptive-name].md`

**Example structure:**

```
OBJECTIVE: [primary goal]

CONTEXT:
[background information if relevant]

REQUIREMENTS:
- [requirement 1]
- [requirement 2]
- [requirement 3]

EXPECTED OUTPUT:
[description of what should be produced]

CONSTRAINTS:
- [constraint 1]
- [constraint 2]
```

## Execution Protocol

### Step 1: Analyze Input

Read and understand the user's input following the command invocation. Identify:

- Primary objective
- Key requirements
- Technical constraints
- Expected outcomes
- Relevant context

### Step 2: Summarize

Condense the input while preserving:

- All actionable requirements
- Technical specifications
- Critical constraints
- Expected deliverables
- Important context

### Step 3: Reformat

Structure the summarized content into a clear, AI-optimized prompt following the structure guidelines above.

### Step 4: Create Directory

Ensure `temp/handoffs/` directory exists. Create it if it does not exist.

### Step 5: Write File

Write the formatted prompt to a markdown file in `temp/handoffs/` directory. Use a descriptive filename based on the handoff content. File should contain only plain text with no markdown formatting inside.

## Example

**User input:**

```
I need to add a new API endpoint that fetches user preferences. It should be a GET request at /api/user/preferences. It needs to authenticate the user first, then return their preferences from the database. Make sure it handles errors properly and returns 404 if the user doesn't exist.
```

**Generated output file:** `temp/handoffs/api-endpoint-implementation.md`

**File contents:**

```
OBJECTIVE: Create a new GET API endpoint at /api/user/preferences that retrieves authenticated user preferences from the database.

REQUIREMENTS:
- Implement GET endpoint at /api/user/preferences
- Authenticate user before processing request
- Query user preferences from database
- Return preferences data on success
- Handle authentication failures appropriately
- Return 404 status if user does not exist
- Implement proper error handling for all failure cases

EXPECTED OUTPUT:
- Functional GET endpoint at /api/user/preferences
- Authentication middleware integration
- Database query for user preferences
- Appropriate HTTP status codes (200, 401, 404)
- Error handling for edge cases

CONSTRAINTS:
- Must use existing authentication system
- Must follow existing API patterns in codebase
- Must return JSON responses
```
