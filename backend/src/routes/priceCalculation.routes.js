const express=require("express");

const {
 getJewelryPrice
}=require("../controllers/priceCalculation.controller");

const router=express.Router();

router.get("/:id",getJewelryPrice);

module.exports=router;