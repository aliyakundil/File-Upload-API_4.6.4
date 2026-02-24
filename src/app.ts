import path from "path";
import express, { type Request, type Response} from "express";
import morgan from "morgan";
import fileDirName from "./utils/dirname.js"
import router from "./routes/upload.js";
import authRouter from "./routes/auth.js"
import { connectToDb } from "./config/database";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Todo REST API",
    version: "1.0.0",
    links: {
      api: "/api",
      health: "/health",
      todos: "/api/users",
    },
  });
});

const { __dirname } = fileDirName(import.meta.url);
const publickDirPath = path.join(__dirname, 'public');

app.use(express.static(publickDirPath));

app.use(morgan('dev'));
app.use('/api/upload', router);
app.use('/api', authRouter);

async function startServer() {
  try {
    await connectToDb();

    app.listen(PORT, () => {
      console.log("Server started on port 3000");
    });
  } catch (err) {
    console.log("Failed to start server: ", err);
    process.exit(1);
  }
}

startServer();
