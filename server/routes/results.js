const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// POST submit exam results
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, userId, answers, score, timeTaken } = req.body;
    const resultId = uuidv4();

    const result = await query(
      `INSERT INTO exam_results (id, session_id, user_id, score, time_taken, answers, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [resultId, sessionId, userId, score, timeTaken, JSON.stringify(answers)]
    );

    // Update exam session status
    await query(
      `UPDATE exam_sessions SET status = 'completed', ended_at = NOW() WHERE id = $1`,
      [sessionId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error submitting results:', error);
    next(error);
  }
});

// GET user results
router.get('/user/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT * FROM exam_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM exam_results WHERE user_id = $1',
      [userId]
    );

    res.json({
      results: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total)
      }
    });
  } catch (error) {
    logger.error('Error fetching results:', error);
    next(error);
  }
});

module.exports = router;
