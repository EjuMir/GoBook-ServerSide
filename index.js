const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const { MongoClient, ServerApiVersion } = require('mongodb');
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

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    app.get('/allBooks', async(req, res)=>{
        const cursor = bookCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.post('/allBooks', async(req, res)=>{
        const data = req.body;
        const result = await bookCollection.insertOne(data);
        res.send(result);
    })

    app.get('/allBooks/:id', async(req, res) => {
        const id = req.params.id;
        const query = {category : id};
        const result = await bookCollection.find(query).toArray();
        res.send(result);
    })
    //Category section
    app.get('/category', async(req, res)=>{
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



app.get('/', (req,res)=>{
    res.send('Book server is running')
})
app.listen(port, ()=>{
    console.log(`server is running at port ${port}`);
})