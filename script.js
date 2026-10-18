
// ===================================
// Spendly Expense Tracker
// ===================================


// 1. Get HTML elements

const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modalOverlay");
const closeBtn = document.getElementById("closeBtn");
const cancelBtn = document.getElementById("cancelBtn");

const form = document.getElementById("transactionForm");
const transactionList = document.getElementById("transactionList");

const title = document.getElementById("title");
const type = document.getElementById("type");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const date = document.getElementById("date");
const payment = document.getElementById("payment");
const note = document.getElementById("note");
const editId = document.getElementById("editId");

const searchInput = document.getElementById("searchInput");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const dateFilter = document.getElementById("dateFilter");

const budgetForm = document.getElementById("budgetForm");
const budgetInput = document.getElementById("budgetInput");


// 2. Store data

let transactions = JSON.parse(
    localStorage.getItem("spendlyTransactions") || "[]"
);

let budget = Number(localStorage.getItem("spendlyBudget")) || 0;

// Starting balance: change this amount if needed.
const openingBalance = 10000;


// 3. Today's date

function getToday() {
    const today = new Date();

    return today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");
}

date.value = getToday();

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN");

document.getElementById("year").textContent =
    new Date().getFullYear();

budgetInput.value = budget || "";


// 4. Format money

function money(amount) {
    return "₹" + amount.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


// 5. Open and close modal

function openModal() {
    modal.style.display = "flex";
}

function closeModal() {
    modal.style.display = "none";
    form.reset();
    editId.value = "";
    date.value = getToday();

    document.getElementById("modalTitle").textContent =
        "Add Transaction";

    document.getElementById("formError").textContent = "";
}

addBtn.addEventListener("click", function () {
    closeModal();
    openModal();
});

closeBtn.addEventListener("click", closeModal);
cancelBtn.addEventListener("click", closeModal);


// 6. Add or edit transaction

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const transaction = {
        id: editId.value || Date.now().toString(),
        title: title.value.trim(),
        type: type.value,
        amount: Number(amount.value),
        category: category.value,
        date: date.value,
        payment: payment.value,
        note: note.value.trim()
    };

    // Check the form values.

    if (
        !transaction.title ||
        !Number.isFinite(transaction.amount) ||
        transaction.amount <= 0 ||
        transaction.amount > 1000000000 ||
        !transaction.date ||
        transaction.date > getToday()
    ) {
        document.getElementById("formError").textContent =
            "Please enter valid details.";
        return;
    }

    // Edit an existing transaction.

    if (editId.value) {
        for (let i = 0; i < transactions.length; i++) {
            if (transactions[i].id === editId.value) {
                transactions[i] = transaction;
                break;
            }
        }
    } else {
        // Add a new transaction.

        transactions.push(transaction);
    }

    // Save data.

    localStorage.setItem(
        "spendlyTransactions",
        JSON.stringify(transactions)
    );

    closeModal();
    updateDashboard();
});


// 7. Show transactions

function displayTransactions() {
    transactionList.innerHTML = "";

    const search = searchInput.value.toLowerCase();

    for (let i = transactions.length - 1; i >= 0; i--) {
        const item = transactions[i];

        // Apply search and filters.

        if (
            !(
                item.title.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search) ||
                item.payment.toLowerCase().includes(search) ||
                (item.note || "").toLowerCase().includes(search)
            )
        ) continue;

        if (typeFilter.value !== "all" &&
            item.type !== typeFilter.value) continue;

        if (categoryFilter.value !== "all" &&
            item.category !== categoryFilter.value) continue;

        if (dateFilter.value &&
            item.date !== dateFilter.value) continue;

        const row = document.createElement("tr");

        // Show income with + and expense with -.

        const sign = item.type === "income" ? "+" : "-";
        const color = item.type === "income" ? "income" : "expense";

        // Escape text entered by the user before displaying it.

        function safeText(text) {
            return String(text).replace(/[&<>"']/g, function (char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[char];
            });
        }

        row.innerHTML = `
            <td>
                <strong>${safeText(item.title)}</strong>
                ${item.note ? `<br><small>${safeText(item.note)}</small>` : ""}
            </td>
            <td>${safeText(item.category)}</td>
            <td>${item.date.split("-").reverse().join("/")}</td>
            <td>${safeText(item.payment)}</td>
            <td class="${color}">${sign}${money(item.amount)}</td>
            <td>
                <button class="btn btn-outline"
                    data-action="edit" data-id="${safeText(item.id)}">
                    Edit
                </button>
                <button class="btn btn-outline"
                    data-action="delete" data-id="${safeText(item.id)}">
                    Delete
                </button>
            </td>
        `;

        transactionList.appendChild(row);
    }

    // Show empty message if the table has no rows.

    document.getElementById("emptyState").style.display =
        transactionList.children.length === 0 ? "block" : "none";

    document.getElementById("transactionCount").textContent =
        transactionList.children.length + " transactions";
}


// 8. Edit and delete buttons

transactionList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "edit") {
        // Find the transaction to edit.

        const item = transactions.find(function (transaction) {
            return transaction.id === id;
        });

        if (!item) return;

        editId.value = item.id;
        title.value = item.title;
        type.value = item.type;
        amount.value = item.amount;
        category.value = item.category;
        date.value = item.date;
        payment.value = item.payment;
        note.value = item.note || "";

        document.getElementById("modalTitle").textContent =
            "Edit Transaction";

        openModal();
    }

    if (button.dataset.action === "delete") {
        if (confirm("Do you want to delete this transaction?")) {
            transactions = transactions.filter(function (item) {
                return item.id !== id;
            });

            localStorage.setItem(
                "spendlyTransactions",
                JSON.stringify(transactions)
            );

            updateDashboard();
        }
    }
});


// 9. Calculate dashboard amounts

function updateDashboard() {
    let income = 0;
    let expenses = 0;
    let todayExpenses = 0;
    let todayCount = 0;
    let monthlyExpenses = 0;

    const today = getToday();
    const month = today.slice(0, 7);

    // Calculate totals using a simple loop.

    for (let i = 0; i < transactions.length; i++) {
        const item = transactions[i];

        if (item.type === "income") {
            income += item.amount;
        } else {
            expenses += item.amount;

            if (item.date === today) {
                todayExpenses += item.amount;
                todayCount++;
            }

            if (item.date.startsWith(month)) {
                monthlyExpenses += item.amount;
            }
        }
    }

    // Remaining balance = opening balance + income - expenses.

    document.getElementById("balance").textContent =
        money(openingBalance + income - expenses);

    document.getElementById("todayExpense").textContent =
        money(todayExpenses);

    document.getElementById("todayCount").textContent =
        todayCount + " transactions today";

    document.getElementById("monthlyExpense").textContent =
        money(monthlyExpenses);

    document.getElementById("totalIncome").textContent =
        money(income);

    // Update budget and transaction table.

    updateBudget(monthlyExpenses);
    displayTransactions();
}


// 10. Save monthly budget

budgetForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const newBudget = Number(budgetInput.value);

    if (
        !Number.isFinite(newBudget) ||
        newBudget <= 0 ||
        newBudget > 1000000000
    ) {
        alert("Please enter a valid budget.");
        return;
    }

    budget = newBudget;

    localStorage.setItem("spendlyBudget", budget);

    updateDashboard();
});


// 11. Update budget progress

function updateBudget(spent) {
    document.getElementById("spentAmount").textContent = money(spent);

    if (budget <= 0) {
        document.getElementById("remainingAmount").textContent =
            "Not set";

        document.getElementById("budgetProgress").style.width = "0%";

        document.getElementById("budgetMessage").textContent =
            "Set your monthly budget to get started.";

        return;
    }

    const remaining = budget - spent;
    const percentage = (spent / budget) * 100;

    document.getElementById("remainingAmount").textContent =
        money(remaining);

    document.getElementById("budgetProgress").style.width =
        Math.min(percentage, 100) + "%";

    if (percentage >= 100) {
        document.getElementById("budgetMessage").textContent =
            "Your monthly budget has been reached or exceeded.";
    } else {
        document.getElementById("budgetMessage").textContent =
            "You have used " + percentage.toFixed(1) +
            "% of your monthly budget.";
    }
}


// 12. Search and filters

searchInput.addEventListener("input", displayTransactions);
typeFilter.addEventListener("change", displayTransactions);
categoryFilter.addEventListener("change", displayTransactions);
dateFilter.addEventListener("change", displayTransactions);


// Clear filters

document.getElementById("clearFilterBtn").addEventListener("click", function () {
    searchInput.value = "";
    typeFilter.value = "all";
    categoryFilter.value = "all";
    dateFilter.value = "";

    displayTransactions();
});


// 13. Start the application

updateDashboard();
