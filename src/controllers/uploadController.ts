import path from 'path';
import fs from "fs/promises";
import type { Request, Response } from 'express';
import fileDirName from '../utils/dirname.js';
import reduceFileSize from "../utils/reduceFileSize.js";
import deleteFile from "../utils/deleteFile.js";
import File from "../models/File.js";

const { __dirname } = fileDirName(import.meta.url);

export async function getHomePage(req: Request, res: Response) {
  try {
    const homeDir = path.join(__dirname, '..', 'public', 'html', 'home.html');
    res.sendFile(homeDir);
  } catch(err) {
    res.status(500).json({ error: "Server error" })
  }
}

export async function getLoginPage(req: Request, res: Response) {
  try {
    const loginDir = path.join(__dirname, '..', 'public', 'html', 'login.html');
    res.sendFile(loginDir);
  } catch(err) {
    res.status(500).json({ error: "Server error" })
  }
}

export async function getRegisterPage(req: Request, res: Response) {
  try {
    const registerDir = path.join(__dirname, '..', 'public', 'html', 'register.html');
    res.sendFile(registerDir);
  } catch (err) {
    res.status(500).json({ error: "Server error" })
  }
}

export async function postResizeImage(req: Request, res: Response) {
  try {
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File not found" });
      
    // Проверка MIME-типа
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) return res.status(400).json({ error: "Unsupported file type" });

    // Проверка расширения
    const ext = path.extname(file.originalname).toLocaleLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
    if (!allowedExts.includes(ext)) {
      return res.status(400).json({ error: "File extension not allowed" })
    }

    if (!req.user) return res.status(401).json({ error: "Unauthorized. Login first." })

    if (!(req.user.role === "user" || req.user.role === "admin" )) {
      return res.status(403).json({ error: "You don't have permission to upload files." });
    }

    // Генерация безопасного уникального имени
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${safeName}`;

    const outputfileDir = path.join(__dirname, '..', '..', 'outputs', uniqueName);

    await reduceFileSize(file.path, outputfileDir);

    const fileDoc = new File({
      originalName: file.originalname,
      savedName: uniqueName,
      savedPath: outputfileDir,
      size: file.size,
      type: file.mimetype,
      uploadedBy: req.user.userId,  
    });

    await fileDoc.save();

    await deleteFile(file.path)

    return res.json({ success: true, downloadLinks: [file.originalname] });
  } catch (err) {
    res.status(500).json({ error: "Server error "})
  }
}

export async function postResizeImages(req: Request, res: Response) {
  try {
    // const files = req.files;
    const files = req.files as Express.Multer.File[];

    const downloadLinks = [];

    if (!Array.isArray(files)) return res.status(400).json({ error: "File not found" });

    for (const file of files) {
      // Проверка MIME-типа
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) return res.status(400).json({ error: "Unsupported file type" });

      // Проверка расширения
      const ext = path.extname(file.originalname).toLocaleLowerCase();
      const allowedExts = ['.jpg', '.jpeg', '.png', '.gif'];
      if (!allowedExts.includes(ext)) {
        return res.status(400).json({ error: "File extension not allowed" })
      }

      if (!req.user) return res.status(401).json({ error: "Unauthorized. Login first." })

      if (!(req.user.role === "user" || req.user.role === "admin" )) {
        return res.status(403).json({ error: "You don't have permission to upload files." });
      }

      // Генерация безопасного уникального имени
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 10000)}_${safeName}`;

      const outputfileDir = path.join(__dirname, '..', '..', 'outputs', uniqueName);

      await reduceFileSize(file.path, outputfileDir);

      const fileDoc = new File({
        originalName: file.originalname,
        savedName: uniqueName,
        savedPath: outputfileDir,
        size: file.size,
        type: file.mimetype,
        uploadedBy: req.user.userId,  
      });

      await fileDoc.save();

      await deleteFile(file.path)

      downloadLinks.push(file.originalname);
    }

    // res.json({ downloadLinks })
      return res.json({ success: true, downloadLinks });
  } catch (err) {
    res.status(500).json({ error: "Server error "})
  }
}

export async function getDownloadFileByName(req: Request, res: Response) {
  try {
    const { filename } = req.params;
    
    if (!filename || Array.isArray(filename)) {
      return res.status(400).json({ error: "File identifier is missing" });
    }

    const filePath = path.join(__dirname, '..', '..', 'outputs', filename);

    res.download(filePath, (err) => {
      if (err) {
        res.status(401).json({ error: "Something went wrong downloading file" })
      }
    })
  } catch(err) {
    res.status(500).json({ error: "Server error"})
  }
}

export async function getListAllFiles(req: Request, res: Response) {
  try {

    const filePath = path.join(__dirname, '..', '..', 'outputs');
    const files = await fs.readdir(filePath)

    res.json({ files})
  } catch(err) {
    res.status(500).json({ error: "Server error"})
  }
}

export async function deleteFileByName(req: Request, res: Response) {
  try {
    const { filename } = req.params;

    if (!filename) return res.status(400).json({ error: "Filename is required" });

    const file = await File.findOne({ savedName: filename });

    if (!file) return res.status(404).json({ error: "File not found in database" });

    // Удалить с диска
    try {
      await fs.unlink(file.savedPath);
    } catch (err) {
      console.log("File already removed from disk");
    }

    // Удалить с бд
    await file.deleteOne();

    return res.json({ success: true, msg: "File deleted successfully" })

  } catch (err) {
    res.json(500).json({ error: "Server error" })
  }
}