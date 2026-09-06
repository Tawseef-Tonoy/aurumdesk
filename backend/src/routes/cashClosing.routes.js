const express=require("express");

const{
createClosing,
getClosing,
getAllClosings,
updateClosing,
refreshClosing,
reopenClosing
}=require("../controllers/cashClosing.controller");

const router=express.Router();

router.post("/",createClosing);

router.get("/",getAllClosings);

router.get("/:date",getClosing);

router.patch("/:id",updateClosing);

router.patch("/:id/refresh",refreshClosing);

router.patch("/:id/reopen",reopenClosing);

module.exports=router;