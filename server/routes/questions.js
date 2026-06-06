const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const cache = require('../cache/redis');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// GET all questions with pagination
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;
    const subject = req.query.subject;

    const cacheKey = `questions:${subject || 'all'}:${page}:${limit}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return res.json(JSON.parse(cached));
    }

    let whereClause = '';
    const params = [limit, offset];

    if (subject) {
      whereClause = 'WHERE subject = $3';
      params.push(subject);
    }

    const result = await query(
      `SELECT id, question, options, correct_answer, subject, difficulty, explanation 
       FROM questions 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM questions ${whereClause}`,
      params.slice(2)
    );

    const response = {
      questions: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, JSON.stringify(response), 300);

    res.json(response);
  } catch (error) {
    logger.error('Error fetching questions:', error);
    next(error);
  }
});

// GET single question
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cacheKey = `question:${id}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await query(
      'SELECT * FROM questions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await cache.set(cacheKey, JSON.stringify(result.rows[0]), 600);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching question:', error);
    next(error);
  }
});

// POST create question (admin only)
router.post('/', async (req, res, next) => {
  try {
    const { question, options, correct_answer, subject, difficulty, explanation } = req.body;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO questions (id, question, options, correct_answer, subject, difficulty, explanation, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, question, JSON.stringify(options), correct_answer, subject, difficulty, explanation]
    );

    // Invalidate cache
    await cache.del(`questions:${subject}:*`);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating question:', error);
    next(error);
  }
});

module.exports = router;
