const mongoose=require("mongoose");
const Payment=require("../models/payment.model");
const Sale=require("../models/sale.model");

const {
  roundMoney,
  serviceError,
  createCustomerPaymentEntry
}=require("../services/ledger.service");

function sendError(res,error){
  console.error("Payment error:",error);

  if(error?.name==="CastError"){
    return res.status(400).json({
      success:false,
      message:"Invalid record ID"
    });
  }

  if(error?.code===11000){
    return res.status(409).json({
      success:false,
      message:"Duplicate payment reference"
    });
  }

  const statusCode=
    error.statusCode||
    (error?.name==="ValidationError"?400:500);

  return res.status(statusCode).json({
    success:false,
    message:error.message||"Payment operation failed"
  });
}

function sameId(left,right){
  return String(left)===String(right);
}

function text(value){
  return String(value??"").trim();
}

function validatePaymentInput(body){
  const amount=roundMoney(body.amount);

  if(!Number.isFinite(amount)||amount<=0){
    throw serviceError(
      "Payment amount must be greater than zero"
    );
  }

  if(!body.saleId){
    throw serviceError(
      "Invoice is required"
    );
  }

  if(!text(body.collectedBy)){
    throw serviceError(
      "Collected by is required"
    );
  }

  return amount;
}

async function validateSaleForDraft({
  saleId,
  customerId,
  amount,
  session=null
}){
  let query=Sale.findById(saleId);

  if(session){
    query=query.session(session);
  }

  const sale=await query;

  if(!sale){
    throw serviceError(
      "Invoice not found",
      404
    );
  }

  if(customerId&&!sameId(customerId,sale.customer)){
    throw serviceError(
      "Selected invoice does not belong to the customer"
    );
  }

  if(![
    "CONFIRMED",
    "PARTIALLY_PAID"
  ].includes(sale.status)){
    throw serviceError(
      "Only confirmed unpaid invoices can receive payments"
    );
  }

  const dueAmount=roundMoney(
    sale.dueAmount||0
  );

  if(amount>dueAmount){
    throw serviceError(
      `Payment cannot exceed outstanding amount of ${dueAmount}`
    );
  }

  return sale;
}

async function createPayment(req,res){
  try{
    const body=req.body||{};
    const amount=validatePaymentInput(body);

    const sale=await validateSaleForDraft({
      saleId:body.saleId,
      customerId:body.customerId,
      amount
    });

    const payment=await Payment.create({
      customerId:sale.customer,
      saleId:sale._id,
      amount,
      paymentMethod:
        body.paymentMethod||"CASH",
      paymentDate:
        body.paymentDate||new Date(),
      referenceNumber:
        text(body.referenceNumber),
      note:
        text(body.note),
      collectedBy:
        text(body.collectedBy)||"Admin",
      status:"DRAFT"
    });

    return res.status(201).json({
      success:true,
      message:"Payment draft created successfully",
      data:payment
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getPayments(req,res){
  try{
    const payments=await Payment.find()
      .populate(
        "customerId",
        "customerId name phone"
      )
      .populate(
        "saleId",
        "invoiceNumber totalAmount paidAmount dueAmount status"
      )
      .sort({
        paymentDate:-1,
        createdAt:-1
      });

    return res.status(200).json({
      success:true,
      count:payments.length,
      data:payments
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getPaymentById(req,res){
  try{
    const payment=await Payment
      .findById(req.params.id)
      .populate(
        "customerId",
        "customerId name phone"
      )
      .populate(
        "saleId",
        "invoiceNumber totalAmount paidAmount dueAmount status customer"
      );

    if(!payment){
      throw serviceError(
        "Payment not found",
        404
      );
    }

    return res.status(200).json({
      success:true,
      data:payment
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function updatePayment(req,res){
  try{
    const body=req.body||{};

    const payment=await Payment.findById(
      req.params.id
    );

    if(!payment){
      throw serviceError(
        "Payment not found",
        404
      );
    }

    if(payment.status!=="DRAFT"){
      throw serviceError(
        "Only draft payments can be edited",
        409
      );
    }

    const nextData={
      customerId:
        body.customerId||
        payment.customerId,
      saleId:
        body.saleId||
        payment.saleId,
      amount:
        body.amount!==undefined
          ?body.amount
          :payment.amount,
      paymentMethod:
        body.paymentMethod||
        payment.paymentMethod,
      paymentDate:
        body.paymentDate||
        payment.paymentDate,
      referenceNumber:
        body.referenceNumber!==undefined
          ?text(body.referenceNumber)
          :payment.referenceNumber,
      note:
        body.note!==undefined
          ?text(body.note)
          :payment.note,
      collectedBy:
        body.collectedBy!==undefined
          ?text(body.collectedBy)
          :payment.collectedBy
    };

    const amount=validatePaymentInput(
      nextData
    );

    const sale=await validateSaleForDraft({
      saleId:nextData.saleId,
      customerId:nextData.customerId,
      amount
    });

    payment.customerId=sale.customer;
    payment.saleId=sale._id;
    payment.amount=amount;
    payment.paymentMethod=
      nextData.paymentMethod;
    payment.paymentDate=
      nextData.paymentDate;
    payment.referenceNumber=
      nextData.referenceNumber;
    payment.note=
      nextData.note;
    payment.collectedBy=
      nextData.collectedBy;

    await payment.save({
      validateBeforeSave:true
    });

    return res.status(200).json({
      success:true,
      message:"Payment draft updated successfully",
      data:payment
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function confirmPayment(req,res){
  const session=await mongoose.startSession();

  try{
    let completedPayment;
    let updatedSale;
    let ledgerEntry;

    await session.withTransaction(async()=>{
      const payment=await Payment.findById(
        req.params.id
      ).session(session);

      if(!payment){
        throw serviceError(
          "Payment not found",
          404
        );
      }

      if(payment.status==="COMPLETED"){
        throw serviceError(
          "Payment is already confirmed and immutable",
          409
        );
      }

      if(payment.status==="CANCELLED"){
        throw serviceError(
          "Cancelled payments cannot be confirmed",
          409
        );
      }

      if(payment.status!=="DRAFT"){
        throw serviceError(
          "Only draft payments can be confirmed",
          409
        );
      }

      const amount=roundMoney(
        payment.amount
      );

      const sale=await validateSaleForDraft({
        saleId:payment.saleId,
        customerId:payment.customerId,
        amount,
        session
      });

      const currentPaid=roundMoney(
        sale.paidAmount||0
      );

      const currentDue=roundMoney(
        sale.dueAmount||0
      );

      payment.status="COMPLETED";
      payment.confirmedAt=new Date();

      await payment.save({
        session,
        validateBeforeSave:true
      });

      sale.paidAmount=roundMoney(
        currentPaid+amount
      );

      sale.dueAmount=roundMoney(
        currentDue-amount
      );

      sale.status=
        sale.dueAmount<=0
          ?"FULLY_PAID"
          :"PARTIALLY_PAID";

      await sale.save({
        session,
        validateBeforeSave:true
      });

      ledgerEntry=
        await createCustomerPaymentEntry(
          payment,
          sale,
          {session}
        );

      completedPayment=payment;
      updatedSale=sale;
    });

    return res.status(200).json({
      success:true,
      message:"Payment confirmed successfully",
      data:completedPayment,
      sale:updatedSale,
      ledgerEntry
    });
  }catch(error){
    return sendError(res,error);
  }finally{
    await session.endSession();
  }
}

async function cancelPayment(req,res){
  try{
    const body=req.body||{};

    const cancelledBy=text(
      body.cancelledBy
    );

    const cancellationReason=text(
      body.cancellationReason
    );

    if(!cancelledBy){
      throw serviceError(
        "Cancelled by is required"
      );
    }

    if(!cancellationReason){
      throw serviceError(
        "Cancellation reason is required"
      );
    }

    const payment=await Payment.findById(
      req.params.id
    );

    if(!payment){
      throw serviceError(
        "Payment not found",
        404
      );
    }

    if(payment.status==="COMPLETED"){
      throw serviceError(
        "Confirmed payments are immutable and cannot be cancelled",
        409
      );
    }

    if(payment.status==="CANCELLED"){
      throw serviceError(
        "Payment draft is already cancelled",
        409
      );
    }

    if(payment.status!=="DRAFT"){
      throw serviceError(
        "Only draft payments can be cancelled",
        409
      );
    }

    payment.status="CANCELLED";
    payment.cancelledAt=new Date();
    payment.cancelledBy=cancelledBy;
    payment.cancellationReason=
      cancellationReason;

    await payment.save({
      validateBeforeSave:true
    });

    return res.status(200).json({
      success:true,
      message:"Payment draft cancelled successfully",
      data:payment
    });
  }catch(error){
    return sendError(res,error);
  }
}

module.exports={
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  confirmPayment,
  cancelPayment
};