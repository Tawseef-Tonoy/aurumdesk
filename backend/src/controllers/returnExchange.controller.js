const mongoose=require("mongoose");

const ReturnExchange=require(
  "../models/returnExchange.model"
);

const {
  getSaleEligibility,
  createReturnExchange,
  updateReturnExchange,
  submitReturnExchange,
  approveReturnExchange,
  rejectReturnExchange,
  cancelReturnExchange,
  completeReturnExchange
}=require(
  "../services/returnExchange.service"
);

const {
  syncLowStockAlertForItem
}=require(
  "../services/lowStockAlert.service"
);

function sendError(
  res,
  error
){
  console.error(
    "Return/exchange error:",
    error
  );

  if(
    error.name==="ValidationError"
  ){
    return res.status(400).json({
      success:false,
      message:
        error.message
    });
  }

  if(
    error.name==="CastError"
  ){
    return res.status(400).json({
      success:false,
      message:
        "Invalid document ID"
    });
  }

  if(error.code===11000){
    return res.status(409).json({
      success:false,
      message:
        "Duplicate return or exchange reference detected"
    });
  }

  return res
    .status(
      error.statusCode||500
    )
    .json({
      success:false,
      message:
        error.message||
        "Return or exchange operation failed"
    });
}

async function safelySyncLowStock(
  itemIds
){
  for(const itemId of itemIds){
    try{
      await syncLowStockAlertForItem(
        itemId
      );
    }catch(error){
      console.error(
        `Low-stock synchronization failed for ${itemId}:`,
        error
      );
    }
  }
}

async function getEligibility(
  req,
  res
){
  try{
    const data=
      await getSaleEligibility(
        req.params.saleId
      );

    return res.status(200).json({
      success:true,
      data
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function createTransaction(
  req,
  res
){
  try{
    const document=
      await createReturnExchange(
        req.body
      );

    const populated=
      await ReturnExchange.findById(
        document._id
      )
        .populate(
          "sale",
          "invoiceNumber status totalAmount paidAmount dueAmount"
        )
        .populate(
          "customer",
          "name phone"
        )
        .populate(
          "items.jewelryItem",
          "sku name quantity status"
        )
        .populate(
          "replacementItems.jewelryItem",
          "sku name quantity status"
        );

    return res.status(201).json({
      success:true,
      message:
        "Return or exchange draft created successfully",
      data:populated
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function getTransactions(
  req,
  res
){
  try{
    const {
      type,
      status,
      sale,
      customer
    }=req.query;

    const filter={};

    if(type){
      filter.type=
        String(type)
          .trim()
          .toUpperCase();
    }

    if(status){
      filter.status=
        String(status)
          .trim()
          .toUpperCase();
    }

    if(sale){
      if(
        !mongoose.Types.ObjectId
          .isValid(sale)
      ){
        return res.status(400).json({
          success:false,
          message:
            "Invalid sale ID"
        });
      }

      filter.sale=sale;
    }

    if(customer){
      if(
        !mongoose.Types.ObjectId
          .isValid(customer)
      ){
        return res.status(400).json({
          success:false,
          message:
            "Invalid customer ID"
        });
      }

      filter.customer=
        customer;
    }

    const documents=
      await ReturnExchange.find(
        filter
      )
        .populate(
          "sale",
          "invoiceNumber status totalAmount paidAmount dueAmount"
        )
        .populate(
          "customer",
          "name phone"
        )
        .sort({
          createdAt:-1
        });

    return res.status(200).json({
      success:true,
      count:
        documents.length,
      data:documents
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function getTransactionById(
  req,
  res
){
  try{
    if(
      !mongoose.Types.ObjectId
        .isValid(req.params.id)
    ){
      return res.status(400).json({
        success:false,
        message:
          "Invalid return or exchange ID"
      });
    }

    const document=
      await ReturnExchange.findById(
        req.params.id
      )
        .populate(
          "sale",
          [
            "invoiceNumber",
            "status",
            "subtotal",
            "totalAmount",
            "paidAmount",
            "dueAmount",
            "createdAt"
          ].join(" ")
        )
        .populate(
          "customer",
          "name phone email"
        )
        .populate(
          "items.jewelryItem",
          [
            "sku",
            "name",
            "category",
            "purity",
            "quantity",
            "status"
          ].join(" ")
        )
        .populate(
          "replacementItems.jewelryItem",
          [
            "sku",
            "name",
            "category",
            "purity",
            "quantity",
            "status"
          ].join(" ")
        );

    if(!document){
      return res.status(404).json({
        success:false,
        message:
          "Return or exchange transaction not found"
      });
    }

    return res.status(200).json({
      success:true,
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function updateTransaction(
  req,
  res
){
  try{
    const document=
      await updateReturnExchange(
        req.params.id,
        req.body
      );

    return res.status(200).json({
      success:true,
      message:
        "Return or exchange draft updated successfully",
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function submitTransaction(
  req,
  res
){
  try{
    const document=
      await submitReturnExchange(
        req.params.id
      );

    return res.status(200).json({
      success:true,
      message:
        "Transaction submitted for approval",
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function approveTransaction(
  req,
  res
){
  try{
    const document=
      await approveReturnExchange(
        req.params.id,
        req.body?.approvedBy
      );

    return res.status(200).json({
      success:true,
      message:
        "Transaction approved successfully",
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function rejectTransaction(
  req,
  res
){
  try{
    const document=
      await rejectReturnExchange(
        req.params.id,
        {
          rejectedBy:
            req.body?.rejectedBy,

          rejectionReason:
            req.body
              ?.rejectionReason
        }
      );

    return res.status(200).json({
      success:true,
      message:
        "Transaction rejected",
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function cancelTransaction(
  req,
  res
){
  try{
    const document=
      await cancelReturnExchange(
        req.params.id,
        req.body?.cancelledBy
      );

    return res.status(200).json({
      success:true,
      message:
        "Transaction cancelled",
      data:document
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }
}

async function completeTransaction(
  req,
  res
){
  const session=
    await mongoose.startSession();

  try{
    let result;

    await session.withTransaction(
      async()=>{
        result=
          await completeReturnExchange(
            req.params.id,
            {
              completedBy:
                req.body?.completedBy,

              refundMethod:
                req.body
                  ?.refundMethod,

              refundReference:
                req.body
                  ?.refundReference,

              requestIp:
                req.ip||"",

              userAgent:
                req.get(
                  "user-agent"
                )||"",

              session
            }
          );
      }
    );

    await safelySyncLowStock(
      result.touchedItemIds
    );

    const populated=
      await ReturnExchange.findById(
        result.document._id
      )
        .populate(
          "sale",
          "invoiceNumber status totalAmount paidAmount dueAmount"
        )
        .populate(
          "customer",
          "name phone"
        )
        .populate(
          "items.jewelryItem",
          "sku name quantity status"
        )
        .populate(
          "replacementItems.jewelryItem",
          "sku name quantity status"
        );

    return res.status(200).json({
      success:true,
      message:
        "Return or exchange completed successfully",
      data:populated,
      ledgerEntry:
        result.ledgerEntry
    });
  }catch(error){
    return sendError(
      res,
      error
    );
  }finally{
    await session.endSession();
  }
}

module.exports={
  getEligibility,
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  submitTransaction,
  approveTransaction,
  rejectTransaction,
  cancelTransaction,
  completeTransaction
};