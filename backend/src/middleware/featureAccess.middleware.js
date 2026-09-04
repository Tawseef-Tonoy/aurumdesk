const OWNER = "OWNER";
const ADMIN = "ADMIN";
const SALESMAN = "SALESMAN";
const STAFF = "STAFF";

const ALL = [
  OWNER,
  ADMIN,
  SALESMAN,
  STAFF,
];

const OWNER_ADMIN = [
  OWNER,
  ADMIN,
];

const OWNER_ADMIN_SALESMAN = [
  OWNER,
  ADMIN,
  SALESMAN,
];

const OWNER_ADMIN_STAFF = [
  OWNER,
  ADMIN,
  STAFF,
];

/*
|--------------------------------------------------------------------------
| Feature-level access rules
|--------------------------------------------------------------------------
|
| readRoles  -> GET requests
| writeRoles -> POST / PUT / PATCH / DELETE
|
*/

const ACCESS_RULES = [
  /*
  |--------------------------------------------------------------------------
  | Jewelry Inventory
  |--------------------------------------------------------------------------
  |
  | Owner/Admin/Staff manage inventory.
  | Salesman may read product information for sales.
  |
  */

  {
    prefix: "/api/jewelry-items",

    readRoles: ALL,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Gold Rates
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/gold-rates",

    readRoles: ALL,

    writeRoles:
      OWNER_ADMIN,
  },

  /*
  |--------------------------------------------------------------------------
  | Price Calculation
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/price-calculation",

    readRoles:
      OWNER_ADMIN_SALESMAN,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | Purchases
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/purchases",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Suppliers
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/suppliers",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Stock Adjustments
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/stock-adjustments",

    readRoles:
      OWNER_ADMIN,

    writeRoles:
      OWNER_ADMIN,
  },

  /*
  |--------------------------------------------------------------------------
  | Low Stock Alerts
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/low-stock-alerts",

    readRoles:
      OWNER_ADMIN,

    writeRoles:
      OWNER_ADMIN,
  },

  /*
  |--------------------------------------------------------------------------
  | Customers
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/customers",

    readRoles:
      OWNER_ADMIN_SALESMAN,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | Sales
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/sales",

    readRoles:
      OWNER_ADMIN_SALESMAN,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | Return / Exchange
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/return-exchanges",

    readRoles:
      OWNER_ADMIN_SALESMAN,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | Customer Due Ledger
  |--------------------------------------------------------------------------
  |
  | Staff may need to read outstanding dues during collection.
  | Direct ledger modifications are restricted.
  |
  */

  {
    prefix:
      "/api/customer-ledgers",

    readRoles: ALL,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | Customer Payments
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/payments",

    readRoles: ALL,

    writeRoles: ALL,
  },

  /*
  |--------------------------------------------------------------------------
  | EMI Plans
  |--------------------------------------------------------------------------
  |
  | Salesman may prepare EMI requests.
  | Approval/rejection is handled by the special rule below.
  |
  */

  {
    prefix: "/api/emi-plans",

    readRoles:
      OWNER_ADMIN_SALESMAN,

    writeRoles:
      OWNER_ADMIN_SALESMAN,
  },

  /*
  |--------------------------------------------------------------------------
  | EMI Installments
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/emi-installments",

    readRoles: ALL,

    writeRoles: ALL,
  },

  /*
  |--------------------------------------------------------------------------
  | AI EMI Risk Checker
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/emi-risk-assessments",

    readRoles:
      OWNER_ADMIN,

    writeRoles:
      OWNER_ADMIN,
  },

  /*
  |--------------------------------------------------------------------------
  | Custom Orders
  |--------------------------------------------------------------------------
  |
  | All roles may need to view order progress.
  | Special write restrictions are handled below.
  |
  */

  {
    prefix:
      "/api/custom-orders",

    readRoles: ALL,

    writeRoles: ALL,
  },

  /*
  |--------------------------------------------------------------------------
  | Workers
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/workers",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Worker Assignments
  |--------------------------------------------------------------------------
  */

  {
    prefix:
      "/api/worker-assignments",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Expenses
  |--------------------------------------------------------------------------
  */

  {
    prefix: "/api/expenses",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Daily Cash Closing
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | app.js uses /api/cash-closings
  |
  */

  {
    prefix:
      "/api/cash-closings",

    readRoles:
      OWNER_ADMIN_STAFF,

    writeRoles:
      OWNER_ADMIN_STAFF,
  },

  /*
  |--------------------------------------------------------------------------
  | Monthly Reports
  |--------------------------------------------------------------------------
  |
  | app.js uses /api/monthly-reports
  |
  */

  {
    prefix:
      "/api/monthly-reports",

    readRoles:
      OWNER_ADMIN,

    writeRoles:
      OWNER_ADMIN,
  },
];

/*
|--------------------------------------------------------------------------
| Helper: check API prefix
|--------------------------------------------------------------------------
*/

function matchesPrefix(
  pathname,
  prefix
) {
  return (
    pathname === prefix ||
    pathname.startsWith(
      `${prefix}/`
    )
  );
}

/*
|--------------------------------------------------------------------------
| Helper: check role
|--------------------------------------------------------------------------
*/

function roleAllowed(
  userRole,
  allowedRoles
) {
  return allowedRoles.includes(
    userRole
  );
}

/*
|--------------------------------------------------------------------------
| Standard 403 response
|--------------------------------------------------------------------------
*/

function forbidden(res) {
  return res.status(403).json({
    success: false,

    message:
      "You do not have permission to perform this action.",
  });
}

/*
|--------------------------------------------------------------------------
| Main authorization middleware
|--------------------------------------------------------------------------
*/

function authorizeFeatureAccess(
  req,
  res,
  next
) {
  /*
  |--------------------------------------------------------------------------
  | Remove query parameters
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | /api/customers?status=ACTIVE
  |
  | becomes:
  |
  | /api/customers
  |
  */

  const pathname =
    req.originalUrl
      .split("?")[0];

  const userRole =
    req.user?.role;

  /*
  |--------------------------------------------------------------------------
  | Authentication fallback
  |--------------------------------------------------------------------------
  |
  | Normally requireAuth runs first.
  |
  */

  if (!userRole) {
    return res.status(401).json({
      success: false,

      message:
        "Authentication required.",
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Special Rule 1:
  | EMI approval / rejection / revision
  |--------------------------------------------------------------------------
  |
  | Salesman may prepare an EMI request,
  | but only Owner/Admin may make approval decisions.
  |
  */

  if (
    pathname.startsWith(
      "/api/emi-plans/"
    ) &&
    /approve|reject|revision/i.test(
      pathname
    )
  ) {
    if (
      !roleAllowed(
        userRole,
        OWNER_ADMIN
      )
    ) {
      return forbidden(res);
    }

    return next();
  }

  /*
  |--------------------------------------------------------------------------
  | Special Rule 2:
  | Custom Order Booking
  |--------------------------------------------------------------------------
  |
  | Owner/Admin/Salesman may create bookings.
  | Staff cannot create a new customer booking.
  |
  */

  if (
    pathname ===
      "/api/custom-orders" &&
    req.method === "POST"
  ) {
    if (
      !roleAllowed(
        userRole,
        OWNER_ADMIN_SALESMAN
      )
    ) {
      return forbidden(res);
    }

    return next();
  }

  /*
  |--------------------------------------------------------------------------
  | Special Rule 3:
  | Staff custom-order updates
  |--------------------------------------------------------------------------
  |
  | Staff may participate in progress/workshop
  | updates but should not perform general
  | booking edits.
  |
  */

  if (
    pathname.startsWith(
      "/api/custom-orders/"
    ) &&
    userRole === STAFF &&
    req.method !== "GET"
  ) {
    const isProgressAction =
      /progress|status|stage/i.test(
        pathname
      );

    if (!isProgressAction) {
      return forbidden(res);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Find normal feature rule
  |--------------------------------------------------------------------------
  */

  const rule =
    ACCESS_RULES.find(
      (item) =>
        matchesPrefix(
          pathname,
          item.prefix
        )
    );

  /*
  |--------------------------------------------------------------------------
  | No explicit rule
  |--------------------------------------------------------------------------
  |
  | requireAuth still protects the route.
  |
  | This allows newly added authenticated APIs
  | to function until a specific RBAC policy
  | is added.
  |
  */

  if (!rule) {
    return next();
  }

  /*
  |--------------------------------------------------------------------------
  | GET = read
  | everything else = write
  |--------------------------------------------------------------------------
  */

  const isReadRequest =
    req.method === "GET";

  const allowedRoles =
    isReadRequest
      ? rule.readRoles
      : rule.writeRoles;

  /*
  |--------------------------------------------------------------------------
  | Role check
  |--------------------------------------------------------------------------
  */

  if (
    !roleAllowed(
      userRole,
      allowedRoles
    )
  ) {
    return forbidden(res);
  }

  next();
}

module.exports = {
  authorizeFeatureAccess,
};