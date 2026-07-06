## 2026-06-22 - Added aria-label to Sidebar Collapse Button
**Learning:** Icon-only toggle buttons in React components often lack accessible names, making them difficult for screen reader users to understand their purpose and state.
**Action:** Always add dynamic `aria-label` and `aria-expanded` attributes to icon-only buttons that toggle UI states to ensure clarity and accessibility.

## 2026-07-06 - Enhanced Custom Tabbed Navigations with ARIA Roles
**Learning:** Custom UI components that act as tabs (like TabNav) or dropdown menus without semantic HTML tags often lack proper accessibility traits for screen readers. By default, they do not announce their role or selection state.
**Action:** Always apply `role="tablist"` to the container and `role="tab"`, `aria-selected={true/false}` to the buttons for tabbed navigation. For custom dropdowns, use `role="listbox"`, `role="option"`, `aria-expanded`, and `aria-haspopup="listbox"` to properly indicate the relationships and states of the interactive elements to assistive technologies.
