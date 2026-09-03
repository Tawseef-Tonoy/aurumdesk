const express=require("express");

const {
createSupplier,
getSuppliers,
getSupplierById,
updateSupplier
}=require(
"../controllers/supplier.controller"
);

const router=express.Router();


router.post(
"/",
createSupplier
);


router.get(
"/",
getSuppliers
);


router.get(
"/:id",
getSupplierById
);


router.patch(
"/:id",
updateSupplier
);


module.exports=router;