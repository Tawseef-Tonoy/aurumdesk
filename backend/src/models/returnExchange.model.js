const mongoose=require("mongoose");

const {Schema}=mongoose;

const reasons=[
  "SIZE_PROBLEM",
  "PRODUCT_DEFECT",
  "CUSTOMER_PREFERENCE",
  "WRONG_PRODUCT",
  "QUALITY_CONCERN",
  "APPROVED_BUYBACK",
  "OTHER"
];

const conditions=[
  "GOOD",
  "NEEDS_INSPECTION",
  "NEEDS_REPAIR",
  "DAMAGED"
];

const dispositions=[
  "RESTOCK",
  "INSPECTION",
  "REPAIR",
  "DAMAGED",
  "RETURN_TO_SUPPLIER"
];

const refundMethods=[
  "NONE",
  "CASH",
  "CARD",
  "BANK",
  "MOBILE_BANKING"
];

const returnItemSchema=new Schema({
  originalSaleItem:{
    type:Schema.Types.ObjectId,
    required:true
  },

  jewelryItem:{
    type:Schema.Types.ObjectId,
    ref:"JewelryItem",
    required:true
  },

  itemName:{
    type:String,
    required:true,
    trim:true
  },

  soldQuantity:{
    type:Number,
    required:true,
    min:1
  },

  quantity:{
    type:Number,
    required:true,
    min:1
  },

  unitReturnValue:{
    type:Number,
    required:true,
    min:0
  },

  returnValue:{
    type:Number,
    required:true,
    min:0
  },

  reason:{
    type:String,
    enum:reasons,
    required:true
  },

  condition:{
    type:String,
    enum:conditions,
    required:true
  },

  inventoryDisposition:{
    type:String,
    enum:dispositions,
    required:true
  }
},{
  _id:true
});

const replacementItemSchema=new Schema({
  jewelryItem:{
    type:Schema.Types.ObjectId,
    ref:"JewelryItem",
    required:true
  },

  itemName:{
    type:String,
    required:true,
    trim:true
  },

  quantity:{
    type:Number,
    required:true,
    min:1
  },

  unitValue:{
    type:Number,
    required:true,
    min:0
  },

  subtotal:{
    type:Number,
    required:true,
    min:0
  }
},{
  _id:true
});

const returnExchangeSchema=new Schema({
  returnExchangeNo:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    uppercase:true
  },

  type:{
    type:String,
    enum:[
      "RETURN",
      "EXCHANGE"
    ],
    required:true
  },

  sale:{
    type:Schema.Types.ObjectId,
    ref:"Sale",
    required:true,
    index:true
  },

  customer:{
    type:Schema.Types.ObjectId,
    ref:"Customer",
    required:true,
    index:true
  },

  items:{
    type:[returnItemSchema],
    validate:{
      validator:value=>
        Array.isArray(value)&&
        value.length>0,
      message:
        "At least one returned item is required"
    }
  },

  replacementItems:{
    type:[replacementItemSchema],
    default:[]
  },

  returnValue:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  replacementValue:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  adjustmentAmount:{
    type:Number,
    required:true,
    default:0
  },

  ledgerCreditAmount:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  ledgerDebitAmount:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  refundAmount:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  additionalDueAmount:{
    type:Number,
    required:true,
    min:0,
    default:0
  },

  refundMethod:{
    type:String,
    enum:refundMethods,
    default:"NONE"
  },

  refundReference:{
    type:String,
    trim:true,
    maxlength:200,
    default:""
  },

  status:{
    type:String,
    enum:[
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "COMPLETED",
      "REJECTED",
      "CANCELLED"
    ],
    default:"DRAFT",
    index:true
  },

  requestedBy:{
    type:String,
    required:true,
    trim:true,
    maxlength:120
  },

  submittedAt:{
    type:Date,
    default:null
  },

  approvedBy:{
    type:String,
    trim:true,
    maxlength:120,
    default:""
  },

  approvedAt:{
    type:Date,
    default:null
  },

  rejectedBy:{
    type:String,
    trim:true,
    maxlength:120,
    default:""
  },

  rejectedAt:{
    type:Date,
    default:null
  },

  rejectionReason:{
    type:String,
    trim:true,
    maxlength:1000,
    default:""
  },

  cancelledBy:{
    type:String,
    trim:true,
    maxlength:120,
    default:""
  },

  cancelledAt:{
    type:Date,
    default:null
  },

  completedBy:{
    type:String,
    trim:true,
    maxlength:120,
    default:""
  },

  completedAt:{
    type:Date,
    default:null
  },

  notes:{
    type:String,
    trim:true,
    maxlength:2000,
    default:""
  }
},{
  timestamps:true
});

returnExchangeSchema.pre(
  "validate",
  function(){
    if(
      this.type==="RETURN"&&
      this.replacementItems.length>0
    ){
      this.invalidate(
        "replacementItems",
        "Return transactions cannot contain replacement items"
      );
    }

    if(
      this.type==="EXCHANGE"&&
      this.replacementItems.length===0
    ){
      this.invalidate(
        "replacementItems",
        "Exchange transactions require at least one replacement item"
      );
    }

    for(
      const item of
      this.items||[]
    ){
      if(
        item.quantity>
        item.soldQuantity
      ){
        this.invalidate(
          "items",
          "Returned quantity cannot exceed sold quantity"
        );
      }

      if(
        item.inventoryDisposition===
          "RESTOCK"&&
        item.condition!=="GOOD"
      ){
        this.invalidate(
          "items",
          "Only items in GOOD condition can be immediately restocked"
        );
      }
    }
  }
);

returnExchangeSchema.index({
  sale:1,
  createdAt:-1
});

returnExchangeSchema.index({
  customer:1,
  createdAt:-1
});

returnExchangeSchema.index({
  type:1,
  status:1,
  createdAt:-1
});

module.exports=mongoose.model(
  "ReturnExchange",
  returnExchangeSchema
);