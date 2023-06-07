const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 5000;
const app = express();
// middleware
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to foreign laguage school");
});

app.listen(port, (req, res) => {
  console.log(`post is runnig on ${port}`);
});
