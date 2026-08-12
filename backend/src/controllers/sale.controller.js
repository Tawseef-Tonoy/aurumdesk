const mongoose = require("mongoose");

const Sale=require("../models/sale.model");
const JewelryItem=require("../models/jewelryItem.model");


function generateInvoiceNumber() {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  const uniquePart =
    new mongoose.Types.ObjectId()
      .toString()
      .slice(-6)
      .toUpperCase();

  return `INV-${date}-${uniquePart}`;
}


const createSale=async(req,res)=>{
try{

for(const item of req.body.items){

const jewelry=await JewelryItem.findById(item.jewelryItem);

if(!jewelry)
return res.status(404).json({message:"Jewelry item not found"});

if(jewelry.status!=="AVAILABLE")
return res.status(400).json({message:`${jewelry.name} is not available`});

}

const invoiceNumber = generateInvoiceNumber();

const sale = await Sale.create({
  ...req.body,
  invoiceNumber,
  status: "DRAFT",
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


const confirmSale = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let confirmedSale;

    await session.withTransaction(async () => {
      const sale = await Sale.findById(
        req.params.id
      ).session(session);

      if (!sale) {
        const error = new Error(
          "Invoice not found"
        );
        error.statusCode = 404;
        throw error;
      }

      if (sale.status !== "DRAFT") {
        const error = new Error(
          "Only draft invoice can be confirmed"
        );
        error.statusCode = 400;
        throw error;
      }

     
      const requiredQuantities = new Map();

      for (const item of sale.items) {
        const itemId =
          item.jewelryItem.toString();

        const currentRequired =
          requiredQuantities.get(itemId) || 0;

        requiredQuantities.set(
          itemId,
          currentRequired + Number(item.quantity)
        );
      }

      
      const inventoryItems = [];

      for (const [
        itemId,
        requiredQuantity,
      ] of requiredQuantities) {
        const jewelry =
          await JewelryItem.findById(
            itemId
          ).session(session);

        if (!jewelry) {
          const error = new Error(
            "Jewelry item not found in inventory"
          );
          error.statusCode = 404;
          throw error;
        }

        if (
          jewelry.status !== "AVAILABLE"
        ) {
          const error = new Error(
            `${jewelry.name} is not available`
          );
          error.statusCode = 400;
          throw error;
        }

        if (
          jewelry.quantity <
          requiredQuantity
        ) {
          const error = new Error(
            `Not enough stock for ${jewelry.name}. Requested: ${requiredQuantity}, Available: ${jewelry.quantity}`
          );
          error.statusCode = 400;
          throw error;
        }

        inventoryItems.push({
          jewelry,
          requiredQuantity,
        });
      }

      
      for (const {
        jewelry,
        requiredQuantity,
      } of inventoryItems) {
        jewelry.quantity -=
          requiredQuantity;

        jewelry.status =
          jewelry.quantity === 0
            ? "SOLD"
            : "AVAILABLE";

        await jewelry.save({
          session,
          validateBeforeSave: true,
        });
      }

      sale.status = "CONFIRMED";

      await sale.save({
        session,
        validateBeforeSave: true,
      });

      confirmedSale = sale;
    });

    return res.status(200).json({
      message:
        "Invoice confirmed and inventory updated",
      sale: confirmedSale,
    });
  } catch (error) {
    console.error(
      "Confirm sale error:",
      error
    );

    return res
      .status(error.statusCode || 500)
      .json({
        message:
          error.message ||
          "Failed to confirm invoice",
      });
  } finally {
    await session.endSession();
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