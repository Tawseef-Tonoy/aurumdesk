function roundMoney(value) {
  return (
    Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100
  );
}

function startOfDay(value = new Date()) {
  const date = new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}

function calculateInstallmentStatus(
  installment,
  currentDate = new Date()
) {
  if (
    installment.status === "PAID" ||
    installment.status === "WAIVED"
  ) {
    return {
      status: installment.status,
      overdueDays: 0,
    };
  }

  const remaining =
    roundMoney(
      installment.remainingAmount
    );

  if (remaining <= 0) {
    return {
      status: "PAID",
      overdueDays: 0,
    };
  }

  const today =
    startOfDay(currentDate);

  const dueDate =
    startOfDay(
      installment.dueDate
    );

  const gracePeriodDays =
    Number(
      installment.gracePeriodDays ||
        0
    );

  const overdueDate =
    new Date(dueDate);

  overdueDate.setDate(
    overdueDate.getDate() +
      gracePeriodDays
  );

  if (today > overdueDate) {
    const milliseconds =
      today.getTime() -
      overdueDate.getTime();

    const overdueDays =
      Math.floor(
        milliseconds /
          (1000 * 60 * 60 * 24)
      );

    return {
      status: "OVERDUE",
      overdueDays,
    };
  }

  if (
    installment.paidAmount > 0 &&
    remaining > 0
  ) {
    return {
      status: "PARTIALLY_PAID",
      overdueDays: 0,
    };
  }

  if (
    today.getTime() ===
    dueDate.getTime()
  ) {
    return {
      status: "DUE_TODAY",
      overdueDays: 0,
    };
  }

  return {
    status: "UPCOMING",
    overdueDays: 0,
  };
}

module.exports = {
  roundMoney,
  calculateInstallmentStatus,
};
