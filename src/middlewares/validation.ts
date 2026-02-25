import multer from "multer";
import fileDirName from "../utils/dirname.js";
import path from "path";
import type { Request } from "express";

const {__dirname} = fileDirName(import.meta.url);
const uploadDirPath = path.join(__dirname, '..', 'uploads');

const fileFilter: multer.Options["fileFilter"] = (req: Request, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF allowed.') as any, false);
  }
};

const uploads = multer({ 
  dest: uploadDirPath, 
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB лимит
    files: 5 //  Мак.5 файлов
  } })

export const uploadMiddleware = uploads.single('file');
export const uploadsMiddleware = uploads.array('files')