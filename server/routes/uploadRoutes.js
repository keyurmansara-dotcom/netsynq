import express from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const resumeDir = path.join(uploadDir, 'resumes');
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

// Define storage for the uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Folder where files will be stored
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|mkv|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images and Videos Only!');
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, resumeDir);
    },
    filename: function (req, file, cb) {
      cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: function (req, file, cb) {
    const allowedExt = /pdf|doc|docx/;
    const extname = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /pdf|msword|officedocument\.wordprocessingml\.document/.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }

    cb('Error: Only PDF, DOC, or DOCX resume files are allowed!');
  },
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

// POST /api/upload
// Route to handle single file upload
router.post('/', protect, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Return the path or URL where the file is accessible
  // In development, this could be something like /uploads/filename.jpg
  res.status(200).json({
    message: 'File uploaded successfully',
    mediaUrl: `/uploads/${req.file.filename}`
  });
});

router.post('/resume', protect, resumeUpload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No resume uploaded' });
  }

  res.status(200).json({
    message: 'Resume uploaded successfully',
    resumeUrl: `/uploads/resumes/${req.file.filename}`,
    fileName: req.file.originalname
  });
});

router.delete('/resume', protect, (req, res) => {
  const { resumeUrl } = req.body || {};

  if (!resumeUrl) {
    return res.status(400).json({ message: 'Resume URL is required' });
  }

  const expectedPrefix = '/uploads/resumes/';
  if (!resumeUrl.startsWith(expectedPrefix)) {
    return res.status(400).json({ message: 'Invalid resume URL' });
  }

  const fileName = path.basename(resumeUrl);
  const filePath = path.join(resumeDir, fileName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res.status(200).json({ message: 'Resume deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete resume file' });
  }
});

export default router;