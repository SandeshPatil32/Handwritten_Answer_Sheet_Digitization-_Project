import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const safeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId || null,
  employeeId: user.employeeId || null
});

export const register = async (req, res) => {
  try {
    const { name, email, password, role, studentId, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    if (role === "student" && !studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    if (role === "teacher" && !employeeId) {
      return res.status(400).json({ message: "Employee / Teacher ID is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      studentId: role === "student" ? studentId.trim() : undefined,
      employeeId: role === "teacher" ? employeeId.trim() : undefined
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token: createToken(user._id.toString()),
      user: safeUser(user)
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error while creating account." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password and role are required." });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `This account is registered as a ${user.role}.` });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json({
      message: "Login successful.",
      token: createToken(user._id.toString()),
      user: safeUser(user)
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error while logging in." });
  }
};

export const getMe = async (req, res) => {
  return res.json({ user: safeUser(req.user) });
};
