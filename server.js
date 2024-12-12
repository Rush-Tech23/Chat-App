import express from "express";
import { MongoClient, ServerApiVersion } from "mongodb";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const port = 3000;


app.use(cors());
app.use(express.json());


const uri =
  "mongodb+srv://rushikesh22:T1KHFGws6Dosu0Ec@cluster0.desf8.mongodb.net/chats?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});


async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    return client.db("chats");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

let db;

connectToDatabase().then((database) => {
  db = database;

 
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});


io.on("connection", (socket) => {
  console.log("New client connected");


  socket.on("sendMessage", (data) => {
    console.log("Message received:", data);

 
    db.collection("messages")
      .insertOne({
        sender: data.sender,
        text: data.text,
        timestamp: new Date(),
      })
      .then((result) => {
        console.log("Message saved:", result);
        io.emit("receiveMessage", data);
      })
      .catch((err) => console.error("Error saving message:", err));
  });

 
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});


app.get("/messages", async (req, res) => {
  try {
    const messages = await db
      .collection("messages")
      .find()
      .sort({ timestamp: 1 }) 
      .toArray();
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});


app.post("/messages", async (req, res) => {
  try {
    const { sender, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Message text is required" });
    }


    const result = await db.collection("messages").insertOne({
      sender,
      text,
      timestamp: new Date(),
    });

    res.status(201).json({ id: result.insertedId, sender, text });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

