import student from "../model/student.js";
import books from "../model/books.js";
import attendant from "../model/attendant.js";
import cloudinary from "../configs/cloudinary.js";
import sendEmail from "../middleware/emailSender.js";
import author from "../model/author.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const createStudent = async (req, res) => {
  const { password, email, ...others } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const existingStudent = await student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }
    let profileImage = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new student({
      ...others,
      email,
      profileImage,
      password: hashedPassword,
    });
    await newStudent.save();
    await sendEmail(newStudent.email, "Welcome to our Library! 📚", "welcome", {
      name: newStudent.name,
    });
    const studentResponse = {
      _id: newStudent._id,
      name: newStudent.name,
      email: newStudent.email,
      profileImage: newStudent.profileImage,
    };
    res.status(201).json({
      message: "Student created successfully",
      student: studentResponse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating student" });
  }
};

const loginStudent = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingStudent = await student.findOne({ email });
    if (!existingStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    const isMatch = await bcrypt.compare(password, existingStudent.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: existingStudent._id },
      process.env.JWT_SECRET,
      { expiresIn: "1hr" },
    );
    res
      .cookie("user_token", token)
      .status(200)
      .json({ message: "Login successful" });
    await sendEmail(email, "Login Alert! 🚨", "login", {
      name: existingStudent.name,
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in student" });
  }
};

const updateStudentPassword = async (req, res) => {
  try {
    const { id } = req.user;
    const { newPassword, oldPassword } = req.body;
    if (!newPassword || !oldPassword) {
      return res.status(400).json({ message: "Password is required" });
    }
    const user = await student.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Student not found" });
    }
    await sendEmail(user.email, "Password Change Alert! 🔒", "resetPassword", {
      name: user.name,
    });
    const isPassword = await bcrypt.compare(oldPassword, user.password);
    if (newPassword === user.password) {
      return res
        .status(400)
        .json({ message: "New password cannot be the same" });
    }
    if (!isPassword) {
      return res.status(400).json({ message: "invalid old password" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedStudent = await student.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true },
    );
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Error updating student" });
  }
};

const updateStudentDetails = async (req, res) => {
  const { id } = req.user;
  try {
    const { email, name } = req.body;
    let profileImage = req.user.profileImage;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      profileImage = result.secure_url;
    }
    const updatedStudent = await student.findByIdAndUpdate(
      id,
      { email, name, profileImage },
      { new: true },
    );
    res.status(200).json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: "Error updating student" });
  }
};

const logoutStudent = (req, res) => {
  try {
    res
      .clearCookie("user_token")
      .status(200)
      .json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out student" });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const { id } = req.user;
    await student.findByIdAndDelete(id);
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting student" });
  }
};

const borrowBook = async (req, res) => {
  try {
    const { id } = req.user;
    const { title } = req.body;
    const { id: attendantId } = req.attendant;

    if (!title) {
      return res.status(400).json({ message: "Book title is required" });
    }
    if (!attendantId) {
      return res.status(401).json({ message: "Attendant not authenticated" });
    }
    if (!id) {
      return res.status(401).json({ message: "Student not authenticated" });
    }

    const studentData = await student.findById(id);
    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }

    const book = await books.findOne({ title }).populate("author");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    if (book.availableCopies <= 0) {
      return res
        .status(400)
        .json({ message: "No copies available for this book" });
    }
    if (
      studentData.borrowedBooks.some(
        (b) => b.book.toString() === book._id.toString(),
      )
    ) {
      return res.status(400).json({ message: "Book already borrowed" });
    }

    studentData.borrowedBooks = studentData.borrowedBooks || [];
    studentData.borrowedBooks.push({
      book: book._id,
      author: book.authorId,
      attendant: attendantId,
      borrowedAt: new Date(),
    });
    await studentData.save();

    book.borrowedBy = studentData._id;
    book.availableCopies -= 1;
    book.borrowedBy = studentData._id;
    book.issueDate = new Date();
    book.status = book.availableCopies > 0 ? "IN" : "OUT";
    await book.save();

    if (book.availableCopies < 1) {
      book.status = "unavailable";
      books.studentData.borrowedBooks.pop();
      await studentData.save();

      return res.status(400).json({ message: "No copies available" });
    }
    await book.save();

    const attendantData = await attendant.findById(attendantId);
    if (!attendantData) {
      return res.status(404).json({ message: "Attendant not found" });
    }
    if (attendantData) {
      attendantData.issuedBooks = attendantData.issuedBooks || [];
      attendantData.issuedBooks.push({
        book: book._id,
        student: studentData._id,
        borrowedAt: studentData.borrowedBooks.borrowedAt,
      });
      attendantData.totalBooksIssued += 1;
      await attendantData.save();
    }

    await sendEmail(
      attendantData.email,
      "Borrowed Book Alert! 📚",
      "attendantBorrow",
      {
        name: attendantData.name,
        borrowerName: studentData.name,
        title: book.title,
      },
    );

    await sendEmail(studentData.email, "Borrowed Book Alert! 📚", "borrowed", {
      name: studentData.name,
      title: book.title,
    });

    await sendEmail(
      book.author.email,
      "Book Borrowed! 📚",
      "authorBookBorrowed",
      {
        name: book.author.name,
        borrowerName: studentData.name,
        title: book.title,
        remainingCopies: book.availableCopies,
      },
    );

    res.status(200).json({
      message: "Book borrowed successfully",
      bookTitle: book.title,
      studentName: studentData.name,
      copiesLeft: book.availableCopies,
      attendantName: attendantData.name,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error borrowing book" });
  }
};

const returnBook = async (req, res) => {
  try {
    const { id } = req.user;
    const { title } = req.body;
    const { id: attendantId } = req.attendant;

    if (!title) {
      return res.status(400).json({ message: "Book title is required" });
    }
    const studentData = await student.findById(id);
    if (!studentData) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Check if the student has borrowed the book
    const book = await books.findOne({ title }).populate("author");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    // Find the index of the borrowed book in the student's borrowedBooks array
    const borrowedBookIndex = studentData.borrowedBooks.findIndex(
      (b) => b.book.toString() === book._id.toString(),
    );
    if (borrowedBookIndex === -1) {
      return res
        .status(400)
        .json({ message: "Book not borrowed by this student" });
    }
    const borrowedRecord = studentData.borrowedBooks[borrowedBookIndex];

    // Remove the book from the student's borrowedBooks array
    studentData.borrowedBooks.splice(borrowedBookIndex, 1);

    studentData.returnedBooks.push({
      book: book._id,
      author: book.authorId,
      attendant: attendantId,
      borrowedAt: borrowedRecord.borrowedAt,
      returnedAt: new Date(),
    });
    await studentData.save();
    book.ifReturned = true;

    book.availableCopies += 1;
    await book.save();

    const attendantData = await attendant.findById(attendantId);
    if (attendantData) {
      attendantData.recievedBooks = attendantData.returnedBooks || [];
      attendantData.recievedBooks.push({
        book: book._id,
        student: studentData._id,
        attendant: attendantId,
        returnedAt: new Date(),
      });
      attendantData.totalBooksRecieved += 1;
      await attendantData.save();

      await sendEmail(
        attendantData.email,
        "Received Book Alert! 📚",
        "attendantRecieved",
        {
          name: attendantData.name,
          title: book.title,
          borrowerName: studentData.name,
        },
      );

      await sendEmail(
        book.author.email,
        "Book Returned! 📚",
        "authorBookReturned",
        {
          name: book.author.name,
          title: book.title,
          remainingCopies: book.availableCopies,
          borrowerName: studentData.name,
        },
      );

      await sendEmail(
        studentData.email,
        "Returned Book Alert! 📚",
        "returned",
        {
          name: studentData.name,
          title: book.title,
        },
      );
    }

    res.status(200).json({
      message: "Book returned successfully",
      copiesLeft: book ? book.availableCopies : "N/A",
      bookReturnedTo: attendantData ? attendantData.name : "N/A",
      attendantBorrowedFrom: studentData.borrowedBooks.attendant,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error returning book" });
  }
};

const getBorrowedBooks = async (req, res) => {
  try {
    const { id } = req.user;
    const studentData = await student.findById(id).populate({
      path: "borrowedBooks.book",
      select: "title author Isbn",
      populate: { path: "author", select: "name" },
    });
    res.status(200).json(studentData.borrowedBooks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching borrowed books" });
  }
};

export {
  createStudent,
  loginStudent,
  logoutStudent,
  deleteStudent,
  borrowBook,
  returnBook,
  getBorrowedBooks,
  updateStudentPassword,
  updateStudentDetails,
};
