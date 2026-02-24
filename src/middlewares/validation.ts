import multer from "multer";
import fileDirName from "../utils/dirname.js";
import path from "path";

const {__dirname} = fileDirName(import.meta.url);
const uploadDirPath = path.join(__dirname, '..', 'uploads');
const uploads = multer({ dest: uploadDirPath })

export const uploadMiddleware = uploads.single('file');
export const uploadsMiddleware = uploads.array('files')