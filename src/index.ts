import express from 'express';
import cors from "cors";
import plantRoutes from "../routes/plants-routes.js"
import gitfRoutes from "../routes/gift-routes.js";
const app = express();
const PORT = process.env.PORT ?? 3000;


app.use(express.static('public'));
app.use(cors())
app.use(express.json());

app.use("/", plantRoutes);
app.use("/", gitfRoutes)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});