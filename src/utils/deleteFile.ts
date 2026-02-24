import { unlink } from "fs/promises";

export default async function deleteFile(filePath: string, retries = 5, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      await unlink(filePath);
      console.log("File deleted:", filePath);
      return;
    } catch (err: any) {
      if (err.code === "EBUSY") {
        console.warn(`File is busy, retrying in ${delay}ms:`, filePath);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else if (err.code === "ENOENT") {
        console.warn("File already deleted:", filePath);
        return;
      } else {
        console.error("Failed to delete file:", err);
        return;
      }
    }
  }
}