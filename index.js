require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "frontend")));

const client = new MongoClient(uri);

let usersCollection;
let projectsCollection;

async function connectDB() {
  if (!uri) {
    throw new Error("Falta MONGO_URI en las variables de entorno.");
  }

  await client.connect();
  console.log("Conectado a MongoDB");

  const db = client.db("miBase");
  usersCollection = db.collection("users");
  projectsCollection = db.collection("projects");
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No autorizado" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}

function ensureCollections(res) {
  if (!usersCollection || !projectsCollection) {
    res.status(503).json({ message: "Base de datos no disponible" });
    return false;
  }

  return true;
}

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "backend-portafolio" });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

app.post("/register", async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const userExists = await usersCollection.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await usersCollection.insertOne({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error("Error en register:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/login", async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const user = await usersCollection.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email
      },
      jwtSecret,
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
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.get("/users", authMiddleware, async (_req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const users = await usersCollection.find().toArray();

    res.json(
      users.map(user => ({
        _id: user._id,
        name: user.name,
        email: user.email
      }))
    );
  } catch (error) {
    console.error("Error en users:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.get("/projects", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const projects = await projectsCollection
      .find({ userId: req.user.id })
      .sort({ _id: -1 })
      .toArray();

    res.json(projects);
  } catch (error) {
    console.error("Error al obtener proyectos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.post("/projects", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const status = req.body.status?.trim() || "pendiente";

    if (!title || !description) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const newProject = {
      title,
      description,
      status,
      userId: req.user.id
    };

    const result = await projectsCollection.insertOne(newProject);

    res.status(201).json({
      ...newProject,
      _id: result.insertedId
    });
  } catch (error) {
    console.error("Error al crear proyecto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.put("/projects/:id", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const { id } = req.params;
    const title = req.body.title?.trim();
    const description = req.body.description?.trim();
    const status = req.body.status?.trim();

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    if (!title || !description || !status) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    const result = await projectsCollection.updateOne(
      {
        _id: new ObjectId(id),
        userId: req.user.id
      },
      {
        $set: {
          title,
          description,
          status
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.json({ message: "Proyecto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar proyecto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.delete("/projects/:id", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }

    const result = await projectsCollection.deleteOne({
      _id: new ObjectId(id),
      userId: req.user.id
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Proyecto no encontrado" });
    }

    res.json({ message: "Proyecto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar proyecto:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.put("/users/:id", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();

    if (!isValidObjectId(id) || id !== req.user.id) {
      return res.status(403).json({ message: "No permitido" });
    }

    if (!name || !email) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name,
          email
        }
      }
    );

    res.json({ message: "Usuario actualizado" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.delete("/users/:id", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    const { id } = req.params;

    if (!isValidObjectId(id) || id !== req.user.id) {
      return res.status(403).json({ message: "No permitido" });
    }

    await usersCollection.deleteOne({
      _id: new ObjectId(id)
    });

    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

app.delete("/me", authMiddleware, async (req, res) => {
  if (!ensureCollections(res)) {
    return;
  }

  try {
    await usersCollection.deleteOne({
      _id: new ObjectId(req.user.id)
    });

    await projectsCollection.deleteMany({
      userId: req.user.id
    });

    res.json({ message: "Cuenta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  });
