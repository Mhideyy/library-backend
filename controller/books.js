import books from "../model/books.js";
import author from "../model/author.js";
import student from "../model/student.js";
import attendant from "../model/attendant.js";
import emailSender from "../middleware/emailSender.js";
import cloudinary from "../configs/cloudinary.js";
import parser from "../middleware/cloudinary.js";

const createBooks = async (req, res) => {
  try {
    const { id } = req.author;

    if (!id) {
      return res.status(401).json({ message: "Author not authenticated" });
    }

    const { title, Isbn, ...others } = req.body;

    const existingBook = await books.findOne({
      title,
      author: id,
    });

    if (existingBook) {
      return res.status(400).json({
        message: "You have already created a book with this title",
      });
    }

    // Generate ISBN if missing
    let getIsbn =
      Isbn ||
      Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");

    // Upload image if exists
    let image = "";
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      image = result.secure_url;
    }

    // Create book
    const newBook = await books.create({
      title,
      author: id,
      Isbn: getIsbn,
      image,
      ...others,
    });

    // Get author
    const bookAuthor = await author.findById(id);

    if (!bookAuthor) {
      return res.status(404).json({ message: "Author not found" });
    }

    // IMPORTANT: populate books safely
    bookAuthor.books = bookAuthor.books || [];
    bookAuthor.books.push(newBook._id);
    bookAuthor.totalBooks = bookAuthor.books.length;

    await bookAuthor.save();

    // Get all users safely (NO NULLS)
    const allUsers = [
      ...(await student.find({}, "email name")),
      ...(await attendant.find({}, "email name")),
      ...(await author.find({}, "email name")),
    ].filter((u) => u && u.email);

    // Send emails (safe + corrected payload)
    await Promise.all(
      allUsers.map(async (user) => {
        try {
          await emailSender(user.email, "New Book Alert! 📚", "newBook", {
            name: user.name,
            title: newBook.title,
            author: bookAuthor.name,
            isbn: newBook.Isbn,
          });
        } catch (err) {
          console.error("Email failed for:", user.email, err.message);
        }
      }),
    );

    // Email author only once (no duplicate update logic)
    if (bookAuthor.email) {
      await emailSender(
        bookAuthor.email,
        "New Book Created! 📚",
        "newBookPublish",
        {
          name: bookAuthor.name,
          bookTitle: newBook.title,
          totalBooks: bookAuthor.totalBooks,
        },
      );
    }

    return res.status(201).json({
      message: "Book created successfully",
      book: {
        _id: newBook._id,
        title: newBook.title,
        Isbn: newBook.Isbn,
        author: bookAuthor.name,
        image: newBook.image,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
      },
    });
  } catch (error) {
    console.error("Create Book Error:", error);
    return res.status(500).json({
      message: "Error creating book",
      error: error.message,
    });
  }
};
const getBooks = async (req, res) => {
  try {
    const allBooks = await books
      .find()
      .populate("author", "name")
      .populate("borrowedBy", "name")
      .populate("issuedBy", "name");
    res.status(200).json(allBooks);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching books" });
  }
};

const getBookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await books
      .findById(id)
      .populate("authorId", "name")
      .populate("borrowedBy", "name");
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: "Error fetching book" });
  }
};

const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await books.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    const { authorId, Isbn, ...others } = req.body;
    // update cover image if a new one is provided
    let coverImage = book.coverImage;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      coverImage = result.secure_url;
    }

    // update the book details
    const updatedBook = await books.findByIdAndUpdate(
      id,
      { ...others, authorId, coverImage },
      { new: true },
    );
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await books.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    await books.findByIdAndDelete(id);
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting book" });
  }
};

export { createBooks, getBooks, getBookById, updateBook, deleteBook };
