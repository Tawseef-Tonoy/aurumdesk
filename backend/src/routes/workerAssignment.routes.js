const express=require("express");
const{
createAssignment,
getAssignments,
getAssignmentByOrder,
updateAssignment
}=require("../controllers/workerAssignment.controller");

const router=express.Router();

router.post("/",createAssignment);
router.get("/",getAssignments);
router.get("/order/:id",getAssignmentByOrder);
router.patch("/:id",updateAssignment);

module.exports=router;