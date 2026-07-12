const express = require("express");

const router = express.Router();


const {
    createPayment,
    getPayments,
    getPaymentById,
    updatePayment,
    cancelPayment

} = require("../controllers/payment.controller");




router.post("/",createPayment); // Create payment
router.get("/",getPayments);// Get all payments
router.get("/:id",getPaymentById);// Get single payment
router.patch("/:id",updatePayment);// Update payment
router.patch("/:id/cancel",cancelPayment);// Cancel payment


module.exports = router;