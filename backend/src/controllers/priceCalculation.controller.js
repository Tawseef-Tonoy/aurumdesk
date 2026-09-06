const {
 calculateJewelryPrice
}=require("../services/jewelryPrice.service");

async function getJewelryPrice(req,res){

 try{

  const result=
   await calculateJewelryPrice(req.params.id);

  res.status(200).json({
   success:true,
   data:result
  });

 }catch(error){

  res.status(400).json({
   success:false,
   message:error.message
  });

 }

}

module.exports={getJewelryPrice};