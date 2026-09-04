const jwt = require("jsonwebtoken");

const User = require(
  "../models/user.model"
);

/*
|--------------------------------------------------------------------------
| Require authenticated user
|--------------------------------------------------------------------------
*/

async function requireAuth(
  req,
  res,
  next
) {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const token =
      authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.userId
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message:
          "User account is inactive.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired login session.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| Role authorization
|--------------------------------------------------------------------------
|
| Example:
|
| authorizeRoles("OWNER", "ADMIN")
|
*/

function authorizeRoles(
  ...allowedRoles
) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to perform this action.",
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  authorizeRoles,
};
