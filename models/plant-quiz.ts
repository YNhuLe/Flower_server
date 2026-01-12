   interface QuizAnswer {
        question_key: string;
        answer_value: string;
      }

interface AIRecommendation{
plant: string,
reasoning: string,
scoreMatch: number
}
export type{QuizAnswer, AIRecommendation}