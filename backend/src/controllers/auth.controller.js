const User = require(
  "../models/user.model"
);

const generateToken = require(
  "../utils/generateToken"
);

/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await User.findOne({
        email: normalizedEmail,
      }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message:
          "This account is inactive.",
      });
    }

    const passwordMatches =
      await user.comparePassword(
        password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    user.lastLoginAt =
      new Date();

    await user.save();

    const token =
      generateToken(user);

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to login.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/auth/me
|--------------------------------------------------------------------------
*/

async function getCurrentUser(
  req,
  res
) {
  try {
    return res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        "Unable to retrieve user.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/auth/logout
|--------------------------------------------------------------------------
|
| JWT logout is handled by deleting the token on the frontend.
| This endpoint gives us a clean API-level logout action.
|
*/

async function logout(req, res) {
  return res.status(200).json({
    success: true,
    message:
      "Logout successful.",
  });
}

module.exports = {
  login,
  getCurrentUser,
  logout,
};
