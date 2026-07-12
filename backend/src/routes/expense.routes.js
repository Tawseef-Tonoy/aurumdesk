const express = require("express");

const router = express.Router();


const {
createExpense,
getExpenses,
getExpenseById,
updateExpense,
confirmExpense,
cancelExpense,
getExpenseSummary
}=require("../controllers/expense.controller");

router.post("/",createExpense);
router.get("/",getExpenses);
router.get("/summary",getExpenseSummary);
router.get("/:id",getExpenseById);
router.patch("/:id",updateExpense);
router.patch("/:id/confirm",confirmExpense);
router.patch("/:id/cancel",cancelExpense);
module.exports=router;