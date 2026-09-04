import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "./AuthContext";

import {
  canAccessPath,
} from "./accessControl";

function RoleNavLink({
  to,
  children,
  ...props
}) {
  const {
    user,
  } = useAuth();

  if (
    typeof to === "string" &&
    !canAccessPath(
      user?.role,
      to
    )
  ) {
    return null;
  }

  return (
    <NavLink
      to={to}
      {...props}
    >
      {children}
    </NavLink>
  );
}

export default RoleNavLink;
