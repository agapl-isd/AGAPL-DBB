const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.knujmnx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// MongoDB Client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Helper Function to Get Collection
async function getDatabaseCollection(collectionName) {
  if (!client.isConnected()) {
    await client.connect();
  }
  return client.db("bankStatement").collection(collectionName);
}

// Routes
app.post("/addUser", async (req, res) => {
  try {
    const user = req.body;
    const userDataCollection = await getDatabaseCollection("userData");

    const existingUser = await userDataCollection.findOne({ email: user.email });
    if (existingUser) {
      return res.send({ message: "User already exists" });
    }

    const result = await userDataCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).send("Server error");
  }
});

app.get("/userData", async (req, res) => {
  try {
    const userEmail = req.query.email;
    if (!userEmail) {
      return res.send([]);
    }

    const userDataCollection = await getDatabaseCollection("userData");
    const result = await userDataCollection.find({ email: userEmail }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/users/admin/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const userDataCollection = await getDatabaseCollection("userData");

    const user = await userDataCollection.findOne({ email });
    const result = { admin: user?.role === "admin" };
    res.send(result);
  } catch (error) {
    console.error("Error checking admin role:", error);
    res.status(500).send("Server error");
  }
});

app.patch("/addBanksData", async (req, res) => {
  try {
    const addBanksData = req.body;
    const date = addBanksData.date;

    if (!date) {
      return res.status(400).send("Date field is required.");
    }

    const bankDataCollection = await getDatabaseCollection("bankData");
    const filter = { date };
    const update = { $set: {} };

    for (const field in addBanksData) {
      if (addBanksData[field]) {
        update.$set[field] = addBanksData[field];
      }
    }

    const options = { upsert: true };
    const result = await bankDataCollection.updateOne(filter, update, options);
    res.send(result);
  } catch (error) {
    console.error("Error updating bank data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/allBankData", async (req, res) => {
  try {
    const bankDataCollection = await getDatabaseCollection("bankData");
    const result = await bankDataCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching all bank data:", error);
    res.status(500).send("Server error");
  }
});

app.get("/singleBankData", async (req, res) => {
  try {
    const { date } = req.query;
    const bankDataCollection = await getDatabaseCollection("bankData");

    const result = await bankDataCollection.find({ date }).toArray();
    res.send(result);
  } catch (error) {
    console.error("Error fetching single bank data:", error);
    res.status(500).send("Server error");
  }
});

// Test Route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on PORT: ${PORT}`);
});
