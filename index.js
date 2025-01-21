const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knujmnx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const userDataCollection = client
      .db("bankStatement")
      .collection("userData");
    const bankDataCollection = client
      .db("bankStatement")
      .collection("bankData");

    app.post("/addUser", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userDataCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "user already exists" });
      }

      const result = await userDataCollection.insertOne(user);
      res.send(result);
    });

    app.get("/userData", async (req, res) => {
      const userEmail = req.query.email;
      if (!userEmail) {
        res.send([]);
      }

      const query = { email: userEmail };
      const result = await userDataCollection.find(query).toArray();
      res.send(result);
    });

    // admin apis
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await userDataCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    });

    app.patch("/addBanksData", async (req, res) => {
      const addBanksData = req.body;
      const date = addBanksData.date;

      if (!date) {
        res.status(400).send("Date field is required.");
        return;
      }

      const filter = { date: date };
      const update = { $set: {} };

      for (const field of [
        "BankAlfalahLtd",
        "HSBC",
        "SCB",
        "DhakaBankLtd",
        "DhakaBankLtdOD",
        "WooriBank",
        "PrimeBankLtd",
        "TheCityBankLtd",
        "BankAsia",
        "CitibankNA",
        "HabibBankLtd",
        "EasternBankLtd",
        "BRACBankLtd",
        "StateBankOfIndia",
        "DutchBanglaBankLtd",
        "DutchBanglaBankLtdOD",
        "TheCityBankLtdOD",
        "PrimeBankLtdOD",
        "StateBankOfIndiaOD",
        "MIDLANDBankLimited",
        "PubaliBankLtd",
        "IslamiBankBangladeshLtd",
        "ShahjalalIslamiBankLtd",
        "AlarafahIslamiBankLtd",
        "UnitedCommercialBankLtd",
        "SocialIslamiBankLtd",
        "MercentileBankLtd",
        "NationalBankLtdGulshan",
        "NationalBankLtdJoina",
        "SonaliBankLtd",
        "UttaraBankLtd",
        "AgraniBankLtd",
        "BangladeshKrishiBank",
        "ABBankLtd",
        "JanataBankLtd",
        "RupaliBankLtd",
        "total",
        "savings_account",
        "sfm_rfm",
        "lc",
        "od",
        "scb",
      ]) {
        if (addBanksData[field]) {
          update.$set[field] = addBanksData[field];
        }
      }

      const options = { upsert: true }; // Create a new document if it doesn't exist

      try {
        const result = await bankDataCollection.updateOne(
          filter,
          update,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating data:", error);
        res.status(500).send("Error updating data");
      }
    });

    app.get("/allBankData", async (req, res) => {
      const cursor = bankDataCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/singleBankData", async (req, res) => {
      const { date } = req.query;
      const cursor = bankDataCollection.find({ date });
      const result = await cursor.toArray();
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

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(PORT, () => {
  console.log(`server is running on PORT: ${PORT}`);
});
