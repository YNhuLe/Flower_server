import express from 'express';
import { postRecommendFeedback } from '../controllers/recommendFeedback_controller';

const router = express.Router();

/**
 * @route POST /feedback/recommendation
 * @desc Submit feedback for a recommended plant.
 * @access Public
 */
router.post('/recommendation/feedback', postRecommendFeedback);

export default router;