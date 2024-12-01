import express, { Express, Request, Response } from "express";
import authenticateJWT from "./middleware/jwt";
import authRouter from "./routes/auth.routes";
import path from "path";
import userRouter from "./routes/user.routes";
import transactionRouter from "./routes/transaction.routes";
import financialProfileRouter from "./routes/financialProfile.routes";

// intialize express
const app: Express = express();
const port = parseInt(process.env.PORT || "8080", 10);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/transaction", transactionRouter);
app.use("/financial-profile", financialProfileRouter);

app.get("/", (req: Request, res: Response) => {
  res.render("index", {
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

app.listen(port, "0.0.0.0", () => {
  console.log(
    "🎉 Server Expressnya dah jalan ya beb! 🚀 disini yhh http://0.0.0.0:${port}",
  );
});
