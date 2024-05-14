const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: ["https://gobook-e3647.firebaseapp.com", "https://gobook-e3647.firebaseapp.com", "https://localhost:5173"],
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());

//middlewares
const verifyUser = (req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).send('Unauthorized Access');
      } else {
        req.user = decoded;
        next();
      }
    })
  } else {
    res.status(401).send('Unauthorized Access');
  }
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cckizs6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 }); 
    const bookCollection = client.db('GoBook').collection('BookCollection');
    const category = client.db('GoBook').collection('Category');
    const borrowedBooks = client.db('GoBook').collection('BorrowedBooks');

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    //token login
    app.post('/token', async (req, res) => {
      const user = req.body;
      console.log('token for user', user);
      const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '1h' })

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
        .send({ success: true });
    })

    //token logout
    app.post('/logout', async (req, res) => {
      const user = req.body;
      console.log(user);
      res.clearCookie('token', { maxAge: 0 }).send({ success: true });
    })

    //all books in the collection
    app.get('/allBooks', async (req, res) => {
      const cursor = bookCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/allBooks', async (req, res) => {
      console.log('token owner', req.user);
      const data = req.body;
      const result = await bookCollection.insertOne(data);
      res.send(result);
    })

    app.get('/allBooks/:category', async (req, res) => {
      const category = req.params.category;
      const query = { category: category };
      const result = await bookCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/details', async (req, res) => {
      const find = bookCollection.find();
      const result = await find.toArray();
      res.send(result);
    })
    app.get('/details/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result)
    })
    //update Page
    app.get('/updatePage', async (req, res) => {
      const find = bookCollection.find();
      const result = await find.toArray();
      res.send(result);
    })

    app.get('/updatePage/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookCollection.findOne(query);
      res.send(result)
    })

    app.put('/allBooks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      updateInfo = req.body
      const updateBook = {
        $set: {
          name: updateInfo.name,
          image: updateInfo.image,
          author: updateInfo.author,
          rating: updateInfo.rating,
          category: updateInfo.category
        }
      }
      const result = await bookCollection.updateOne(query, updateBook, options);
      res.send(result);
    })

    //borrowed books route
    app.post('/borrowedBooks', async (req, res) => {
      const book = req.body;
      const result = await borrowedBooks.insertOne(book);
      res.send(result);
    })


    app.put('/borrowedBooks', async (req, res) => {
      const book = req.body;
      const modify = await bookCollection.updateOne({
        name: book.name
      }, {
        $inc: {
          quantity: -1
        }
      }
      )
      res.send(modify);
    })

    // return books 
    app.put('/allBooks', async (req, res) => {
      const data = req.body;
      const modify = await bookCollection.updateOne({
        name: data.name
      }, {
        $inc: { quantity: 1 }
      }
      )
      res.send(modify);
    })

    //delete from borrowed books 
    app.delete('/borrowedBooks/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowedBooks.deleteOne(query);
      res.send(result)
    })



    app.get('/borrowedBooks', async (req, res) => {
      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const find = await borrowedBooks.find(query).toArray();
      res.send(find);
    })



    //Category section
    app.get('/category', async (req, res) => {
      const cursor = category.find();
      const result = await cursor.toArray();
      res.send(result);
    })



  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Book server is running')
})
app.listen(port, () => {
  console.log(`server is running at port ${port}`);
})