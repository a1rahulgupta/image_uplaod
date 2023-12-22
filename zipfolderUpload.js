const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb://localhost/image_upload', { useNewUrlParser: true, useUnifiedTopology: true });

// Image model
const Image = mongoose.model('Image', {
  filename: String,
  path: String,
});

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = path.join(__dirname, 'uploads/folders');
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Express route for folder upload
app.post('/upload-folder', upload.single('folder'), async (req, res) => {
  try {
    const zipPath = req.file.path;
    const extractPath = path.join(__dirname, 'uploads/folders', Date.now().toString());

    // Extract the zip file
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(extractPath, true);

    // Get the list of files in the folder
    const folderFiles = fs.readdirSync(extractPath);

    // Save each file to the database
    const uploadedImages = [];
    for (const file of folderFiles) {
      const filePath = path.join(extractPath, file);
      const image = new Image({ filename: file, path: filePath });
      await image.save();
      uploadedImages.push({ filename: file, path: filePath });
    }

    // Cleanup: Remove the extracted folder and zip file
    fs.rmdirSync(extractPath, { recursive: true });
    fs.unlinkSync(zipPath);

    res.status(200).json({ success: true, message: 'Folder uploaded successfully', uploadedImages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
