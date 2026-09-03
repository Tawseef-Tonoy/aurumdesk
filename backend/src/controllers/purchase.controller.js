const Purchase=require("../models/purchase.model");

const {
createPurchase,
updatePurchase,
confirmPurchase,
cancelPurchase
}=require("../services/purchase.service");


function asyncHandler(fn){

return(req,res,next)=>{

Promise.resolve(
fn(req,res,next)
).catch(next);

};

}



const createPurchaseController=
asyncHandler(
async(req,res)=>{

const purchase=
await createPurchase(
req.body
);


res.status(201).json({

success:true,

data:purchase

});

});



const getPurchases=
asyncHandler(
async(req,res)=>{

const purchases=
await Purchase.find()
.populate(
"supplier",
"name phone"
)
.sort({
createdAt:-1
});


res.json({

success:true,

data:purchases

});

});



const getPurchaseById=
asyncHandler(
async(req,res)=>{

const purchase=
await Purchase.findById(
req.params.id
)
.populate(
"supplier"
)
.populate(
"items.jewelryItem"
);


if(!purchase){

return res.status(404).json({

success:false,

message:"Purchase not found"

});

}


res.json({

success:true,

data:purchase

});

});




const updatePurchaseController=
asyncHandler(
async(req,res)=>{

const purchase=
await updatePurchase(
req.params.id,
req.body
);


res.json({

success:true,

data:purchase

});

});




const confirmPurchaseController=
asyncHandler(
async(req,res)=>{


const purchase=
await confirmPurchase(

req.params.id,

req.body.confirmedBy||
"SYSTEM"

);



res.json({

success:true,

data:purchase

});

});




const cancelPurchaseController=
asyncHandler(
async(req,res)=>{


const purchase=
await cancelPurchase(
req.params.id
);



res.json({

success:true,

data:purchase

});

});



module.exports={

createPurchaseController,

getPurchases,

getPurchaseById,

updatePurchaseController,

confirmPurchaseController,

cancelPurchaseController

};