const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { logger } = require('./errorHandler');

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize upload directories
const uploadDirs = [
  'uploads/profiles',
  'uploads/media/images',
  'uploads/media/videos',
  'uploads/media/audio',
  'uploads/media/documents'
];

uploadDirs.forEach(ensureDir);

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'video/mp4': ['mp4'],
    'video/mpeg': ['mpeg', 'mpg'],
    'video/quicktime': ['mov'],
    'video/x-msvideo': ['avi'],
    'audio/mpeg': ['mp3'],
    'audio/wav': ['wav'],
    'audio/ogg': ['ogg'],
    'audio/aac': ['aac'],
    'application/pdf': ['pdf'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'text/plain': ['txt']
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Generate unique filename
const generateFileName = (originalname) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalname);
  return `${timestamp}-${random}${ext}`;
};

// Storage configuration for profile pictures
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const filename = generateFileName(file.originalname);
    cb(null, filename);
  }
});

// Storage configuration for media files
const mediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/media/';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath += 'images/';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath += 'audio/';
    } else {
      uploadPath += 'documents/';
    }
    
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = generateFileName(file.originalname);
    cb(null, filename);
  }
});

// Multer configurations
const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profiles
  },
  fileFilter: (req, file, cb) => {
    // Only allow images for profile pictures
    if (file.mimetype.startsWith('image/')) {
      fileFilter(req, file, cb);
    } else {
      cb(new Error('Profile picture must be an image'), false);
    }
  }
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for media files
  },
  fileFilter
});

// Image processing middleware for profile pictures
const processProfileImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '_processed.jpg');

    // Resize and optimize profile image
    await sharp(inputPath)
      .resize(400, 400, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    // Remove original file and update req.file with processed file info
    fs.unlinkSync(inputPath);
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);
    req.file.mimetype = 'image/jpeg';

    next();
  } catch (error) {
    logger.error('Error processing profile image:', error);
    // Clean up files
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(new Error('Failed to process profile image'));
  }
};

// Image processing middleware for media images
const processMediaImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const inputPath = req.file.path;
    const outputPath = inputPath.replace(path.extname(inputPath), '_optimized.jpg');

    // Optimize media image (maintain original size but compress)
    await sharp(inputPath)
      .jpeg({ quality: 85 })
      .toFile(outputPath);

    // Remove original file and update req.file with processed file info
    fs.unlinkSync(inputPath);
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);
    req.file.mimetype = 'image/jpeg';

    next();
  } catch (error) {
    logger.error('Error processing media image:', error);
    // Clean up files
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(new Error('Failed to process media image'));
  }
};

// Cleanup middleware for failed uploads
const cleanupOnError = (error, req, res, next) => {
  if (req.file && fs.existsSync(req.file.path)) {
    fs.unlinkSync(req.file.path);
    logger.info(`Cleaned up file: ${req.file.path}`);
  }
  next(error);
};

module.exports = {
  profileUpload,
  mediaUpload,
  processProfileImage,
  processMediaImage,
  cleanupOnError,
  generateFileName,
  ensureDir
};