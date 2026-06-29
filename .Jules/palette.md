## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.
## 2024-05-15 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a widespread pattern across the application where icon-only buttons (like refresh, close, and delete buttons) were missing `aria-label` attributes, making them inaccessible to screen reader users who would only hear "button".
**Action:** Applied `aria-label` attributes to these components and will ensure all future icon-only interactive elements explicitly describe their function for screen readers.
