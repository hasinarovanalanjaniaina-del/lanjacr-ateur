import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import fs from "fs";
import multer from "multer";
import { INITIAL_PROJECTS } from "./src/data/initialProjects";
import { Project } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Universal body parsers
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ limit: "150mb", extended: true }));

// Setup safe physical uploads directory for portfolio project creations (MP4, MP3, GIF, PNG, etc.)
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// Configure storage for multer to save files in the physical public uploads folder with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Prevent directory traversal or special characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
});

// Endpoint to upload realization assets (video, audio, GIF, photo, PDF, etc.) physically to the server
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("[Upload API - Multer Error]", err);
      return res.status(400).json({ 
        error: `Erreur d'importation : ${err.message || "Fichier incorrect ou trop volumineux."}` 
      });
    }

    try {
      if (!req.file) {
        // Fallback: Check if the client did a direct Base64 JSON upload of the asset
        if (req.body && req.body.fileData && req.body.filename) {
          const { filename, fileData } = req.body;
          const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          let buffer: Buffer;
          if (matches && matches.length === 3) {
            buffer = Buffer.from(matches[2], "base64");
          } else {
            buffer = Buffer.from(fileData, "base64");
          }
          const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
          const uniqueName = `${Date.now()}-${safeName}`;
          const targetPath = path.join(uploadsDir, uniqueName);
          fs.writeFileSync(targetPath, buffer);
          console.log(`[Upload API - Base64 Fallback] Successfully saved file to: ${targetPath}`);
          return res.json({ success: true, url: `/uploads/${uniqueName}` });
        }
        
        return res.status(400).json({ error: "Aucun fichier ou contenu n'a été fourni." });
      }

      const safeUrl = `/uploads/${req.file.filename}`;
      console.log(`[Upload API - Multer] Successfully saved file: ${req.file.filename}`);
      return res.json({ success: true, url: safeUrl });
    } catch (catchErr: any) {
      console.error("[Upload API - Catch Handler]", catchErr);
      return res.status(500).json({ error: `Erreur interne de sauvegarde : ${catchErr.message || catchErr}` });
    }
  });
});

// Database initialization
const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    password?: string;
    registeredAt: string;
  }>;
  connections: Array<{
    id: string;
    name: string;
    email: string;
    timestamp: string;
    event: "Inscription" | "Connexion" | "Déconnexion";
  }>;
  messages: Array<{
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    date: string;
    read: boolean;
  }>;
  portraits?: Array<string>;
  activePortrait?: string;
  projects?: Array<Project>;
}

// Ensure database file exists and patch admin credentials if needed
function initDB() {
  const defaultAdmin = {
    id: "visitor-admin",
    name: "Lanja Créateur",
    email: "hasinarovanalanjaniaina@gmail.com",
    password: "Andrianjaka,123",
    registeredAt: new Date().toISOString()
  };

  if (!fs.existsSync(DB_FILE)) {
    const defaultData: DatabaseSchema = {
      users: [defaultAdmin],
      connections: [],
      messages: [],
      projects: INITIAL_PROJECTS
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
  } else {
    // If the database.json file already exists, let's make sure the password matches Andrianjaka,123
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content) as DatabaseSchema;
      let updated = false;

      if (!db.users) {
        db.users = [];
      }

      if (!db.projects) {
        db.projects = INITIAL_PROJECTS;
        updated = true;
      }

      const adminIndex = db.users.findIndex((u) => u.email === "hasinarovanalanjaniaina@gmail.com");
      if (adminIndex !== -1) {
        if (db.users[adminIndex].password !== "Andrianjaka,123") {
          db.users[adminIndex].password = "Andrianjaka,123";
          updated = true;
          console.log("[initDB] Updated admin password to Andrianjaka,123 in database.json");
        }
      } else {
        db.users.push(defaultAdmin);
        updated = true;
        console.log("[initDB] Inserted default admin user in existing database.json");
      }

      if (updated) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }
    } catch (err) {
      console.error("Failed to patch admin password in existing database.json:", err);
    }
  }
}

// Read database
function readDB(): DatabaseSchema {
  initDB();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database.json, returning empty template:", err);
    return { users: [], connections: [], messages: [] };
  }
}

// Write database
function writeDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing database.json:", err);
  }
}

// Temporary log list for testing
interface OutboxMail {
  id: string;
  email: string;
  name: string;
  timestamp: string;
  subject: string;
  body: string;
}
const outboxMailLogs: OutboxMail[] = [];

// Lazy creation of SMTP transporter to avoid boot crashes
let smtpTransporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter | null {
  if (smtpTransporter) return smtpTransporter;

  const user = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.MAIL_PASS;
  let host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
  
  // Clean host in case of protocol prefix, slashes, or trailing path/port
  host = host.trim().replace(/^(https?:|smtp:|smtps:)?\/\//i, '');
  host = host.split(':')[0].split('/')[0];

  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587");

  if (!user || !pass) {
    return null; // Gracefully fall back to local outbox dashboard
  }

  try {
    smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || port === 993,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    return smtpTransporter;
  } catch (err) {
    console.error("Error creating SMTP transporter:", err);
    return null;
  }
}

// Helper function to send email notification on account creation/login
async function sendWelcomeEmail(email: string, name: string) {
  const transporter = getTransporter();
  const cleanEmail = email.toLowerCase().trim();
  const formattedName = name ? name.trim() : "Cher Visiteur";

  const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; background-color: #0b1329; border: 1px solid #1e293b; border-radius: 16px; color: #f8fafc;">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #22d3ee; padding: 4px 12px; background-color: rgba(34, 211, 238, 0.1); border-radius: 9999px; border: 1px solid rgba(34, 211, 238, 0.15);">Lanja Créateur</span>
        <h2 style="font-size: 20px; font-weight: bold; margin-top: 12px; margin-bottom: 0; color: #ffffff;">Bienvenue dans notre Communauté</h2>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
        Bonjour <strong>${formattedName}</strong>,<br/>
        Votre compte visiteur sur le portfolio officiel de **Lanja Créateur** a été enregistré avec succès dans notre base de données.
      </p>

      <div style="text-align: center; background: #020617; border: 1px solid #334155; padding: 20px; border-radius: 12px; margin: 24px 0;">
        <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px;">Authentification Active</span>
        <span style="font-size: 18px; font-weight: bold; color: #22d3ee; display: block;">Accès Membre Autorisé</span>
        <span style="font-size: 11px; color: #64748b; display: block; margin-top: 8px;">Adresse e-mail enregistrée : ${cleanEmail}</span>
      </div>
      
      <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px;">
        Vous pouvez dès à présent interagir, poster des avis, et envoyer vos messages et formulaires de contact personnalisés.
      </p>
      
      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #64748b; font-family: monospace;">
        Notification automatique par Lanja Créateur © 2026
      </div>
    </div>
  `;

  // Log to outbox log for preview inspection
  outboxMailLogs.push({
    id: `welcome-${Date.now()}`,
    email: cleanEmail,
    name: formattedName,
    timestamp: new Date().toLocaleTimeString("fr-FR"),
    subject: "Bienvenue sur le portfolio de Lanja Créateur !",
    body: htmlContent
  });

  if (transporter) {
    try {
      const activeUser = process.env.SMTP_USER || process.env.EMAIL_USER || process.env.MAIL_USER || "lanja.createur@gmail.com";
      await transporter.sendMail({
        from: `"Lanja Créateur" <${activeUser}>`,
        to: cleanEmail,
        subject: "Confirmation d'Inscription - Lanja Créateur",
        html: htmlContent,
        text: `Bonjour ${formattedName},\n\nVotre compte a été créé avec succès sur le portfolio de Lanja Créateur.\n\nCordialement,\nLanja Créateur`
      });
      console.log(`Confirmation email sent successfully to ${cleanEmail}`);
    } catch (err) {
      console.error("SMTP Welcome email failed:", err);
    }
  }
}

// -------------------------------------------------------------
// API ENDPOINTS
// -------------------------------------------------------------

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Outbox simulator logs for testing
app.get("/api/auth/outbox", (req, res) => {
  res.json({ mails: outboxMailLogs.slice(-10).reverse() });
});

// Clear outbox
app.post("/api/auth/outbox/clear", (req, res) => {
  outboxMailLogs.length = 0;
  res.json({ success: true });
});

// List Subscribers (Subscribers / Registered Visitors) - accessible by Admin
app.get("/api/database/users", (req, res) => {
  const db = readDB();
  res.json({ users: db.users });
});

// List Connections History logs
app.get("/api/database/connections", (req, res) => {
  const db = readDB();
  res.json({ connections: db.connections });
});

// Clear Connections History logs
app.post("/api/database/connections/clear", (req, res) => {
  const db = readDB();
  db.connections = [];
  writeDB(db);
  res.json({ success: true });
});

// Get all stored messages on the server database
app.get("/api/database/messages", (req, res) => {
  const db = readDB();
  res.json({ messages: db.messages });
});

// Post / save a message on the server database
app.post("/api/database/messages/add", (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Champs obligatoires manquants." });
  }

  const db = readDB();
  const newMessage = {
    id: `msg-${Date.now()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    subject: (subject || "Général").trim(),
    message: message.trim(),
    date: new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }),
    read: false
  };

  db.messages.unshift(newMessage);
  writeDB(db);

  res.json({ success: true, message: newMessage });
});

// Delete a message on the server database
app.delete("/api/database/messages/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  db.messages = db.messages.filter((m) => m.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// --- PROJECT REALISATIONS API ENDPOINTS ---

// Get all projects
app.get("/api/database/projects", (req, res) => {
  const db = readDB();
  if (!db.projects || db.projects.length === 0) {
    db.projects = INITIAL_PROJECTS;
    writeDB(db);
  }
  res.json({ success: true, projects: db.projects });
});

// Save (create or update) projects list
app.post("/api/database/projects", (req, res) => {
  const { projects } = req.body;
  if (!Array.isArray(projects)) {
    return res.status(400).json({ error: "La liste des projets est de format incorrect." });
  }
  const db = readDB();
  db.projects = projects;
  writeDB(db);
  res.json({ success: true, projects: db.projects });
});

// Delete a single project by id
app.delete("/api/database/projects/:id", (req, res) => {
  const { id } = req.params;
  const db = readDB();
  if (db.projects) {
    db.projects = db.projects.filter((p) => p.id !== id);
    writeDB(db);
  }
  res.json({ success: true, projects: db.projects || [] });
});

// Mark messages as read
app.post("/api/database/messages/read-all", (req, res) => {
  const db = readDB();
  db.messages = db.messages.map((m) => ({ ...m, read: true }));
  writeDB(db);
  res.json({ success: true });
});

// Upload and replace custom portrait of Lanja physically on disk
app.post("/api/database/upload-portrait", (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Aucune image fournie." });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = path.join(process.cwd(), "src", "assets", "images", "lanja_portrait.png");
    
    // Ensure nested folders exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    
    // Write physical file to replace the layout asset on disk
    fs.writeFileSync(filePath, buffer);
    console.log(`[upload-portrait] Successfully updated physical image asset at ${filePath}`);
    
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[upload-portrait] Failed to write image to disk:", err);
    return res.status(500).json({ error: "Échec de l'enregistrement physique du fichier image." });
  }
});

// --- MULTIPLE PROFILE PORTRAITS GALLERY ENDPOINTS ---

let cachedDefaultBase64 = "";
function getDefaultPortraitBase64(): string {
  if (!cachedDefaultBase64) {
    const filePath = path.join(process.cwd(), "src", "assets", "images", "lanja_portrait.png");
    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        cachedDefaultBase64 = `data:image/png;base64,${fileBuffer.toString("base64")}`;
      } catch (ex) {
        console.error("[portraits] Failed to read default portrait:", ex);
      }
    }
  }
  return cachedDefaultBase64;
}

// Get all profile portraits and the active one
app.get("/api/database/portraits", (req, res) => {
  try {
    const db = readDB();
    let portraits = db.portraits || [];
    let activePortrait = db.activePortrait || "";

    // Automatically seed the default image into the database if the collection is empty
    if (portraits.length === 0) {
      const defaultBase64 = getDefaultPortraitBase64();
      if (defaultBase64) {
        portraits = [defaultBase64];
        activePortrait = defaultBase64;
        
        db.portraits = portraits;
        db.activePortrait = activePortrait;
        writeDB(db);
        console.log("[portraits] Successfully seeded default portrait image from disk into backend database.");
      }
    }

    // Deduplicate portraits
    portraits = portraits.filter((val, i, arr) => arr.indexOf(val) === i);

    // If there is any custom uploaded portrait in the collection, filter out the unwanted default stranger template portrait
    const defaultImg = getDefaultPortraitBase64();
    const hasCustom = portraits.some(img => img !== defaultImg);
    if (hasCustom && portraits.length > 1) {
      portraits = portraits.filter(img => img !== defaultImg);
      db.portraits = portraits;
      if (activePortrait === defaultImg) {
        activePortrait = portraits[0] || "";
        db.activePortrait = activePortrait;
      }
      writeDB(db);
    }

    // Fallback activePortrait to the first available portrait if missing or not in the final list
    if (!activePortrait || !portraits.includes(activePortrait)) {
      activePortrait = portraits[0] || "";
    }

    res.json({
      success: true,
      portraits,
      activePortrait
    });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de lire la collection." });
  }
});

// Add a portrait to the collection
app.post("/api/database/portraits", (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Aucune image fournie." });
  }

  try {
    const db = readDB();
    if (!db.portraits) {
      db.portraits = [];
    }

    db.portraits.push(image);

    // Always make newly uploaded portrait active
    db.activePortrait = image;

    // Deduplicate portraits list
    db.portraits = db.portraits.filter((val, i, arr) => arr.indexOf(val) === i);

    // Filter out the default template stock photo if there's custom uploaded pictures
    const defaultImg = getDefaultPortraitBase64();
    db.portraits = db.portraits.filter(img => img !== defaultImg);

    // If list is empty after filtering (unlikely), ensure at least the uploaded image is in there
    if (db.portraits.length === 0) {
      db.portraits = [image];
    }

    writeDB(db);

    // Physically persist the active or uploaded portrait to disk as lanja_portrait.png
    const persistImg = db.activePortrait || image;
    if (persistImg && persistImg.startsWith("data:image/")) {
      try {
        const base64Data = persistImg.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const filePath = path.join(process.cwd(), "src", "assets", "images", "lanja_portrait.png");
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, buffer);
        console.log(`[portraits] Physically saved portrait to disk at ${filePath}`);
      } catch (saveErr) {
        console.error("[portraits] Failed to save physically to disk:", saveErr);
      }
    }

    res.json({
      success: true,
      portraits: db.portraits,
      activePortrait: db.activePortrait
    });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible d'insérer l'image." });
  }
});

// Set active main portrait
app.post("/api/database/portraits/activate", (req, res) => {
  const { image } = req.body;
  if (image === undefined) {
    return res.status(400).json({ error: "Donnée manquante." });
  }

  try {
    const db = readDB();
    db.activePortrait = image;
    writeDB(db);

    // Physically persist the active portrait to disk as lanja_portrait.png
    if (image && image.startsWith("data:image/")) {
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const filePath = path.join(process.cwd(), "src", "assets/images", "lanja_portrait.png");
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, buffer);
        console.log(`[portraits/activate] Physically saved active portrait to disk at ${filePath}`);
      } catch (saveErr) {
        console.error("[portraits/activate] Failed to save physically to disk:", saveErr);
      }
    }

    res.json({
      success: true,
      portraits: db.portraits || [],
      activePortrait: db.activePortrait
    });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de changer l'image principale." });
  }
});

// Delete a portrait from the collection
app.post("/api/database/portraits/delete", (req, res) => {
  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "Image manquante." });
  }

  try {
    const db = readDB();
    const list = db.portraits || [];
    db.portraits = list.filter(img => img !== image);

    if (db.activePortrait === image) {
      db.activePortrait = db.portraits[0] || "";
    }

    writeDB(db);
    res.json({
      success: true,
      portraits: db.portraits,
      activePortrait: db.activePortrait
    });
  } catch (err: any) {
    res.status(500).json({ error: "Impossible de supprimer l'image." });
  }
});

// --- VISITOR SECURE REGISTRATION & LOGIN ENDPOINTS ---

// Register Visitor with email + password
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs : nom complet, email et mot de passe." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const db = readDB();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "L'adresse email saisie est incorrecte." });
  }

  // Password length restriction
  if (password.length < 4) {
    return res.status(400).json({ error: "Le mot de passe doit contenir au moins 4 caractères." });
  }

  // Prevent duplicates
  const existingUser = db.users.find((u) => u.email === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ error: "Cette adresse email est déjà enregistrée. Veuillez utiliser 'Se connecter'." });
  }

  const newUser = {
    id: `visitor-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password: password.toString(),
    registeredAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Add event tracking log to central connections history
  db.connections.push({
    id: `conn-${Date.now()}`,
    name: newUser.name,
    email: newUser.email,
    timestamp: new Date().toISOString(),
    event: "Inscription"
  });

  writeDB(db);

  // Send a beautiful welcome notification email asynchronously (non-blocking)
  sendWelcomeEmail(newUser.email, newUser.name).catch((err) =>
    console.error("Welcome email async failed:", err)
  );

  return res.json({
    success: true,
    visitor: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      provider: "email" as const
    }
  });
});

// Login Visitor with email + password
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Veuillez saisir votre email et votre mot de passe." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const db = readDB();

  // Search user account
  const user = db.users.find((u) => u.email === cleanEmail);
  if (!user) {
    return res.status(401).json({ error: "Aucun compte trouvé avec cette adresse email. Veuillez créer un compte." });
  }

  // Verify password match
  if (user.password !== password.toString()) {
    return res.status(401).json({ error: "Mot de passe incorrect. Veuillez réessayer." });
  }

  // Save successful connection event log in list
  db.connections.push({
    id: `conn-${Date.now()}`,
    name: user.name,
    email: user.email,
    timestamp: new Date().toISOString(),
    event: "Connexion"
  });

  writeDB(db);

  return res.json({
    success: true,
    visitor: {
      id: user.id,
      name: user.name,
      email: user.email,
      provider: "email" as const
    }
  });
});

// Log out Visitor and register the action in connections log
app.post("/api/auth/logout", (req, res) => {
  const { email, name } = req.body;
  if (email) {
    const db = readDB();
    db.connections.push({
      id: `conn-${Date.now()}`,
      name: name || email.split("@")[0],
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      event: "Déconnexion"
    });
    writeDB(db);
  }
  res.json({ success: true });
});

// -------------------------------------------------------------
// VITE OR STATIC MIDDLEWARE SETUP
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite dev server middleware so SPA routing and Hot reload are proxied perfectly
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Static assets distribution path handles final deployment builds
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Lanja Créateur Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
