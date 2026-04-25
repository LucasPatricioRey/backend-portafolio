require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;
let usersCollection;
let projectsCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log("Conectado a MongoDB 🚀");

    db = client.db("miBase");
    usersCollection = db.collection("users");
    projectsCollection = db.collection("projects");
  } catch (error) {
    console.log("Error al conectar", error);
  }
}

connectDB();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

// CREAR PROYECTO
app.post("/projects", authMiddleware, async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const newProject = {
    title,
    description,
    status: "pendiente",
    userId: req.user.id
  };

  await projectsCollection.insertOne(newProject);

  res.status(201).json(newProject);
});

// OBTENER PROYECTOS DEL USUARIO
app.get("/projects", authMiddleware, async (req, res) => {
  const projects = await projectsCollection
    .find({ userId: req.user.id })
    .toArray();

  res.json(projects);
});

// ELIMINAR PROYECTO
app.delete("/projects/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;

  await projectsCollection.deleteOne({
    _id: new ObjectId(id),
    userId: req.user.id
  });

  res.json({ message: "Proyecto eliminado" });
});

// REGISTER
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const userExists = await usersCollection.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "El email ya está registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    name,
    email,
    password: hashedPassword
  };

  await usersCollection.insertOne(newUser);

  res.status(201).json({ message: "Usuario registrado correctamente" });
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Faltan datos" });
  }

  const user = await usersCollection.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  if (!user.password) {
    return res.status(400).json({ message: "Usuario sin contraseña registrada" });
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h"
    }
  );

  res.json({
    message: "Login correcto",
    token,
    user: {
      name: user.name,
      email: user.email
    }
  });
});

// GET usuarios protegidos
app.get("/users", authMiddleware, async (req, res) => {
  const users = await usersCollection.find().toArray();

  const usersSafe = users.map(user => ({
    _id: user._id,
    name: user.name,
    email: user.email
  }));

  res.json(usersSafe);
});

// UPDATE usuario protegido
app.put("/users/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;

  await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: req.body.name,
        email: req.body.email
      }
    }
  );

  res.json({ message: "Usuario actualizado" });
});

// DELETE usuario por ID protegido
app.delete("/users/:id", authMiddleware, async (req, res) => {
  const id = req.params.id;

  await usersCollection.deleteOne({
    _id: new ObjectId(id)
  });

  res.json({ message: "Usuario eliminado" });
});

// DELETE cuenta propia
app.delete("/me", authMiddleware, async (req, res) => {
  await usersCollection.deleteOne({
    _id: new ObjectId(req.user.id)
  });

  res.json({ message: "Cuenta eliminada correctamente" });
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});