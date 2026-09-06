const express=require("express");

const{
getMonthlyOwnerReport
}=require("../controllers/monthlyReport.controller");


const router=express.Router();


router.get(
"/",
getMonthlyOwnerReport
);


module.exports=router;