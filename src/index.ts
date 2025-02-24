import express, { Express, Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import session from "express-session";
import { create } from "express-handlebars";
import passport from "./middleware/passport";
import authenticateJWT from "./middleware/jwt";

// Import Routers
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import transactionRouter from "./routes/transaction.routes";
import financialProfileRouter from "./routes/financialProfile.routes";
import authDevRouter from "./routes/dev/authDev.routes";
import advisorRouter from "./routes/advisor.routes";
import ocrRouter from "./routes/ocr.routes";
import oauthRouter from "./routes/oauth.routes";

dotenv.config();

const app: Express = express();
const hbs = create();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.JWT_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// View Engine Setup
app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Static Files
app.use(express.static(path.join(__dirname, "../public")));

// Define Routes
app.use("/auth", authRouter);
app.use("/dev/auth", authDevRouter);
app.use("/oauth", oauthRouter);
app.use("/user", userRouter);
app.use("/transaction", transactionRouter);
app.use("/financial-profile", financialProfileRouter);
app.use("/advisor", advisorRouter);
app.use("/ocr", ocrRouter);

app.get("/", (req: Request, res: Response) => {
  res.render("home", {
    title: "seimbang.in",
  });
});

// Handle 404 Not Found
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎉 Server berjalan di http://localhost:${PORT}`);
});
