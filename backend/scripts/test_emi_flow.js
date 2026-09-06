const BASE_URL =
  process.env.BASE_URL ||
  "http://localhost:5000/api";

const TEST_SERVICE_CHARGE = 3000;
const TEST_INSTALLMENT_COUNT = 4;
const TEST_FREQUENCY = "MONTHLY";
const TEST_GRACE_DAYS = 0;

function section(title) {
  console.log("\n");
  console.log("=".repeat(70));
  console.log(title);
  console.log("=".repeat(70));
}

function success(message) {
  console.log(`✅ ${message}`);
}

function failure(message) {
  console.error(`❌ ${message}`);
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function tomorrowDate() {
  const date = new Date();

  date.setDate(
    date.getDate() + 1
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function pastDate() {
  const date = new Date();

  date.setDate(
    date.getDate() - 10
  );

  return date
    .toISOString()
    .slice(0, 10);
}

async function request(
  path,
  options = {}
) {
  const response = await fetch(
    `${BASE_URL}${path}`,
    {
      headers: {
        "Content-Type":
          "application/json",

        ...(options.headers || {}),
      },

      ...options,
    }
  );

  let body;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function extractArray(response) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  return [];
}

async function getCustomers() {
  const response =
    await request(
      "/customers"
    );

  if (!response.ok) {
    throw new Error(
      `Could not load customers: ${
        response.body?.message ||
        response.status
      }`
    );
  }

  return extractArray(
    response.body
  );
}

async function getSales() {
  const response =
    await request(
      "/sales"
    );

  if (!response.ok) {
    throw new Error(
      `Could not load sales: ${
        response.body?.message ||
        response.status
      }`
    );
  }

  return extractArray(
    response.body
  );
}

async function getExistingPlans() {
  const response =
    await request(
      "/emi-plans"
    );

  if (!response.ok) {
    throw new Error(
      "Could not load EMI plans"
    );
  }

  return extractArray(
    response.body
  );
}

async function findEligibleSale() {
  section(
    "1. FINDING ELIGIBLE CUSTOMER + SALE"
  );

  const customers =
    await getCustomers();

  const sales =
    await getSales();

  const plans =
    await getExistingPlans();

  info(
    `Customers found: ${customers.length}`
  );

  info(
    `Sales found: ${sales.length}`
  );

  info(
    `Existing EMI plans: ${plans.length}`
  );

  const usedSaleIds =
    new Set(
      plans
        .filter(
          (plan) =>
            ![
              "CANCELLED",
              "REJECTED",
            ].includes(
              plan.status
            )
        )
        .map(
          (plan) =>
            String(
              plan.sale?._id ||
              plan.sale
            )
        )
    );

  const activeCustomerIds =
    new Set(
      customers
        .filter(
          (customer) =>
            String(
              customer.status
            ).toUpperCase() ===
            "ACTIVE"
        )
        .map(
          (customer) =>
            String(
              customer._id
            )
        )
    );

  const eligibleSale =
    sales.find(
      (sale) => {
        const customerId =
          sale.customer?._id ||
          sale.customer;

        const due =
          Number(
            sale.dueAmount ??
              (
                Number(
                  sale.totalAmount ||
                    0
                ) -
                Number(
                  sale.paidAmount ||
                    0
                )
              )
          );

        return (
          activeCustomerIds.has(
            String(customerId)
          ) &&
          String(
            sale.status
          ).toUpperCase() ===
            "CONFIRMED" &&
          due > 0 &&
          !usedSaleIds.has(
            String(sale._id)
          )
        );
      }
    );

  if (!eligibleSale) {
    throw new Error(
      [
        "No unused eligible sale found.",
        "",
        "You need:",
        "- ACTIVE customer",
        "- CONFIRMED sale",
        "- dueAmount > 0",
        "- sale must not already have an active EMI plan",
      ].join("\n")
    );
  }

  const customerId =
    eligibleSale.customer?._id ||
    eligibleSale.customer;

  const customer =
    customers.find(
      (entry) =>
        String(entry._id) ===
        String(customerId)
    );

  success(
    `Customer: ${
      customer?.name ||
      customerId
    }`
  );

  success(
    `Sale: ${
      eligibleSale.invoiceNumber ||
      eligibleSale._id
    }`
  );

  info(
    `Total: ${money(
      eligibleSale.totalAmount
    )}`
  );

  info(
    `Already paid: ${money(
      eligibleSale.paidAmount
    )}`
  );

  info(
    `Due: ${money(
      eligibleSale.dueAmount
    )}`
  );

  return {
    customer,
    sale: eligibleSale,
  };
}

async function createPlan(
  customer,
  sale
) {
  section(
    "2. CREATING EMI PLAN"
  );

  const response =
    await request(
      "/emi-plans",
      {
        method: "POST",

        body: JSON.stringify({
          customer:
            customer._id,

          sale:
            sale._id,

          serviceCharge:
            TEST_SERVICE_CHARGE,

          installmentCount:
            TEST_INSTALLMENT_COUNT,

          frequency:
            TEST_FREQUENCY,

          firstDueDate:
            tomorrowDate(),

          gracePeriodDays:
            TEST_GRACE_DAYS,

          referenceName:
            "Automated Test Reference",

          referencePhone:
            "01700000000",

          guarantorName:
            "Automated Test Guarantor",

          guarantorPhone:
            "01800000000",

          preparedBy:
            "Automated Test",

          notes:
            "Created by automated EMI integration test",
        }),
      }
    );

  if (!response.ok) {
    console.log(
      response.body
    );

    throw new Error(
      `EMI creation failed: ${
        response.body?.message ||
        response.status
      }`
    );
  }

  const plan =
    response.body.data;

  success(
    `Created plan ${plan.planNo}`
  );

  success(
    `Status = ${plan.status}`
  );

  info(
    `Sale amount = ${money(
      plan.totalSaleAmount
    )}`
  );

  info(
    `Down payment = ${money(
      plan.downPayment
    )}`
  );

  info(
    `Financed amount = ${money(
      plan.financedAmount
    )}`
  );

  info(
    `EMI payable = ${money(
      plan.emiPayable
    )}`
  );

  if (
    plan.status !== "DRAFT"
  ) {
    throw new Error(
      "New plan should have DRAFT status"
    );
  }

  return plan;
}

async function submitPlan(plan) {
  section(
    "3. SUBMITTING EMI PLAN"
  );

  const response =
    await request(
      `/emi-plans/${plan._id}/submit`,
      {
        method: "PATCH",
      }
    );

  if (!response.ok) {
    throw new Error(
      `Submit failed: ${
        response.body?.message
      }`
    );
  }

  if (
    response.body.data.status !==
    "PENDING_APPROVAL"
  ) {
    throw new Error(
      "Plan did not enter PENDING_APPROVAL"
    );
  }

  success(
    "Plan status = PENDING_APPROVAL"
  );
}

async function approvePlan(plan) {
  section(
    "4. APPROVING EMI PLAN"
  );

  const response =
    await request(
      `/emi-plans/${plan._id}/approve`,
      {
        method: "PATCH",

        body: JSON.stringify({
          approvedBy:
            "Automated Test Owner",
        }),
      }
    );

  if (!response.ok) {
    console.log(
      response.body
    );

    throw new Error(
      `Approval failed: ${
        response.body?.message
      }`
    );
  }

  const installments =
    response.body.installments ||
    [];

  if (
    response.body.data.status !==
    "APPROVED"
  ) {
    throw new Error(
      "Plan should be APPROVED"
    );
  }

  if (
    installments.length !==
    TEST_INSTALLMENT_COUNT
  ) {
    throw new Error(
      `Expected ${TEST_INSTALLMENT_COUNT} installments, got ${installments.length}`
    );
  }

  success(
    "Plan status = APPROVED"
  );

  success(
    `${installments.length} installments created`
  );

  return installments;
}

async function loadPlan(
  planId
) {
  const response =
    await request(
      `/emi-plans/${planId}`
    );

  if (!response.ok) {
    throw new Error(
      "Could not reload EMI plan"
    );
  }

  return response.body;
}

async function testPartialPayment(
  plan,
  installment
) {
  section(
    "5. TESTING PARTIAL PAYMENT"
  );

  const originalRemaining =
    Number(
      installment.remainingAmount
    );

  const paymentAmount =
    Math.floor(
      (originalRemaining / 2) *
        100
    ) / 100;

  info(
    `Installment amount = ${money(
      originalRemaining
    )}`
  );

  info(
    `Partial payment = ${money(
      paymentAmount
    )}`
  );

  const response =
    await request(
      `/emi-installments/${installment._id}/payments`,
      {
        method: "POST",

        body: JSON.stringify({
          amount:
            paymentAmount,

          method: "CASH",

          receiptReference:
            "AUTO-PARTIAL-001",

          receivedBy:
            "Automated Test",

          notes:
            "Automatic partial payment test",
        }),
      }
    );

  if (!response.ok) {
    console.log(
      response.body
    );

    throw new Error(
      `Partial payment failed: ${
        response.body?.message
      }`
    );
  }

  const updated =
    response.body.data
      .installment;

  if (
    updated.status !==
    "PARTIALLY_PAID"
  ) {
    throw new Error(
      `Expected PARTIALLY_PAID but got ${updated.status}`
    );
  }

  if (
    Number(
      updated.remainingAmount
    ) >=
    originalRemaining
  ) {
    throw new Error(
      "Remaining amount did not decrease"
    );
  }

  success(
    "Partial payment accepted"
  );

  success(
    "Status = PARTIALLY_PAID"
  );

  success(
    `Remaining = ${money(
      updated.remainingAmount
    )}`
  );

  return updated;
}

async function testPlanBalanceDecrease(
  planId,
  oldBalance
) {
  const response =
    await loadPlan(planId);

  const newBalance =
    Number(
      response.data
        .remainingBalance
    );

  if (
    newBalance >= oldBalance
  ) {
    throw new Error(
      `Plan remaining balance did not decrease (${oldBalance} -> ${newBalance})`
    );
  }

  success(
    `Plan balance decreased: ${money(
      oldBalance
    )} → ${money(
      newBalance
    )}`
  );

  return newBalance;
}

async function testFullPayment(
  installment
) {
  section(
    "6. COMPLETING INSTALLMENT"
  );

  const amount =
    Number(
      installment.remainingAmount
    );

  const response =
    await request(
      `/emi-installments/${installment._id}/payments`,
      {
        method: "POST",

        body: JSON.stringify({
          amount,

          method:
            "MOBILE_BANKING",

          receiptReference:
            "AUTO-FULL-001",

          receivedBy:
            "Automated Test",

          notes:
            "Automatic final installment payment test",
        }),
      }
    );

  if (!response.ok) {
    console.log(
      response.body
    );

    throw new Error(
      `Full payment failed: ${
        response.body?.message
      }`
    );
  }

  const updated =
    response.body.data
      .installment;

  if (
    updated.status !== "PAID"
  ) {
    throw new Error(
      `Expected PAID but got ${updated.status}`
    );
  }

  if (
    Number(
      updated.remainingAmount
    ) !== 0
  ) {
    throw new Error(
      "Paid installment remainingAmount should be 0"
    );
  }

  success(
    "Remaining payment accepted"
  );

  success(
    "Status = PAID"
  );

  success(
    "remainingAmount = 0"
  );

  return updated;
}

async function testDoublePayment(
  installmentId
) {
  section(
    "7. TESTING DOUBLE PAYMENT PROTECTION"
  );

  const response =
    await request(
      `/emi-installments/${installmentId}/payments`,
      {
        method: "POST",

        body: JSON.stringify({
          amount: 1,
          method: "CASH",
          receivedBy:
            "Automated Test",
        }),
      }
    );

  if (response.ok) {
    throw new Error(
      "CRITICAL: System allowed a second payment on an already paid installment"
    );
  }

  if (
    response.status !== 400
  ) {
    throw new Error(
      `Expected HTTP 400 but got ${response.status}`
    );
  }

  success(
    "Double payment correctly rejected"
  );

  info(
    response.body?.message
  );
}

async function testOverdue(
  installment
) {
  section(
    "8. TESTING OVERDUE DETECTION"
  );

  const newDueDate =
    pastDate();

  info(
    `Moving installment #${installment.installmentNo} to ${newDueDate}`
  );

  const reschedule =
    await request(
      `/emi-installments/${installment._id}/reschedule`,
      {
        method: "PATCH",

        body: JSON.stringify({
          newDueDate,

          reason:
            "Automated overdue test",

          authorizedBy:
            "Automated Test Owner",
        }),
      }
    );

  if (!reschedule.ok) {
    throw new Error(
      `Reschedule failed: ${
        reschedule.body?.message
      }`
    );
  }

  success(
    "Installment rescheduled into the past"
  );

  const refresh =
    await request(
      "/emi-installments/refresh-statuses",
      {
        method: "POST",
      }
    );

  if (!refresh.ok) {
    throw new Error(
      "Status refresh failed"
    );
  }

  success(
    "Statuses refreshed"
  );

  const details =
    await request(
      `/emi-installments/${installment._id}`
    );

  if (!details.ok) {
    throw new Error(
      "Could not reload overdue installment"
    );
  }

  const updated =
    details.body.data;

  if (
    updated.status !==
    "OVERDUE"
  ) {
    throw new Error(
      `Expected OVERDUE but got ${updated.status}`
    );
  }

  if (
    Number(
      updated.overdueDays
    ) <= 0
  ) {
    throw new Error(
      "overdueDays was not calculated"
    );
  }

  success(
    "Status = OVERDUE"
  );

  success(
    `Overdue days = ${updated.overdueDays}`
  );
}

async function displayPaymentHistory(
  installmentId
) {
  section(
    "9. VERIFYING PAYMENT HISTORY"
  );

  const response =
    await request(
      `/emi-installments/${installmentId}`
    );

  if (!response.ok) {
    throw new Error(
      "Could not load installment payment history"
    );
  }

  const payments =
    response.body.payments ||
    [];

  if (
    payments.length < 2
  ) {
    throw new Error(
      `Expected at least 2 payment records, got ${payments.length}`
    );
  }

  success(
    `${payments.length} payment records found`
  );

  for (
    const payment
    of payments
  ) {
    console.log(
      `   ${payment.paymentNo} | ${money(
        payment.amount
      )} | ${payment.method}`
    );
  }
}

async function run() {
  console.log("\n");
  console.log(
    "🧪 AURUMDESK AUTOMATED EMI INTEGRATION TEST"
  );

  console.log(
    `API: ${BASE_URL}`
  );

  let createdPlan = null;

  try {
    const {
      customer,
      sale,
    } =
      await findEligibleSale();

    createdPlan =
      await createPlan(
        customer,
        sale
      );

    await submitPlan(
      createdPlan
    );

    const installments =
      await approvePlan(
        createdPlan
      );

    const initialPlan =
      await loadPlan(
        createdPlan._id
      );

    const initialBalance =
      Number(
        initialPlan.data
          .remainingBalance
      );

    info(
      `Initial plan remaining balance = ${money(
        initialBalance
      )}`
    );

    const partiallyPaid =
      await testPartialPayment(
        createdPlan,
        installments[0]
      );

    await testPlanBalanceDecrease(
      createdPlan._id,
      initialBalance
    );

    const paidInstallment =
      await testFullPayment(
        partiallyPaid
      );

    await testDoublePayment(
      paidInstallment._id
    );

    await displayPaymentHistory(
      paidInstallment._id
    );

    if (
      installments.length >= 2
    ) {
      await testOverdue(
        installments[1]
      );
    } else {
      info(
        "Skipping overdue test because only one installment exists."
      );
    }

    section(
      "AUTOMATED TEST RESULT"
    );

    console.log(
      "🎉 ALL EMI TESTS PASSED"
    );

    console.log(
      "\nValidated:"
    );

    console.log(
      "✅ EMI plan creation"
    );

    console.log(
      "✅ Submission workflow"
    );

    console.log(
      "✅ Approval workflow"
    );

    console.log(
      "✅ Automatic installment creation"
    );

    console.log(
      "✅ Partial payment"
    );

    console.log(
      "✅ Remaining balance calculation"
    );

    console.log(
      "✅ Full payment"
    );

    console.log(
      "✅ Double-payment protection"
    );

    console.log(
      "✅ Payment history"
    );

    console.log(
      "✅ Overdue detection"
    );

    console.log(
      `\nTest EMI plan: ${createdPlan.planNo}`
    );

    process.exit(0);
  } catch (error) {
    section(
      "AUTOMATED TEST RESULT"
    );

    failure(
      "TEST FAILED"
    );

    console.error(
      error.message
    );

    if (createdPlan) {
      console.log(
        `\nCreated test plan: ${createdPlan.planNo}`
      );

      console.log(
        `Plan ID: ${createdPlan._id}`
      );
    }

    process.exit(1);
  }
}

run();
