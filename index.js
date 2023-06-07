const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
// to get data from env file
require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Welcome to foreign laguage school");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
console.log(process.env.dbUser);
const uri = `mongodb+srv://${process.env.dbUser}:${process.env.dbPass}@cluster0.w5hdwnt.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("SummerCamp").collection("users");
    const classCollection = client.db("SummerCamp").collection("allclass");

    // for all user
    // this api hits from sign up and social login page
    app.post("/users", async (req, res) => {
      const user = req.body;
      //   console.log(user);
      const query = { email: user.email };

      const result = await userCollection.insertOne(query);
      //   console.log(result);
      res.send(result);
    });

    // see all user
    // sucured for admin
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // todo: this class should be the approved class by admin
    app.get("/allclass", async (req, res) => {
      const result = await classCollection.find().toArray();
      //   console.log(result);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, (req, res) => {
  console.log(`post is runnig on ${port}`);
});
