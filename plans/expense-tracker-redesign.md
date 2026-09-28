# Expense Tracker Redesign — Plan

## Context
Right now the app is an unstyled page with two inputs, an Add button and a bullet list (`<ul>`). The goal is a polished app built with vanilla HTML, CSS and JS, and no framework:
- a top nav with the brand, tabs and a light/dark toggle
- a colored header for each page
- an expense table with aligned columns, with inline Edit and Delete actions
- subtly 3D buttons

The existing add behavior and validation stay as they are: the name is trimmed, both fields are required, and a failed check shows the same alert text.

Decisions confirmed with the user:
- **Edit** happens inline in the row: the cells become inputs, with Save/Cancel buttons.
- **Bills and Activities** are placeholder sections in the same page.
- **Storage:** expenses stay in memory only, so a refresh clears them, as today.

## Files

| File | Needed by the app? | Why |
|---|---|---|
| `index.html` | **Yes, restructure** | The only page. It holds the markup for the nav, the headers, the form and the table. |
| `script.js` | **Yes, rewrite** | Holds all behavior: adding, validation, rendering, edit/delete, tabs and the theme toggle. |
| `style.css` | **Yes, new file** | There's no CSS today. A separate stylesheet keeps styling out of the HTML, which makes both easier to learn from. |
| `CLAUDE.md` | No (for Claude only) | Project instructions for Claude Code. The browser never loads it. Keep it. |
| `.claude/skills/change-review/SKILL.md` | No (for Claude only) | The `/change-review` skill. It doesn't affect the app. Keep it. |

The redesign adds no dependencies, build step or framework.

## Steps

### 1. `index.html`: restructure the markup
- Add `<meta charset>`, a viewport meta tag, `lang="en"` and `<link rel="stylesheet" href="style.css">`.
- `<header class="navbar">` contains:
  - the brand "Expense Tracker" on the left
  - `<nav>` with three `<button class="nav-tab" data-page="expenses|bills|activities">`
  - `<button id="theme-toggle">` on the right
- Add one `<section class="page" id="page-expenses">` per tab, and give the Bills and Activities sections the `hidden` attribute. Each section starts with a `<div class="page-header">` containing a title and subtitle. The subtitle reuses "Track your daily expenses."
- In the Expenses section:
  - a `<form id="expense-form">` holding the existing `#expense-name` and `#expense-amount` inputs (IDs unchanged) and the `#add-expense` button (`type="submit"`). Using a form means the Enter key also adds an expense.
  - a `<table class="expense-table">` with a `<thead>` for the Name, Amount and Actions columns, and a `<tbody id="expense-list">`. This replaces the `<ul>`.
  - an empty-state message ("No expenses yet") shown when the list is empty.
- Bills and Activities each get a page header and a short "Coming soon" card.

### 2. `style.css`: create the stylesheet
- **Theme variables:** colors are defined once on `:root`, and dark mode overrides them under `[data-theme="dark"]`. Switching theme then just flips one attribute.
  - Colors to define: background, surface, text, muted text, border, accent, danger.
- **Layout:** the body uses a system font stack. A centered `.container` has a max-width of about 900px.
- **Navbar:** a flex row with `justify-content: space-between`. The active tab gets an accent underline or pill.
- **Page header:** a colored band with a gentle gradient, one accent color per page (Expenses blue, Bills amber, Activities green, for example), and white title text.
- **Form row:** the inputs and button sit in a flex row that wraps on narrow screens. Inputs get rounded corners, a border, and a focus ring in the accent color.
- **Table:**
  - full width, a light header row and thin row dividers
  - a subtle hover highlight
  - the Amount column right-aligned with `font-variant-numeric: tabular-nums`, so the digits line up
  - the Actions column right-aligned
- **Subtle 3D buttons:** a light top-to-bottom gradient, an inset top highlight and a small bottom shadow. `:hover` lifts slightly (`translateY(-1px)`, a slightly larger shadow). `:active` presses down (`translateY(1px)`, a smaller shadow).
  - Variants: `.btn-primary` for Add and Save, `.btn-secondary` for Edit and Cancel, and `.btn-danger` for Delete. Edit and Delete are small.
- **Responsive:** below about 600px, the nav tabs can scroll or wrap and the form stacks vertically.

### 3. `script.js`: rewrite around a data array
These are the core ideas I'll explain as I write them:
- **The data lives in one array**, `let expenses = []`. Each item is `{ id, name, amount }`, with `id` from `Date.now()`.
- **Render from the data.** `renderExpenses()` clears `#expense-list` and rebuilds one `<tr>` per expense. It also shows or hides the empty state. Add, save and delete each change the array, then call `renderExpenses()`. That keeps the screen and the data in sync, and new expenses appear immediately.
- **Shared validation.** `validateExpense(name, amount)` pulls the existing check out of the click handler, keeping the same alert text. Both Add and Save use it.
- **Safe rendering.** Cells are filled with `textContent`, never `innerHTML`, so text the user typed can't inject HTML.

Functions:
1. The existing element lookups, plus `expenseForm`, `themeToggle` and the tabs.
2. `validateExpense(name, amount)`
3. `formatAmount(amount)` returns `"$" + Number(amount).toFixed(2)`.
4. `renderExpenses()` builds the rows. A row whose `id === editingId` gets inputs and Save/Cancel buttons instead of text and Edit/Delete.
5. **Add** runs on the form's `submit` event: `preventDefault()`, trim, validate, push to the array, clear the inputs, refocus the name field, then render.
6. **Edit/Delete** use one click listener on `#expense-list` (event delegation). It reads `data-action` and `data-id` from the clicked button, which avoids attaching listeners to every row.
   - Edit: set `editingId`, then render.
   - Save: validate, update the item, clear `editingId`, then render.
   - Cancel: clear `editingId`, then render.
   - Delete: `filter` the item out of the array, then render. Consider a `confirm()` before deleting.
7. **Tabs:** clicking a tab hides every `.page`, shows the matching one, and moves the `active` class and `aria-current` to that tab.
8. **Theme toggle:** flips `data-theme` on `<html>` between light and dark and updates the button's icon or label. The first load follows the system setting via `matchMedia('(prefers-color-scheme: dark)')`. The choice is not saved, consistent with keeping everything in memory.
9. Remove the leftover `console.log` debug lines.

### 4. Review together
After each file, I'll pause to explain what changed. I won't commit anything unless you ask.

## Verification
Open `index.html` directly in a browser. No server is needed.
1. Add "Coffee" / 4.5. A row appears immediately showing `$4.50`, with the columns aligned.
2. Submit with an empty name, with only spaces, or with an empty amount. The same alert as today appears and nothing is added.
3. Press Enter inside an input. It adds the expense, just like clicking the button.
4. Edit a row: the inputs appear, prefilled. Save with a blank name and the alert shows. Save with valid values and the row updates. Cancel restores the row.
5. Delete a row. It disappears, and when the list is empty the empty state shows.
6. Click Bills and Activities. Each shows its own colored header, and Expenses hides. Clicking back to Expenses keeps the data.
7. Toggle dark mode. All text, table borders and buttons stay readable.
8. Narrow the window to phone width. The form stacks, there's no horizontal scroll, and the table stays usable.
9. Buttons lift on hover and press on click, with the effect staying subtle.
10. Typing `<b>hi</b>` as a name shows the literal text, not bold.
