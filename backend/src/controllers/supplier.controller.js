const Supplier=require("../models/supplier.model");


function asyncHandler(fn){
return(req,res,next)=>{
Promise.resolve(
fn(req,res,next)
).catch(next);
};
}


function generateSupplierCode(){

const date=new Date()
.toISOString()
.slice(0,10)
.replaceAll("-","");

const suffix=
Math.random()
.toString(36)
.substring(2,6)
.toUpperCase();

return `SUP-${date}-${suffix}`;

}


const createSupplier=asyncHandler(
async(req,res)=>{

const supplier=
await Supplier.create({

supplierCode:
req.body.supplierCode||
generateSupplierCode(),

name:
req.body.name,

phone:
req.body.phone,

email:
req.body.email||"",

address:
req.body.address||"",

supplierType:
req.body.supplierType||
"SUPPLIER",

createdBy:
req.body.createdBy||
"SYSTEM"

});


res.status(201).json({
success:true,
data:supplier
});

});


const getSuppliers=asyncHandler(
async(req,res)=>{

const suppliers=
await Supplier.find()
.sort({
createdAt:-1
});


res.json({
success:true,
data:suppliers
});

});


const getSupplierById=asyncHandler(
async(req,res)=>{

const supplier=
await Supplier.findById(
req.params.id
);


if(!supplier){

return res.status(404).json({
success:false,
message:"Supplier not found"
});

}


res.json({
success:true,
data:supplier
});

});


const updateSupplier=asyncHandler(
async(req,res)=>{

const supplier=
await Supplier.findById(
req.params.id
);


if(!supplier){

return res.status(404).json({
success:false,
message:"Supplier not found"
});

}


Object.assign(
supplier,
{
name:req.body.name??supplier.name,
phone:req.body.phone??supplier.phone,
email:req.body.email??supplier.email,
address:req.body.address??supplier.address,
supplierType:
req.body.supplierType??
supplier.supplierType
}
);


await supplier.save();


res.json({
success:true,
data:supplier
});

});


module.exports={
createSupplier,
getSuppliers,
getSupplierById,
updateSupplier
};