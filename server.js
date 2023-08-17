const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DBUser = process.env.DBUser;
const DBPassword = process.env.DBPassword;
const uri = `mongodb+srv://${DBUser}:${DBPassword}@cluster0.jqo1zug.mongodb.net`
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("vworkspace");
    const usersCollection = database.collection("users");
    const classesCollection = database.collection("classes");
    const projectsCollection = database.collection("projects");
    const assignmentsCollection = database.collection("assignments");


    // POST USERS
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(user);
      res.json(result);
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
      console.log(updatedProfile);
      res.json(result);
    });
    // GET USER BY EMAIL
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);
      console.log(user, "ind");
      res.json(user);
    });


    // ASSIGNMENT POST
    app.post("/assignments", async (req, res) => {
      const user = req.body;
      const result = await assignmentsCollection.insertOne(user);
      res.json(result);
    });
    // GET ASSIGNEMNTS
    app.get("/assignments", async (req, res) => {
      const cursor = assignmentsCollection.find();
      const assignments = await cursor.toArray();
      res.json(assignments);
    });
    // GET INDIVIDUAL ASSIGNEMNTS
    app.get("/assignments/:postID", async (req, res) => {
      const postID = req.params.postID;
      const filter = { postID: postID };
      const user = await assignmentsCollection.findOne(filter);
      res.json(user);
    });
    
    // POST CLASSROOM
    app.post("/classes", async (req, res) => {
      const user = req.body;
      const result = await classesCollection.insertOne(user);
      res.json(result);
      //  (result);
    });
    // UPDATE STUDENT INFOR WHEN JOIN IN CLASSROOM
    app.put("/classes/join/student", async (req, res) => {
      const joinData = req.body;
      const filter = { code: joinData.code };
      const updateDoc = {
        $push: { studentInfo: joinData },
      };
      // const options = { upsert: true };
      const result = await classesCollection.updateMany(
        filter,
        updateDoc
        // options
      );
      res.json(result);
    });
    // UPDATE AN ANNOUNCEMENT IN CLASSROOM
    app.put("/classes/posts/:code", async (req, res) => {
      const code = req.params.code;
      const announcementData = req.body;
      const filter = { code: code };
      const updateDoc = {
        $push: { posts: announcementData },
      };
      // const options = { upsert: true };
      const result = await classesCollection.updateMany(filter, updateDoc);
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
    });
    // ASSIGN PROJECT IN THE CLASS
    app.put("/classes/assign", async (req, res) => {
      const assign = req.body;
      const filter = { code: assign.code };
      const updateDoc = {
        $push: { assign },
      };
      const result = await classesCollection.updateOne(filter, updateDoc);
    });
    // POST PROJECTS
    app.post("/projects", async (req, res) => {
      const user = req.body;
      const result = await projectsCollection.insertOne(user);
      res.json(result);
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
    // INSERT POSTS FROM PROJECTS CLASS
    app.put("/projects/:id", async (req, res) => {
      const id = req.params.id;
      const post = req.body;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $push: { post },
      };
      const result = await projectsCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send( `Hello from virtual workspace!`);
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
