const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();

const jwt = require("jsonwebtoken");
// to get data from env file
require("dotenv").config();
// middleware
app.use(cors());

// verify jwt middle ware

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unathorized token" });
  }

  const token = authorization.split(" ")[1];
  // now verify
  jwt.verify(token, process.env.SecretAccessToken, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unathorized token" });
    }
    req.decoded = decoded;
    next();
  });
};

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Welcome to foreign laguage school");
});

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// console.log(process.env.dbUser);
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

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;

      const jwtToken = jwt.sign(user, process.env.SecretAccessToken, {
        expiresIn: "8hr",
      });
      res.send({ jwtToken });
    });

    // for all user
    // this api hits from sign up and social login page
    // todo:Socail login check
    app.post("/users", async (req, res) => {
      const user = req.body;
      //   console.log(user);

      const query = { email: user.email };
      const result = await userCollection.insertOne(query);
      //   console.log(result);
      res.send(result);
    });

    // only admin can see all user
    //todo: secured this request for admin
    app.get("/users", verifyJwt, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // make admin by manual admin
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;

      //   console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);

      res.send(result);
    });

    // now make moderator via admin
    //todo: secured this request for admin

    app.patch("/users/instructor/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          role: "instructor",
        },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // check whether the user admin/not
    // remember:client will recieve logged in user from authContext to perform transtack wury

    app.get("/users/admin/:email", verifyJwt, async (req, res) => {
      const userEmail = req.params.email;

      if (userEmail !== req.decoded.email) {
        res.send({ admin: false });
      }

      const query = { email: userEmail };
      const user = await userCollection.findOne(query);
      // console.log("user", user);
      // if user exist then match his role
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    // check whether instructor or not

    app.get("/users/instructor/:email", verifyJwt, async (req, res) => {
      const userEmail = req.params.email;

      if (userEmail !== req.decoded.email) {
        res.send({ instructor: false });
      }
      const query = { email: userEmail };
      const user = await userCollection.findOne(query);
      // console.log(user);
      const result = { instructor: user?.role === "instructor" };
      // response is {instructor:true}
      res.send(result);
    });

    // post add class data by instructor
    // todo: make the route secure for instructor..using verifyinstructctor middleware
    app.post("/addclass", async (req, res) => {
      const item = req.body;

      const result = await classCollection.insertOne(item);
      // console.log(result);
      res.send(result);
    });

    // to show all class added by an instructor email
    app.get("/myclass", async (req, res) => {
      // const userEmail = req.params.email;
      const { email } = req.query;
      // console.log("email", email);

      let query = {};
      if (req.query?.email) {
        query = { instructorEmail: req.query.email };
      }

      // const query = { email: email };
      const result = await classCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // it will be in admin dashboard to check allt he class in manage class
    app.get("/myclass", async (req, res) => {
      // const { email } = req.query;
      // const query = { email: email };
      const result = await classCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });
    // approved /deny by admin

    app.patch("/myclass/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      console.log("update", result);
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
