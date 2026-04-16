const STORAGE_KEY = "cashFlowTrackerData";

const salaryForm = document.getElementById("salaryForm");
const expenseForm = document.getElementById("expenseForm");
const salaryInput = document.getElementById("salary");
const expenseNameInput = document.getElementById("expenseName");
const expenseAmountInput = document.getElementById("expenseAmount");
const expenseList = document.getElementById("expenseList");
const emptyState = document.getElementById("emptyState");
const statusMessage = document.getElementById("statusMessage");
const totalSalaryEl = document.getElementById("totalSalary");
const totalExpensesEl = document.getElementById("totalExpenses");
const balanceEl = document.getElementById("balance");

let state = {
    salary: 0,
    expenses: []
};

let chartInstance;

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    loadData();
    bindEvents();
    render();
}

function bindEvents() {
    salaryForm.addEventListener("submit", handleSalarySubmit);
    expenseForm.addEventListener("submit", handleExpenseSubmit);
    expenseList.addEventListener("click", handleExpenseListClick);
}

function handleSalarySubmit(event) {
    event.preventDefault();

    const salaryValue = Number(salaryInput.value);

    if (salaryInput.value.trim() === "" || Number.isNaN(salaryValue) || salaryValue < 0) {
        showStatus("Please enter a valid salary amount.", true);
        return;
    }

    state.salary = salaryValue;
    persistData();
    render();
    showStatus("Salary saved successfully.");
}

function handleExpenseSubmit(event) {
    event.preventDefault();

    const expenseName = expenseNameInput.value.trim();
    const expenseAmount = Number(expenseAmountInput.value);

    if (!expenseName) {
        showStatus("Expense name cannot be empty.", true);
        return;
    }

    if (
        expenseAmountInput.value.trim() === "" ||
        Number.isNaN(expenseAmount) ||
        expenseAmount <= 0
    ) {
        showStatus("Expense amount must be greater than 0.", true);
        return;
    }

    state.expenses.push({
        id: crypto.randomUUID(),
        name: expenseName,
        amount: expenseAmount
    });

    persistData();
    expenseForm.reset();
    render();
    showStatus("Expense added successfully.");
}

function handleExpenseListClick(event) {
    const deleteButton = event.target.closest(".delete-btn");

    if (!deleteButton) {
        return;
    }

    const expenseId = deleteButton.dataset.id;
    state.expenses = state.expenses.filter((expense) => expense.id !== expenseId);
    persistData();
    render();
    showStatus("Expense deleted.");
}

function render() {
    const totalExpenses = getTotalExpenses();
    const balance = state.salary - totalExpenses;

    salaryInput.value = state.salary || "";
    totalSalaryEl.textContent = formatCurrency(state.salary);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    balanceEl.textContent = formatCurrency(balance);

    renderExpenses();
    renderChart(totalExpenses, balance);
}

function renderExpenses() {
    expenseList.innerHTML = "";

    if (state.expenses.length === 0) {
        emptyState.hidden = false;
        return;
    }

    emptyState.hidden = true;

    state.expenses.forEach((expense) => {
        const listItem = document.createElement("li");
        listItem.className = "expense-item";
        listItem.innerHTML = `
            <div>
                <h3>${escapeHtml(expense.name)}</h3>
                <p>Added expense</p>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
            <button class="delete-btn" type="button" data-id="${expense.id}" aria-label="Delete ${escapeAttribute(expense.name)}">
                Trash
            </button>
        `;

        expenseList.appendChild(listItem);
    });
}

function renderChart(totalExpenses, balance) {
    const ctx = document.getElementById("chart");
    const remainingBalance = Math.max(balance, 0);

    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: ["Total Expenses", "Remaining Balance"],
            datasets: [{
                data: [totalExpenses, remainingBalance],
                backgroundColor: ["#f97316", "#0f766e"],
                borderColor: ["#fff7ed", "#f0fdfa"],
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 18,
                        font: {
                            family: "Manrope"
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label(context) {
                            const value = Number(context.raw) || 0;
                            return `${context.label}: ${formatCurrency(value)}`;
                        }
                    }
                }
            }
        }
    });
}

function getTotalExpenses() {
    return state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function persistData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
        return;
    }

    try {
        const parsedData = JSON.parse(savedData);
        state.salary = Number(parsedData.salary) || 0;
        state.expenses = Array.isArray(parsedData.expenses)
            ? parsedData.expenses
                .filter((expense) => expense && typeof expense.name === "string")
                .map((expense) => ({
                    id: expense.id || crypto.randomUUID(),
                    name: expense.name.trim(),
                    amount: Number(expense.amount) || 0
                }))
                .filter((expense) => expense.name && expense.amount > 0)
            : [];
    } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        showStatus("Saved data was corrupted, so it was reset.", true);
    }
}

function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.classList.toggle("error", isError);
}

function formatCurrency(value) {
    return `Rs ${Number(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
    return escapeHtml(value);
}
