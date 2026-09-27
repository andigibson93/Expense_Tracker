console.log("Javascript is connected!");
const addExpenseButton = document.getElementById("add-expense");
const expenseName = document.getElementById("expense-name");
const expenseAmount = document.getElementById("expense-amount");
const expenseList = document.getElementById("expense-list");

addExpenseButton.addEventListener("click", function() {
    const name = expenseName.value.trim();
    const amount = expenseAmount.value;

    if (name === "" || amount === "") {
        alert("Please enter both an expense name and an amount.");
        return;
    }

    const listItem = document.createElement("li");
    listItem.textContent = name + " - $" + amount;
    expenseList.appendChild(listItem);
    
    console.log(name, amount);
});