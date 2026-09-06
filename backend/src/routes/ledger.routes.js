const express=require("express");

const {
  getSummary,
  getBalance,
  getStatement,
  getOutstanding,
  getDateWise,
  getAging,
  createAdjustment
}=require("../controllers/ledger.controller");

const router=express.Router();

router.get("/",getSummary);
router.post("/adjustments",createAdjustment);

router.get("/:customerId/balance",getBalance);
router.get("/:customerId/statement",getStatement);
router.get("/:customerId/outstanding",getOutstanding);
router.get("/:customerId/date-wise",getDateWise);
router.get("/:customerId/aging",getAging);

module.exports=router;