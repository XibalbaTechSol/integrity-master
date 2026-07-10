## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.
## 2025-02-12 - Accessibility improvement for ActuarialHub forms
**Learning:** React form inputs must have proper `id` attributes matched with their `<label>` tag`s `htmlFor` attributes to ensure screen readers can associate them correctly.
**Action:** When adding or reviewing forms, always verify that `htmlFor` on the `<label>` points to a valid, matching `id` on the input element.
