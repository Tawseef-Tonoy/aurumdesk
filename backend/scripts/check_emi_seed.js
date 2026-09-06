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

const PREFIX =
  "SEED-EMI";

async function main() {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGO_URI is missing"
    );
  }

  await mongoose.connect(uri);

  try {
    const customers =
      await Customer.find({
        customerId: {
          $regex:
            `^${PREFIX}-CUS-`,
        },
      });

    const sales =
      await Sale.find({
        invoiceNumber: {
          $regex:
            `^${PREFIX}-INV-`,
        },
      });

    const plans =
      await EMIPlan.find({
        planNo: {
          $regex:
            `^${PREFIX}-PLAN-`,
        },
      });

    const planIds =
      plans.map(
        (plan) =>
          plan._id
      );

    const installments =
      await EMIInstallment.find({
        emiPlan: {
          $in:
            planIds,
        },
      });

    const payments =
      await EMIInstallmentPayment.find({
        paymentNo: {
          $regex:
            `^${PREFIX}-PAY-`,
        },
      });

    const statusCounts = {};

    for (
      const installment
      of installments
    ) {
      statusCounts[
        installment.status
      ] =
        (
          statusCounts[
            installment.status
          ] || 0
        ) + 1;
    }

    const planStatuses = {};

    for (const plan of plans) {
      planStatuses[
        plan.status
      ] =
        (
          planStatuses[
            plan.status
          ] || 0
        ) + 1;
    }

    const incomes =
      customers.map(
        (customer) =>
          Number(
            customer.monthlyIncome ||
              0
          )
      );

    console.log("\n");
    console.log(
      "=".repeat(70)
    );

    console.log(
      "EMI SEED DATABASE CHECK"
    );

    console.log(
      "=".repeat(70)
    );

    console.log(
      `Customers:    ${customers.length}`
    );

    console.log(
      `Sales:        ${sales.length}`
    );

    console.log(
      `Plans:        ${plans.length}`
    );

    console.log(
      `Installments: ${installments.length}`
    );

    console.log(
      `Payments:     ${payments.length}`
    );

    console.log(
      "\nPlan statuses:"
    );

    console.table(
      planStatuses
    );

    console.log(
      "Installment statuses:"
    );

    console.table(
      statusCounts
    );

    if (
      incomes.length > 0
    ) {
      console.log(
        `Income range: ${Math.min(
          ...incomes
        )} - ${Math.max(
          ...incomes
        )}`
      );
    }

    const overdue =
      installments.filter(
        (item) =>
          item.status ===
          "OVERDUE"
      );

    if (overdue.length > 0) {
      const overdueDays =
        overdue.map(
          (item) =>
            Number(
              item.overdueDays ||
                0
            )
        );

      console.log(
        `Overdue-day range: ${Math.min(
          ...overdueDays
        )} - ${Math.max(
          ...overdueDays
        )}`
      );
    }

    console.log(
      "\n✅ Check complete."
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
