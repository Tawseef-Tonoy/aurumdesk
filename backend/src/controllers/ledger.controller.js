const mongoose=require("mongoose");

const Sale=require("../models/sale.model");

const {
  createLedgerEntry,
  roundMoney,
  serviceError
}=require("../services/ledger.service");

const {
  getCustomerBalance,
  getCustomerStatement,
  getInvoiceOutstanding,
  getDateWiseOutstanding,
  getDueAging,
  getCustomerDueSummary
}=require("../services/ledgerReport.service");

const adjustmentRules={
  RETURN_ADJUSTMENT:["CREDIT"],
  EXCHANGE_ADJUSTMENT:[
    "DEBIT",
    "CREDIT"
  ],
  DISCOUNT_ADJUSTMENT:["CREDIT"],
  REFUND_ADJUSTMENT:["DEBIT"],
  APPROVED_CORRECTION:[
    "DEBIT",
    "CREDIT"
  ]
};

function text(value){
  return String(value??"").trim();
}

function sendError(res,error){
  console.error(
    "Ledger error:",
    error
  );

  const statusCode=
    error.statusCode||
    (error?.name==="ValidationError"
      ?400
      :500);

  return res.status(statusCode).json({
    success:false,
    message:
      error.message||
      "Ledger operation failed"
  });
}

async function getSummary(req,res){
  try{
    const data=
      await getCustomerDueSummary();

    return res.status(200).json({
      success:true,
      count:data.length,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getBalance(req,res){
  try{
    const data=
      await getCustomerBalance(
        req.params.customerId
      );

    return res.status(200).json({
      success:true,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getStatement(req,res){
  try{
    const data=
      await getCustomerStatement(
        req.params.customerId,
        req.query
      );

    return res.status(200).json({
      success:true,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getOutstanding(req,res){
  try{
    const data=
      await getInvoiceOutstanding(
        req.params.customerId
      );

    return res.status(200).json({
      success:true,
      count:data.length,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getDateWise(req,res){
  try{
    const data=
      await getDateWiseOutstanding(
        req.params.customerId
      );

    return res.status(200).json({
      success:true,
      count:data.length,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function getAging(req,res){
  try{
    const data=
      await getDueAging(
        req.params.customerId,
        req.query.asOf||
        new Date()
      );

    return res.status(200).json({
      success:true,
      data
    });
  }catch(error){
    return sendError(res,error);
  }
}

async function createAdjustment(req,res){
  const session=await mongoose.startSession();

  try{
    const body=req.body||{};

    const transactionType=text(
      body.transactionType
    ).toUpperCase();

    const allowedDirections=
      adjustmentRules[
        transactionType
      ];

    if(!allowedDirections){
      throw serviceError(
        "Invalid adjustment transaction type"
      );
    }

    const direction=text(
      body.direction
    ).toUpperCase();

    if(
      !allowedDirections.includes(
        direction
      )
    ){
      throw serviceError(
        `${transactionType} only allows ${allowedDirections.join(" or ")}`
      );
    }

    const amount=roundMoney(
      body.amount
    );

    if(
      !Number.isFinite(amount)||
      amount<=0
    ){
      throw serviceError(
        "Adjustment amount must be greater than zero"
      );
    }

    const notes=text(
      body.notes
    );

    const approvedBy=text(
      body.approvedBy
    );

    const createdBy=text(
      body.createdBy
    );

    if(!notes){
      throw serviceError(
        "Adjustment notes are required"
      );
    }

    if(!approvedBy){
      throw serviceError(
        "Approved by is required"
      );
    }

    if(!createdBy){
      throw serviceError(
        "Created by is required"
      );
    }

    if(
      !mongoose.Types.ObjectId.isValid(
        body.customer
      )||
      !mongoose.Types.ObjectId.isValid(
        body.sale
      )
    ){
      throw serviceError(
        "Valid customer and invoice are required"
      );
    }

    const entryDate=
      body.entryDate
        ?new Date(body.entryDate)
        :new Date();

    if(
      Number.isNaN(
        entryDate.getTime()
      )
    ){
      throw serviceError(
        "Invalid entry date"
      );
    }

    let dueDate=null;

    if(body.dueDate){
      dueDate=new Date(
        body.dueDate
      );

      if(
        Number.isNaN(
          dueDate.getTime()
        )
      ){
        throw serviceError(
          "Invalid due date"
        );
      }
    }

    let entry;
    let updatedSale;

    await session.withTransaction(
      async()=>{
        const sale=
          await Sale.findById(
            body.sale
          ).session(session);

        if(!sale){
          throw serviceError(
            "Invoice not found",
            404
          );
        }

        if(
          String(sale.customer)!==
          String(body.customer)
        ){
          throw serviceError(
            "Invoice does not belong to the selected customer"
          );
        }

        if(
          [
            "DRAFT",
            "CANCELLED"
          ].includes(sale.status)
        ){
          throw serviceError(
            "Adjustments require a confirmed transaction"
          );
        }

        const currentDue=
          roundMoney(
            sale.dueAmount||0
          );

        const nextDue=
          roundMoney(
            direction==="DEBIT"
              ?currentDue+amount
              :currentDue-amount
          );

        if(nextDue<0){
          throw serviceError(
            `Credit adjustment cannot exceed current due of ${currentDue}`
          );
        }

        const eventId=
          new mongoose.Types.ObjectId();

        entry=
          await createLedgerEntry({
            customer:sale.customer,
            sale:sale._id,
            entryDate,
            dueDate:
              dueDate||
              entryDate,
            transactionType,
            debitAmount:
              direction==="DEBIT"
                ?amount
                :0,
            creditAmount:
              direction==="CREDIT"
                ?amount
                :0,
            eventKey:
              `ADJUSTMENT:${eventId}`,
            sourceDocument:{
              documentType:"SALE",
              documentId:sale._id
            },
            createdBy,
            notes,
            approvedBy,
            approvedAt:new Date()
          },{
            session
          });

        sale.dueAmount=nextDue;

        if(
          ![
            "RETURNED",
            "EXCHANGED"
          ].includes(sale.status)
        ){
          if(nextDue<=0){
            sale.status=
              "FULLY_PAID";
          }else if(
            Number(
              sale.paidAmount||0
            )>0
          ){
            sale.status=
              "PARTIALLY_PAID";
          }else{
            sale.status=
              "CONFIRMED";
          }
        }

        await sale.save({
          session,
          validateBeforeSave:true
        });

        updatedSale=sale;
      }
    );

    return res.status(201).json({
      success:true,
      message:
        "Ledger adjustment created successfully",
      data:entry,
      sale:updatedSale
    });
  }catch(error){
    return sendError(res,error);
  }finally{
    await session.endSession();
  }
}

module.exports={
  getSummary,
  getBalance,
  getStatement,
  getOutstanding,
  getDateWise,
  getAging,
  createAdjustment
};