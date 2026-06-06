const express = require('express');
const router = express.Router();
const { query } = require('../db/pool');
const cache = require('../cache/redis');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// GET user profile
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cacheKey = `user:${userId}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await query(
      `SELECT id, email, name, created_at, updated_at, total_attempts, average_score
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await cache.set(cacheKey, JSON.stringify(result.rows[0]), 1800);
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error fetching user:', error);
    next(error);
  }
});

// POST create user
router.post('/', async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const id = uuidv4();

    const result = await query(
      `INSERT INTO users (id, email, name, created_at, updated_at, total_attempts, average_score)
       VALUES ($1, $2, $3, NOW(), NOW(), 0, 0)
       RETURNING *`,
      [id, email, name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error creating user:', error);
    next(error);
  }
});

// PUT update user stats
router.put('/:userId/stats', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { score, totalAttempts } = req.body;

    const result = await query(
      `UPDATE users 
       SET average_score = (average_score * total_attempts + $2) / ($3 + 1),
           total_attempts = $3 + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId, score, totalAttempts]
    );

    // Invalidate cache
    await cache.del(`user:${userId}`);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating user stats:', error);
    next(error);
  }
});

module.exports = router;
