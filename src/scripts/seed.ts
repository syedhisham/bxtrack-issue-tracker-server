import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/user.model";

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Clear existing users (optional)
    await User.deleteMany({});
    console.log("Cleared existing users");

    const users = [
      {
        name: "Syed Hisham Shah",
        email: "syedhishamshah27@gmail.com",
        profileImage: "https://avatar.iran.liara.run/public/1.png",
      },
      {
        name: "Ali Ahmed",
        email: "aliahmed@gmail.com",
        profileImage: "https://avatar.iran.liara.run/public/2.png",
      },
      {
        name: "Fatima Khan",
        email: "fatimakhan@gmail.com",
        profileImage: "https://avatar.iran.liara.run/public/3.png",
      },
      {
        name: "Ahmed Hassan",
        email: "ahmedhassan@gmail.com",
        profileImage: "https://avatar.iran.liara.run/public/4.png",
      },
    ];

    // Insert users
    const createdUsers = await User.insertMany(users);
    console.log(`Seeded ${createdUsers.length} users:`);
    createdUsers.forEach((user) => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedUsers();

