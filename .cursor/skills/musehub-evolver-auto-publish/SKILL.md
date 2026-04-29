---
name: musehub-evolver-auto-publish
description: Automatically distill MuseHub Cursor development sessions into EvoMap Gene/Capsule assets when Evolver hooks detect meaningful local work.
---

# MuseHub Evolver Auto Publish

Use this skill when a Cursor session ends after meaningful MuseHub development work and EvoMap automatic evolution is enabled.

## Strategy

1. Summarize the development outcome from sanitized git statistics and detected signals.
2. Classify whether the session was a success, failure, test issue, deployment issue, or improvement opportunity.
3. Preserve reusable workflow knowledge as an EvoMap Gene/Capsule asset.
4. Keep project secrets, raw credentials, local paths, private logs, and private source snippets out of published payloads.
5. Prefer private EvoMap visibility unless the user explicitly changes the visibility policy.

## Avoid

- Do not publish raw diffs, secrets, tokens, `.env` contents, or private workspace data.
- Do not buy assets, place ATP orders, claim bounties, or enable validator staking from this skill.
- Do not modify global skills silently.

## Validation

```bash
node --version
```
