const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const cache = require('../cache/redis');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// GET available exams
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'exams:all';
    
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await query(
      `SELECT id, name, description, duration, total_questions, difficulty_level, subject
       FROM exams WHERE is_active = true
       ORDER BY created_at DESC`
    );

    await cache.set(cacheKey, JSON.stringify(result.rows), 600);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching exams:', error);
    next(error);
  }
});

// GET exam details
router.get('/:examId', async (req, res, next) => {
  try {
    const { examId } = req.params;
    const cacheKey = `exam:${examId}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await query(
      'SELECT * FROM exams WHERE id = $1',
      [examId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    await cache.set(cacheKey, JSON.stringify(result.rows[0]), 600);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching exam:', error);
    next(error);
  }
});

// POST start exam session
router.post('/:examId/start', async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { userId } = req.body;
    const sessionId = uuidv4();

    await query(
      `INSERT INTO exam_sessions (id, exam_id, user_id, started_at, status)
       VALUES ($1, $2, $3, NOW(), 'active')`,
      [sessionId, examId, userId]
    );

    res.status(201).json({ sessionId });
  } catch (error) {
    logger.error('Error starting exam:', error);
    next(error);
  }
});

module.exports = router;
