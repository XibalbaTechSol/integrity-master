## 2026-06-24 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Found an icon-only button in the Sidebar used to toggle collapse state that lacks an ARIA label, making it inaccessible for screen readers.
**Action:** Adding an `aria-label` based on the collapsed state to ensure screen readers announce its purpose correctly.
