import { Router } from "express";
import { getHomePage, postResizeImage, postResizeImages, getDownloadFileByName, getListAllFiles, deleteFileByName } from "../controllers/uploadController.js";
import { uploadsMiddleware, uploadMiddleware } from "../middlewares/validation.js";
import { authenticateToken } from "../middlewares/auth.js"

const router = Router();

router.get('/', getHomePage);
router.post('/single', authenticateToken, uploadMiddleware, postResizeImage);
router.post('/multiple', authenticateToken, uploadsMiddleware, postResizeImages);
router.get('/file/:filename', authenticateToken, getDownloadFileByName);
router.get('/file', authenticateToken, getListAllFiles);
router.delete('/file/:filename', authenticateToken, deleteFileByName)

export default router;