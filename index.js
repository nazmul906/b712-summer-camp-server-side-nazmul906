const express = require("express");
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
const stripe = require("stripe")(process.env.stipeSecretKey);
const jwt = require("jsonwebtoken");
// to get data from env file

// middleware
app.use(cors());
app.use(express.json());

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
    // await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db("SummerCamp").collection("users");

    const classCollection = client.db("SummerCamp").collection("allclass");
    const paymentCollection = client.db("SummerCamp").collection("payments");
    // admin verification middlewaware
    // this middleware is written here cuz we need db connvtn to check it

    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
    const verifyInstructor = async (req, res, next) => {
      email = req.decoded.email;
      const query = { email: email };

      const user = await userCollection.findOne(query);
      if (user?.role !== "instructor") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
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
    // todo:Social login check
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      //   console.log(user);
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user exists here.dont add" });
      }

      const result = await userCollection.insertOne(user);
      console.log("register", result);
      res.send(result);
    });

    // only admin can see all user
    //todo: secured this request for admin
    app.get("/users", verifyJwt, verifyAdmin, async (req, res) => {
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

    // now make instructor via admin
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

    // check whether the user admin/not//for useAdmin hook
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

    // check whether instructor or not for useInstructor hooks

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

    // it will be in admin dashboard to check all the class in manage class
    // const { email } = req.query;
    // const query = { email: email };
    app.get("/myclass", async (req, res) => {
      // const { email } = req.query;

      // let enrollment = {};
      // if(req.query?.email){}
      const query = { email: email };
      // const query2 = { _id: id };

      const result = await classCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // select
    // app.post("/myclass", async (req, res) => {
    //   const { item } = req.body;
    //   const filter = { _id: _id };
    //   const result = classCollection.insertOne();
    //   res.send(result);
    // });

    //check select from allclass
    app.put("/myclass/select/:id", async (req, res) => {
      const id = req.params.id;
      const { enrollment } = req.body;
      // wrong way
      // const query = { _id: id };

      //right way
      const query = { _id: new ObjectId(id) };
      // try {
      // Find the class document based on the item ID
      const classDocument = await classCollection.findOne(query);
      // console.log("selected item", classDocument);
      if (classDocument) {
        const updatedEnrollment = classDocument.enrollment
          ? [...classDocument.enrollment, enrollment]
          : [enrollment];
        // console.log("updatedEnrollment", updatedEnrollment);

        const updateDoc = {
          $set: { enrollment: updatedEnrollment },
        };

        const result = await classCollection.updateOne(query, updateDoc);
        res.send(result);
        // console.log("res", result);
        //   if (result.modifiedCount === 1) {
        //     res.status(200).json({ message: "Class updated successfully" });
        //   } else {
        //     res.status(500).json({ error: "Failed to update class" });
        //   }
        // } else {
        //   // If the class document is not found, return an error response
        //   res.status(404).json({ error: "Class not found" });
        // }
        // } catch (error) {
        //   res
        //     .status(500)
        //     .json({ error: "An error occurred while updating the class" });
      }
    });

    // delete my selected class

    app.patch("/myclass/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const classDocument = await classCollection.findOne(query);
      if (!classDocument) {
        return res.status(404).json({ error: "Class not found" });
      }

      const { emailToDelete } = req.body;

      const updatedEnrollment = classDocument.enrollment.filter(
        (email) => email !== emailToDelete
      );

      const updateDoc = {
        $set: {
          enrollment: updatedEnrollment,
        },
      };

      const result = await classCollection.updateOne(query, updateDoc);

      res.json(result);
    });

    // approved by admin
    app.patch("/myclass/approve/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: "approved",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      // console.log("update", result);
      res.send(result);
    });

    // deny by admin

    app.patch("/myclass/deny/:id", async (req, res) => {
      const id = req.params.id;
      // find the item
      const filter = { _id: new ObjectId(id) };
      // update it
      const updateDoc = {
        $set: {
          status: "denied by admin",
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      console.log("denied", result);
      res.send(result);
    });

    // send feedback by admin
    app.put("/myclass/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const { feedback } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          feedback: feedback,
        },
      };
      const result = await classCollection.updateOne(filter, updateDoc);
      console.log("updated", result);
      res.send(result);
    });

    // show allclass approved by admin in nav allclass
    app.get("/approveclass", async (req, res) => {
      const query = { status: "approved" };
      const result = await classCollection.find(query).toArray();
      //   console.log(result);
      res.send(result);
    });

    // instructor info in nav
    // take those from user whose role are instructor
    app.get("/instructors", async (req, res) => {
      const query = { role: "instructor" };
      const result = await userCollection.find(query).toArray();
      // console.log(result);
      res.send(result);
    });

    // todo: this class should be the approved class by admin before rendering to allclass navbar
    // app.get("/allclass", async (req, res) => {
    //   const { id } = req.query;
    //   const query = { _id: id };
    //   const result = await classCollection.find(query).toArray();
    //   console.log("allclass", result);

    //   res.send(result);
    // });

    // payment intent
    app.post("/create-payment-intent", verifyJwt, async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);

      // console.log(price, amount);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // payment related api
    // app.post("/payments", verifyJwt, async (req, res) => {
    //   const payment = req.body;
    //   const insertResult = await paymentCollection.insertOne(payment);

    //   // const query = {
    //   //   _id: { $in: payment.cartItems.map((id) => new ObjectId(id)) },
    //   // };
    //   // const deleteResult = await cartCollection.deleteMany(query);

    //   const email = payment.email;

    //   const filter = { enrollment: email };
    //   const updateDoc = {
    //     $set: { paidEnrollment: email },
    //   };

    //   const updateResult = await classCollection.updateMany(filter, updateDoc);

    //   console.log("paid enrolled", updateResult);
    //   res.send({ insertResult, updateResult });

    //   // res.send({ insertResult });
    // });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const insertResult = await paymentCollection.insertOne(payment);

      const email = payment.email;

      // Find the class document based on the user email
      const classDocument = await classCollection.findOne({
        enrollment: email,
      });

      // console.log("classDocPay", classDocument);

      if (classDocument) {
        const classId = classDocument._id;
        const paidEnrollment = classDocument.paidEnrollment || [];
        const updatedEnrollment = [...paidEnrollment, email];

        // console.log("paidEnrollment before update", paidEnrollment);
        // console.log("updatedEnrollment", updatedEnrollment);

        // Update the class document with the updated enrollment array
        const updateResult = await classCollection.updateOne(
          { _id: classId },
          { $set: { paidEnrollment: updatedEnrollment } }
        );

        // console.log("update pay", updateResult);
        res.send({ insertResult, updateResult });
      } else {
        res.status(404).json({ error: "No class found for the payment email" });
      }
    });

    app.get("/payment", async (req, res) => {
      const { email } = req.query;

      const query = { email: email };
      const payment = await paymentCollection.find(query).toArray();
      console.log(payment);
      res.send(payment);
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
