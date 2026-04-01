import attendant from "../model/attendant.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createAttendant = async (req, res) => {
  const { password, email, ...others } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const existingAttendant = await attendant.findOne({ email });
    if (existingAttendant) {
      return res.status(400).json({ message: "Attendant already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAttendant = new attendant({
      ...others,
      email,
      password: hashedPassword,
    });
    await newAttendant.save();
    const attendantResponse = {
      _id: newAttendant._id,
      name: newAttendant.name,
      email: newAttendant.email,
    };
    res
      .status(201)
      .json({
        message: "Attendant created successfully",
        attendant: attendantResponse,
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating attendant" });
  }
};

const loginAttendant = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingAttendant = await attendant.findOne({ email });
    if (!existingAttendant) {
      return res.status(404).json({ message: "Attendant not found" });
    }
    const isMatch = await bcrypt.compare(password, existingAttendant.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: existingAttendant._id },
      process.env.JWT_SECRET,
      { expiresIn: "1hr" },
    );
    res
      .cookie("attendant_token", token)
      .status(200)
      .json({ message: "Login successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating attendant" });
  }
};

const updateAttendantPassword = async (req, res) => {
  try {
    const { id } = req.attendant;
    const { password, ...others } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedAttendant = await attendant.findByIdAndUpdate(
      id,
      { ...others, password: hashedPassword },
      { new: true },
    );
    res.status(200).json(updatedAttendant);
  } catch (error) {
    res.status(500).json({ message: "Error updating attendant" });
  }
};

const updateAttendantDetails = async (req, res) => {
  const { id } = req.attendant;
  try {
    const { email, name } = req.body;
    const updatedAttendant = await attendant.findByIdAndUpdate(
      id,
      { email, name },
      { new: true },
    );
    res.status(200).json(updatedAttendant);
  } catch (error) {
    res.status(500).json({ message: "Error updating attendant" });
  }
};

const logoutAttendant = (req, res) => {
  try {
    res
      .clearCookie("attendant_token")
      .status(200)
      .json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out attendant" });
  }
};

const deleteAttendant = async (req, res) => {
  try {
    const { id } = req.user;
    await attendant.findByIdAndDelete(id);
    res.status(200).json({ message: "Attendant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting attendant" });
  }
};

const getAttendants = async (req, res) => {
  try {
    const allAttendants = await attendant.find();
    res.status(200).json(allAttendants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendants" });
  }
};

const getAttendantById = async (req, res) => {
  try {
    const { id } = req.params;
    const attendantData = await attendant.findById(id);
    if (!attendantData) {
      return res.status(404).json({ message: "Attendant not found" });
    }
    res.status(200).json(attendantData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching attendant" });
  }
};

export {
  createAttendant,
  loginAttendant,
  logoutAttendant,
  deleteAttendant,
  getAttendants,
  getAttendantById,
  updateAttendantPassword,
  updateAttendantDetails,
};
