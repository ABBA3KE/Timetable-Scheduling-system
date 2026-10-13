import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");
  
  // Fix CS526 sessionsPerWeek
  const r1 = await mongoose.connection.db.collection("courses").updateOne(
    { code: "CS526" },
    { $set: { sessionsPerWeek: 1 } }
  );
  console.log("CS526 update result:", r1.modifiedCount);

  // Check student and lecturer users to make sure department is set
  const dept = await mongoose.connection.db.collection("departments").findOne({ code: "CS" });
  if (dept) {
    const r2 = await mongoose.connection.db.collection("users").updateMany(
      { role: "lecturer", department: { $exists: false } },
      { $set: { department: dept._id } }
    );
    console.log("Lecturers with missing dept updated:", r2.modifiedCount);
  }

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(console.error);
