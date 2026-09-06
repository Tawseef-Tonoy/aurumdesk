const express=require("express");

const {
  getEligibility,
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  submitTransaction,
  approveTransaction,
  rejectTransaction,
  cancelTransaction,
  completeTransaction
}=require(
  "../controllers/returnExchange.controller"
);

const router=
  express.Router();

router.get(
  "/eligibility/:saleId",
  getEligibility
);

router.post(
  "/",
  createTransaction
);

router.get(
  "/",
  getTransactions
);

router.get(
  "/:id",
  getTransactionById
);

router.patch(
  "/:id",
  updateTransaction
);

router.patch(
  "/:id/submit",
  submitTransaction
);

router.patch(
  "/:id/approve",
  approveTransaction
);

router.patch(
  "/:id/reject",
  rejectTransaction
);

router.patch(
  "/:id/cancel",
  cancelTransaction
);

router.patch(
  "/:id/complete",
  completeTransaction
);

module.exports=router;