import author from "../model/author.js";
import books from "../model/books.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../configs/cloudinary.js";
import emailSender from "../middleware/emailSender.js";

const createAuthor = async (req, res) => {
  const { password, email, ...others } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const existingAuthor = await author.findOne({ email });
    if (existingAuthor) {
      return res.status(400).json({ message: "Author already exists" });
    }
    let profileImage = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAuthor = new author({
      ...others,
      email,
      profileImage,
      password: hashedPassword,
    });
    await newAuthor.save();
    await emailSender(
      email,
      "Welcome to the Library Management as an Author! 🎉",
      "welcome",
      { name: newAuthor.name },
    );
    const authorResponse = {
      _id: newAuthor._id,
      name: newAuthor.name,
      email: newAuthor.email,
    };
    res
      .status(201)
      .json({ message: "Author created successfully", author: authorResponse });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating author" });
  }
};

const loginAuthor = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await author.findOne({ email });
    // console.log(user.password);
    if (!user) {
      return res.status(404).json({ message: "Author not found" });
    }
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1hr",
    });
    await emailSender(email, "Login Alert! 🚨", "login", { name: user.name });
    res
      .cookie("author_token", token)
      .status(200)
      .json({ message: "Login successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error logging in author" });
  }
};

const updateAuthorPassword = async (req, res) => {
  try {
    const { id } = req.author;
    const { newPassword, oldPassword } = req.body;
    const user = await author.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "Author not found" });
    }
    if (!newPassword || !oldPassword) {
      return res.status(400).json({ message: "Password is required" });
    }
    await emailSender(
      user.email,
      "Password Change Alert! 🔒",
      "resetPassword",
      { name: user.name },
    );
    console.log("oldPassword", oldPassword);
    console.log("user.password", user.password);
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid current password" });
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({ message: "new password cannot be the same as old password," });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedAuthor = await author.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true },
    );
    res.status(200).json(updatedAuthor);
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Error updating author" });
  }
};

const updateAuthorDetails = async (req, res) => {
  const { id } = req.author;
  try {
    const { email, name } = req.body;
    let profileImage = req.author.profileImage;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const updatedAuthor = await author.findByIdAndUpdate(
      id,
      { email, name, profileImage },
      { new: true },
    );
    res.status(200).json(updatedAuthor);
  } catch (error) {
    res.status(500).json({ message: "Error updating author" });
  }
};

const logoutAuthor = (req, res) => {
  try {
    res
      .clearCookie("author_token")
      .status(200)
      .json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out author" });
  }
};

const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.user;
    await author.findByIdAndDelete(id);
    res.status(200).json({ message: "Author deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting author" });
  }
};

const getAuthorBooks = async (req, res) => {
  try {
    const { authorId } = req.params;
    const authorBooks = await books
      .find({ author: authorId })
      .populate("author", "name");
    res.status(200).json(authorBooks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching author's books" });
  }
};

export {
  createAuthor,
  loginAuthor,
  logoutAuthor,
  deleteAuthor,
  getAuthorBooks,
  updateAuthorPassword,
  updateAuthorDetails,
};
