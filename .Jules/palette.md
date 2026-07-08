## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.

## 2026-06-25 - Added aria-live and roles to Toast notifications
**Learning:** Toast notifications dynamically appear in the UI but are often missed by screen readers unless properly marked as live regions with semantic roles.
**Action:** Always wrap toast containers in `aria-live="polite"` and `aria-atomic="true"`, assign `role="alert"` or `role="status"` based on severity, add `aria-label` to icon-only close buttons, and hide decorative icons with `aria-hidden="true"`.
