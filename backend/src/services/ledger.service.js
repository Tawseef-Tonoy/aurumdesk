const mongoose=require("mongoose");

const Customer=require("../models/customer.model");
const Sale=require("../models/sale.model");
const Payment=require("../models/payment.model");
const EMIPlan=require("../models/emiPlan.model");
const EMIInstallment=require("../models/emiInstallment.model");
const EMIInstallmentPayment=require("../models/emiInstallmentPayment.model");
const LedgerEntry=require("../models/ledgerEntry.model");

const sourceModels={
  SALE:Sale,
  PAYMENT:Payment,
  EMI_PLAN:EMIPlan,
  EMI_INSTALLMENT:EMIInstallment,
  EMI_INSTALLMENT_PAYMENT:EMIInstallmentPayment,
  LEDGER_ENTRY:LedgerEntry
};

const roundMoney=value=>
  Math.round(
    (Number(value)+Number.EPSILON)*100
  )/100;

function serviceError(
  message,
  statusCode=400
){
  const error=new Error(message);
  error.statusCode=statusCode;
  return error;
}

function text(
  value,
  fallback=""
){
  return String(
    value??fallback
  ).trim();
}

function sameId(
  left,
  right
){
  return String(left)===String(right);
}

function withSession(
  query,
  session
){
  return session
    ?query.session(session)
    :query;
}

async function findRequired(
  Model,
  id,
  label,
  session
){
  if(
    !mongoose.Types.ObjectId.isValid(
      id
    )
  ){
    throw serviceError(
      `Invalid ${label} ID`
    );
  }

  const document=
    await withSession(
      Model.findById(id),
      session
    );

  if(!document){
    throw serviceError(
      `${label} not found`,
      404
    );
  }

  return document;
}

async function validateSource({
  customerId,
  saleId,
  source,
  session
}){
  const customer=
    await findRequired(
      Customer,
      customerId,
      "customer",
      session
    );

  const sale=
    await findRequired(
      Sale,
      saleId,
      "sale",
      session
    );

  if(
    !sameId(
      sale.customer,
      customer._id
    )
  ){
    throw serviceError(
      "The sale does not belong to the selected customer"
    );
  }

  const Model=
    sourceModels[
      source.documentType
    ];

  if(!Model){
    throw serviceError(
      "Unsupported Ledger source document type"
    );
  }

  const document=
    await findRequired(
      Model,
      source.documentId,
      "source document",
      session
    );

  let documentNumber;

  switch(
    source.documentType
  ){
    case "SALE":
      if(
        !sameId(
          document._id,
          sale._id
        )
      ){
        throw serviceError(
          "Sale source does not match the selected invoice"
        );
      }

      documentNumber=
        document.invoiceNumber;

      break;

    case "PAYMENT":
      if(
        !sameId(
          document.customerId,
          customer._id
        )||
        !sameId(
          document.saleId,
          sale._id
        )
      ){
        throw serviceError(
          "Payment source does not match the customer and sale"
        );
      }

      documentNumber=
        document.referenceNumber||
        document._id;

      break;

    case "EMI_PLAN":
      if(
        !sameId(
          document.customer,
          customer._id
        )||
        !sameId(
          document.sale,
          sale._id
        )
      ){
        throw serviceError(
          "EMI plan does not match the customer and sale"
        );
      }

      documentNumber=
        document.planNo;

      break;

    case "EMI_INSTALLMENT":{
      const plan=
        await findRequired(
          EMIPlan,
          document.emiPlan,
          "EMI plan",
          session
        );

      if(
        !sameId(
          plan.customer,
          customer._id
        )||
        !sameId(
          plan.sale,
          sale._id
        )
      ){
        throw serviceError(
          "EMI installment does not match the customer and sale"
        );
      }

      documentNumber=
        `${plan.planNo}-INST-${document.installmentNo}`;

      break;
    }

    case "EMI_INSTALLMENT_PAYMENT":{
      const plan=
        await findRequired(
          EMIPlan,
          document.emiPlan,
          "EMI plan",
          session
        );

      if(
        !sameId(
          document.customer,
          customer._id
        )||
        !sameId(
          plan.sale,
          sale._id
        )
      ){
        throw serviceError(
          "EMI payment does not match the customer and sale"
        );
      }

      documentNumber=
        document.paymentNo;

      break;
    }

    case "LEDGER_ENTRY":
      if(
        !sameId(
          document.customer,
          customer._id
        )||
        !sameId(
          document.sale,
          sale._id
        )
      ){
        throw serviceError(
          "Referenced Ledger entry does not match"
        );
      }

      documentNumber=
        document.eventKey;

      break;
  }

  if(!text(documentNumber)){
    throw serviceError(
      "Source document has no valid reference number"
    );
  }

  return text(
    documentNumber
  );
}

function matchesExisting(
  entry,
  data
){
  return(
    sameId(
      entry.customer,
      data.customer
    )&&
    sameId(
      entry.sale,
      data.sale
    )&&
    entry.transactionType===
      data.transactionType&&
    roundMoney(
      entry.debitAmount
    )===
      data.debitAmount&&
    roundMoney(
      entry.creditAmount
    )===
      data.creditAmount&&
    entry.sourceDocument
      .documentType===
      data.sourceDocument
        .documentType&&
    sameId(
      entry.sourceDocument
        .documentId,
      data.sourceDocument
        .documentId
    )
  );
}

async function createLedgerEntry(
  input,
  {session=null}={}
){
  const data={
    customer:
      input.customer,

    sale:
      input.sale,

    transactionType:
      text(
        input.transactionType
      ).toUpperCase(),

    debitAmount:
      roundMoney(
        input.debitAmount||0
      ),

    creditAmount:
      roundMoney(
        input.creditAmount||0
      ),

    eventKey:
      text(
        input.eventKey
      ).toUpperCase(),

    sourceDocument:{
      documentType:
        text(
          input
            .sourceDocument
            ?.documentType
        ).toUpperCase(),

      documentId:
        input
          .sourceDocument
          ?.documentId
    }
  };

  if(!data.eventKey){
    throw serviceError(
      "Ledger event key is required"
    );
  }

  if(
    !data.sourceDocument
      .documentType||
    !data.sourceDocument
      .documentId
  ){
    throw serviceError(
      "Valid source document details are required"
    );
  }

  if(
    !Number.isFinite(
      data.debitAmount
    )||
    !Number.isFinite(
      data.creditAmount
    )
  ){
    throw serviceError(
      "Ledger amounts must be valid numbers"
    );
  }

  const existing=
    await withSession(
      LedgerEntry.findOne({
        eventKey:
          data.eventKey
      }),
      session
    );

  if(existing){
    if(
      !matchesExisting(
        existing,
        data
      )
    ){
      throw serviceError(
        "Ledger event key belongs to a different entry",
        409
      );
    }

    return existing;
  }

  data.sourceDocument
    .documentNumber=
      await validateSource({
        customerId:
          data.customer,

        saleId:
          data.sale,

        source:
          data.sourceDocument,

        session
      });

  const payload={
    ...data,

    entryDate:
      input.entryDate||
      new Date(),

    dueDate:
      input.dueDate||
      null,

    createdBy:
      text(
        input.createdBy,
        "SYSTEM"
      ),

    notes:
      text(
        input.notes
      ),

    reversalOf:
      input.reversalOf||
      null,

    approvedBy:
      text(
        input.approvedBy
      ),

    approvedAt:
      input.approvedAt||
      null
  };

  try{
    const entries=
      await LedgerEntry.create(
        [payload],
        session
          ?{session}
          :undefined
      );

    return entries[0];
  }catch(error){
    if(
      error?.code===11000
    ){
      throw serviceError(
        "Duplicate Ledger event detected",
        409
      );
    }

    throw error;
  }
}

async function createSaleDueEntry(
  sale,
  {
    createdBy="SYSTEM",
    session=null
  }={}
){
  const dueAmount=
    roundMoney(
      sale.dueAmount||0
    );

  if(dueAmount<=0){
    return null;
  }

  if(
    ![
      "CONFIRMED",
      "PARTIALLY_PAID"
    ].includes(
      sale.status
    )
  ){
    throw serviceError(
      "Only confirmed unpaid sales can create Ledger dues"
    );
  }

  return createLedgerEntry({
    customer:
      sale.customer,

    sale:
      sale._id,

    entryDate:
      sale.updatedAt||
      new Date(),

    dueDate:
      sale.updatedAt||
      new Date(),

    transactionType:
      "NEW_SALE_DUE",

    debitAmount:
      dueAmount,

    eventKey:
      `SALE:${sale._id}:DUE`,

    sourceDocument:{
      documentType:"SALE",
      documentId:
        sale._id
    },

    createdBy,

    notes:
      `Unpaid balance for invoice ${sale.invoiceNumber}`
  },{
    session
  });
}

async function createCustomerPaymentEntry(
  payment,
  sale,
  {session=null}={}
){
  const amount=
    roundMoney(
      payment.amount
    );

  if(
    !Number.isFinite(
      amount
    )||
    amount<=0
  ){
    throw serviceError(
      "Payment amount must be greater than zero"
    );
  }

  if(
    payment.status!==
    "COMPLETED"
  ){
    throw serviceError(
      "Only completed payments can create Ledger credits"
    );
  }

  if(
    !sameId(
      payment.customerId,
      sale.customer
    )||
    !sameId(
      payment.saleId,
      sale._id
    )
  ){
    throw serviceError(
      "Payment does not match the customer and sale"
    );
  }

  return createLedgerEntry({
    customer:
      payment.customerId,

    sale:
      sale._id,

    entryDate:
      payment.paymentDate||
      new Date(),

    transactionType:
      "CUSTOMER_PAYMENT",

    creditAmount:
      amount,

    eventKey:
      `PAYMENT:${payment._id}:CREDIT`,

    sourceDocument:{
      documentType:"PAYMENT",
      documentId:
        payment._id
    },

    createdBy:
      text(
        payment.collectedBy
      )||
      "SYSTEM",

    notes:
      `Payment collected for invoice ${sale.invoiceNumber}`
  },{
    session
  });
}

async function createEMIServiceChargeEntry(
  plan,
  {
    createdBy="SYSTEM",
    session=null
  }={}
){
  const amount=
    roundMoney(
      plan.serviceCharge||0
    );

  if(amount<=0){
    return null;
  }

  if(
    plan.status!==
    "APPROVED"
  ){
    throw serviceError(
      "Only approved EMI plans can create EMI Ledger dues"
    );
  }

  return createLedgerEntry({
    customer:
      plan.customer,

    sale:
      plan.sale,

    entryDate:
      plan.approvedAt||
      new Date(),

    dueDate:
      plan.firstDueDate||
      null,

    transactionType:
      "EMI_DUE",

    debitAmount:
      amount,

    eventKey:
      `EMI_PLAN:${plan._id}:SERVICE_CHARGE`,

    sourceDocument:{
      documentType:
        "EMI_PLAN",

      documentId:
        plan._id
    },

    createdBy,

    notes:
      `EMI service charge for plan ${plan.planNo}`,

    approvedBy:
      text(
        plan.approvedBy
      ),

    approvedAt:
      plan.approvedAt||
      new Date()
  },{
    session
  });
}

module.exports={
  roundMoney,
  serviceError,
  createLedgerEntry,
  createSaleDueEntry,
  createCustomerPaymentEntry,
  createEMIServiceChargeEntry
};