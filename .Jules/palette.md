## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.
## 2025-02-12 - Accessibility improvement for ActuarialHub forms
**Learning:** React form inputs must have proper `id` attributes matched with their `<label>` tag`s `htmlFor` attributes to ensure screen readers can associate them correctly.
**Action:** When adding or reviewing forms, always verify that `htmlFor` on the `<label>` points to a valid, matching `id` on the input element.

## 2024-05-24 - Lucide-React Animation Classes
**Learning:** In the `integrity-dashboard` codebase using `lucide-react`, the correct Tailwind/CSS class to use for spinning animations on icons (e.g., `<RefreshCw />`) is `animate-spin`, not `spin`. Using `spin` results in no animation being applied.
**Action:** Always verify animation class names when dealing with loading states, specifically favoring `animate-spin` over `spin` in this project.
