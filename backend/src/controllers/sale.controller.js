const Sale=require("../models/sale.model");
const JewelryItem=require("../models/jewelryItem.model");

const createSale=async(req,res)=>{
try{

for(const item of req.body.items){

const jewelry=await JewelryItem.findById(item.jewelryItem);

if(!jewelry)
return res.status(404).json({message:"Jewelry item not found"});

if(jewelry.status!=="AVAILABLE")
return res.status(400).json({message:`${jewelry.name} is not available`});

}

const sale=await Sale.create({
...req.body,
status:"DRAFT"
});

res.status(201).json({
message:"Invoice created successfully",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const getSales=async(req,res)=>{
try{

const sales=await Sale.find()
.populate("customer")
.populate("items.jewelryItem")
.sort({createdAt:-1});

res.json(sales);

}catch(error){
res.status(500).json({message:error.message});
}

};


const getSaleById=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id)
.populate("customer")
.populate("items.jewelryItem");

if(!sale)
return res.status(404).json({message:"Invoice not found"});

res.json(sale);

}catch(error){
res.status(500).json({message:error.message});
}

};


const updateSale=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});

if(sale.status!=="DRAFT")
return res.status(400).json({message:"Only draft invoice can be edited"});

Object.assign(sale,req.body);

await sale.save();

res.json({
message:"Invoice updated",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const confirmSale=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});

if(sale.status!=="DRAFT")
return res.status(400).json({message:"Only draft invoice can be confirmed"});


for(const item of sale.items){

await JewelryItem.findByIdAndUpdate(
item.jewelryItem,
{status:"SOLD"}
);

}


sale.status="CONFIRMED";

await sale.save();


res.json({
message:"Invoice confirmed",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const updatePaymentStatus=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});


sale.paidAmount=Number(req.body.paidAmount);

sale.dueAmount=
sale.totalAmount-sale.paidAmount;


if(sale.paidAmount<=0)
sale.status="CONFIRMED";

else if(sale.paidAmount<sale.totalAmount)
sale.status="PARTIALLY_PAID";

else
sale.status="FULLY_PAID";


await sale.save();


res.json({
message:"Payment updated",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const returnSale=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});


if(
sale.status!=="CONFIRMED" &&
sale.status!=="FULLY_PAID"
)
return res.status(400).json({message:"Invoice cannot be returned"});


sale.status="RETURNED";


for(const item of sale.items){

await JewelryItem.findByIdAndUpdate(
item.jewelryItem,
{status:"AVAILABLE"}
);

}


await sale.save();


res.json({
message:"Invoice returned",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const exchangeSale=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});


if(
sale.status!=="CONFIRMED" &&
sale.status!=="FULLY_PAID"
)
return res.status(400).json({message:"Invoice cannot be exchanged"});


sale.status="EXCHANGED";

await sale.save();


res.json({
message:"Invoice exchanged",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


const cancelSale=async(req,res)=>{
try{

const sale=await Sale.findById(req.params.id);

if(!sale)
return res.status(404).json({message:"Invoice not found"});


if(sale.status!=="DRAFT")
return res.status(400).json({message:"Only draft invoice can be cancelled"});


sale.status="CANCELLED";

await sale.save();


res.json({
message:"Invoice cancelled",
sale
});

}catch(error){
res.status(500).json({message:error.message});
}

};


module.exports={
createSale,
getSales,
getSaleById,
updateSale,
confirmSale,
updatePaymentStatus,
returnSale,
exchangeSale,
cancelSale
};