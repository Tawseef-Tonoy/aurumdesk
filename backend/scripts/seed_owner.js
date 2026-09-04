require("dotenv").config();

const mongoose =
  require("mongoose");

const User =
  require(
    "../src/models/user.model"
  );

async function seedOwner() {
  try {
    if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing."
    );
  }

    if (
      !process.env.SEED_OWNER_EMAIL ||
      !process.env.SEED_OWNER_PASSWORD
    ) {
      throw new Error(
        "SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD are required."
      );
    }

    await mongoose.connect(
    process.env.MONGODB_URI
  );

    console.log(
      "MongoDB connected"
    );

    const email =
      process.env.SEED_OWNER_EMAIL
        .trim()
        .toLowerCase();

    const existingUser =
      await User.findOne({
        email,
      });

    if (existingUser) {
      console.log(
        "Owner already exists:",
        existingUser.email
      );

      return;
    }

    const owner =
      await User.create({
        name:
          process.env.SEED_OWNER_NAME ||
          "AurumDesk Owner",

        email,

        password:
          process.env
            .SEED_OWNER_PASSWORD,

        role: "OWNER",

        status: "ACTIVE",
      });

    console.log(
      "Owner account created:"
    );

    console.log(
      `Name: ${owner.name}`
    );

    console.log(
      `Email: ${owner.email}`
    );

    console.log(
      `Role: ${owner.role}`
    );
  } catch (error) {
    console.error(
      "Owner seed failed:"
    );

    console.error(
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedOwner();
