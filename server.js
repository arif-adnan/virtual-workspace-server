const http = require(`http`);
const express = require("express");
const app = express();
const server = http.createServer(app);
const socketio = require("socket.io");
const io = socketio(server);
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const { addUser, removeUser, getUser, getUsersInRoom } = require("./users");

const port = process.env.PORT || 5000;
const socketPort = process.env.SOCKETPORT || 4000;

app.use(cors());
app.use(express.json());

const DBUser = process.env.DBUser;
const DBPassword = process.env.DBPassword;
const uri = `mongodb+srv://${DBUser}:${DBPassword}@cluster0.qmcox.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("vclass");
    const usersCollection = database.collection("users");
    const classesCollection = database.collection("classes");
    const projectsCollection = database.collection("projects");

    // POST USERS
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
      console.log(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const users = await cursor.toArray();
      res.json(users);
    });

    // UPDATE USERS
    app.put("/users/:email", async (req, res) => {
      const email = req.params.email;
      const updatedProfile = req.body;
      console.log(updatedProfile);
      const filter = { email: email };
      const updateDoc = {
        $set: { type: updatedProfile.type },
      };
      const options = { upsert: true };
      const result = await usersCollection.updateMany(
        filter,
        updateDoc,
        options
      );
      res.json(result);
      console.log(result, "check if it works");
    });

    // GET USER BY EMAIL
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      res.json(user);
    });

    // POST CLASSROOM
    app.post("/classes", async (req, res) => {
      const user = req.body;
      const result = await classesCollection.insertOne(user);
      res.json(result);
      // console.log(result);
    });

    // POST AN ANNOUNCEMENT IN CLASSROOM
    app.put("/classes/posts/:code", async (req, res) => {
      const code = req.params.code;
      const announcementData = req.body;
      const filter = { code: code };
      const updateDoc = {
        $push: { posts: announcementData },
      };
      // const options = { upsert: true };
      const result = await classesCollection.updateMany(
        filter,
        updateDoc
        // options
      );
      res.json(result);
    });

    // GET CLASSROOM
    app.get("/classes", async (req, res) => {
      const cursor = classesCollection.find();
      const classes = await cursor.toArray();
      res.json(classes);
    });

    // GET CLASS WITH CODE
    app.get("/classes/:code", async (req, res) => {
      const code = req.params.code;
      const filter = { code: code };
      const cl = await classesCollection.findOne(filter);
      res.json(cl);
    });

    // GET INDIVIDUAL CLASS WITH ID
    // app.get("/classroom/:postID", async (req, res) => {
    //   const id = req.params.postID;
    //   const filter = { postID: id };
    //   const cl = await classesCollection.findOne(filter);
    //   res.json(cl);
    // });

    // INSERT CLASS INFO IN THE USERS
    app.put("/users/join/:email", async (req, res) => {
      const email = req.params.email;
      const joinedClass = req.body;
      const filter = { email: email };
      const updateDoc = {
        $push: {
          classInfo: { joinedClass },
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
      console.log(result);
    });

    // ASSIGN PROJECT IN THE CLASS
    app.put("/classes/assign", async (req, res) => {
      const assign = req.body;
      const filter = { code: assign.code };
      const updateDoc = {
        $push: { assign },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
      console.log(result);
    });

    // POST PROJECTS
    app.post("/projects", async (req, res) => {
      const user = req.body;
      const result = await projectsCollection.insertOne(user);
      res.json(result);
      // console.log(result);
    });

    // GET PROJECTS
    app.get("/projects", async (req, res) => {
      const cursor = projectsCollection.find();
      const projects = await cursor.toArray();
      res.json(projects);
    });

    // GET PROJECT BY ID
    app.get("/projects/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await projectsCollection.findOne(query);
      res.json(result);
    });

    // INSERT POSTS FRON PROJECTS CLASS
    app.put("/projects/:id", async (req, res) => {
      const id = req.params.id;
      const post = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $push: { post },
      };
      const result = await projectsCollection.updateOne(filter, updateDoc);
      res.json(result);
      console.log(result);
    });
  } finally {
    // await client.close();
  }
}

io.on("connect", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
    });
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!` });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit("message", { user: user.name, text: message });

    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: "Admin",
        text: `${user.name} has left.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Virtual Class");
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});

server.listen(socketPort, () => console.log(`Listening on port ${socketPort}`));
