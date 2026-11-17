
// MiniBiz - Improved Business Manager

// ==========================================
// 1. LOAD SAVED FINANCIAL DATA
// ==========================================

let sales = Number(localStorage.getItem("minibiz_sales")) || 0;
let expenses = Number(localStorage.getItem("minibiz_expenses")) || 0;

let transactions = [];

try {
    transactions = JSON.parse(
        localStorage.getItem("minibiz_transactions") || "[]"
    );

    if (!Array.isArray(transactions)) {
        transactions = [];
    }
} catch (error) {
    transactions = [];
}

// ==========================================
// 2. GET HTML ELEMENTS
// ==========================================

const salesElement = document.getElementById("sales");
const expensesElement = document.getElementById("expenses");
const profitElement = document.getElementById("profit");

const startButton = document.getElementById("startButton");
const cancelButton = document.getElementById("cancelButton");

const transactionForm = document.getElementById("transactionForm");
const entryForm = document.getElementById("entryForm");
const transactionList = document.getElementById("transactionList");

// Smart sales elements

const productPicker = document.getElementById("productPicker");
const saleProduct = document.getElementById("saleProduct");
const quantityWrapper = document.getElementById("quantityWrapper");
const saleQuantity = document.getElementById("saleQuantity");

const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const descriptionInput = document.getElementById("description");

// Inventory elements

const productList = document.getElementById("productList");

const addProductButton =
    document.getElementById("addProductButton");

const productForm =
    document.getElementById("productForm");

const productEntryForm =
    document.getElementById("productEntryForm");

const cancelProductButton =
    document.getElementById("cancelProductButton");

// ==========================================
// 3. LOAD SAVED PRODUCTS
// ==========================================

let products = [];
let saleCart = [];

try {
    products = JSON.parse(
        localStorage.getItem("minibiz_products") || "[]"
    );

    if (!Array.isArray(products)) {
        products = [];
    }
} catch (error) {
    products = [];
}

// ==========================================
// 4. COMMON FUNCTIONS
// ==========================================

// ==========================================
// MINIBIZ CUSTOM NOTIFICATION SYSTEM
// ==========================================

function showMiniBizDialog(message, type = "info", confirmation = false) {

    return new Promise(function(resolve) {

        // Create popup background
        const overlay = document.createElement("div");
        overlay.className = "minibiz-dialog-overlay";

        // Create popup box
        const dialog = document.createElement("div");
        dialog.className = "minibiz-dialog";

        // Icon
        const icon = document.createElement("div");
        icon.className = "minibiz-dialog-icon " + type;

        if (type === "success") {
            icon.textContent = "✓";
        } else if (type === "error") {
            icon.textContent = "!";
        } else {
            icon.textContent = "i";
        }

        // Title
        const title = document.createElement("h3");
        title.textContent =
            type === "success" ? "Success!" :
            type === "error" ? "Something went wrong" :
            confirmation ? "Please confirm" :
            "MiniBiz";

        // Message
        const text = document.createElement("p");
        text.textContent = message;

        // Buttons
        const actions = document.createElement("div");
        actions.className = "minibiz-dialog-actions";

        function closeDialog(result) {
            overlay.remove();
            resolve(result);
        }

        if (confirmation) {

            const cancelButton = document.createElement("button");
            cancelButton.textContent = "Cancel";
            cancelButton.className = "minibiz-dialog-cancel";

            cancelButton.addEventListener("click", function() {
                closeDialog(false);
            });

            actions.appendChild(cancelButton);

        }

        const okButton = document.createElement("button");

        okButton.textContent = confirmation ? "Confirm" : "OK";
        okButton.className = "minibiz-dialog-confirm";

        okButton.addEventListener("click", function() {
            closeDialog(true);
        });

        actions.appendChild(okButton);

        // Assemble popup
        dialog.append(icon, title, text, actions);
        overlay.appendChild(dialog);

        document.body.appendChild(overlay);

        okButton.focus();

    });

}


// Show notification
function showMiniBizAlert(message) {

    const type =
        /successfully|success/i.test(message) ? "success" :
        /invalid|unable|error|not enough|cannot|no longer/i.test(message)
            ? "error"
            : "info";

    return showMiniBizDialog(message, type, false);

}


// Show confirmation
function showMiniBizConfirm(message) {

    return showMiniBizDialog(message, "info", true);

}

// Format Indian currency

function formatMoney(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}

// Save financial information

function saveData() {

    localStorage.setItem("minibiz_sales", sales);
    localStorage.setItem("minibiz_expenses", expenses);

    localStorage.setItem(
        "minibiz_transactions",
        JSON.stringify(transactions)
    );

}

// Save product inventory

function saveProducts() {

    localStorage.setItem(
        "minibiz_products",
        JSON.stringify(products)
    );

}

// Update dashboard

function updateDashboard() {

    const profit = sales - expenses;

    salesElement.textContent = formatMoney(sales);
    expensesElement.textContent = formatMoney(expenses);
    profitElement.textContent = formatMoney(profit);

}

// ==========================================
// 5. TRANSACTION HISTORY
// ==========================================


// Convert saved transaction dates into usable Date objects

function parseTransactionDate(dateValue) {

    if (!dateValue) return null;

    const value = String(dateValue).trim();

    // Indian date format: DD/MM/YYYY, HH:MM:SS

    const indianDate = value.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
    );

    if (indianDate) {

        let hour = Number(indianDate[4] || 0);

        const meridiem = (indianDate[7] || "").toLowerCase();

        if (meridiem === "pm" && hour < 12) hour += 12;
        if (meridiem === "am" && hour === 12) hour = 0;

        return new Date(
            Number(indianDate[3]),
            Number(indianDate[2]) - 1,
            Number(indianDate[1]),
            hour,
            Number(indianDate[5] || 0),
            Number(indianDate[6] || 0)
        );

    }

    // ISO date format fallback

    const isoDate = value.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/
    );

    if (isoDate) {

        return new Date(
            Number(isoDate[1]),
            Number(isoDate[2]) - 1,
            Number(isoDate[3]),
            Number(isoDate[4] || 0),
            Number(isoDate[5] || 0),
            Number(isoDate[6] || 0)
        );

    }

    const parsed = new Date(value);

    return Number.isNaN(parsed.getTime()) ? null : parsed;

}


// Convert a date into YYYY-MM-DD using local time

function getTransactionDateKey(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;

}


// Display filtered transactions

function displayTransactions() {

    transactionList.replaceChildren();

    if (transactions.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty";
        empty.textContent = "No transactions yet.";

        transactionList.appendChild(empty);

        return;

    }

    const typeFilter =
        document.getElementById("transactionTypeFilter").value;

    const periodFilter =
        document.getElementById("transactionPeriodFilter").value;

    const sortFilter =
        document.getElementById("transactionSortFilter").value;

    const startDate =
        document.getElementById("transactionStartDate").value;

    const endDate =
        document.getElementById("transactionEndDate").value;

    const now = new Date();

    const todayKey = getTransactionDateKey(now);

    let startKey = "";
    let endKey = todayKey;

    if (periodFilter === "today") {

        startKey = todayKey;

    } else if (periodFilter === "week") {

        const weekStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const daysSinceMonday =
            (weekStart.getDay() + 6) % 7;

        weekStart.setDate(
            weekStart.getDate() - daysSinceMonday
        );

        startKey = getTransactionDateKey(weekStart);

    } else if (periodFilter === "month") {

        const monthStart = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );

        startKey = getTransactionDateKey(monthStart);

    } else if (periodFilter === "custom") {

        if (!startDate || !endDate) {

            const empty = document.createElement("p");

            empty.className = "empty";
            empty.textContent =
                "Please select both start and end dates.";

            transactionList.appendChild(empty);

            return;

        }

        if (endDate < startDate) {

            const empty = document.createElement("p");

            empty.className = "empty";
            empty.textContent =
                "End date cannot be earlier than start date.";

            transactionList.appendChild(empty);

            return;

        }

        startKey = startDate;
        endKey = endDate;

    }


    let filteredTransactions = transactions
        .map(function(item, index) {

            const date = parseTransactionDate(item.date);

            return {
                item: item,
                index: index,
                date: date,
                timestamp: date ? date.getTime() : 0,
                dateKey: date ? getTransactionDateKey(date) : ""
            };

        })
        .filter(function(entry) {

            if (
                typeFilter !== "all" &&
                entry.item.type !== typeFilter
            ) {
                return false;
            }

            if (periodFilter !== "all") {

                if (!entry.dateKey) return false;

                if (
                    entry.dateKey < startKey ||
                    entry.dateKey > endKey
                ) {
                    return false;
                }

            }

            return true;

        });


    // Sorting

    filteredTransactions.sort(function(a, b) {

        if (sortFilter === "oldest") {

            return a.timestamp - b.timestamp ||
                   a.index - b.index;

        }

        if (sortFilter === "highest") {

            return Number(b.item.amount) -
                   Number(a.item.amount) ||
                   b.timestamp - a.timestamp;

        }

        if (sortFilter === "lowest") {

            return Number(a.item.amount) -
                   Number(b.item.amount) ||
                   b.timestamp - a.timestamp;
      
        }

// Default: Newest first

        return b.timestamp - a.timestamp ||
               b.index - a.index;

    });


    if (filteredTransactions.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty";
        empty.textContent = "No transactions match your filters.";

        transactionList.appendChild(empty);

        return;

    }


    // Display transactions

    filteredTransactions.forEach(function(entry) {

        const item = entry.item;

        const card = document.createElement("div");

        card.className = "transaction";

        const details = document.createElement("div");

        const title = document.createElement("strong");

        title.textContent = item.description || item.type;

        const date = document.createElement("p");

        date.textContent = item.date;

        const category = document.createElement("p");

        category.textContent = item.type;

        details.append(title, category, date);

        const amount = document.createElement("strong");

        amount.className =
            item.type === "Sale" ? "income" : "expense";

        amount.textContent =
            (item.type === "Sale" ? "+" : "-") +
            formatMoney(item.amount);

        card.append(details, amount);

        transactionList.appendChild(card);

    });

}


// ==========================================
// TRANSACTION FILTER CONTROLS
// ==========================================

const transactionTypeControl =
    document.getElementById("transactionTypeFilter");

const transactionPeriodControl =
    document.getElementById("transactionPeriodFilter");

const transactionSortControl =
    document.getElementById("transactionSortFilter");

const transactionCustomDates =
    document.getElementById("transactionCustomDates");

const transactionStartControl =
    document.getElementById("transactionStartDate");

const transactionEndControl =
    document.getElementById("transactionEndDate");

const resetTransactionFilters =
    document.getElementById("resetTransactionFilters");


// Transaction type filter

transactionTypeControl.addEventListener("change", function() {

    displayTransactions();

});


// Date period filter

transactionPeriodControl.addEventListener("change", function() {

    transactionCustomDates.hidden =
        transactionPeriodControl.value !== "custom";

    displayTransactions();

});


// Sorting filter

transactionSortControl.addEventListener("change", function() {

    displayTransactions();

});


// Custom date filters

transactionStartControl.addEventListener("change", function() {

    displayTransactions();

});

transactionEndControl.addEventListener("change", function() {

    displayTransactions();

});


// Reset all filters

resetTransactionFilters.addEventListener("click", function() {

    transactionTypeControl.value = "all";

    transactionPeriodControl.value = "all";

    transactionSortControl.value = "newest";

    transactionStartControl.value = "";

    transactionEndControl.value = "";

  transactionStartDateButton.textContent = "Choose Start Date";

transactionEndDateButton.textContent = "Choose End Date";

transactionCalendar.hidden = true;

    transactionCustomDates.hidden = true;

    displayTransactions();

});


// ==========================================
// CUSTOM TRANSACTION CALENDAR
// ==========================================

const transactionCalendar =
    document.getElementById("transactionCalendar");

const transactionCalendarMonth =
    document.getElementById("transactionCalendarMonth");

const transactionCalendarDays =
    document.getElementById("transactionCalendarDays");

const transactionStartDateButton =
    document.getElementById("transactionStartDateButton");

const transactionEndDateButton =
    document.getElementById("transactionEndDateButton");

const transactionCalendarPrev =
    document.getElementById("transactionCalendarPrev");

const transactionCalendarNext =
    document.getElementById("transactionCalendarNext");

const transactionCalendarToday =
    document.getElementById("transactionCalendarToday");

const transactionCalendarClose =
    document.getElementById("transactionCalendarClose");

let transactionCalendarDate = new Date();

let transactionCalendarActiveField = null;


// Format date for button

function formatTransactionCalendarDate(dateValue) {

    const date = new Date(dateValue + "T00:00:00");

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });

}


// Open calendar

function openTransactionCalendar(field) {

    transactionCalendarActiveField = field;

    const selectedValue = field.value;

    transactionCalendarDate = selectedValue
        ? new Date(selectedValue + "T00:00:00")
        : new Date();

    transactionCalendar.hidden = false;

    renderTransactionCalendar();

}


// Display calendar

function renderTransactionCalendar() {

    const year = transactionCalendarDate.getFullYear();

    const month = transactionCalendarDate.getMonth();

    transactionCalendarMonth.textContent =
        transactionCalendarDate.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });

    transactionCalendarDays.replaceChildren();

    const firstDay = new Date(year, month, 1).getDay();

    const totalDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {

        const blank = document.createElement("span");

        transactionCalendarDays.appendChild(blank);

    }

    for (let day = 1; day <= totalDays; day++) {

        const dayButton = document.createElement("button");

        dayButton.type = "button";

        dayButton.textContent = day;

        const dateValue =
            year + "-" +
            String(month + 1).padStart(2, "0") + "-" +
            String(day).padStart(2, "0");

        if (
            transactionCalendarActiveField &&
            transactionCalendarActiveField.value === dateValue
        ) {

            dayButton.classList.add("selected");

        }

        dayButton.addEventListener("click", function() {

            transactionCalendarActiveField.value = dateValue;

            if (
                transactionCalendarActiveField.id === "transactionStartDate"
            ) {

                transactionStartDateButton.textContent =
                    formatTransactionCalendarDate(dateValue);

            } else {

                transactionEndDateButton.textContent =
                    formatTransactionCalendarDate(dateValue);

            }

            transactionCalendar.hidden = true;

            transactionCalendarActiveField.dispatchEvent(
                new Event("change", { bubbles: true })
            );

        });

        transactionCalendarDays.appendChild(dayButton);

    }

}


// Open Start Date calendar

transactionStartDateButton.addEventListener("click", function() {

    openTransactionCalendar(transactionStartControl);

});


// Open End Date calendar

transactionEndDateButton.addEventListener("click", function() {

    openTransactionCalendar(transactionEndControl);

});


// Previous month

transactionCalendarPrev.addEventListener("click", function() {

    transactionCalendarDate.setMonth(
        transactionCalendarDate.getMonth() - 1
    );

    renderTransactionCalendar();

});


// Next month

transactionCalendarNext.addEventListener("click", function() {

    transactionCalendarDate.setMonth(
        transactionCalendarDate.getMonth() + 1
    );

    renderTransactionCalendar();

});


// Select Today

transactionCalendarToday.addEventListener("click", function() {

    const today = new Date();

    const dateValue =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    transactionCalendarActiveField.value = dateValue;

    if (
        transactionCalendarActiveField.id === "transactionStartDate"
    ) {

        transactionStartDateButton.textContent =
            formatTransactionCalendarDate(dateValue);

    } else {

        transactionEndDateButton.textContent =
            formatTransactionCalendarDate(dateValue);

    }

    transactionCalendar.hidden = true;

    transactionCalendarActiveField.dispatchEvent(
        new Event("change", { bubbles: true })
    );

});


// Close calendar

transactionCalendarClose.addEventListener("click", function() {

    transactionCalendar.hidden = true;

});


// ==========================================
// 6. TRANSACTION FORM
// ==========================================

// Open transaction form

startButton.addEventListener("click", function() {

    transactionForm.hidden = false;

    entryForm.reset();

    saleCart = [];

    displaySaleCart();

    updateSaleFields();

    transactionForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    amountInput.focus();

});

// Close transaction form

cancelButton.addEventListener("click", function() {

    transactionForm.hidden = true;

    entryForm.reset();

    saleCart = [];

    displaySaleCart();

    updateSaleFields();

});

// ==========================================
// 7. SMART SALES AND EXPENSE RECORDING
// ==========================================

function updateSaleFields() {

    const isSale = typeInput.value === "Sale";

    productPicker.hidden = !isSale;

    const selectedProduct = products.find(
        p => p.id === saleProduct.value
    );

    quantityWrapper.hidden = !isSale || !selectedProduct;

    if (isSale && saleCart.length > 0) {

        const total = saleCart.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        amountInput.value = total.toFixed(2);
        amountInput.readOnly = true;

    } else if (selectedProduct && isSale) {

        const quantity = Number(saleQuantity.value);

        amountInput.value =
            quantity > 0
                ? (selectedProduct.price * quantity).toFixed(2)
                : "";

        amountInput.readOnly = true;

    } else {

        amountInput.readOnly = false;
      
