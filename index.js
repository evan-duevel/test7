import express from "express";
import cors from "cors";
import multer from "multer";
import { Client, Storage, Databases, ID } from "node-appwrite";

const app = express();

// ⭐ CORS FIX — REQUIRED FOR React
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });

// ⭐ Your Appwrite values (plugged in)
const APPWRITE_ENDPOINT = "https://sfo.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6a66c94d0001f60a4293";
const APPWRITE_API_KEY = "standard_cc67a33c3e0d731718385d13326a1b68485cf7e5b6b2d9c6e4200b2d5cd497fad2c39e0e1cba4bdf939a298c93b48ce20cb31f24b537650ec04ada0b908eabd2d438cc93cdf21265f2d191e2891c8a9214b378904f281390dae2cc8483eb749de6f996fd86511984ff16b93d83c86ca665ba3f5602a76ad847a6969120f9681d";
const APPWRITE_BUCKET_ID = "6a764238002e1a726719";
const APPWRITE_DATABASE_ID = "6a6a605d001a0c4ca679";
const APPWRITE_COLLECTION_ID = "posts";

// ⭐ Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    console.log("UPLOAD ROUTE HIT");

    if (!req.file) {
      console.log("NO FILE RECEIVED");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const storage = new Storage(client);

    console.log("UPLOADING TO APPWRITE...");

    // ⭐ FIXED: Correct multipart format
    const uploaded = await storage.createFile(
      APPWRITE_BUCKET_ID,
      ID.unique(),
      {
        file: req.file.buffer,
        filename: req.file.originalname,
        mimeType: req.file.mimetype
      }
    );

    console.log("UPLOAD SUCCESS:", uploaded.$id);

    const fileUrl =
      `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET_ID}/files/${uploaded.$id}/view?project=${APPWRITE_PROJECT_ID}`;

    res.json({ fileUrl });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ⭐ Create Post route
app.post("/createPost", async (req, res) => {
  try {
    const { text, media } = req.body;

    const client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID)
      .setKey(APPWRITE_API_KEY);

    const databases = new Databases(client);

    const saved = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      ID.unique(),
      {
        text,
        media,
        createdAt: Date.now()
      }
    );

    res.json({ success: true, post: saved });
  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Railway PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));