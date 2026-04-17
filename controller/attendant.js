import attendant from "../model/attendant.js";
import cloudinary from "../configs/cloudinary.js";
import emailSender from "../middleware/emailSender.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../middleware/emailSender.js";

const createAttendant = async (req, res) => {
  const { password, email, ...others } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    console.log(email);
    const existingAttendant = await attendant.findOne({ email });
    if (existingAttendant) {
      return res.status(400).json({ message: "Attendant already exists" });
    }
    let profileImage = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAttendant = new attendant({
      ...others,
      email,
      profileImage,
      password: hashedPassword,
    });
    await newAttendant.save();
    await emailSender(
      email,
      "Welcome to the Library Management as an Attendant! 🎉",
      "welcome",
      { name: newAttendant.name },
    );
    const attendantResponse = {
      _id: newAttendant._id,
      name: newAttendant.name,
      email: newAttendant.email,
    };
    res.status(201).json({
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
    await emailSender(email, "Login Alert! 🚨", "login", {
      name: existingAttendant.name,
    });
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
    const { newPassword, oldPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Password is required" });
    }
    const user = await attendant.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Attendant not found" });
    }
    await sendEmail(user.email, "Password Change Alert! 🔒", "resetPassword", {
      name: user.name,
    });
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid current password" });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "new password cannot be the same as old" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedAttendant = await attendant.findByIdAndUpdate(
      id,
      { password: hashedPassword },
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
    let profileImage = req.attendant.profileImage;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const updatedAttendant = await attendant.findByIdAndUpdate(
      id,
      { email, name, profileImage },
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
