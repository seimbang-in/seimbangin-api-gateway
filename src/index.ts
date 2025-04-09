import cors from "cors";
import express, { Express, Request, Response } from "express";
import { create } from "express-handlebars";
import path from "path";
import "./config/passport";
import { authenticateJWT } from "./middleware/jwt";
import advisorRouter from "./routes/advisor.routes";
import articleRouter from "./routes/article.route";
import authRouter from "./routes/auth.routes";
import authDevRouter from "./routes/dev/authDev.routes";
import financialProfileRouter from "./routes/financialProfile.routes";
import oauthRouter from "./routes/oauth.routes";
import ocrRouter from "./routes/ocr.routes";
import transactionRouter from "./routes/transaction.routes";
import userRouter from "./routes/user.routes";

// intialize express
const app: Express = express();
const hbs = create();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine("handlebars", hbs.engine);
app.set("view engine", "handlebars");

app.set('views', path.resolve(__dirname, '../src/views'));

app.use(express.static(path.resolve(__dirname, '../public/')));

app.use("/auth", authRouter);
app.use("/auth/google", oauthRouter);
app.use("/dev/auth", authDevRouter);
app.use("/user", userRouter);
app.use("/transaction", transactionRouter);
app.use("/financial-profile", financialProfileRouter);
app.use("/advisor", advisorRouter);
app.use("/ocr", ocrRouter);
app.use('/articles', articleRouter);

app.get("/", (req: Request, res: Response) => {
  res.render("home", {
    title: "seimbang.in",
  });
});

app.get("/protected", authenticateJWT, (req: Request, res: Response) => {
  res.send({
    message: "This is a protected route",
    data: {
      user: req.user,
    },
  });
});

app.listen(3000, () => {
  console.log(
    "🎉 Server Expressnya dah jalan ya beb! 🚀 disini yhh http://localhost:3000",
  );
});
