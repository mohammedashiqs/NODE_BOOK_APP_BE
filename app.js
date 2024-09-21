const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001; // Backend server port

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crudDB');
mongoose.connection.on('connected', () => console.log('connected'));

// Define book schema and model
const bookSchema = new mongoose.Schema({
  bookId: String,
  bookName: String,
  authorName: String,
  publishedYear: Number,
  price: Number,
  status: { type: Number, default: 1 } // 1: active, 0: deleted
});
const Book = mongoose.model('Book', bookSchema);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes

// Create a new book
app.post('/books', (req, res) => {
  const newBook = new Book(req.body);
  newBook.save()
    .then(book => {
      return res.status(201).send(book);
    })
    .catch(err => {
      return res.status(500).send(err);
    });
});

// Update a book
app.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedBook) {
      return res.status(404).send('Book not found');
    }
    return res.send(updatedBook);
  } catch (err) {
    return res.status(500).send(err);
  }
});

// Delete a book
app.delete('/books/:id', async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndUpdate(req.params.id, { status: 0 }, { new: true });
    if (!deletedBook) {
      return res.status(404).send('Book not found');
    }
    return res.send(deletedBook);
  } catch (err) {
    return res.status(500).send(err);
  }
});


// Get all books with pagination and search
app.get('/books', async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const parsedSearch = parseInt(search) || '';
  const query = {
    $or: [
      { bookName: { $regex: search, $options: 'i' } },
      { authorName: { $regex: search, $options: 'i' } },
      { publishedYear: parsedSearch  } // Parse search as integer for publishedYear
    ],
    status: 1
  };

  try {
    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Book.countDocuments(query);

    return res.status(200).json({
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      books
    });
  } catch (err) {
    return res.status(500).send(err);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
