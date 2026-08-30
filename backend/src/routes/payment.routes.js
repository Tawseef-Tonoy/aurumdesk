const express=require("express");

const {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  confirmPayment,
  cancelPayment
}=require("../controllers/payment.controller");

const router=express.Router();

router.post("/",createPayment);
router.get("/",getPayments);
router.get("/:id",getPaymentById);
router.patch("/:id",updatePayment);
router.patch("/:id/confirm",confirmPayment);
router.patch("/:id/cancel",cancelPayment);

module.exports=router;