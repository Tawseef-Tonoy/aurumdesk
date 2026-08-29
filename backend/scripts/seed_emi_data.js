require("dotenv").config();

const mongoose = require("mongoose");

const Customer = require(
  "../src/models/customer.model"
);

const Sale = require(
  "../src/models/sale.model"
);

const EMIPlan = require(
  "../src/models/emiPlan.model"
);

const EMIInstallment = require(
  "../src/models/emiInstallment.model"
);

const EMIInstallmentPayment = require(
  "../src/models/emiInstallmentPayment.model"
);

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
*/

const CUSTOMER_COUNT_PER_GROUP = 15;

const INSTALLMENT_COUNT = 6;

const PREFIX = "SEED-EMI";

const GENERATED_BY = "SEED_SCRIPT";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}

function startOfDay(value) {
  const date = new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function addDays(dateValue, days) {
  const date = new Date(dateValue);

  date.setDate(
    date.getDate() + days
  );

  return date;
}

function addMonths(dateValue, months) {
  const original =
    new Date(dateValue);

  const originalDay =
    original.getDate();

  const result =
    new Date(original);

  result.setDate(1);

  result.setMonth(
    result.getMonth() + months
  );

  const lastDay =
    new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0
    ).getDate();

  result.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );

  return result;
}

function daysBetween(later, earlier) {
  const oneDay =
    1000 * 60 * 60 * 24;

  return Math.max(
    0,
    Math.floor(
      (
        startOfDay(later) -
        startOfDay(earlier)
      ) / oneDay
    )
  );
}

function formatNumber(number, length = 3) {
  return String(number).padStart(
    length,
    "0"
  );
}

function installmentAmounts(
  payable,
  count
) {
  const regular =
    Math.floor(
      (payable / count) * 100
    ) / 100;

  const amounts = [];

  let allocated = 0;

  for (
    let i = 0;
    i < count;
    i += 1
  ) {
    if (i === count - 1) {
      amounts.push(
        roundMoney(
          payable - allocated
        )
      );
    } else {
      amounts.push(
        roundMoney(regular)
      );

      allocated =
        roundMoney(
          allocated + regular
        );
    }
  }

  return amounts;
}

function randomLike(index, min, max) {
  /*
    Deterministic pseudo-random-looking
    number.

    Same index -> same result.
  */
  const fraction =
    (
      (
        index * 9301 +
        49297
      ) %
      233280
    ) / 233280;

  return Math.round(
    min +
      fraction * (max - min)
  );
}

/*
|--------------------------------------------------------------------------
| DATABASE
|--------------------------------------------------------------------------
*/

async function connectDatabase() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGO_URI is missing from backend/.env"
    );
  }

  await mongoose.connect(uri);

  console.log(
    "✅ Connected to MongoDB"
  );
}

/*
|--------------------------------------------------------------------------
| SAFETY CHECK
|--------------------------------------------------------------------------
*/

async function ensureSeedDoesNotExist() {
  const existing =
    await Customer.countDocuments({
      customerId: {
        $regex: `^${PREFIX}-CUS-`,
      },
    });

  if (existing > 0) {
    throw new Error(
      [
        "",
        "Seed data already exists.",
        "",
        `Found ${existing} seeded customers.`,
        "",
        "Run:",
        "npm run seed:emi:clean",
        "",
        "Then run the seed again.",
      ].join("\n")
    );
  }
}

/*
|--------------------------------------------------------------------------
| CUSTOMER
|--------------------------------------------------------------------------
*/

async function createCustomer(
  riskGroup,
  groupIndex,
  globalIndex
) {
  let monthlyIncome;

  if (riskGroup === "LOW") {
    monthlyIncome =
      randomLike(
        globalIndex,
        100000,
        180000
      );
  } else if (
    riskGroup === "MEDIUM"
  ) {
    monthlyIncome =
      randomLike(
        globalIndex,
        55000,
        95000
      );
  } else {
    monthlyIncome =
      randomLike(
        globalIndex,
        25000,
        50000
      );
  }

  const customerNumber =
    formatNumber(globalIndex);

  return Customer.create({
    customerId:
      `${PREFIX}-CUS-${customerNumber}`,

    name:
      `${riskGroup} Risk Seed Customer ${formatNumber(
        groupIndex,
        2
      )}`,

    phone:
      `019${String(
        10000000 + globalIndex
      ).slice(-8)}`,

    alternativePhone: "",

    email:
      `seed.emi.${customerNumber}@example.com`,

    address:
      riskGroup === "LOW"
        ? "Dhaka"
        : riskGroup === "MEDIUM"
          ? "Rajshahi"
          : "Chattogram",

    nid:
      `SEED${String(
        1000000000 + globalIndex
      )}`,

    occupation:
      riskGroup === "LOW"
        ? "Business Owner"
        : riskGroup === "MEDIUM"
          ? "Private Employee"
          : "Junior Employee",

    monthlyIncome,

    status: "ACTIVE",
  });
}

/*
|--------------------------------------------------------------------------
| SALE
|--------------------------------------------------------------------------
*/

async function createSale({
  customer,
  riskGroup,
  globalIndex,
  planSequence,
}) {
  let totalAmount;
  let downPaymentRate;

  if (riskGroup === "LOW") {
    totalAmount =
      randomLike(
        globalIndex +
          planSequence * 50,
        80000,
        180000
      );

    downPaymentRate =
      0.4;
  } else if (
    riskGroup === "MEDIUM"
  ) {
    totalAmount =
      randomLike(
        globalIndex +
          planSequence * 50,
        100000,
        220000
      );

    downPaymentRate =
      0.2;
  } else {
    totalAmount =
      randomLike(
        globalIndex +
          planSequence * 50,
        140000,
        280000
      );

    downPaymentRate =
      0.05;
  }

  const paidAmount =
    roundMoney(
      totalAmount *
        downPaymentRate
    );

  const dueAmount =
    roundMoney(
      totalAmount -
        paidAmount
    );

  const invoiceNumber =
    `${PREFIX}-INV-${formatNumber(
      globalIndex
    )}-${planSequence}`;

  const sale =
    await Sale.create({
      invoiceNumber,

      customer:
        customer._id,

      salesPerson:
        GENERATED_BY,

      /*
        Seed sales do not need real
        inventory movements.

        Your current Sales data already
        permits an empty items array.
      */
      items: [],

      goldRateSnapshot:
        14000,

      subtotal:
        totalAmount,

      discount: 0,

      vat: 0,

      totalAmount,

      paidAmount,

      dueAmount,

      paymentMethod:
        "CASH",

      warrantyTerms:
        "Synthetic EMI seed record",

      returnExchangeTerms:
        "Synthetic EMI seed record",

      status:
        "CONFIRMED",
    });

  return {
    sale,
    downPaymentRate,
  };
}

/*
|--------------------------------------------------------------------------
| PLAN
|--------------------------------------------------------------------------
*/

async function createPlan({
  customer,
  sale,
  riskGroup,
  globalIndex,
  planSequence,
}) {
  const serviceRate =
    riskGroup === "LOW"
      ? 0.03
      : riskGroup === "MEDIUM"
        ? 0.05
        : 0.08;

  const totalSaleAmount =
    Number(
      sale.totalAmount
    );

  const downPayment =
    Number(
      sale.paidAmount
    );

  const financedAmount =
    roundMoney(
      totalSaleAmount -
        downPayment
    );

  const serviceCharge =
    roundMoney(
      financedAmount *
        serviceRate
    );

  const emiPayable =
    roundMoney(
      financedAmount +
        serviceCharge
    );

  const amounts =
    installmentAmounts(
      emiPayable,
      INSTALLMENT_COUNT
    );

  const installmentAmount =
    amounts[0];

  /*
    Plan 1 = historical plan
    Plan 2 = newer/current plan
  */

  let firstDueDate;

  if (planSequence === 1) {
    firstDueDate =
      addMonths(
        new Date(),
        -8
      );
  } else {
    firstDueDate =
      addMonths(
        new Date(),
        -2
      );
  }

  const plan =
    await EMIPlan.create({
      planNo:
        `${PREFIX}-PLAN-${formatNumber(
          globalIndex
        )}-${planSequence}`,

      customer:
        customer._id,

      sale:
        sale._id,

      totalSaleAmount,

      downPayment,

      financedAmount,

      serviceCharge,

      emiPayable,

      installmentCount:
        INSTALLMENT_COUNT,

      frequency:
        "MONTHLY",

      firstDueDate,

      gracePeriodDays:
        riskGroup === "LOW"
          ? 5
          : riskGroup === "MEDIUM"
            ? 3
            : 0,

      installmentAmount,

      remainingBalance:
        emiPayable,

      referenceName:
        `${riskGroup} Seed Reference`,

      referencePhone:
        "01700000000",

      guarantorName:
        riskGroup === "HIGH"
          ? ""
          : `${riskGroup} Seed Guarantor`,

      guarantorPhone:
        riskGroup === "HIGH"
          ? ""
          : "01800000000",

      notes:
        `Synthetic ${riskGroup} risk EMI profile generated by ${GENERATED_BY}`,

      status:
        "APPROVED",

      preparedBy:
        GENERATED_BY,

      approvedBy:
        GENERATED_BY,

      approvedAt:
        addDays(
          firstDueDate,
          -10
        ),
    });

  return plan;
}

/*
|--------------------------------------------------------------------------
| PAYMENT RECORD
|--------------------------------------------------------------------------
*/

async function addPayment({
  plan,
  installment,
  customer,
  amount,
  paymentDate,
  paymentIndex,
}) {
  return EMIInstallmentPayment.create({
    paymentNo:
      `${PREFIX}-PAY-${plan.planNo.replace(
        `${PREFIX}-PLAN-`,
        ""
      )}-${installment.installmentNo}-${paymentIndex}`,

    emiPlan:
      plan._id,

    installment:
      installment._id,

    customer:
      customer._id,

    amount:
      roundMoney(amount),

    paymentDate,

    method:
      paymentIndex % 2 === 0
        ? "MOBILE_BANKING"
        : "CASH",

    receiptReference:
      `${PREFIX}-RECEIPT-${plan._id}-${installment.installmentNo}-${paymentIndex}`,

    receivedBy:
      GENERATED_BY,

    notes:
      "Synthetic payment history",
  });
}

/*
|--------------------------------------------------------------------------
| LOW RISK PLAN
|--------------------------------------------------------------------------
*/

async function seedLowRiskPlan({
  customer,
  plan,
  planSequence,
}) {
  const amounts =
    installmentAmounts(
      plan.emiPayable,
      INSTALLMENT_COUNT
    );

  let remainingPlanBalance =
    0;

  for (
    let i = 0;
    i < INSTALLMENT_COUNT;
    i += 1
  ) {
    const installmentNo =
      i + 1;

    const dueDate =
      addMonths(
        plan.firstDueDate,
        i
      );

    /*
      Historical plan:
      all 6 installments paid.

      Current plan:
      first 3 paid,
      final 3 upcoming.
    */
    const shouldBePaid =
      planSequence === 1 ||
      installmentNo <= 3;

    const amount =
      amounts[i];

    const installment =
      await EMIInstallment.create({
        emiPlan:
          plan._id,

        installmentNo,

        dueDate,

        scheduledAmount:
          amount,

        paidAmount:
          shouldBePaid
            ? amount
            : 0,

        remainingAmount:
          shouldBePaid
            ? 0
            : amount,

        gracePeriodDays:
          plan.gracePeriodDays,

        status:
          shouldBePaid
            ? "PAID"
            : "UPCOMING",

        overdueDays: 0,

        lastPaymentDate:
          shouldBePaid
            ? addDays(
                dueDate,
                installmentNo %
                  2 ===
                  0
                  ? -2
                  : 0
              )
            : null,

        lastPaymentMethod:
          shouldBePaid
            ? "CASH"
            : "",

        lastReceiptReference:
          "",
      });

    if (shouldBePaid) {
      await addPayment({
        plan,
        installment,
        customer,

        amount,

        paymentDate:
          installment
            .lastPaymentDate,

        paymentIndex: 1,
      });
    } else {
      remainingPlanBalance =
        roundMoney(
          remainingPlanBalance +
            amount
        );
    }
  }

  plan.remainingBalance =
    remainingPlanBalance;

  if (
    remainingPlanBalance ===
    0
  ) {
    plan.status =
      "COMPLETED";
  }

  await plan.save();
}

/*
|--------------------------------------------------------------------------
| MEDIUM RISK PLAN
|--------------------------------------------------------------------------
*/

async function seedMediumRiskPlan({
  customer,
  plan,
  planSequence,
}) {
  const amounts =
    installmentAmounts(
      plan.emiPayable,
      INSTALLMENT_COUNT
    );

  let remainingPlanBalance =
    0;

  for (
    let i = 0;
    i < INSTALLMENT_COUNT;
    i += 1
  ) {
    const installmentNo =
      i + 1;

    const dueDate =
      addMonths(
        plan.firstDueDate,
        i
      );

    const amount =
      amounts[i];

    /*
      Historical plan:
      all paid, but several were late.

      Current plan:
      #1 and #2 paid
      #3 partial + overdue
      #4-#6 upcoming
    */

    if (planSequence === 1) {
      const lateDays =
        installmentNo === 2
          ? 4
          : installmentNo === 4
            ? 8
            : installmentNo === 5
              ? 3
              : 0;

      const paymentDate =
        addDays(
          dueDate,
          lateDays
        );

      const installment =
        await EMIInstallment.create({
          emiPlan:
            plan._id,

          installmentNo,

          dueDate,

          scheduledAmount:
            amount,

          paidAmount:
            amount,

          remainingAmount:
            0,

          gracePeriodDays:
            plan.gracePeriodDays,

          status:
            "PAID",

          overdueDays: 0,

          lastPaymentDate:
            paymentDate,

          lastPaymentMethod:
            "MOBILE_BANKING",
        });

      await addPayment({
        plan,
        installment,
        customer,
        amount,
        paymentDate,
        paymentIndex: 1,
      });
    } else {
      if (
        installmentNo <= 2
      ) {
        const lateDays =
          installmentNo === 2
            ? 4
            : 0;

        const paymentDate =
          addDays(
            dueDate,
            lateDays
          );

        const installment =
          await EMIInstallment.create({
            emiPlan:
              plan._id,

            installmentNo,

            dueDate,

            scheduledAmount:
              amount,

            paidAmount:
              amount,

            remainingAmount:
              0,

            gracePeriodDays:
              plan.gracePeriodDays,

            status:
              "PAID",

            overdueDays: 0,

            lastPaymentDate:
              paymentDate,

            lastPaymentMethod:
              "CASH",
          });

        await addPayment({
          plan,
          installment,
          customer,
          amount,
          paymentDate,
          paymentIndex: 1,
        });
      } else if (
        installmentNo === 3
      ) {
        const partial =
          roundMoney(
            amount * 0.4
          );

        const remaining =
          roundMoney(
            amount - partial
          );

        const overdueDays =
          daysBetween(
            new Date(),
            addDays(
              dueDate,
              plan.gracePeriodDays
            )
          );

        const installment =
          await EMIInstallment.create({
            emiPlan:
              plan._id,

            installmentNo,

            dueDate,

            scheduledAmount:
              amount,

            paidAmount:
              partial,

            remainingAmount:
              remaining,

            gracePeriodDays:
              plan.gracePeriodDays,

            status:
              overdueDays > 0
                ? "OVERDUE"
                : "PARTIALLY_PAID",

            overdueDays,

            lastPaymentDate:
              addDays(
                dueDate,
                2
              ),

            lastPaymentMethod:
              "CASH",
          });

        await addPayment({
          plan,
          installment,
          customer,

          amount:
            partial,

          paymentDate:
            installment
              .lastPaymentDate,

          paymentIndex: 1,
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              remaining
          );
      } else {
        await EMIInstallment.create({
          emiPlan:
            plan._id,

          installmentNo,

          dueDate,

          scheduledAmount:
            amount,

          paidAmount: 0,

          remainingAmount:
            amount,

          gracePeriodDays:
            plan.gracePeriodDays,

          status:
            dueDate <
            new Date()
              ? "OVERDUE"
              : "UPCOMING",

          overdueDays:
            dueDate <
            new Date()
              ? daysBetween(
                  new Date(),
                  addDays(
                    dueDate,
                    plan.gracePeriodDays
                  )
                )
              : 0,
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              amount
          );
      }
    }
  }

  plan.remainingBalance =
    remainingPlanBalance;

  if (
    planSequence === 1
  ) {
    plan.remainingBalance =
      0;

    plan.status =
      "COMPLETED";
  }

  await plan.save();
}

/*
|--------------------------------------------------------------------------
| HIGH RISK PLAN
|--------------------------------------------------------------------------
*/

async function seedHighRiskPlan({
  customer,
  plan,
  planSequence,
}) {
  const amounts =
    installmentAmounts(
      plan.emiPayable,
      INSTALLMENT_COUNT
    );

  let remainingPlanBalance =
    0;

  for (
    let i = 0;
    i < INSTALLMENT_COUNT;
    i += 1
  ) {
    const installmentNo =
      i + 1;

    const dueDate =
      addMonths(
        plan.firstDueDate,
        i
      );

    const amount =
      amounts[i];

    /*
      Historical high-risk plan:
      installments #1-#3 paid late
      #4-#6 still overdue.

      Current high-risk plan:
      #1 partial
      #2/#3 overdue unpaid
      #4-#6 upcoming.
    */

    if (planSequence === 1) {
      if (
        installmentNo <= 3
      ) {
        const lateDays =
          12 +
          installmentNo * 5;

        const paymentDate =
          addDays(
            dueDate,
            lateDays
          );

        const installment =
          await EMIInstallment.create({
            emiPlan:
              plan._id,

            installmentNo,

            dueDate,

            scheduledAmount:
              amount,

            paidAmount:
              amount,

            remainingAmount:
              0,

            gracePeriodDays:
              0,

            status:
              "PAID",

            overdueDays: 0,

            lastPaymentDate:
              paymentDate,

            lastPaymentMethod:
              "CASH",
          });

        await addPayment({
          plan,
          installment,
          customer,
          amount,
          paymentDate,
          paymentIndex: 1,
        });
      } else {
        const overdueDays =
          daysBetween(
            new Date(),
            dueDate
          );

        await EMIInstallment.create({
          emiPlan:
            plan._id,

          installmentNo,

          dueDate,

          scheduledAmount:
            amount,

          paidAmount: 0,

          remainingAmount:
            amount,

          gracePeriodDays: 0,

          status:
            "OVERDUE",

          overdueDays,
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              amount
          );
      }
    } else {
      if (
        installmentNo === 1
      ) {
        const partial =
          roundMoney(
            amount * 0.2
          );

        const remaining =
          roundMoney(
            amount - partial
          );

        const installment =
          await EMIInstallment.create({
            emiPlan:
              plan._id,

            installmentNo,

            dueDate,

            scheduledAmount:
              amount,

            paidAmount:
              partial,

            remainingAmount:
              remaining,

            gracePeriodDays: 0,

            status:
              "OVERDUE",

            overdueDays:
              daysBetween(
                new Date(),
                dueDate
              ),

            lastPaymentDate:
              addDays(
                dueDate,
                10
              ),

            lastPaymentMethod:
              "CASH",
          });

        await addPayment({
          plan,
          installment,
          customer,

          amount:
            partial,

          paymentDate:
            installment
              .lastPaymentDate,

          paymentIndex: 1,
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              remaining
          );
      } else if (
        installmentNo <= 3
      ) {
        await EMIInstallment.create({
          emiPlan:
            plan._id,

          installmentNo,

          dueDate,

          scheduledAmount:
            amount,

          paidAmount: 0,

          remainingAmount:
            amount,

          gracePeriodDays: 0,

          status:
            "OVERDUE",

          overdueDays:
            daysBetween(
              new Date(),
              dueDate
            ),
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              amount
          );
      } else {
        const isPast =
          dueDate <
          new Date();

        await EMIInstallment.create({
          emiPlan:
            plan._id,

          installmentNo,

          dueDate,

          scheduledAmount:
            amount,

          paidAmount: 0,

          remainingAmount:
            amount,

          gracePeriodDays: 0,

          status:
            isPast
              ? "OVERDUE"
              : "UPCOMING",

          overdueDays:
            isPast
              ? daysBetween(
                  new Date(),
                  dueDate
                )
              : 0,
        });

        remainingPlanBalance =
          roundMoney(
            remainingPlanBalance +
              amount
          );
      }
    }
  }

  plan.remainingBalance =
    remainingPlanBalance;

  plan.status =
    "APPROVED";

  await plan.save();
}

/*
|--------------------------------------------------------------------------
| CREATE ONE CUSTOMER PROFILE
|--------------------------------------------------------------------------
*/

async function seedCustomerProfile(
  riskGroup,
  groupIndex,
  globalIndex
) {
  const customer =
    await createCustomer(
      riskGroup,
      groupIndex,
      globalIndex
    );

  for (
    let planSequence = 1;
    planSequence <= 2;
    planSequence += 1
  ) {
    const {
      sale,
    } = await createSale({
      customer,
      riskGroup,
      globalIndex,
      planSequence,
    });

    const plan =
      await createPlan({
        customer,
        sale,
        riskGroup,
        globalIndex,
        planSequence,
      });

    if (
      riskGroup === "LOW"
    ) {
      await seedLowRiskPlan({
        customer,
        plan,
        planSequence,
      });
    } else if (
      riskGroup === "MEDIUM"
    ) {
      await seedMediumRiskPlan({
        customer,
        plan,
        planSequence,
      });
    } else {
      await seedHighRiskPlan({
        customer,
        plan,
        planSequence,
      });
    }
  }

  console.log(
    `✅ ${riskGroup.padEnd(
      6
    )} customer ${formatNumber(
      groupIndex,
      2
    )}`
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

async function printSummary() {
  const seededCustomers =
    await Customer.find({
      customerId: {
        $regex: `^${PREFIX}-CUS-`,
      },
    });

  const seededSales =
    await Sale.find({
      invoiceNumber: {
        $regex: `^${PREFIX}-INV-`,
      },
    });

  const seededPlans =
    await EMIPlan.find({
      planNo: {
        $regex: `^${PREFIX}-PLAN-`,
      },
    });

  const planIds =
    seededPlans.map(
      (plan) =>
        plan._id
    );

  const installments =
    await EMIInstallment.find({
      emiPlan: {
        $in: planIds,
      },
    });

  const payments =
    await EMIInstallmentPayment.find({
      paymentNo: {
        $regex: `^${PREFIX}-PAY-`,
      },
    });

  const completedPlans =
    seededPlans.filter(
      (plan) =>
        plan.status ===
        "COMPLETED"
    ).length;

  const activePlans =
    seededPlans.filter(
      (plan) =>
        plan.status ===
        "APPROVED"
    ).length;

  const overdueInstallments =
    installments.filter(
      (installment) =>
        installment.status ===
        "OVERDUE"
    );

  const paidInstallments =
    installments.filter(
      (installment) =>
        installment.status ===
        "PAID"
    );

  const partialInstallments =
    installments.filter(
      (installment) =>
        installment.paidAmount >
          0 &&
        installment.remainingAmount >
          0
    );

  console.log("\n");
  console.log(
    "=".repeat(70)
  );

  console.log(
    "AURUMDESK EMI SEED COMPLETE"
  );

  console.log(
    "=".repeat(70)
  );

  console.log(
    `Customers:             ${seededCustomers.length}`
  );

  console.log(
    `Sales:                 ${seededSales.length}`
  );

  console.log(
    `EMI plans:             ${seededPlans.length}`
  );

  console.log(
    `Completed plans:       ${completedPlans}`
  );

  console.log(
    `Active plans:          ${activePlans}`
  );

  console.log(
    `Installments:          ${installments.length}`
  );

  console.log(
    `Paid installments:     ${paidInstallments.length}`
  );

  console.log(
    `Partial installments:  ${partialInstallments.length}`
  );

  console.log(
    `Overdue installments:  ${overdueInstallments.length}`
  );

  console.log(
    `Payment records:       ${payments.length}`
  );

  console.log(
    "\nRisk profiles:"
  );

  console.log(
    `LOW:    ${CUSTOMER_COUNT_PER_GROUP}`
  );

  console.log(
    `MEDIUM: ${CUSTOMER_COUNT_PER_GROUP}`
  );

  console.log(
    `HIGH:   ${CUSTOMER_COUNT_PER_GROUP}`
  );

  console.log(
    "\n✅ Development database is ready for Feature 17."
  );
}

/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  try {
    console.log(
      "\n🌱 Starting AurumDesk EMI seed...\n"
    );

    await connectDatabase();

    await ensureSeedDoesNotExist();

    let globalIndex = 1;

    for (
      const riskGroup of [
        "LOW",
        "MEDIUM",
        "HIGH",
      ]
    ) {
      console.log(
        `\n--- ${riskGroup} RISK GROUP ---`
      );

      for (
        let i = 1;
        i <=
        CUSTOMER_COUNT_PER_GROUP;
        i += 1
      ) {
        await seedCustomerProfile(
          riskGroup,
          i,
          globalIndex
        );

        globalIndex += 1;
      }
    }

    await printSummary();
  } catch (error) {
    console.error(
      "\n❌ EMI seed failed:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      "\n🔌 MongoDB disconnected"
    );
  }
}

main();
