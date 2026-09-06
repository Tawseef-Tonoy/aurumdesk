const mongoose=require("mongoose");

const ReturnExchange=require(
  "../models/returnExchange.model"
);

const Sale=require(
  "../models/sale.model"
);

const JewelryItem=require(
  "../models/jewelryItem.model"
);

const StockAdjustment=require(
  "../models/stockAdjustment.model"
);

const {
  calculateJewelryPrice
}=require(
  "./jewelryPrice.service"
);

const {
  roundMoney,
  createLedgerEntry
}=require(
  "./ledger.service"
);

const eligibleSaleStatuses=[
  "CONFIRMED",
  "PARTIALLY_PAID",
  "FULLY_PAID"
];

const activeReservationStatuses=[
  "PENDING_APPROVAL",
  "APPROVED",
  "COMPLETED"
];

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

function normalizeEnum(value){
  return text(value)
    .toUpperCase();
}

function sameId(left,right){
  return String(left)===
    String(right);
}

function withSession(
  query,
  session
){
  return session
    ?query.session(session)
    :query;
}

function generateReturnExchangeNo(
  type
){
  const date=new Date()
    .toISOString()
    .slice(0,10)
    .replaceAll("-","");

  const suffix=
    new mongoose.Types.ObjectId()
      .toString()
      .slice(-6)
      .toUpperCase();

  return `${
    type==="RETURN"
      ?"RET"
      :"EXC"
  }-${date}-${suffix}`;
}

function generateAdjustmentId(){
  return `ADJ-${Date.now()}-${
    Math.floor(
      1000+
      Math.random()*9000
    )
  }`;
}

async function getRequiredSale(
  saleId,
  session=null
){
  if(
    !mongoose.Types.ObjectId.isValid(
      saleId
    )
  ){
    throw serviceError(
      "Invalid sale ID"
    );
  }

  const sale=
    await withSession(
      Sale.findById(saleId),
      session
    );

  if(!sale){
    throw serviceError(
      "Invoice not found",
      404
    );
  }

  if(
    !eligibleSaleStatuses.includes(
      sale.status
    )
  ){
    throw serviceError(
      "Only confirmed, partially paid, or fully paid invoices can be returned or exchanged"
    );
  }

  return sale;
}

function calculateUnitReturnValue(
  sale,
  saleItem
){
  const invoiceSubtotal=
    Number(sale.subtotal||0);

  const invoiceTotal=
    Number(sale.totalAmount||0);

  const itemSubtotal=
    Number(saleItem.subtotal||0);

  const soldQuantity=
    Number(saleItem.quantity||0);

  if(
    soldQuantity<=0||
    itemSubtotal<0
  ){
    throw serviceError(
      `Invalid original sale value for ${saleItem.itemName}`
    );
  }

  const allocatedValue=
    invoiceSubtotal>0
      ?itemSubtotal*(
        invoiceTotal/
        invoiceSubtotal
      )
      :itemSubtotal;

  return roundMoney(
    allocatedValue/
    soldQuantity
  );
}

async function getUsedQuantities(
  saleId,
  {
    excludeId=null,
    statuses=
      activeReservationStatuses,
    session=null
  }={}
){
  const filter={
    sale:saleId,
    status:{
      $in:statuses
    }
  };

  if(excludeId){
    filter._id={
      $ne:excludeId
    };
  }

  const transactions=
    await withSession(
      ReturnExchange.find(filter)
        .select(
          "items.originalSaleItem items.quantity"
        ),
      session
    );

  const used=new Map();

  for(const transaction of transactions){
    for(const item of transaction.items){
      const key=String(
        item.originalSaleItem
      );

      used.set(
        key,
        (
          used.get(key)||0
        )+
        Number(item.quantity)
      );
    }
  }

  return used;
}

async function getSaleEligibility(
  saleId
){
  const sale=
    await getRequiredSale(
      saleId
    );

  const used=
    await getUsedQuantities(
      sale._id
    );

  const items=
    sale.items.map(item=>{
      const soldQuantity=
        Number(item.quantity);

      const reservedQuantity=
        Number(
          used.get(
            String(item._id)
          )||0
        );

      const remainingQuantity=
        Math.max(
          0,
          soldQuantity-
          reservedQuantity
        );

      return{
        originalSaleItem:
          item._id,

        jewelryItem:
          item.jewelryItem,

        itemName:
          item.itemName,

        purity:
          item.purity,

        soldQuantity,

        reservedOrProcessedQuantity:
          reservedQuantity,

        remainingReturnableQuantity:
          remainingQuantity,

        unitReturnValue:
          calculateUnitReturnValue(
            sale,
            item
          )
      };
    });

  return{
    sale:{
      _id:sale._id,
      invoiceNumber:
        sale.invoiceNumber,
      customer:
        sale.customer,
      totalAmount:
        sale.totalAmount,
      paidAmount:
        sale.paidAmount,
      dueAmount:
        sale.dueAmount,
      status:
        sale.status
    },
    items
  };
}

async function buildReturnItems(
  sale,
  inputItems,
  {
    excludeId=null,
    session=null
  }={}
){
  if(
    !Array.isArray(inputItems)||
    inputItems.length===0
  ){
    throw serviceError(
      "At least one returned item is required"
    );
  }

  const used=
    await getUsedQuantities(
      sale._id,
      {
        excludeId,
        session
      }
    );

  const seen=new Set();
  const result=[];

  for(const input of inputItems){
    const originalSaleItemId=
      input.originalSaleItem;

    if(
      !mongoose.Types.ObjectId
        .isValid(
          originalSaleItemId
        )
    ){
      throw serviceError(
        "Invalid original sale item ID"
      );
    }

    const key=String(
      originalSaleItemId
    );

    if(seen.has(key)){
      throw serviceError(
        "The same sale item cannot be added twice"
      );
    }

    seen.add(key);

    const saleItem=
      sale.items.id(
        originalSaleItemId
      );

    if(!saleItem){
      throw serviceError(
        "Selected item does not belong to the original invoice"
      );
    }

    const quantity=
      Number(input.quantity);

    if(
      !Number.isInteger(quantity)||
      quantity<=0
    ){
      throw serviceError(
        `Return quantity for ${saleItem.itemName} must be a positive whole number`
      );
    }

    const alreadyUsed=
      Number(
        used.get(key)||0
      );

    const remaining=
      Number(
        saleItem.quantity
      )-
      alreadyUsed;

    if(quantity>remaining){
      throw serviceError(
        `${saleItem.itemName} has only ${Math.max(
          remaining,
          0
        )} returnable unit(s) remaining`
      );
    }

    const reason=
      normalizeEnum(
        input.reason
      );

    const condition=
      normalizeEnum(
        input.condition
      );

    const inventoryDisposition=
      normalizeEnum(
        input.inventoryDisposition
      );

    const allowedReasons=[
      "SIZE_PROBLEM",
      "PRODUCT_DEFECT",
      "CUSTOMER_PREFERENCE",
      "WRONG_PRODUCT",
      "QUALITY_CONCERN",
      "APPROVED_BUYBACK",
      "OTHER"
    ];

    const allowedConditions=[
      "GOOD",
      "NEEDS_INSPECTION",
      "NEEDS_REPAIR",
      "DAMAGED"
    ];

    const allowedDispositions=[
      "RESTOCK",
      "INSPECTION",
      "REPAIR",
      "DAMAGED",
      "RETURN_TO_SUPPLIER"
    ];

    if(
      !allowedReasons.includes(
        reason
      )
    ){
      throw serviceError(
        `Invalid return reason for ${saleItem.itemName}`
      );
    }

    if(
      !allowedConditions.includes(
        condition
      )
    ){
      throw serviceError(
        `Invalid item condition for ${saleItem.itemName}`
      );
    }

    if(
      !allowedDispositions.includes(
        inventoryDisposition
      )
    ){
      throw serviceError(
        `Invalid inventory disposition for ${saleItem.itemName}`
      );
    }

    if(
      inventoryDisposition===
        "RESTOCK"&&
      condition!=="GOOD"
    ){
      throw serviceError(
        `${saleItem.itemName} cannot be restocked unless its condition is GOOD`
      );
    }

    const unitReturnValue=
      calculateUnitReturnValue(
        sale,
        saleItem
      );

    result.push({
      originalSaleItem:
        saleItem._id,

      jewelryItem:
        saleItem.jewelryItem,

      itemName:
        saleItem.itemName,

      soldQuantity:
        saleItem.quantity,

      quantity,

      unitReturnValue,

      returnValue:
        roundMoney(
          unitReturnValue*
          quantity
        ),

      reason,

      condition,

      inventoryDisposition
    });
  }

  return result;
}

async function buildReplacementItems(
  type,
  inputItems,
  session=null
){
  if(type==="RETURN"){
    return[];
  }

  if(
    !Array.isArray(inputItems)||
    inputItems.length===0
  ){
    throw serviceError(
      "Exchange requires at least one replacement item"
    );
  }

  const result=[];
  const requestedQuantities=
    new Map();

  for(const input of inputItems){
    if(
      !mongoose.Types.ObjectId
        .isValid(
          input.jewelryItem
        )
    ){
      throw serviceError(
        "Invalid replacement jewelry item ID"
      );
    }

    const quantity=
      Number(input.quantity);

    if(
      !Number.isInteger(quantity)||
      quantity<=0
    ){
      throw serviceError(
        "Replacement quantity must be a positive whole number"
      );
    }

    const key=String(
      input.jewelryItem
    );

    requestedQuantities.set(
      key,
      (
        requestedQuantities.get(key)||
        0
      )+
      quantity
    );
  }

  for(
    const [
      itemId,
      totalQuantity
    ] of requestedQuantities
  ){
    const item=
      await withSession(
        JewelryItem.findById(
          itemId
        ),
        session
      );

    if(!item){
      throw serviceError(
        "Replacement jewelry item not found",
        404
      );
    }

    if(
      item.status!=="AVAILABLE"
    ){
      throw serviceError(
        `${item.name} is not currently available for exchange`
      );
    }

    if(
      totalQuantity>
      Number(item.quantity)
    ){
      throw serviceError(
        `Not enough stock for ${item.name}. Available: ${item.quantity}`
      );
    }
  }

  for(const input of inputItems){
    const item=
      await withSession(
        JewelryItem.findById(
          input.jewelryItem
        ),
        session
      );

    const quantity=
      Number(input.quantity);

    let price;

    try{
      price=
        await calculateJewelryPrice(
          item._id
        );
    }catch(error){
      throw serviceError(
        `Price calculation failed for ${item.name}: ${error.message}`
      );
    }

    const unitValue=
      roundMoney(
        price.finalPrice
      );

    if(
      !Number.isFinite(
        unitValue
      )||
      unitValue<=0
    ){
      throw serviceError(
        `Calculated replacement value for ${item.name} is invalid`
      );
    }

    result.push({
      jewelryItem:
        item._id,

      itemName:
        item.name,

      quantity,

      unitValue,

      subtotal:
        roundMoney(
          unitValue*
          quantity
        )
    });
  }

  return result;
}

function calculateTotals(
  type,
  items,
  replacementItems
){
  const returnValue=
    roundMoney(
      items.reduce(
        (sum,item)=>
          sum+
          Number(
            item.returnValue||0
          ),
        0
      )
    );

  const replacementValue=
    type==="EXCHANGE"
      ?roundMoney(
        replacementItems.reduce(
          (sum,item)=>
            sum+
            Number(
              item.subtotal||0
            ),
          0
        )
      )
      :0;

  return{
    returnValue,
    replacementValue,
    adjustmentAmount:
      roundMoney(
        replacementValue-
        returnValue
      )
  };
}

function calculateSettlement(
  adjustmentAmount,
  currentDue
){
  const adjustment=
    roundMoney(
      adjustmentAmount
    );

  const due=Math.max(
    0,
    roundMoney(
      currentDue||0
    )
  );

  if(adjustment>0){
    return{
      ledgerCreditAmount:0,
      ledgerDebitAmount:
        adjustment,
      refundAmount:0,
      additionalDueAmount:
        adjustment
    };
  }

  if(adjustment<0){
    const creditValue=
      Math.abs(adjustment);

    const ledgerCreditAmount=
      roundMoney(
        Math.min(
          creditValue,
          due
        )
      );

    return{
      ledgerCreditAmount,
      ledgerDebitAmount:0,
      refundAmount:
        roundMoney(
          creditValue-
          ledgerCreditAmount
        ),
      additionalDueAmount:0
    };
  }

  return{
    ledgerCreditAmount:0,
    ledgerDebitAmount:0,
    refundAmount:0,
    additionalDueAmount:0
  };
}

async function buildDraftPayload(
  input,
  {
    existing=null,
    session=null
  }={}
){
  const type=
    normalizeEnum(
      input.type||
      existing?.type
    );

  if(
    ![
      "RETURN",
      "EXCHANGE"
    ].includes(type)
  ){
    throw serviceError(
      "Type must be RETURN or EXCHANGE"
    );
  }

  const saleId=
    input.sale||
    existing?.sale;

  const sale=
    await getRequiredSale(
      saleId,
      session
    );

  const items=
    await buildReturnItems(
      sale,
      input.items,
      {
        excludeId:
          existing?._id||null,
        session
      }
    );

  const replacementItems=
    await buildReplacementItems(
      type,
      input.replacementItems,
      session
    );

  const totals=
    calculateTotals(
      type,
      items,
      replacementItems
    );

  const settlement=
    calculateSettlement(
      totals.adjustmentAmount,
      sale.dueAmount
    );

  return{
    type,
    sale:sale._id,
    customer:sale.customer,
    items,
    replacementItems,
    ...totals,
    ...settlement,
    notes:text(
      input.notes
    )
  };
}

async function createReturnExchange(
  input
){
  const payload=
    await buildDraftPayload(
      input
    );

  const sale=
    await Sale.findById(
      payload.sale
    ).select(
      "salesPerson"
    );

  const requestedBy=
    text(
      input.requestedBy||
      sale?.salesPerson||
      "SYSTEM"
    );

  const document=
    await ReturnExchange.create({
      ...payload,

      returnExchangeNo:
        generateReturnExchangeNo(
          payload.type
        ),

      requestedBy,

      status:"DRAFT"
    });

  return document;
}

async function updateReturnExchange(
  id,
  input
){
  const document=
    await ReturnExchange.findById(
      id
    );

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    document.status!=="DRAFT"
  ){
    throw serviceError(
      "Only draft return or exchange transactions can be edited"
    );
  }

  const payload=
    await buildDraftPayload(
      {
        type:
          input.type||
          document.type,

        sale:
          document.sale,

        items:
          input.items||
          document.items.map(
            item=>({
              originalSaleItem:
                item.originalSaleItem,
              quantity:
                item.quantity,
              reason:
                item.reason,
              condition:
                item.condition,
              inventoryDisposition:
                item.inventoryDisposition
            })
          ),

        replacementItems:
          input.replacementItems||
          document.replacementItems.map(
            item=>({
              jewelryItem:
                item.jewelryItem,
              quantity:
                item.quantity,
              unitValue:
                item.unitValue
            })
          ),

        notes:
          input.notes===
            undefined
            ?document.notes
            :input.notes
      },
      {
        existing:document
      }
    );

  Object.assign(
    document,
    payload
  );

  await document.save();

  return document;
}

async function validateCurrentReturnability(
  document,
  session=null
){
  const sale=
    await getRequiredSale(
      document.sale,
      session
    );

  const used=
    await getUsedQuantities(
      sale._id,
      {
        excludeId:
          document._id,
        statuses:[
          "PENDING_APPROVAL",
          "APPROVED",
          "COMPLETED"
        ],
        session
      }
    );

  for(const item of document.items){
    const saleItem=
      sale.items.id(
        item.originalSaleItem
      );

    if(!saleItem){
      throw serviceError(
        `${item.itemName} is no longer present on the original invoice`
      );
    }

    const remaining=
      Number(
        saleItem.quantity
      )-
      Number(
        used.get(
          String(
            item.originalSaleItem
          )
        )||0
      );

    if(
      Number(item.quantity)>
      remaining
    ){
      throw serviceError(
        `${item.itemName} no longer has enough returnable quantity`
      );
    }
  }

  return sale;
}

async function submitReturnExchange(
  id
){
  const document=
    await ReturnExchange.findById(
      id
    );

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    document.status!=="DRAFT"
  ){
    throw serviceError(
      "Only draft transactions can be submitted"
    );
  }

  await validateCurrentReturnability(
    document
  );

  document.status=
    "PENDING_APPROVAL";

  document.submittedAt=
    new Date();

  await document.save();

  return document;
}

async function approveReturnExchange(
  id,
  approvedBy
){
  const document=
    await ReturnExchange.findById(
      id
    );

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    document.status!==
    "PENDING_APPROVAL"
  ){
    throw serviceError(
      "Only pending transactions can be approved"
    );
  }

  const approver=
    text(approvedBy);

  if(!approver){
    throw serviceError(
      "Approver name is required"
    );
  }

  await validateCurrentReturnability(
    document
  );

  document.status="APPROVED";
  document.approvedBy=approver;
  document.approvedAt=new Date();

  await document.save();

  return document;
}

async function rejectReturnExchange(
  id,
  {
    rejectedBy,
    rejectionReason
  }
){
  const document=
    await ReturnExchange.findById(
      id
    );

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    ![
      "PENDING_APPROVAL",
      "APPROVED"
    ].includes(
      document.status
    )
  ){
    throw serviceError(
      "This transaction cannot be rejected"
    );
  }

  const user=text(rejectedBy);
  const reason=text(
    rejectionReason
  );

  if(!user||!reason){
    throw serviceError(
      "Rejected by and rejection reason are required"
    );
  }

  document.status="REJECTED";
  document.rejectedBy=user;
  document.rejectedAt=new Date();
  document.rejectionReason=
    reason;

  await document.save();

  return document;
}

async function cancelReturnExchange(
  id,
  cancelledBy
){
  const document=
    await ReturnExchange.findById(
      id
    );

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    ![
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED"
    ].includes(
      document.status
    )
  ){
    throw serviceError(
      "This transaction cannot be cancelled"
    );
  }

  const user=text(
    cancelledBy,
    "SYSTEM"
  );

  document.status=
    "CANCELLED";

  document.cancelledBy=
    user;

  document.cancelledAt=
    new Date();

  await document.save();

  return document;
}

async function createStockAudit({
  item,
  direction,
  amount,
  previousQuantity,
  newQuantity,
  reason,
  notes,
  adjustedBy,
  requestIp="",
  userAgent="",
  session
}){
  const records=
    await StockAdjustment.create(
      [{
        adjustmentId:
          generateAdjustmentId(),

        jewelryItem:
          item._id,

        direction,

        adjustmentAmount:
          amount,

        previousQuantity,

        newQuantity,

        reason,

        notes,

        adjustedBy,

        requestIp,

        userAgent
      }],
      {session}
    );

  return records[0];
}

async function restoreReturnedInventory(
  document,
  {
    completedBy,
    requestIp,
    userAgent,
    session
  }
){
  const touchedIds=new Set();

  const quantities=
    new Map();

  for(const line of document.items){
    if(
      line.inventoryDisposition!==
      "RESTOCK"
    ){
      continue;
    }

    const key=String(
      line.jewelryItem
    );

    quantities.set(
      key,
      (
        quantities.get(key)||0
      )+
      Number(line.quantity)
    );
  }

  for(
    const [
      itemId,
      amount
    ] of quantities
  ){
    const item=
      await JewelryItem.findById(
        itemId
      ).session(session);

    if(!item){
      throw serviceError(
        "Returned inventory item no longer exists",
        404
      );
    }

    if(
      item.status==="INACTIVE"
    ){
      throw serviceError(
        `${item.name} is inactive and cannot be restocked`
      );
    }

    const previousQuantity=
      Number(item.quantity);

    const newQuantity=
      previousQuantity+
      amount;

    item.quantity=
      newQuantity;

    item.status=
      "AVAILABLE";

    await item.save({
      session,
      validateBeforeSave:true
    });

    await createStockAudit({
      item,
      direction:"INCREASE",
      amount,
      previousQuantity,
      newQuantity,
      reason:
        "RETURN_OR_REPAIR",
      notes:
        `Sellable stock restored by ${document.returnExchangeNo}`,
      adjustedBy:
        completedBy,
      requestIp,
      userAgent,
      session
    });

    touchedIds.add(
      String(item._id)
    );
  }

  return touchedIds;
}

async function issueReplacementInventory(
  document,
  {
    completedBy,
    requestIp,
    userAgent,
    session
  }
){
  const touchedIds=new Set();

  if(
    document.type!=="EXCHANGE"
  ){
    return touchedIds;
  }

  const quantities=
    new Map();

  for(
    const line of
    document.replacementItems
  ){
    const key=String(
      line.jewelryItem
    );

    quantities.set(
      key,
      (
        quantities.get(key)||0
      )+
      Number(line.quantity)
    );
  }

  for(
    const [
      itemId,
      amount
    ] of quantities
  ){
    const item=
      await JewelryItem.findById(
        itemId
      ).session(session);

    if(!item){
      throw serviceError(
        "Replacement inventory item no longer exists",
        404
      );
    }

    if(
      item.status!==
      "AVAILABLE"
    ){
      throw serviceError(
        `${item.name} is no longer available`
      );
    }

    const previousQuantity=
      Number(item.quantity);

    if(
      previousQuantity<
      amount
    ){
      throw serviceError(
        `Not enough stock for ${item.name}. Required: ${amount}, Available: ${previousQuantity}`
      );
    }

    const newQuantity=
      previousQuantity-
      amount;

    item.quantity=
      newQuantity;

    item.status=
      newQuantity===0
        ?"SOLD"
        :"AVAILABLE";

    await item.save({
      session,
      validateBeforeSave:true
    });

    await createStockAudit({
      item,
      direction:"DECREASE",
      amount,
      previousQuantity,
      newQuantity,
      reason:"OTHER",
      notes:
        `Replacement item issued for ${document.returnExchangeNo}`,
      adjustedBy:
        completedBy,
      requestIp,
      userAgent,
      session
    });

    touchedIds.add(
      String(item._id)
    );
  }

  return touchedIds;
}

function updateSaleDueStatus(
  sale
){
  const due=
    roundMoney(
      sale.dueAmount||0
    );

  sale.dueAmount=
    Math.max(0,due);

  if(
    sale.dueAmount<=0
  ){
    sale.status=
      "FULLY_PAID";

    return;
  }

  sale.status=
    Number(
      sale.paidAmount||0
    )>0
      ?"PARTIALLY_PAID"
      :"CONFIRMED";
}

async function completeReturnExchange(
  id,
  {
    completedBy,
    refundMethod="NONE",
    refundReference="",
    requestIp="",
    userAgent="",
    session
  }
){
  const document=
    await ReturnExchange.findById(
      id
    ).session(session);

  if(!document){
    throw serviceError(
      "Return or exchange transaction not found",
      404
    );
  }

  if(
    document.status!=="APPROVED"
  ){
    throw serviceError(
      "Only approved transactions can be completed"
    );
  }

  const user=text(
    completedBy
  );

  if(!user){
    throw serviceError(
      "Completed by is required"
    );
  }

  const sale=
    await validateCurrentReturnability(
      document,
      session
    );

  const settlement=
    calculateSettlement(
      document.adjustmentAmount,
      sale.dueAmount
    );

  const normalizedRefundMethod=
    normalizeEnum(
      refundMethod||"NONE"
    );

  const allowedRefundMethods=[
    "NONE",
    "CASH",
    "CARD",
    "BANK",
    "MOBILE_BANKING"
  ];

  if(
    !allowedRefundMethods.includes(
      normalizedRefundMethod
    )
  ){
    throw serviceError(
      "Invalid refund method"
    );
  }

  if(
    settlement.refundAmount>0&&
    normalizedRefundMethod==="NONE"
  ){
    throw serviceError(
      "Refund method is required when a refund is due"
    );
  }

  const returnedTouched=
    await restoreReturnedInventory(
      document,
      {
        completedBy:user,
        requestIp,
        userAgent,
        session
      }
    );

  const replacementTouched=
    await issueReplacementInventory(
      document,
      {
        completedBy:user,
        requestIp,
        userAgent,
        session
      }
    );

  let ledgerEntry=null;

  if(
    settlement.ledgerCreditAmount>0||
    settlement.ledgerDebitAmount>0
  ){
    ledgerEntry=
      await createLedgerEntry({
        customer:
          document.customer,

        sale:
          document.sale,

        entryDate:
          new Date(),

        transactionType:
          document.type===
          "RETURN"
            ?"RETURN_ADJUSTMENT"
            :"EXCHANGE_ADJUSTMENT",

        debitAmount:
          settlement
            .ledgerDebitAmount,

        creditAmount:
          settlement
            .ledgerCreditAmount,

        eventKey:
          `RETURN_EXCHANGE:${document._id}:LEDGER`,

        sourceDocument:{
          documentType:
            "RETURN_EXCHANGE",

          documentId:
            document._id
        },

        createdBy:user,

        notes:
          `${
            document.type==="RETURN"
              ?"Return"
              :"Exchange"
          } adjustment for ${
            document.returnExchangeNo
          }`,

        approvedBy:
          document.approvedBy,

        approvedAt:
          document.approvedAt
      },{
        session
      }
    );
  }

  sale.dueAmount=
    roundMoney(
      Number(
        sale.dueAmount||0
      )+
      settlement
        .ledgerDebitAmount-
      settlement
        .ledgerCreditAmount
    );

  updateSaleDueStatus(
    sale
  );

  await sale.save({
    session,
    validateBeforeSave:true
  });

  document.ledgerCreditAmount=
    settlement
      .ledgerCreditAmount;

  document.ledgerDebitAmount=
    settlement
      .ledgerDebitAmount;

  document.refundAmount=
    settlement.refundAmount;

  document.additionalDueAmount=
    settlement
      .additionalDueAmount;

  document.refundMethod=
    settlement.refundAmount>0
      ?normalizedRefundMethod
      :"NONE";

  document.refundReference=
    settlement.refundAmount>0
      ?text(refundReference)
      :"";

  document.status=
    "COMPLETED";

  document.completedBy=user;
  document.completedAt=new Date();

  await document.save({
    session,
    validateBeforeSave:true
  });

  return{
    document,
    ledgerEntry,
    touchedItemIds:[
      ...new Set([
        ...returnedTouched,
        ...replacementTouched
      ])
    ]
  };
}

module.exports={
  serviceError,
  getSaleEligibility,
  createReturnExchange,
  updateReturnExchange,
  submitReturnExchange,
  approveReturnExchange,
  rejectReturnExchange,
  cancelReturnExchange,
  completeReturnExchange
};