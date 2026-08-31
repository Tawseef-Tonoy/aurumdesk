const mongoose=require("mongoose");

const Customer=require("../models/customer.model");
const LedgerEntry=require("../models/ledgerEntry.model");
const {
  roundMoney,
  serviceError
}=require("./ledger.service");

function customerObjectId(customerId){
  if(!mongoose.Types.ObjectId.isValid(customerId)){
    throw serviceError("Invalid customer ID");
  }

  return new mongoose.Types.ObjectId(customerId);
}

async function requireCustomer(customerId){
  const customer=await Customer.findById(customerId);

  if(!customer){
    throw serviceError("Customer not found",404);
  }

  return customer;
}

function parseDate(value,label,endOfDay=false){
  if(!value) return null;

  const date=new Date(value);

  if(Number.isNaN(date.getTime())){
    throw serviceError(`Invalid ${label}`);
  }

  if(endOfDay){
    date.setUTCHours(23,59,59,999);
  }

  return date;
}

async function getCustomerBalance(customerId){
  const id=customerObjectId(customerId);

  await requireCustomer(customerId);

  const [result]=await LedgerEntry.aggregate([
    {$match:{customer:id}},
    {
      $group:{
        _id:null,
        totalDebit:{$sum:"$debitAmount"},
        totalCredit:{$sum:"$creditAmount"},
        entryCount:{$sum:1}
      }
    },
    {
      $project:{
        _id:0,
        totalDebit:{$round:["$totalDebit",2]},
        totalCredit:{$round:["$totalCredit",2]},
        balance:{
          $round:[
            {$subtract:["$totalDebit","$totalCredit"]},
            2
          ]
        },
        entryCount:1
      }
    }
  ]);

  return result||{
    totalDebit:0,
    totalCredit:0,
    balance:0,
    entryCount:0
  };
}

async function getCustomerStatement(
  customerId,
  options={}
){
  const id=customerObjectId(customerId);
  const customer=await requireCustomer(customerId);
  const page=Math.max(
    1,
    parseInt(options.page,10)||1
  );
  const limit=Math.min(
    100,
    Math.max(
      1,
      parseInt(options.limit,10)||50
    )
  );

  const from=parseDate(
    options.from,
    "start date"
  );

  const to=parseDate(
    options.to,
    "end date",
    true
  );

  const filter={};

  if(from||to){
    filter.entryDate={};

    if(from){
      filter.entryDate.$gte=from;
    }

    if(to){
      filter.entryDate.$lte=to;
    }
  }

  if(options.transactionType){
    filter.transactionType=String(
      options.transactionType
    ).trim().toUpperCase();
  }

  const pipeline=[
    {$match:{customer:id}},
    {
      $set:{
        netAmount:{
          $subtract:[
            "$debitAmount",
            "$creditAmount"
          ]
        }
      }
    },
    {
      $setWindowFields:{
        partitionBy:"$customer",
        sortBy:{
          entryDate:1,
          _id:1
        },
        output:{
          runningBalance:{
            $sum:"$netAmount",
            window:{
              documents:[
                "unbounded",
                "current"
              ]
            }
          }
        }
      }
    }
  ];

  if(Object.keys(filter).length){
    pipeline.push({
      $match:filter
    });
  }

  pipeline.push(
    {
      $sort:{
        entryDate:1,
        _id:1
      }
    },
    {
      $facet:{
        metadata:[
          {$count:"total"}
        ],
        entries:[
          {
            $skip:
              (page-1)*limit
          },
          {
            $limit:limit
          },
          {
            $set:{
              runningBalance:{
                $round:[
                  "$runningBalance",
                  2
                ]
              }
            }
          }
        ]
      }
    }
  );

  const [result]=
    await LedgerEntry.aggregate(
      pipeline
    );

  const entries=
    await LedgerEntry.populate(
      result?.entries||[],
      {
        path:"sale",
        select:
          "invoiceNumber status totalAmount paidAmount dueAmount"
      }
    );

  const total=
    result?.metadata?.[0]?.total||0;

  const balance=
    await getCustomerBalance(
      customerId
    );

  return {
    customer,
    balance,
    entries,
    pagination:{
      page,
      limit,
      total,
      pages:Math.ceil(
        total/limit
      )
    }
  };
}

async function getInvoiceOutstanding(
  customerId
){
  const id=customerObjectId(
    customerId
  );

  await requireCustomer(customerId);

  return LedgerEntry.aggregate([
    {
      $match:{
        customer:id
      }
    },
    {
      $group:{
        _id:"$sale",
        firstEntryDate:{
          $min:"$entryDate"
        },
        dueDate:{
          $min:{
            $ifNull:[
              "$dueDate",
              "$entryDate"
            ]
          }
        },
        totalDebit:{
          $sum:"$debitAmount"
        },
        totalCredit:{
          $sum:"$creditAmount"
        }
      }
    },
    {
      $set:{
        outstanding:{
          $round:[
            {
              $subtract:[
                "$totalDebit",
                "$totalCredit"
              ]
            },
            2
          ]
        }
      }
    },
    {
      $match:{
        outstanding:{
          $gt:0
        }
      }
    },
    {
      $lookup:{
        from:"sales",
        localField:"_id",
        foreignField:"_id",
        as:"sale"
      }
    },
    {
      $unwind:"$sale"
    },
    {
      $project:{
        _id:0,
        saleId:"$_id",
        invoiceNumber:
          "$sale.invoiceNumber",
        saleStatus:
          "$sale.status",
        saleDate:
          "$sale.createdAt",
        firstEntryDate:1,
        dueDate:1,
        totalDebit:{
          $round:[
            "$totalDebit",
            2
          ]
        },
        totalCredit:{
          $round:[
            "$totalCredit",
            2
          ]
        },
        outstanding:1
      }
    },
    {
      $sort:{
        dueDate:1,
        firstEntryDate:1
      }
    }
  ]);
}

async function getDateWiseOutstanding(
  customerId
){
  const id=customerObjectId(
    customerId
  );

  await requireCustomer(customerId);

  return LedgerEntry.aggregate([
    {
      $match:{
        customer:id
      }
    },
    {
      $group:{
        _id:{
          $dateToString:{
            format:"%Y-%m-%d",
            date:"$entryDate",
            timezone:"UTC"
          }
        },
        debit:{
          $sum:"$debitAmount"
        },
        credit:{
          $sum:"$creditAmount"
        }
      }
    },
    {
      $set:{
        dailyChange:{
          $subtract:[
            "$debit",
            "$credit"
          ]
        }
      }
    },
    {
      $setWindowFields:{
        sortBy:{
          _id:1
        },
        output:{
          outstanding:{
            $sum:"$dailyChange",
            window:{
              documents:[
                "unbounded",
                "current"
              ]
            }
          }
        }
      }
    },
    {
      $project:{
        _id:0,
        date:"$_id",
        debit:{
          $round:[
            "$debit",
            2
          ]
        },
        credit:{
          $round:[
            "$credit",
            2
          ]
        },
        outstanding:{
          $round:[
            "$outstanding",
            2
          ]
        }
      }
    },
    {
      $sort:{
        date:1
      }
    }
  ]);
}

async function getDueAging(
  customerId,
  asOf=new Date()
){
  const agingDate=parseDate(
    asOf,
    "aging date"
  );

  const invoices=
    await getInvoiceOutstanding(
      customerId
    );

  const buckets={
    current:0,
    days1To30:0,
    days31To60:0,
    days61To90:0,
    over90Days:0
  };

  const items=invoices.map(
    invoice=>{
      const dueDate=new Date(
        invoice.dueDate||
        invoice.firstEntryDate||
        invoice.saleDate
      );

      const overdueDays=Math.max(
        0,
        Math.floor(
          (
            agingDate.getTime()-
            dueDate.getTime()
          )/86400000
        )
      );

      let bucket="current";

      if(
        overdueDays>=1&&
        overdueDays<=30
      ){
        bucket="days1To30";
      }else if(
        overdueDays>30&&
        overdueDays<=60
      ){
        bucket="days31To60";
      }else if(
        overdueDays>60&&
        overdueDays<=90
      ){
        bucket="days61To90";
      }else if(
        overdueDays>90
      ){
        bucket="over90Days";
      }

      buckets[bucket]=roundMoney(
        buckets[bucket]+
        invoice.outstanding
      );

      return {
        ...invoice,
        overdueDays,
        bucket
      };
    }
  );

  return {
    asOf:agingDate,
    totalOutstanding:roundMoney(
      Object.values(buckets).reduce(
        (sum,value)=>sum+value,
        0
      )
    ),
    buckets,
    items
  };
}

async function getCustomerDueSummary(){
  return LedgerEntry.aggregate([
    {
      $group:{
        _id:"$customer",
        totalDebit:{
          $sum:"$debitAmount"
        },
        totalCredit:{
          $sum:"$creditAmount"
        },
        lastEntryDate:{
          $max:"$entryDate"
        }
      }
    },
    {
      $set:{
        balance:{
          $round:[
            {
              $subtract:[
                "$totalDebit",
                "$totalCredit"
              ]
            },
            2
          ]
        }
      }
    },
    {
      $lookup:{
        from:"customers",
        localField:"_id",
        foreignField:"_id",
        as:"customer"
      }
    },
    {
      $unwind:"$customer"
    },
    {
      $project:{
        _id:0,
        customerId:"$_id",
        customerCode:
          "$customer.customerId",
        customerName:
          "$customer.name",
        phone:
          "$customer.phone",
        status:
          "$customer.status",
        totalDebit:{
          $round:[
            "$totalDebit",
            2
          ]
        },
        totalCredit:{
          $round:[
            "$totalCredit",
            2
          ]
        },
        balance:1,
        lastEntryDate:1
      }
    },
    {
      $sort:{
        balance:-1,
        customerName:1
      }
    }
  ]);
}

module.exports={
  getCustomerBalance,
  getCustomerStatement,
  getInvoiceOutstanding,
  getDateWiseOutstanding,
  getDueAging,
  getCustomerDueSummary
};