const mongoose=require("mongoose");

const changeSchema=new mongoose.Schema({
field:{type:String,required:true},
oldValue:{type:mongoose.Schema.Types.Mixed},
newValue:{type:mongoose.Schema.Types.Mixed}
},{_id:false});

const revisionSchema=new mongoose.Schema({
changedBy:{type:String,required:true,trim:true},
reason:{type:String,default:"Customer-requested change",trim:true},
changes:{type:[changeSchema],default:[]},
changedAt:{type:Date,default:Date.now}
},{_id:false});

const customOrderSchema=new mongoose.Schema({
orderNo:{
type:String,
required:true,
unique:true,
trim:true,
uppercase:true
},

customer:{
type:mongoose.Schema.Types.ObjectId,
ref:"Customer",
required:true
},

bookingDate:{
type:Date,
required:true,
default:Date.now
},

jewelryType:{
type:String,
required:true,
trim:true
},

designDescription:{
type:String,
required:true,
trim:true
},

purity:{
type:String,
required:true,
trim:true,
uppercase:true
},

expectedWeight:{
type:Number,
required:true,
min:0
},

size:{
type:String,
default:"",
trim:true
},

stoneRequirements:{
type:String,
default:"",
trim:true
},

engravingInstructions:{
type:String,
default:"",
trim:true
},

specialInstructions:{
type:String,
default:"",
trim:true
},

estimatedPrice:{
type:Number,
required:true,
min:0
},

advancePaid:{
type:Number,
default:0,
min:0
},

advancePaymentMethod:{
type:String,
enum:["CASH","CARD","BANK_TRANSFER","MOBILE_BANKING"],
default:"CASH"
},

advanceReferenceNumber:{
type:String,
default:"",
trim:true
},

advancePaymentDate:{
type:Date,
default:Date.now
},

expectedDeliveryDate:{
type:Date,
required:true,
validate:{
validator:function(value){
return !this.bookingDate||value>=this.bookingDate;
},
message:"Expected delivery date cannot be earlier than booking date"
}
},

notes:{
type:String,
default:"",
trim:true
},

bookedBy:{
type:String,
required:true,
trim:true
},

revisionHistory:{
type:[revisionSchema],
default:[]
},

status:{
type:String,
enum:[
"BOOKED",
"DESIGN_APPROVED",
"IN_PRODUCTION",
"QUALITY_CHECK",
"READY",
"DELIVERED",
"CANCELLED"
],
default:"BOOKED"
}
},{
timestamps:true,
toJSON:{virtuals:true},
toObject:{virtuals:true}
});

customOrderSchema.virtual("remainingAmount").get(function(){
return Math.max(this.estimatedPrice-this.advancePaid,0);
});

customOrderSchema.pre("validate",function(){
if(this.advancePaid>this.estimatedPrice){
this.invalidate("advancePaid","Advance cannot exceed estimated price");
}
});

module.exports=mongoose.model("CustomOrder",customOrderSchema);