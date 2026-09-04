export const ROLES = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  SALESMAN: "SALESMAN",
  STAFF: "STAFF",
};

const {
  OWNER,
  ADMIN,
  SALESMAN,
  STAFF,
} = ROLES;

const ALL = [
  OWNER,
  ADMIN,
  SALESMAN,
  STAFF,
];

const RULES = [
  {
    test: (path) =>
      path.startsWith(
        "/gold-rates"
      ),
    roles: [
      OWNER,
      ADMIN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/stock-adjustments"
      ),
    roles: [
      OWNER,
      ADMIN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/low-stock-alerts"
      ),
    roles: [
      OWNER,
      ADMIN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/emi-risk"
      ),
    roles: [
      OWNER,
      ADMIN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/monthly-report"
      ),
    roles: [
      OWNER,
      ADMIN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/customers"
      ),
    roles: [
      OWNER,
      ADMIN,
      SALESMAN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/sales"
      ),
    roles: [
      OWNER,
      ADMIN,
      SALESMAN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/return-exchanges"
      ),
    roles: [
      OWNER,
      ADMIN,
      SALESMAN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/customer-ledgers"
      ),
    roles: [
      OWNER,
      ADMIN,
      SALESMAN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/emi-plans"
      ),
    roles: [
      OWNER,
      ADMIN,
      SALESMAN,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/inventory"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/purchases"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/suppliers"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/workers"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/expenses"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/cash-closing"
      ),
    roles: [
      OWNER,
      ADMIN,
      STAFF,
    ],
  },

  {
    test: (path) =>
      path.startsWith(
        "/payments"
      ),
    roles: ALL,
  },

  {
    test: (path) =>
      path.startsWith(
        "/emi-installments"
      ),
    roles: ALL,
  },

  {
    test: (path) =>
      path.startsWith(
        "/custom-orders"
      ),
    roles: ALL,
  },
];

export function canAccessPath(
  role,
  pathname
) {
  if (!role) {
    return false;
  }

  if (
    pathname === "/" ||
    pathname === "/unauthorized"
  ) {
    return true;
  }

  const rule =
    RULES.find(
      (item) =>
        item.test(pathname)
    );

  if (!rule) {
    return true;
  }

  return rule.roles.includes(
    role
  );
}
