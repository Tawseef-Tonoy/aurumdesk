function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}

function calculateEMIValues({
  totalSaleAmount,
  downPayment,
  serviceCharge,
  installmentCount,
}) {
  const total = Number(totalSaleAmount);
  const down = Number(downPayment);
  const service = Number(serviceCharge);
  const count = Number(installmentCount);

  if (!Number.isFinite(total) || total <= 0) {
    throw new Error(
      "Sale amount must be greater than zero"
    );
  }

  if (!Number.isFinite(down) || down < 0) {
    throw new Error(
      "Down payment cannot be negative"
    );
  }

  if (down > total) {
    throw new Error(
      "Down payment cannot exceed the sale amount"
    );
  }

  if (!Number.isFinite(service) || service < 0) {
    throw new Error(
      "Service charge cannot be negative"
    );
  }

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(
      "At least one installment is required"
    );
  }

  const financedAmount = roundMoney(
    total - down
  );

  if (financedAmount <= 0) {
    throw new Error(
      "There must be an outstanding amount to finance"
    );
  }

  const emiPayable = roundMoney(
    financedAmount + service
  );

  const regularInstallment =
    Math.floor(
      (emiPayable / count) * 100
    ) / 100;

  return {
    totalSaleAmount: roundMoney(total),
    downPayment: roundMoney(down),
    financedAmount,
    serviceCharge: roundMoney(service),
    emiPayable,
    installmentCount: count,
    installmentAmount:
      roundMoney(regularInstallment),
    remainingBalance: emiPayable,
  };
}

function addMonthsClamped(dateValue, numberOfMonths) {
  const date = new Date(dateValue);

  const originalDay = date.getDate();

  date.setDate(1);

  date.setMonth(
    date.getMonth() + numberOfMonths
  );

  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();

  date.setDate(
    Math.min(originalDay, lastDay)
  );

  return date;
}

function calculateDueDate(
  firstDueDate,
  frequency,
  index
) {
  const baseDate = new Date(firstDueDate);

  if (Number.isNaN(baseDate.getTime())) {
    throw new Error(
      "Invalid first due date"
    );
  }

  if (frequency === "WEEKLY") {
    const date = new Date(baseDate);

    date.setDate(
      date.getDate() + index * 7
    );

    return date;
  }

  if (frequency === "BIWEEKLY") {
    const date = new Date(baseDate);

    date.setDate(
      date.getDate() + index * 14
    );

    return date;
  }

  if (frequency === "MONTHLY") {
    return addMonthsClamped(
      baseDate,
      index
    );
  }

  throw new Error(
    "Invalid EMI frequency"
  );
}

function generateInstallmentSchedule({
  emiPayable,
  installmentCount,
  firstDueDate,
  frequency,
  gracePeriodDays = 0,
}) {
  const payable = roundMoney(emiPayable);
  const count = Number(installmentCount);

  if (!Number.isInteger(count) || count < 1) {
    throw new Error(
      "Invalid installment count"
    );
  }

  const regularAmount =
    Math.floor(
      (payable / count) * 100
    ) / 100;

  let allocated = 0;

  const schedule = [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    let amount;

    if (index === count - 1) {
      amount = roundMoney(
        payable - allocated
      );
    } else {
      amount = roundMoney(
        regularAmount
      );

      allocated = roundMoney(
        allocated + amount
      );
    }

    schedule.push({
      installmentNo: index + 1,

      dueDate: calculateDueDate(
        firstDueDate,
        frequency,
        index
      ),

      scheduledAmount: amount,
      paidAmount: 0,
      remainingAmount: amount,

      gracePeriodDays:
        Number(gracePeriodDays) || 0,

      status: "UPCOMING",
    });
  }

  return schedule;
}

module.exports = {
  roundMoney,
  calculateEMIValues,
  generateInstallmentSchedule,
};
