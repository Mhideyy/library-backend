import books from "../model/books.js";
import author from "../model/author.js";
import attendant from "../model/attendant.js";

const createBooks = async (req, res) => {
  try {
    const { id } = req.author;
    if (!id) {
      return res.status(401).json({ message: "Author not authenticated" });
    }

    const { title, Isbn, ...others } = req.body;
    const existingBook = await books.findOne({
      title: title,
      author: id,
    });

    if (existingBook) {
      return res.status(400).json({
        message: "You have already created a book with this title",
      });
    }
    let getIsbn = Isbn;
    if (!getIsbn) {
      getIsbn = "";
      for (let i = 0; i < 10; i++) {
        getIsbn += Math.floor(Math.random() * 10);
      }
    }

    const newBook = new books({
      title,
      author: id,
      Isbn: getIsbn,
      ...others,
    });

    await newBook.save();

    const authorData = await author.findById(id);
    if (authorData) {
      authorData.books = authorData.books || [];
      authorData.books.push(newBook._id);
      authorData.totalBooks = (authorData.totalBooks || 0) + 1;
      await authorData.save();
    }
    res.status(201).json({
      message: "Book created successfully",
      book: {
        _id: newBook._id,
        title: newBook.title,
        Isbn: newBook.Isbn,
        author: newBook.author,
        content: newBook.content,
        totalCopies: newBook.totalCopies,
        availableCopies: newBook.availableCopies,
      },
    });
  } catch (error) {
    console.error("Create Book Error:", error);
    res.status(500).json({
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
    const { authorId, Isbn, ...others } = req.body;
    const updatedBook = await books.findByIdAndUpdate(
      id,
      { ...others, authorId },
      { new: true },
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: "Error updating book" });
  }
};

export { createBooks, getBooks, getBookById, updateBook };
