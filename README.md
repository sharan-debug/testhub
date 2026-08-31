# TestHub V1 AI Development Pack

This directory is the implementation contract for building TestHub V1 with Claude.

## Start here

1. Read `CLAUDE.md`.
2. Read `docs/PRD.md`.
3. Read `docs/ARCHITECTURE.md`.
4. Read `docs/DATA_MODEL.md`.
5. Read `docs/API_CONTRACT.md`.
6. Read `docs/IMPLEMENTATION_PLAN.md`.
7. Read `.claude/skills/testhub-v1/SKILL.md`.
8. Read `docs/CLAUDE_PROMPTS.md`.
9. Inspect the existing repository.
10. Start with Prompt 0.

## V1 philosophy

TestHub V1 is intentionally simple.

The user should not be forced to:
- create test scenarios
- model dependencies
- document Redis state
- explain experiment logic
- enter Jira tickets
- maintain relationships

The application should make existing knowledge easier to find.

## Important

The supplied Google Workspace Marketplace page is not treated as proof of the company's Google Workspace/OAuth configuration. Verify the actual company Workspace/Cloud setup before production.

## V2

See `docs/PRD.md` for the planned V2 features.

## Current import compatibility

The current feature import is based on the existing feature knowledge sheet. The source fields are documented in `docs/PRD.md` and `docs/DATA_MODEL.md`.
