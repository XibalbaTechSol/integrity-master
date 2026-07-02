## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.
## 2025-07-02 - Toast Notifications Accessibility
**Learning:** Dynamically rendered toast notifications were not being announced to screen readers due to missing `role` attributes, and the close button was an icon-only button lacking an `aria-label`.
**Action:** Applied `role="alert"` for error toasts and `role="status"` for non-error toasts, and added `aria-label="Dismiss notification"` to the close button. Ensure dynamic notifications use appropriate ARIA live regions or roles.
