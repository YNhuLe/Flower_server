import express from 'express';
import cors from "cors";
import plantRoutes from "../routes/plants-routes.js"
import gitfRoutes from "../routes/gift-routes.js";
import quizRoutes from "../routes/plantQuiz-routes.js";
import saleDataRoutes from "../routes/saleData_route.js";
import userRoutes from "../routes/user-routes.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;


app.use(express.static('public'));
app.use(cors())
app.use(express.json());

app.use("/", plantRoutes);
app.use("/", gitfRoutes);
app.use("/",quizRoutes);
app.use("/", saleDataRoutes);
app.use("/", userRoutes);
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});