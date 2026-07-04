## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.
## 2026-07-04 - Added aria-label to Toast Close Button
**Learning:** Icon-only close buttons in Toast notifications are often overlooked for accessibility, leaving screen reader users without context when navigating dynamically appearing notifications.
**Action:** Ensure all dynamically generated alerts and toasts that contain icon-only dismiss controls include an explicit `aria-label` like "Close".
