import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    console.log("MongoDB Connected");
  } catch (error) {
  console.log("MongoDB Error:", error);
}
};

export default connectDB;