const { Router } = require('express');
const router = Router();
const usersController = require('./users.controller');

// GET /api/users/:id
router.get('/:id', usersController.getUserById);

// PUT /api/users/:id (Actualizar perfil)
router.put('/:id', usersController.updateProfile);

// DELETE /api/users/:id (Eliminar cuenta)
router.delete('/:id', usersController.deleteAccount);

module.exports = router;