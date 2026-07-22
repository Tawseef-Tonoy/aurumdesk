const express=require("express");

const {
createSale,
getSales,
getSaleById,
updateSale,
confirmSale,
updatePaymentStatus,
returnSale,
exchangeSale,
cancelSale
}=require("../controllers/sale.controller");

const router=express.Router();

router.post("/",createSale);
router.get("/",getSales);
router.get("/:id",getSaleById);
router.patch("/:id",updateSale);

router.patch("/:id/confirm",confirmSale);
router.patch("/:id/payment",updatePaymentStatus);
router.patch("/:id/return",returnSale);
router.patch("/:id/exchange",exchangeSale);
router.patch("/:id/cancel",cancelSale);

module.exports=router;