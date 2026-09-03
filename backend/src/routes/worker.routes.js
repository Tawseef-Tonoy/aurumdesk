const express=require("express");
const{
createWorker,
getWorkers,
getWorkerById,
updateWorker
}=require("../controllers/worker.controller");

const router=express.Router();

router.post("/",createWorker);
router.get("/",getWorkers);
router.get("/:id",getWorkerById);
router.patch("/:id",updateWorker);

module.exports=router;