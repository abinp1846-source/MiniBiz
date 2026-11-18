
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
      
        if (isSale) {
            amountInput.value = "";
        }

    }

}

// Populate sale product dropdown

function populateSaleProducts() {

    saleProduct.replaceChildren();

    const manualOption = document.createElement("option");

    manualOption.value = "";
    manualOption.textContent = "Manual sale (no product)";

    saleProduct.appendChild(manualOption);

    products.forEach(function(product) {

        const option = document.createElement("option");

        option.value = product.id;

        option.textContent =
            product.name + " (" + product.stock + " available)";

        option.disabled = product.stock === 0;

        saleProduct.appendChild(option);

    });

}

// Display sale cart

function displaySaleCart() {

    const cartItemsList =
        document.getElementById("cartItemsList");

    const saleCartBox =
        document.getElementById("saleCart");

    const cartTotal =
        document.getElementById("cartTotal");

    cartItemsList.replaceChildren();

    if (saleCart.length === 0) {

        saleCartBox.hidden = true;

        cartTotal.textContent = "₹0.00";

        return;
    }

    saleCartBox.hidden = false;

    let total = 0;

    saleCart.forEach(function(item) {

        total += item.subtotal;

        const itemRow = document.createElement("p");

        itemRow.textContent =
            item.name + " × " + item.quantity +
            " = " + formatMoney(item.subtotal);

        cartItemsList.appendChild(itemRow);

    });

    cartTotal.textContent = formatMoney(total);

}

// Add product to sale cart

function addToSaleCart() {

    const productId = saleProduct.value;
    const quantity = Number(saleQuantity.value);

    const selectedProduct = products.find(
        p => p.id === productId
    );

    if (!selectedProduct) {
        showMiniBizAlert("Please select a product first.");
        return;
    }

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
        showMiniBizAlert("Please enter a valid quantity.");
        return;
    }

    const existingItem = saleCart.find(
        item => item.productId === productId
    );

    const alreadyAdded = existingItem
        ? existingItem.quantity
        : 0;

    if (alreadyAdded + quantity > selectedProduct.stock) {
        showMiniBizAlert("Not enough stock available!");
        return;
    }

    if (existingItem) {

        existingItem.quantity += quantity;

        existingItem.subtotal =
            existingItem.price * existingItem.quantity;

    } else {

        saleCart.push({

            productId: selectedProduct.id,
            name: selectedProduct.name,
            price: selectedProduct.price,
            quantity: quantity,
            subtotal: selectedProduct.price * quantity

        });

    }

    displaySaleCart();

    saleQuantity.value = 1;

    updateSaleFields();

}

// Cart buttons

document.getElementById("addToCartButton").addEventListener(
    "click",
    addToSaleCart
);

document.getElementById("clearCartButton").addEventListener(
    "click",
    function() {

        saleCart = [];

        displaySaleCart();

        updateSaleFields();

    }
);

// Update sale fields when selections change

typeInput.addEventListener("change", updateSaleFields);

saleProduct.addEventListener("change", updateSaleFields);

saleQuantity.addEventListener("input", updateSaleFields);

// ==========================================
// 8. SAVE TRANSACTION
// ==========================================

entryForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const type = typeInput.value;

    const description = descriptionInput.value.trim();

    let value = Number(amountInput.value);

    let finalDescription = description || type;

    let soldItems = [];

    if (type === "Sale") {

        if (saleCart.length > 0) {

            // Validate all products before changing stock

            for (const item of saleCart) {

                const product = products.find(
                    p => p.id === item.productId
                );

                if (!product) {
                    showMiniBizAlert("A product in your cart no longer exists.");
                    return;
                }

                if (
                    !Number.isSafeInteger(item.quantity) ||
                    item.quantity < 1 ||
                    item.quantity > product.stock
                ) {
                    showMiniBizAlert("Not enough stock available for " + item.name);
                    return;
                }

            }

            // Calculate total

            value = saleCart.reduce(
                (total, item) => total + item.subtotal,
                0
            );

            // Prepare sale details

            soldItems = saleCart.map(item => ({

                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal

            }));

            finalDescription = soldItems.map(
                item => item.name + " × " + item.quantity
            ).join(", ");

            // Deduct stock

            soldItems.forEach(function(item) {

                const product = products.find(
                    p => p.id === item.productId
                );

                product.stock -= item.quantity;

            });

            saveProducts();

        } else {

            // Prevent a selected product from being sold
            // without adding it to the cart

            if (saleProduct.value !== "") {

                showMiniBizAlert(
                    "Please add the selected product to the sale first."
                );

                return;

            }

        }

    }

    if (!Number.isFinite(value) || value <= 0) {

        showMiniBizAlert("Please enter a valid amount.");

        return;

    }

    // Update financial totals

    if (type === "Sale") {
        sales += value;
    } else {
        expenses += value;
    }

    // Save transaction

    transactions.push({

        type: type,
        amount: value,
        description: finalDescription,
        quantity: null,
        items: soldItems,
        date: new Date().toLocaleString("en-IN")

    });

    saveData();

    updateDashboard();

    displayTransactions();

    displayProducts();

    populateSaleProducts();

    // Clear cart after successful transaction

    saleCart = [];

    displaySaleCart();

    transactionForm.hidden = true;

    entryForm.reset();

    updateSaleFields();

    showMiniBizAlert("Transaction saved successfully!");

});

// ==========================================
// 9. INVENTORY DISPLAY
// ==========================================

function displayProducts() {

    productList.replaceChildren();

    if (products.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty";
        empty.textContent = "No products added yet.";

        productList.appendChild(empty);

        return;

    }

    products.forEach(function(product) {

        const card = document.createElement("div");

        card.className = "product-card";

        const top = document.createElement("div");

        top.className = "product-top";

        const details = document.createElement("div");

        const name = document.createElement("div");

        name.className = "product-name";
        name.textContent = product.name;

        const price = document.createElement("div");

        price.className = "product-price";
        price.textContent = formatMoney(product.price);

        details.append(name, price);

        const status = document.createElement("span");

        status.className = "stock-status";

        if (product.stock === 0) {

            status.textContent = "Out of stock";
            status.classList.add("out-stock");

        } else if (product.stock <= 5) {

            status.textContent = "Low stock";
            status.classList.add("low-stock");

        } else {

            status.textContent = "In stock";

        }

        top.append(details, status);

        const quantity = document.createElement("p");

        quantity.className = "product-quantity";

        quantity.textContent =
            "Available quantity: " + product.stock;

        // Product management buttons

        const actions = document.createElement("div");

        actions.className = "product-actions";

        const editButton = document.createElement("button");

        editButton.className = "edit-product-btn";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", function() {
            editProduct(product.id);
        });

        const restockButton = document.createElement("button");

        restockButton.className = "restock-product-btn";
        restockButton.textContent = "Restock";

        restockButton.addEventListener("click", function() {
            restockProduct(product.id);
        });

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-product-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function() {
            deleteProduct(product.id);
        });

        actions.append(
            editButton,
            restockButton,
            deleteButton
        );

        card.append(top, quantity, actions);

        productList.appendChild(card);

    });

}

// ==========================================
// 10. PRODUCT MANAGEMENT POPUP
// ==========================================

const productModal = document.getElementById("productModal");

const productModalForm =
    document.getElementById("productModalForm");

const productModalTitle =
    document.getElementById("productModalTitle");

const productModalMessage =
    document.getElementById("productModalMessage");

const modalNameField =
    document.getElementById("modalNameField");

const modalPriceField =
    document.getElementById("modalPriceField");

const modalStockField =
    document.getElementById("modalStockField");

const modalProductName =
    document.getElementById("modalProductName");

const modalProductPrice =
    document.getElementById("modalProductPrice");

const modalProductStock =
    document.getElementById("modalProductStock");

const modalSubmitButton =
    document.getElementById("modalSubmitButton");

const modalCancelButton =
    document.getElementById("modalCancelButton");
                
let currentProductAction = "";
let currentProductId = "";

// Open product popup

function openProductModal(action, productId) {

    const product = products.find(p => p.id === productId);

    if (!product) return;

    currentProductAction = action;
    currentProductId = productId;

    productModalForm.reset();

    modalNameField.hidden = false;
    modalPriceField.hidden = false;
    modalStockField.hidden = false;

    modalSubmitButton.style.background = "#1769aa";

    const stockLabel = document.querySelector(
        'label[for="modalProductStock"]'
    );

    if (action === "edit") {

        productModalTitle.textContent = "Edit Product";

        productModalMessage.textContent =
            "Update your product details.";

        modalProductName.value = product.name;
        modalProductPrice.value = product.price;
        modalProductStock.value = product.stock;

        stockLabel.textContent = "Stock Quantity";

        modalSubmitButton.textContent = "Save Changes";

    } else if (action === "restock") {

        productModalTitle.textContent = "Restock Product";

        productModalMessage.textContent =
            "Add more units of " + product.name + ".";

        modalNameField.hidden = true;
        modalPriceField.hidden = true;

        modalProductStock.value = 1;

        stockLabel.textContent = "Additional Quantity";

        modalSubmitButton.textContent = "Add Stock";

    } else if (action === "delete") {

        productModalTitle.textContent = "Delete Product?";

        productModalMessage.textContent =
            "Delete " + product.name +
            "? Previous sales records will remain unchanged.";

        modalNameField.hidden = true;
        modalPriceField.hidden = true;
        modalStockField.hidden = true;

        modalSubmitButton.textContent = "Delete Product";

        modalSubmitButton.style.background = "#c62828";

    }

    productModal.hidden = false;

}

// Edit product

function editProduct(productId) {

    if (saleCart.some(item => item.productId === productId)) {

        showMiniBizAlert("Please finish or clear the current sale first.");

        return;

    }

    openProductModal("edit", productId);

}

// Restock product

function restockProduct(productId) {

    openProductModal("restock", productId);

}


// Delete product


function deleteProduct(productId) {

    if (saleCart.some(item => item.productId === productId)) {

        showMiniBizAlert("Please finish or clear the current sale first.");

        return;

    }

    openProductModal("delete", productId);

}



// Cancel product popup

modalCancelButton.addEventListener("click", function() {

    productModal.hidden = true;

});

// Save product popup action

productModalForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const product = products.find(
        p => p.id === currentProductId
    );

    if (!product) {

        productModal.hidden = true;

        return;

    }

    if (currentProductAction === "edit") {

        const name = modalProductName.value.trim();

        const price = Number(modalProductPrice.value);

        const stock = Number(modalProductStock.value);

        if (
            !name ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isSafeInteger(stock) ||
            stock < 0
        ) {

            showMiniBizAlert("Please enter valid product details.");

            return;

        }

        product.name = name;
        product.price = price;
        product.stock = stock;

    } else if (currentProductAction === "restock") {

        const quantity = Number(modalProductStock.value);

        if (
            !Number.isSafeInteger(quantity) ||
            quantity < 1 ||
            !Number.isSafeInteger(product.stock + quantity)
        ) {

            showMiniBizAlert("Please enter a valid stock quantity.");

            return;

        }

        product.stock += quantity;

    } else if (currentProductAction === "delete") {

        products = products.filter(
            p => p.id !== currentProductId
        );

    }

    saveProducts();

    productModal.hidden = true;

    displayProducts();

    populateSaleProducts();

    updateSaleFields();

      if (currentProductAction === "edit") {

        showMiniBizAlert("Product updated successfully!");

    } else if (currentProductAction === "restock") {

        showMiniBizAlert("Stock updated successfully!");

    } else if (currentProductAction === "delete") {

        showMiniBizAlert("Product deleted successfully!");

      }

});

// ==========================================
// 11. ADD NEW PRODUCT
// ==========================================

// Open product form

addProductButton.addEventListener("click", function() {

    productForm.hidden = false;

    productEntryForm.reset();

    productForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

});

// Cancel product form

cancelProductButton.addEventListener("click", function() {

    productForm.hidden = true;

    productEntryForm.reset();

});

// Add new product

productEntryForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const name = document.getElementById("productName")
        .value.trim();

    const price = Number(
        document.getElementById("productPrice").value
    );

    const stockInput =
        document.getElementById("productStock").value;

    const stock = Number(stockInput);

    if (
        !name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        stockInput.trim() === "" ||
        !Number.isSafeInteger(stock) ||
        stock < 0
    ) {

        showMiniBizAlert("Please enter valid product details.");

        return;

    }

    products.push({

        id: Date.now().toString() +
            Math.random().toString(36).slice(2),

        name: name,

        price: price,

        stock: stock

    });

    saveProducts();

    displayProducts();

    productForm.hidden = true;

    productEntryForm.reset();

    showMiniBizAlert("Product added successfully!");

});

// ==========================================
// END OF PART 1
// ==========================================


// ==========================================
// 12. LOAD SAVED INFORMATION
// ==========================================

updateDashboard();
displayTransactions();
displayProducts();
populateSaleProducts();
updateSaleFields();


// ==========================================
// 13. BACKUP AND RESTORE
// ==========================================

const backupButton =
    document.getElementById("backupButton");

const restoreButton =
    document.getElementById("restoreButton");

const backupFile =
    document.getElementById("backupFile");

const backupInstructions =
    document.getElementById("backupInstructions");

const backupText =
    document.getElementById("backupText");

const copyBackupButton =
    document.getElementById("copyBackupButton");


// Prepare backup

backupButton.addEventListener("click", function() {

    const backupData = {

        app: "MiniBiz",
        version: 1,
        backupDate: new Date().toISOString(),
        sales: sales,
        expenses: expenses,
        transactions: transactions,
        products: products

    };

    backupText.value = JSON.stringify(backupData, null, 2);

    backupInstructions.style.display = "block";

});


// Copy backup data

copyBackupButton.addEventListener("click", async function() {

    backupText.focus();

    backupText.select();

    try {

        await navigator.clipboard.writeText(backupText.value);

        showMiniBizAlert("Backup data copied successfully!");

    } catch (error) {

        const copied = document.execCommand("copy");

        if (copied) {

            showMiniBizAlert("Backup data copied successfully!");

        } else {

            showMiniBizAlert(
                "Please select and copy the backup text manually."
            );

        }

    }

});


// Open backup file selector

restoreButton.addEventListener("click", function() {

    backupFile.click();

});


// Restore backup

backupFile.addEventListener("change", function() {

    const file = backupFile.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async function() {

        try {

            const data = JSON.parse(reader.result);

            const validTransactions =
                Array.isArray(data.transactions) &&
                data.transactions.every(item =>

                    item &&
                    ["Sale", "Expense"].includes(item.type) &&
                    Number.isFinite(item.amount) &&
                    item.amount > 0 &&
                    typeof item.date === "string"

                );

            const validProducts =
                Array.isArray(data.products) &&
                data.products.every(item =>

                    item &&
                    typeof item.id === "string" &&
                    typeof item.name === "string" &&
                    item.name.trim().length > 0 &&
                    Number.isFinite(item.price) &&
                    item.price > 0 &&
                    Number.isSafeInteger(item.stock) &&
                    item.stock >= 0

                );

            const validBackup =
                data.app === "MiniBiz" &&
                data.version === 1 &&
                Number.isFinite(data.sales) &&
                data.sales >= 0 &&
                Number.isFinite(data.expenses) &&
                data.expenses >= 0 &&
                validTransactions &&
                validProducts;

            if (!validBackup) {

                showMiniBizAlert("Invalid MiniBiz backup file.");

                return;

            }

            const confirmed = await showMiniBizConfirm(
                "Restoring this backup will replace your " +
                "current MiniBiz records. Continue?"
            );

            if (!confirmed) return;

            sales = data.sales;
            expenses = data.expenses;

            transactions = data.transactions;
            products = data.products;

        
            saveData();
            saveProducts();

            updateDashboard();
            displayTransactions();
            displayProducts();
            populateSaleProducts();
            updateSaleFields();

            showMiniBizAlert("MiniBiz backup restored successfully!");

        } catch (error) {

            showMiniBizAlert("Unable to read this backup file.");

        }

    };

    reader.readAsText(file);

    backupFile.value = "";

});


// ==========================================
// 14. BUSINESS REPORTS
// ==========================================

// All report elements are declared together
// before any report functions are called.

const reportPeriod =
    document.getElementById("reportPeriod");

const reportDate =
    document.getElementById("reportDate");

const reportSummary =
    document.getElementById("reportSummary");

const reportCharts =
    document.getElementById("reportCharts");

const reportModal =
    document.getElementById("reportModal");

const openReportModalButton =
    document.getElementById("openReportModalButton");

const cancelReportModalButton =
    document.getElementById("cancelReportModalButton");

const reportModalForm =
    document.getElementById("reportModalForm");

const reportEndDateField =
    document.getElementById("reportEndDateField");

const reportEndDate =
    document.getElementById("reportEndDate");


// ==========================================
// 15. REPORT DATE HELPERS
// ==========================================

// Get local date in YYYY-MM-DD format

function getLocalDateValue(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


// Parse transaction dates

function parseTransactionDate(dateText) {

    const match = String(dateText || "").match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

    if (match) {

        return new Date(
            Number(match[3]),
            Number(match[2]) - 1,
            Number(match[1])
        );

    }

    const parsed = new Date(dateText);

    return isNaN(parsed.getTime()) ? null : parsed;

}


// ==========================================
// 16. SHARED REPORT DATE CALCULATION
// ==========================================

// Both summary and charts use this function.
// This prevents date-range mismatches.

function getReportDateRange() {

    if (!reportDate.value) {
        return null;
    }

    const selectedDate = new Date(
        reportDate.value + "T00:00:00"
    );

    let startDate = new Date(selectedDate);

    let endDate = new Date(selectedDate);

    const period = reportPeriod.value;

    if (period === "custom") {

        if (!reportEndDate.value) {
            return null;
        }

        endDate = new Date(
            reportEndDate.value + "T00:00:00"
        );

        if (
            isNaN(endDate.getTime()) ||
            endDate < startDate
        ) {

            return null;

        }

        // Include the entire end date

        endDate.setDate(endDate.getDate() + 1);

    } else if (period === "weekly") {

        const day = (selectedDate.getDay() + 6) % 7;

        startDate.setDate(
            selectedDate.getDate() - day
        );

        endDate = new Date(startDate);

        endDate.setDate(
            startDate.getDate() + 7
        );

    } else if (period === "monthly") {

        startDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        );

        endDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            1
        );

    } else {

        // Daily report

        endDate.setDate(endDate.getDate() + 1);

    }

    return {
        startDate: startDate,
        endDate: endDate
    };

}


// Get transactions for selected report period

function getReportTransactions() {

    const range = getReportDateRange();

    if (!range) {
        return null;
    }

    return transactions.filter(item => {

        const transactionDate =
            parseTransactionDate(item.date);

        return transactionDate &&
            transactionDate >= range.startDate &&
            transactionDate < range.endDate;

    });

}


// ==========================================
// 17. REPORT SUMMARY
// ==========================================

function generateBusinessReport() {

    if (!reportPeriod || !reportDate || !reportSummary) {
        return false;
    }

    if (!reportDate.value) {

        reportSummary.innerHTML =
            "<p>Please choose a start date.</p>";

        return false;

    }

    if (
        reportPeriod.value === "custom" &&
        !reportEndDate.value
    ) {

        reportSummary.innerHTML =
            "<p>Please choose an end date.</p>";

        return false;

    }

    const filteredTransactions =
        getReportTransactions();

    if (!filteredTransactions) {

        reportSummary.innerHTML =
            "<p>End date cannot be earlier than start date.</p>";

        return false;

    }

    const reportSales = filteredTransactions
        .filter(item => item.type === "Sale")
        .reduce((total, item) => total + item.amount, 0);

    const reportExpenses = filteredTransactions
        .filter(item => item.type === "Expense")
        .reduce((total, item) => total + item.amount, 0);

    const reportProfit = reportSales - reportExpenses;

    const salesCount = filteredTransactions.filter(
        item => item.type === "Sale"
    ).length;

    const expensesCount = filteredTransactions.filter(
        item => item.type === "Expense"
    ).length;

    let periodName = "Daily";

    if (reportPeriod.value === "weekly") {
        periodName = "Weekly";
    }

    if (reportPeriod.value === "monthly") {
        periodName = "Monthly";
    }

    if (reportPeriod.value === "custom") {
        periodName = "Custom Date Range";
    }

    // Display report summary

    reportSummary.innerHTML = `

        <h3>${periodName} Business Summary</h3>

        <p>
            <strong>Total Sales:</strong>
            ${formatMoney(reportSales)}
        </p>

        <p>
            <strong>Total Expenses:</strong>
            ${formatMoney(reportExpenses)}
        </p>

        <p class="report-profit">
            <strong>Net Profit:</strong>
            ${formatMoney(reportProfit)}
        </p>

        <hr>

        <p>
            <strong>Number of Sales:</strong>
            ${salesCount}
        </p>

        <p>
            <strong>Number of Expenses:</strong>
            ${expensesCount}
        </p>

        <p>
            <strong>Total Transactions:</strong>
            ${filteredTransactions.length}
        </p>

    `;

    // Generate charts before closing popup

    updateReportCharts();

    return true;

}


// ==========================================
// 18. REPORT POPUP CONTROLS
// ==========================================

// Set today's date

reportDate.value = getLocalDateValue(new Date());

reportEndDate.value = getLocalDateValue(new Date());


// Display end date field only for custom range

reportPeriod.addEventListener("change", function() {

    reportEndDateField.hidden =
        reportPeriod.value !== "custom";

    updateReportCharts();

});


// Open report popup

openReportModalButton.addEventListener("click", function() {

    reportModal.hidden = false;

});


// Cancel report popup

cancelReportModalButton.addEventListener("click", function() {

    reportModal.hidden = true;

});


// Generate report and close popup only on success

reportModalForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const success = generateBusinessReport();

    if (success) {

        reportModal.hidden = true;

    }

});


// ==========================================
// 19. CUSTOM CALENDAR ELEMENTS
// ==========================================

const startDateButton =
    document.getElementById("startDateButton");

const endDateButton =
    document.getElementById("endDateButton");

const customCalendar =
    document.getElementById("customCalendar");

const calendarMonth =
    document.getElementById("calendarMonth");

const calendarDays =
    document.getElementById("calendarDays");

const calendarPrev =
    document.getElementById("calendarPrev");

const calendarNext =
    document.getElementById("calendarNext");

const calendarClose =
    document.getElementById("calendarClose");


let calendarTargetInput = reportDate;

let calendarTargetButton = startDateButton;

let calendarViewDate = new Date();


// Format calendar date

function formatCalendarDate(value) {

    if (!value) {
        return "Choose Date";
    }

    return new Date(value + "T00:00:00")
        .toLocaleDateString("en-IN", {

            day: "numeric",
            month: "short",
            year: "numeric"

        });

}


// ==========================================
// 20. RENDER CUSTOM CALENDAR
// ==========================================

function renderCalendar() {

    const year = calendarViewDate.getFullYear();

    const month = calendarViewDate.getMonth();

    calendarMonth.textContent =
        calendarViewDate.toLocaleDateString("en-IN", {

            month: "long",
            year: "numeric"

        });

    calendarDays.replaceChildren();

    const firstDay =
        new Date(year, month, 1).getDay();

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();

    const today = getLocalDateValue(new Date());

    // Empty spaces before first day

    for (let i = 0; i < firstDay; i++) {
        
        const blank = document.createElement("span");

        calendarDays.appendChild(blank);

    }

    // Create calendar dates

    for (let day = 1; day <= daysInMonth; day++) {

        const dateValue =
            year + "-" +
            String(month + 1).padStart(2, "0") + "-" +
            String(day).padStart(2, "0");

        const button = document.createElement("button");

        button.type = "button";

        button.textContent = day;

        if (dateValue === calendarTargetInput.value) {

            button.classList.add("selected");

        }

        if (dateValue === today) {

            button.classList.add("today");

        }

        button.addEventListener("click", function() {

            calendarTargetInput.value = dateValue;

            calendarTargetButton.textContent =
                formatCalendarDate(dateValue);

            customCalendar.hidden = true;

            updateReportCharts();

        });

        calendarDays.appendChild(button);

    }

}


// ==========================================
// 21. OPEN CUSTOM CALENDAR
// ==========================================

// Start date calendar

startDateButton.addEventListener("click", function() {

    calendarTargetInput = reportDate;

    calendarTargetButton = startDateButton;

    calendarViewDate = reportDate.value
        ? new Date(reportDate.value + "T00:00:00")
        : new Date();

    renderCalendar();

    customCalendar.hidden = false;

});


// End date calendar

endDateButton.addEventListener("click", function() {

    calendarTargetInput = reportEndDate;

    calendarTargetButton = endDateButton;

    calendarViewDate = reportEndDate.value
        ? new Date(reportEndDate.value + "T00:00:00")
        : new Date(reportDate.value + "T00:00:00");

    renderCalendar();

    customCalendar.hidden = false;

});


// ==========================================
// 22. CALENDAR MONTH NAVIGATION
// ==========================================

// Previous month

calendarPrev.addEventListener("click", function() {

    calendarViewDate = new Date(

        calendarViewDate.getFullYear(),

        calendarViewDate.getMonth() - 1,

        1

    );

    renderCalendar();

});


// Next month

calendarNext.addEventListener("click", function() {

    calendarViewDate = new Date(

        calendarViewDate.getFullYear(),

        calendarViewDate.getMonth() + 1,

        1

    );

    renderCalendar();

});


// Close calendar

calendarClose.addEventListener("click", function() {

    customCalendar.hidden = true;

});


// ==========================================
// 23. INITIAL DATE LABELS
// ==========================================

startDateButton.textContent =
    formatCalendarDate(reportDate.value);

endDateButton.textContent =
    formatCalendarDate(reportEndDate.value);


// ==========================================
// 24. END OF PART 2
// ==========================================


// ==========================================
// 25. REPORT TEXT SAFETY
// ==========================================

function escapeReportText(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// 26. UPDATE REPORT CHARTS
// ==========================================

function updateReportCharts() {

    if (!reportCharts) {
        return;
    }

    const records = getReportTransactions();

    // Clear charts if the selected date range is invalid.
    if (records === null) {
        reportCharts.innerHTML = "";
        return;
    }

    const totalSales = records
        .filter(item => item.type === "Sale")
        .reduce((total, item) => total + Number(item.amount || 0), 0);

    const totalExpenses = records
        .filter(item => item.type === "Expense")
        .reduce((total, item) => total + Number(item.amount || 0), 0);


    // ======================================
    // SALES VS EXPENSES
    // ======================================

    const maximumAmount = Math.max(
        totalSales,
        totalExpenses,
        1
    );

    const salesWidth = (totalSales / maximumAmount) * 100;
    const expensesWidth = (totalExpenses / maximumAmount) * 100;


    // ======================================
    // PRODUCT-WISE SALES BREAKDOWN
    // ======================================

    const productSales = {};

    records
        .filter(item => item.type === "Sale")
        .forEach(item => {

            // Multi-product sale transactions.
            if (
                Array.isArray(item.items) &&
                item.items.length > 0
            ) {

                item.items.forEach(soldItem => {

                    const name = soldItem.name || "Unknown product";

                    const key = soldItem.productId || name;

                    if (!productSales[key]) {

                        productSales[key] = {
                            name: name,
                            quantity: 0,
                            revenue: 0
                        };

                    }

                    const quantity =
                        Number.isSafeInteger(Number(soldItem.quantity)) &&
                        Number(soldItem.quantity) > 0
                            ? Number(soldItem.quantity)
                            : 1;

                    const subtotal = Number.isFinite(
                        Number(soldItem.subtotal)
                    )
                        ? Number(soldItem.subtotal)
                        : Number(soldItem.price || 0) * quantity;

                    productSales[key].quantity += quantity;

                    productSales[key].revenue += subtotal;

                });

            } else {

                // Older single-product or manually recorded sales.
                const name = item.description || "Other sale";

                const key = name;

                if (!productSales[key]) {

                    productSales[key] = {
                        name: name,
                        quantity: 0,
                        revenue: 0
                    };

                }

                const quantity =
                    Number.isSafeInteger(Number(item.quantity)) &&
                    Number(item.quantity) > 0
                        ? Number(item.quantity)
                        : 1;

                productSales[key].quantity += quantity;

                productSales[key].revenue += Number(item.amount || 0);

            }

        });


    // Sort products by revenue, highest first.
    const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue);


    // ======================================
    // CREATE PRODUCT BREAKDOWN HTML
    // ======================================

let productHTML = "";

if (sortedProducts.length === 0) {

    productHTML = `
        <p class="no-sales-message">
            No sales recorded in this period.
        </p>
    `;

} else {

    const totalUnits = sortedProducts.reduce(
        (total, product) => total + product.quantity,
        0
    );

    const totalRevenue = sortedProducts.reduce(
        (total, product) => total + product.revenue,
        0
    );

    productHTML = `

        <div class="product-table-wrap">

            <table class="product-report-table">

                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Revenue</th>
                    </tr>
                </thead>

                <tbody>

                    ${sortedProducts.map(product => `
                        <tr>
                            <td>
                                ${escapeReportText(product.name)}
                            </td>

                            <td>
                                ${product.quantity}
                            </td>

                            <td>
                                ${formatMoney(product.revenue)}
                            </td>
                        </tr>
                    `).join("")}

                </tbody>

                <tfoot>
                    <tr>
                        <td>Total</td>
                        <td>${totalUnits} units</td>
                        <td>${formatMoney(totalRevenue)}</td>
                    </tr>
                </tfoot>

            </table>

        </div>

    `;

}

    // ======================================
    // DISPLAY BOTH REPORT SECTIONS
    // ======================================

    reportCharts.innerHTML = `

        <div class="chart-card">

            <h3>Sales vs Expenses</h3>

            <div class="chart-row">

                <span class="chart-label">Sales</span>

                <div class="chart-track">

                    <div
                        class="chart-bar sales-bar"
                        style="width: ${salesWidth}%">
                    </div>

                </div>

                <strong>${formatMoney(totalSales)}</strong>

            </div>


            <div class="chart-row">

                <span class="chart-label">Expenses</span>

                <div class="chart-track">

                    <div
                        class="chart-bar expenses-bar"
                        style="width: ${expensesWidth}%">
                    </div>

                </div>

                <strong>${formatMoney(totalExpenses)}</strong>

            </div>

        </div>


        <div class="chart-card">

            <h3>Sales Breakdown</h3>

            <div class="product-report-list">

                ${productHTML}

            </div>

        </div>

    `;

}


// ==========================================
// 27. REPORT DATE INPUT LISTENERS
// ==========================================

if (reportDate) {

    reportDate.addEventListener(
        "change",
        updateReportCharts
    );

}

if (reportEndDate) {

    reportEndDate.addEventListener(
        "change",
        updateReportCharts
    );

}


// ==========================================
// 28. FINAL INITIALIZATION
// ==========================================

// Refresh the main dashboard.
updateDashboard();

// Refresh transaction history.
displayTransactions();

// Refresh inventory.
displayProducts();

// Refresh product selection in the sale form.
populateSaleProducts();

// Refresh sale form fields.
updateSaleFields();


// ==========================================
// END OF PART 3
// ==========================================
                
// ==========================================
// 29. HOME SCREEN NAVIGATION
// ==========================================

function showScreen(screenId) {

    const screenIds = [
        "homeScreen",
        "dashboardScreen",
        "transactionsScreen",
        "inventoryScreen",
        "reportsScreen",
        "backupScreen",
        "settingsScreen"
    ];

    screenIds.forEach(id => {

        const screen = document.getElementById(id);

        if (screen) {
            screen.hidden = id !== screenId;
        }

    });

    window.scrollTo(0, 0);

}


// Open selected screen from home cards.
document.querySelectorAll(".menu-card").forEach(card => {

    card.addEventListener("click", function() {

        showScreen(this.dataset.screen);

    });

});


// Return to home screen.
document.querySelectorAll(".back-home-button").forEach(button => {

    button.addEventListener("click", function() {

        showScreen(this.dataset.screen);

    });

});


// Show home screen when MiniBiz opens.
showScreen("homeScreen");
// ==========================================
// 30. DELETE ALL BUSINESS DATA
// ==========================================

const deleteAllDataButton =
    document.getElementById("deleteAllDataButton");

deleteAllDataButton.addEventListener("click", async function() {

    const confirmed = await showMiniBizConfirm(
        "Are you sure you want to permanently delete all your sales, expenses, transactions and products? This action cannot be undone. Please create a backup before continuing."
    );

    if (!confirmed) {
        return;
    }

    try {

        // Delete saved business data only

        localStorage.removeItem("minibiz_sales");
        localStorage.removeItem("minibiz_expenses");
        localStorage.removeItem("minibiz_transactions");
        localStorage.removeItem("minibiz_products");

        // Reset saved data in memory

        sales = 0;
        expenses = 0;
        transactions = [];
        products = [];
        saleCart = [];

        // Refresh MiniBiz screens

        updateDashboard();
        displayTransactions();
        displayProducts();

        // Show success notification

        await showMiniBizAlert(
            "All MiniBiz business data has been deleted successfully."
        );

    } catch (error) {

        await showMiniBizAlert(
            "Unable to delete all data. Please try again."
        );

    }

});
