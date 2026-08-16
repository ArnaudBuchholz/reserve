\# AGENTS.md



\## Environment

\- OS: Windows

\- Shell: PowerShell

\- Main local workflow is executed from a Windows laptop.

\- Repository path is typically inside OneDrive, so file paths may include spaces or sync-specific behavior.

\- Prefer PowerShell-compatible commands when giving terminal instructions.



\## Project Overview

\- Project: `reserve`

\- Language: JavaScript / Node.js

\- Purpose: lightweight configurable HTTP server

\- Main package manager: `npm`



\## Install

```powershell

npm install

Build

Before tests, project sources may need generated files:



powershell



npm run build:sources

Test Commands

Run all tests:



powershell



npm test

Run only mocha tests:



powershell



npm run mocha

Run only integration tests:



powershell



node tests/integration.mjs

Run a specific test file:



powershell



npx mocha src/handlers/rate-limit.spec.js

Code Style

Follow the existing project style exactly.

The project uses standard for linting.

Keep code in CommonJS style where the surrounding file already uses it.

Prefer minimal, focused changes.

Do not introduce unnecessary abstractions.

Preserve existing naming and handler patterns used by REserve.

Testing Guidelines

Do not break existing tests.

New functionality must include tests.

Prefer:

unit tests for handler logic

config validation tests

integration tests for real HTTP behavior

For rate limiting or request-flow features, validate both success and rejection paths.

If adding concurrency-sensitive logic, include parallel/integration coverage.

Rate Limiting Notes

rate-limit is implemented as a dedicated handler.

Global and mapping-level configuration must remain supported.

Supported algorithms:

fixed-window

sliding-window

token-bucket

concurrent-requests

Supported stores:

in-memory

Redis-compatible

custom store interface

Supported keys:

IP

headers

query/url params

body params

session/sessionID

composite keys

Logging and Events

Keep compatibility with the existing event system.

Current custom rate-limit events:

rate-limit-exceeded

rate-limit-reset

rate-limit-warning

Preserve verbose logging behavior and existing log formatting style.

Documentation Guidelines

Add comments only where the logic is non-obvious.

Keep comments short and technical.

Avoid redundant narration.

Match the project's existing documentation tone.

Safety Rules for Agents

Never use git add . in a parent directory if unrelated files may exist nearby.

Stage only the files related to the task.

On this machine, always confirm the current working directory before commit/push.

Prefer checking:

powershell



pwd

git status --short

Recommended Workflow

Inspect relevant files first.

Propose or identify the minimal change.

Implement.

Run targeted tests.

Run full npm test.

Stage only relevant files.

Commit with a focused message.







