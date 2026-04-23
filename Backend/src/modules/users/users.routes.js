const { Router } = require('express');
const router = Router();
const usersController = require('./users.controller');

// GET /api/users/:id
router.get('/:id', usersController.getUserById);

module.exports = router;