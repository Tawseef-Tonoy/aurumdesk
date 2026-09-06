const express=require("express");

const {
createPurchaseController,
getPurchases,
getPurchaseById,
updatePurchaseController,
confirmPurchaseController,
cancelPurchaseController
}=require(
"../controllers/purchase.controller"
);


const router=express.Router();


router.post(
"/",
createPurchaseController
);


router.get(
"/",
getPurchases
);


router.get(
"/:id",
getPurchaseById
);


router.patch(
"/:id",
updatePurchaseController
);


router.patch(
"/:id/confirm",
confirmPurchaseController
);


router.patch(
"/:id/cancel",
cancelPurchaseController
);


module.exports=router;