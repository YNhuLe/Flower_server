import express from "express";
import * as quizControllers from "../controllers/plantQuiz-controllers.js";


const router = express.Router();

router.route("/quiz").get(quizControllers.getQuizQuestionOptions);

export default router;