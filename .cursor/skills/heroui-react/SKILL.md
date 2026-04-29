---
name: heroui-react
description: Use HeroUI v3 React components in this Cursor project. Applies when building or changing frontend UI, components, pages, forms, overlays, themes, or styles with @heroui/react and Tailwind CSS v4.
---

# HeroUI v3 React

Use this skill for frontend UI work in this project.

## Required Approach

- Use HeroUI v3 React components from `@heroui/react` as the component system.
- Prefer HeroUI primitives for buttons, cards, forms, inputs, chips, tooltips, menus, modals, popovers, tabs, lists, and scroll areas.
- Use compound component APIs where available, for example `Card.Header`, `Card.Content`, `Card.Footer`, and `Card.Title`.
- Use Tailwind CSS v4 and local CSS for layout, spacing, custom visuals, and project-specific styling.
- Do not add another React component library unless the user explicitly requests it.
- Do not hand-roll behavior or accessibility for primitives that HeroUI v3 already provides.

## Project Setup Facts

- The app uses React and Vite.
- HeroUI is installed as `@heroui/react`.
- Tailwind CSS v4 is installed.
- Cursor MCP is configured in `.cursor/mcp.json` as `heroui-react` using `@heroui/react-mcp@latest`.

## Before Implementing

When component details matter, use the HeroUI MCP server to fetch current docs instead of guessing:

- List components when choosing a primitive.
- Fetch component docs for props, anatomy, examples, and usage patterns.
- Fetch source styles or theme variables when customizing deeply.

## Styling Rules

- Keep behavior and accessibility on HeroUI components.
- Put visual art direction in CSS/Tailwind classes.
- Prefer theme variables and CSS custom properties for reusable colors, radius, spacing, and dark/light themes.
- Keep imports from `@heroui/react`.

```tsx
import { Button, Card, Input } from "@heroui/react";
```
