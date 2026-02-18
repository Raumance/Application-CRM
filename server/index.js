import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/mon-site-web";

// Middlewares
app.use(cors());
app.use(express.json());

// Schéma / Modèle simple pour tester (ex: messages)
const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

// Routes
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.post("/api/messages", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Le champ 'text' est obligatoire" });
    }

    const message = await Message.create({ text });
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Connexion MongoDB et lancement serveur
async function start() {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ Connecté à MongoDB");

    app.listen(port, () => {
      console.log(`🚀 Serveur backend démarré sur http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
    process.exit(1);
  }
}

start();

