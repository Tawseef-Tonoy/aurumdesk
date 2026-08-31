const mongoose=require("mongoose");

const {Schema}=mongoose;

const transactionTypes=[
  "NEW_SALE_DUE",
  "EMI_DUE",
  "CUSTOMER_PAYMENT",
  "PAYMENT_REVERSAL",
  "RETURN_ADJUSTMENT",
  "EXCHANGE_ADJUSTMENT",
  "DISCOUNT_ADJUSTMENT",
  "REFUND_ADJUSTMENT",
  "APPROVED_CORRECTION"
];

const sourceTypes=[
  "SALE",
  "PAYMENT",
  "EMI_PLAN",
  "EMI_INSTALLMENT",
  "EMI_INSTALLMENT_PAYMENT",
  "LEDGER_ENTRY"
];

const adjustmentTypes=[
  "PAYMENT_REVERSAL",
  "RETURN_ADJUSTMENT",
  "EXCHANGE_ADJUSTMENT",
  "DISCOUNT_ADJUSTMENT",
  "REFUND_ADJUSTMENT",
  "APPROVED_CORRECTION"
];

const debitOnlyTypes=[
  "NEW_SALE_DUE",
  "EMI_DUE",
  "PAYMENT_REVERSAL",
  "REFUND_ADJUSTMENT"
];

const creditOnlyTypes=[
  "CUSTOMER_PAYMENT",
  "RETURN_ADJUSTMENT",
  "DISCOUNT_ADJUSTMENT"
];

function roundMoney(value){
  const number=Number(value);

  return Number.isFinite(number)
    ?Math.round((number+Number.EPSILON)*100)/100
    :number;
}

const sourceDocumentSchema=new Schema({
  documentType:{
    type:String,
    enum:sourceTypes,
    required:true,
    immutable:true
  },
  documentId:{
    type:Schema.Types.ObjectId,
    required:true,
    immutable:true
  },
  documentNumber:{
    type:String,
    required:true,
    trim:true,
    maxlength:120,
    immutable:true
  }
},{
  _id:false
});

const ledgerEntrySchema=new Schema({
  customer:{
    type:Schema.Types.ObjectId,
    ref:"Customer",
    required:true,
    immutable:true
  },
  sale:{
    type:Schema.Types.ObjectId,
    ref:"Sale",
    required:true,
    immutable:true
  },
  entryDate:{
    type:Date,
    default:Date.now,
    required:true,
    immutable:true
  },
  dueDate:{
    type:Date,
    default:null,
    immutable:true
  },
  transactionType:{
    type:String,
    enum:transactionTypes,
    required:true,
    immutable:true
  },
  debitAmount:{
    type:Number,
    min:0,
    default:0,
    set:roundMoney,
    immutable:true
  },
  creditAmount:{
    type:Number,
    min:0,
    default:0,
    set:roundMoney,
    immutable:true
  },
  sourceDocument:{
    type:sourceDocumentSchema,
    required:true,
    immutable:true
  },
  eventKey:{
    type:String,
    required:true,
    unique:true,
    uppercase:true,
    trim:true,
    maxlength:200,
    immutable:true
  },
  createdBy:{
    type:String,
    required:true,
    trim:true,
    maxlength:120,
    immutable:true
  },
  notes:{
    type:String,
    default:"",
    trim:true,
    maxlength:1000,
    immutable:true
  },
  reversalOf:{
    type:Schema.Types.ObjectId,
    ref:"LedgerEntry",
    default:null,
    immutable:true
  },
  approvedBy:{
    type:String,
    default:"",
    trim:true,
    maxlength:120,
    immutable:true
  },
  approvedAt:{
    type:Date,
    default:null,
    immutable:true
  }
},{
  timestamps:true
});

ledgerEntrySchema.pre("validate",function(){
  const debit=Number(this.debitAmount||0);
  const credit=Number(this.creditAmount||0);

  if(!Number.isFinite(debit)||debit<0){
    this.invalidate(
      "debitAmount",
      "Debit amount must be a valid non-negative number"
    );
  }

  if(!Number.isFinite(credit)||credit<0){
    this.invalidate(
      "creditAmount",
      "Credit amount must be a valid non-negative number"
    );
  }

  if((debit>0)===(credit>0)){
    this.invalidate(
      "debitAmount",
      "Exactly one of debit amount or credit amount must be greater than zero"
    );
  }

  if(
    debitOnlyTypes.includes(this.transactionType)&&
    debit<=0
  ){
    this.invalidate(
      "debitAmount",
      `${this.transactionType} must be a debit entry`
    );
  }

  if(
    creditOnlyTypes.includes(this.transactionType)&&
    credit<=0
  ){
    this.invalidate(
      "creditAmount",
      `${this.transactionType} must be a credit entry`
    );
  }

  if(adjustmentTypes.includes(this.transactionType)){
    if(!this.notes){
      this.invalidate(
        "notes",
        "Adjustment notes are required"
      );
    }

    if(!this.approvedBy||!this.approvedAt){
      this.invalidate(
        "approvedBy",
        "Approved adjustments require approver information and approval date"
      );
    }
  }

  if(
    this.transactionType==="PAYMENT_REVERSAL"&&
    !this.reversalOf
  ){
    this.invalidate(
      "reversalOf",
      "Payment reversal must reference the original ledger entry"
    );
  }
});

ledgerEntrySchema.index({
  customer:1,
  entryDate:1,
  _id:1
});

ledgerEntrySchema.index({
  customer:1,
  sale:1,
  entryDate:1,
  _id:1
});

ledgerEntrySchema.index({
  customer:1,
  dueDate:1
});

ledgerEntrySchema.index({
  "sourceDocument.documentType":1,
  "sourceDocument.documentId":1
});

module.exports=mongoose.model(
  "LedgerEntry",
  ledgerEntrySchema
);