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

async function main() {
  try {
    console.log(
      "\n🧹 Cleaning AurumDesk EMI seed data...\n"
    );

    await connectDatabase();

    /*
      Find seeded plans first because
      installments reference them.
    */

    const plans =
      await EMIPlan.find({
        planNo: {
          $regex:
            `^${PREFIX}-PLAN-`,
        },
      }).select("_id");

    const planIds =
      plans.map(
        (plan) =>
          plan._id
      );

    /*
      1. Payments
    */

    const paymentResult =
      await EMIInstallmentPayment.deleteMany({
        $or: [
          {
            paymentNo: {
              $regex:
                `^${PREFIX}-PAY-`,
            },
          },
          {
            emiPlan: {
              $in:
                planIds,
            },
          },
        ],
      });

    /*
      2. Installments
    */

    const installmentResult =
      await EMIInstallment.deleteMany({
        emiPlan: {
          $in:
            planIds,
        },
      });

    /*
      3. EMI plans
    */

    const planResult =
      await EMIPlan.deleteMany({
        planNo: {
          $regex:
            `^${PREFIX}-PLAN-`,
        },
      });

    /*
      4. Sales
    */

    const saleResult =
      await Sale.deleteMany({
        invoiceNumber: {
          $regex:
            `^${PREFIX}-INV-`,
        },
      });

    /*
      5. Customers
    */

    const customerResult =
      await Customer.deleteMany({
        customerId: {
          $regex:
            `^${PREFIX}-CUS-`,
        },
      });

    console.log(
      "=".repeat(60)
    );

    console.log(
      "SEED CLEANUP COMPLETE"
    );

    console.log(
      "=".repeat(60)
    );

    console.log(
      `Payments deleted:     ${paymentResult.deletedCount}`
    );

    console.log(
      `Installments deleted: ${installmentResult.deletedCount}`
    );

    console.log(
      `EMI plans deleted:    ${planResult.deletedCount}`
    );

    console.log(
      `Sales deleted:        ${saleResult.deletedCount}`
    );

    console.log(
      `Customers deleted:    ${customerResult.deletedCount}`
    );

    console.log(
      "\n✅ Normal development records were not targeted."
    );
  } catch (error) {
    console.error(
      "\n❌ Seed cleanup failed:"
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
