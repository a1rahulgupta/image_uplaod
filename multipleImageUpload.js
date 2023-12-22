const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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
    const folderPath = path.join(__dirname, 'uploads/images');
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Express route for multiple file upload
app.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files;
    const uploadedImages = [];

    for (const file of files) {
      const { filename, path } = file;
      const image = new Image({ filename, path });
      await image.save();
      uploadedImages.push({ filename, path });
    }

    res.status(200).json({ success: true, message: 'Files uploaded successfully', uploadedImages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
