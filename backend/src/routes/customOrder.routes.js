const express=require("express");
const{
createCustomOrder,
getCustomOrders,
getCustomOrderById,
updateCustomOrder,
getCustomOrderReceipt
}=require("../controllers/customOrder.controller");

const router=express.Router();

router.post("/",createCustomOrder);
router.get("/",getCustomOrders);
router.get("/:id/receipt",getCustomOrderReceipt);
router.get("/:id",getCustomOrderById);
router.patch("/:id",updateCustomOrder);

module.exports=router;