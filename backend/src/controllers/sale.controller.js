const mongoose = require("mongoose");

const Sale=require("../models/sale.model");
const JewelryItem=require("../models/jewelryItem.model");
const {roundMoney,createSaleDueEntry}=require("../services/ledger.service");

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


const getOutstandingSalesByCustomer=async(req,res)=>{
try{

if(
!mongoose.Types.ObjectId.isValid(
req.params.customerId
)
)
return res.status(400).json({
success:false,
message:"Invalid customer ID"
});

const sales=await Sale.find({
customer:req.params.customerId,
status:{
$in:[
"CONFIRMED",
"PARTIALLY_PAID"
]
},
dueAmount:{$gt:0}
})
.select(
"invoiceNumber totalAmount paidAmount dueAmount status createdAt"
)
.sort({createdAt:1});

return res.status(200).json({
success:true,
count:sales.length,
data:sales
});

}catch(error){
return res.status(500).json({
success:false,
message:error.message
});
}
};

const getAdjustableSalesByCustomer=async(req,res)=>{
try{

if(
!mongoose.Types.ObjectId.isValid(
req.params.customerId
)
)
return res.status(400).json({
success:false,
message:"Invalid customer ID"
});

const sales=await Sale.find({
customer:req.params.customerId,
status:{
$nin:[
"DRAFT",
"CANCELLED"
]
}
})
.select(
"invoiceNumber totalAmount paidAmount dueAmount status createdAt"
)
.sort({createdAt:-1});

return res.status(200).json({
success:true,
count:sales.length,
data:sales
});

}catch(error){
return res.status(500).json({
success:false,
message:error.message
});
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
    let ledgerEntry;

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

      const totalAmount=roundMoney(
        sale.totalAmount
      );

      const paidAmount=roundMoney(
        sale.paidAmount||0
      );

      if(
        !Number.isFinite(totalAmount)||
        !Number.isFinite(paidAmount)||
        paidAmount<0||
        paidAmount>totalAmount
      ){
        const error=new Error(
          "Invalid sale total or paid amount"
        );

        error.statusCode=400;
        throw error;
      }

      sale.paidAmount=paidAmount;
      sale.dueAmount=roundMoney(
        totalAmount-paidAmount
      );

      sale.status=
        sale.dueAmount<=0
          ?"FULLY_PAID"
          :paidAmount>0
            ?"PARTIALLY_PAID"
            :"CONFIRMED";

      await sale.save({
        session,
        validateBeforeSave:true
      });

      ledgerEntry=await createSaleDueEntry(
        sale,
        {
          createdBy:String(
            req.body?.confirmedBy||
            sale.salesPerson||
            "SYSTEM"
          ).trim(),
          session
        }
      );

      confirmedSale=sale;
       });

    return res.status(200).json({
      message:
        "Invoice confirmed and inventory updated and Ledger recorded",
      sale: confirmedSale,
      ledgerEntry
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
return res.status(409).json({
success:false,
message:
"Direct payment updates are disabled. Use the payment collection endpoint."
});
};


const returnSale=async(req,res)=>{
return res.status(409).json({
success:false,
message:
"Direct invoice returns are disabled. Use the Sale Return or Exchange workflow."
});
};


const exchangeSale=async(req,res)=>{
return res.status(409).json({
success:false,
message:
"Direct invoice exchanges are disabled. Use the Sale Return or Exchange workflow."
});
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
getOutstandingSalesByCustomer,
getAdjustableSalesByCustomer,
updateSale,
confirmSale,
updatePaymentStatus,
returnSale,
exchangeSale,
cancelSale
};