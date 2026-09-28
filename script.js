// ----- Elements on the page -----
const expenseForm = document.getElementById("expense-form");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseList = document.getElementById("expense-list");
const emptyState = document.getElementById("empty-state");
const spendingChart = document.getElementById("spending-chart");
const spendingTotal = document.getElementById("spending-total");
const chartLegend = document.getElementById("chart-legend");
const themeToggle = document.getElementById("theme-toggle");
const navTabs = document.querySelectorAll(".nav-tab");
const pages = document.querySelectorAll(".page");

// ----- Data -----
// All expenses live in this array. The table is always drawn from it.
let expenses = [];

// The id of the expense currently being edited (null when nothing is being edited).
let editingId = null;

// What has been typed into the edit inputs so far, e.g. { name: "Coffee", amount: "4.5" }.
// Keeping it here means redrawing the table does not wipe out unsaved typing.
let editDraft = null;

// ----- Helpers -----

// Returns true if the name and amount are valid, otherwise shows an alert and returns false.
function validateExpense(name, amount) {
    if (name === "" || amount === "") {
        alert("Please enter both an expense name and an amount.");
        return false;
    }
    return true;
}

// Turns 4.5 into "$4.50".
function formatAmount(amount) {
    return "$" + Number(amount).toFixed(2);
}

// Finds the expense with the given id in the array.
function findExpense(id) {
    return expenses.find(function(item) {
        return item.id === id;
    });
}

// True if the row being edited has typing that differs from what is saved.
function hasUnsavedChanges() {
    if (editingId === null) {
        return false;
    }
    const expense = findExpense(editingId);
    return editDraft.name !== expense.name || editDraft.amount !== String(expense.amount);
}

// Leaves edit mode.
function stopEditing() {
    editingId = null;
    editDraft = null;
}

// Creates a small button for a table row.
function createRowButton(label, action, id, style) {
    const button = document.createElement("button");
    button.textContent = label;
    button.className = "btn btn-sm " + style;
    button.dataset.action = action;
    button.dataset.id = id;
    return button;
}

// ----- Drawing the table -----
function renderExpenses() {
    // Remove every existing row, then build them again from the array.
    expenseList.innerHTML = "";

    expenses.forEach(function(expense) {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        const amountCell = document.createElement("td");
        const actionsCell = document.createElement("td");
        amountCell.className = "col-amount";
        actionsCell.className = "col-actions";

        if (expense.id === editingId) {
            // This row is being edited: show inputs and Save/Cancel.
            const nameInput = document.createElement("input");
            nameInput.type = "text";
            nameInput.className = "row-input edit-name";
            nameInput.value = editDraft.name;

            const amountInput = document.createElement("input");
            amountInput.type = "number";
            amountInput.step = "0.01";
            amountInput.className = "row-input edit-amount";
            amountInput.value = editDraft.amount;

            nameCell.appendChild(nameInput);
            amountCell.appendChild(amountInput);
            actionsCell.appendChild(createRowButton("Save", "save", expense.id, "btn-primary"));
            actionsCell.appendChild(createRowButton("Cancel", "cancel", expense.id, "btn-secondary"));
        } else {
            // Normal row: show text and Edit/Delete.
            // textContent (not innerHTML) keeps typed text as plain text.
            nameCell.textContent = expense.name;
            amountCell.textContent = formatAmount(expense.amount);
            actionsCell.appendChild(createRowButton("Edit", "edit", expense.id, "btn-secondary"));
            actionsCell.appendChild(createRowButton("Delete", "delete", expense.id, "btn-danger"));
        }

        row.appendChild(nameCell);
        row.appendChild(amountCell);
        row.appendChild(actionsCell);
        expenseList.appendChild(row);
    });

    // Show the "No expenses yet" message only when the list is empty.
    emptyState.hidden = expenses.length > 0;

    // Keep the chart in sync with the table.
    renderChart();
}

// ----- Drawing the pie chart -----
// Slice colors. If there are more expenses than colors, they repeat.
const chartColors = ["#3b6fe0", "#2f9e6b", "#e0913b", "#9b59d0", "#d9443c", "#2bb3c0", "#c9a227", "#e05a9b"];

function renderChart() {
    // Only positive amounts can be drawn as slices.
    const positiveExpenses = expenses.filter(function(expense) {
        return expense.amount > 0;
    });

    let total = 0;
    positiveExpenses.forEach(function(expense) {
        total += expense.amount;
    });

    spendingTotal.textContent = formatAmount(total);
    chartLegend.innerHTML = "";

    if (total === 0) {
        // Empty chart: remove the slices so the plain grey circle shows.
        spendingChart.style.background = "";
        spendingChart.setAttribute("aria-label", "No spending yet");
        return;
    }

    // A conic-gradient paints colors around a circle, e.g.
    // conic-gradient(blue 0% 40%, green 40% 100%) is a 40% / 60% pie.
    const slices = [];
    let start = 0;

    positiveExpenses.forEach(function(expense, index) {
        const percent = (expense.amount / total) * 100;
        const color = chartColors[index % chartColors.length];
        slices.push(color + " " + start + "% " + (start + percent) + "%");
        start += percent;

        // Legend row: color swatch, name and percentage.
        const item = document.createElement("li");
        const swatch = document.createElement("span");
        const name = document.createElement("span");
        const percentText = document.createElement("span");
        swatch.className = "legend-swatch";
        swatch.style.background = color;
        name.className = "legend-name";
        name.textContent = expense.name;
        percentText.className = "legend-percent";
        percentText.textContent = Math.round(percent) + "%";
        item.appendChild(swatch);
        item.appendChild(name);
        item.appendChild(percentText);
        chartLegend.appendChild(item);
    });

    spendingChart.style.background = "conic-gradient(" + slices.join(", ") + ")";
    spendingChart.setAttribute("aria-label", "Spending pie chart, total " + formatAmount(total));
}

// ----- Adding an expense -----
expenseForm.addEventListener("submit", function(event) {
    // Stop the form from reloading the page.
    event.preventDefault();

    const name = expenseName.value.trim();
    const amount = expenseAmount.value;

    if (!validateExpense(name, amount)) {
        return;
    }

    expenses.push({
        id: Date.now(),
        name: name,
        amount: Number(amount)
    });

    expenseName.value = "";
    expenseAmount.value = "";
    expenseName.focus();

    renderExpenses();
});

// ----- Edit, Save, Cancel and Delete -----
// One listener on the table body handles every row button.
expenseList.addEventListener("click", function(event) {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const id = Number(button.dataset.id);
    const expense = findExpense(id);

    if (action === "edit") {
        // Ask before throwing away changes made to another row.
        if (hasUnsavedChanges() && !confirm("Discard your unsaved changes?")) {
            return;
        }
        editingId = id;
        editDraft = { name: expense.name, amount: String(expense.amount) };
    } else if (action === "cancel") {
        stopEditing();
    } else if (action === "save") {
        const name = editDraft.name.trim();
        const amount = editDraft.amount;

        if (!validateExpense(name, amount)) {
            return;
        }

        expense.name = name;
        expense.amount = Number(amount);
        stopEditing();
    } else if (action === "delete") {
        if (!confirm("Delete this expense?")) {
            return;
        }
        expenses = expenses.filter(function(item) {
            return item.id !== id;
        });
    }

    renderExpenses();

    // After clicking Edit, put the cursor in the name box.
    if (action === "edit") {
        expenseList.querySelector(".edit-name").focus();
    }
});

// Remember what is typed into the edit inputs.
expenseList.addEventListener("input", function(event) {
    if (event.target.classList.contains("edit-name")) {
        editDraft.name = event.target.value;
    } else if (event.target.classList.contains("edit-amount")) {
        editDraft.amount = event.target.value;
    }
});

// Keyboard shortcuts while editing: Enter saves, Escape cancels.
expenseList.addEventListener("keydown", function(event) {
    if (!event.target.classList.contains("row-input")) {
        return;
    }

    const row = event.target.closest("tr");
    if (event.key === "Enter") {
        row.querySelector('[data-action="save"]').click();
    } else if (event.key === "Escape") {
        row.querySelector('[data-action="cancel"]').click();
    }
});

// ----- Navigation tabs -----
navTabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const pageName = tab.dataset.page;

        // Show only the matching page.
        pages.forEach(function(page) {
            page.hidden = page.id !== "page-" + pageName;
        });

        // Highlight only the clicked tab.
        navTabs.forEach(function(otherTab) {
            otherTab.classList.remove("active");
            otherTab.removeAttribute("aria-current");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-current", "page");
    });
});

// ----- Light / dark mode -----
function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    // Show the icon for the mode you would switch TO.
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
}

themeToggle.addEventListener("click", function() {
    const current = document.documentElement.dataset.theme;
    setTheme(current === "dark" ? "light" : "dark");
});

// ----- Start-up -----
// Always start in light mode. The toggle switches to dark mode.
setTheme("light");
renderExpenses();
