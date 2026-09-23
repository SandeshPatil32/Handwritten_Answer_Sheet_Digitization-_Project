import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      required: true
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
