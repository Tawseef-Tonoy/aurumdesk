const Sale=require("../models/sale.model");
const Payment=require("../models/payment.model");
const EMIInstallmentPayment=require("../models/emiInstallmentPayment.model");
const CustomOrder=require("../models/customOrder.model");
const Purchase=require("../models/purchase.model");
const Expense=require("../models/expense.model");
const ReturnExchange=require("../models/returnExchange.model");

function getDayRange(date){
const start=new Date(`${date instanceof Date?date.toISOString().slice(0,10):date}T00:00:00`);
const end=new Date(`${date instanceof Date?date.toISOString().slice(0,10):date}T23:59:59.999`);
return{start,end};
}

function total(result){
return result[0]?.total||0;
}

async function getDailyCashSummary(date){
const{start,end}=getDayRange(date);

const[
cashSales,
dueCollections,
emiCollections,
customOrderAdvances,
supplierPayments,
businessExpenses,
refunds
]=await Promise.all([
Sale.aggregate([
{
$match:{
createdAt:{$gte:start,$lte:end},
paymentMethod:"CASH",
status:"COMPLETED"
}
},
{
$group:{
_id:null,
total:{$sum:"$totalAmount"}
}
}
]),

Payment.aggregate([
{
$match:{
paymentDate:{$gte:start,$lte:end},
paymentMethod:"CASH",
status:"COMPLETED"
}
},
{
$group:{
_id:null,
total:{$sum:"$amount"}
}
}
]),

EMIInstallmentPayment.aggregate([
{
$match:{
paymentDate:{$gte:start,$lte:end},
paymentMethod:"CASH",
status:"COMPLETED"
}
},
{
$group:{
_id:null,
total:{$sum:"$amount"}
}
}
]),

CustomOrder.aggregate([
{
$match:{
advancePaymentDate:{$gte:start,$lte:end},
advancePaymentMethod:"CASH",
advancePaid:{$gt:0}
}
},
{
$group:{
_id:null,
total:{$sum:"$advancePaid"}
}
}
]),

Purchase.aggregate([
{
$match:{
purchaseDate:{$gte:start,$lte:end},
paymentMethod:"CASH",
status:"CONFIRMED",
paidAmount:{$gt:0}
}
},
{
$group:{
_id:null,
total:{$sum:"$paidAmount"}
}
}
]),

Expense.aggregate([
{
$match:{
expenseDate:{$gte:start,$lte:end},
paymentMethod:"CASH",
status:"CONFIRMED"
}
},
{
$group:{
_id:null,
total:{$sum:"$amount"}
}
}
]),

ReturnExchange.aggregate([
{
$match:{
completedAt:{$gte:start,$lte:end},
status:"COMPLETED",
refundMethod:"CASH",
refundAmount:{$gt:0}
}
},
{
$group:{
_id:null,
total:{$sum:"$refundAmount"}
}
}
])
]);

return{
cashSales:total(cashSales),
dueCollections:total(dueCollections),
emiCollections:total(emiCollections),
customOrderAdvances:total(customOrderAdvances),
supplierPayments:total(supplierPayments),
businessExpenses:total(businessExpenses),
refunds:total(refunds)
};
}

function calculateClosing(data){
const totalCashInflow=
Number(data.cashSales||0)+
Number(data.dueCollections||0)+
Number(data.emiCollections||0)+
Number(data.customOrderAdvances||0)+
Number(data.otherCashIncome||0)+
Number(data.cashWithdrawals||0);

const totalCashOutflow=
Number(data.supplierPayments||0)+
Number(data.businessExpenses||0)+
Number(data.refunds||0)+
Number(data.cashDeposits||0);

const expectedClosingCash=
Number(data.openingCash||0)+
totalCashInflow-
totalCashOutflow;

const hasActual=
data.actualClosingCash!==undefined&&
data.actualClosingCash!==null;

const cashDifference=hasActual
?Number(data.actualClosingCash)-expectedClosingCash
:null;

return{
totalCashInflow,
totalCashOutflow,
expectedClosingCash,
cashDifference
};
}

async function refreshDailyCashClosing(closing){
const summary=await getDailyCashSummary(closing.businessDate);

const calculation=calculateClosing({
openingCash:closing.openingCash,
...summary,
otherCashIncome:closing.otherCashIncome,
cashDeposits:closing.cashDeposits,
cashWithdrawals:closing.cashWithdrawals,
actualClosingCash:closing.actualClosingCash
});

Object.assign(closing,summary,calculation);
return closing;
}

module.exports={
getDailyCashSummary,
calculateClosing,
refreshDailyCashClosing
};