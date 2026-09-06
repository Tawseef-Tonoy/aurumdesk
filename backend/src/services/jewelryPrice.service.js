const JewelryItem = require("../models/jewelryItem.model");
const GoldRate = require("../models/goldRate.model");

async function calculateJewelryPrice(itemId){

  const item = await JewelryItem.findById(itemId);
  if(!item) throw new Error("Jewelry item not found");

  const goldRate = await GoldRate.findOne({
    purity:item.purity,
    isActive:true
  }).sort({effectiveDate:-1});

  if(!goldRate) throw new Error("Active gold rate not found");

  const goldValue =
    item.netGoldWeight * goldRate.ratePerGram;

  let makingCharge = 0;

  if(item.makingChargeType==="PER_GRAM")
    makingCharge =
      item.netGoldWeight * item.makingChargeAmount;

  else if(item.makingChargeType==="FIXED")
    makingCharge =
      item.makingChargeAmount;

  else if(item.makingChargeType==="PERCENTAGE")
    makingCharge =
      (goldValue * item.makingChargeAmount) / 100;

  const finalPrice =
    goldValue +
    makingCharge +
    item.stonePrice;

  return {
    itemName:item.name,
    purity:item.purity,
    netGoldWeight:item.netGoldWeight,
    goldRate:goldRate.ratePerGram,
    goldValue,
    makingCharge,
    stonePrice:item.stonePrice,
    finalPrice
  };
}

module.exports={calculateJewelryPrice};