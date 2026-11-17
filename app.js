
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
                
