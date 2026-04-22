const express = require('express');
const { check } = require('express-validator');
const authController = require('./auth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', [
  check('firstName', 'El nombre es requerido').not().isEmpty(),
  check('lastName', 'El apellido es requerido').not().isEmpty(),
  check('email', 'Incluye un correo válido').isEmail(),
  check('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
  check('role', 'El rol es requerido').not().isEmpty()
], authController.register);

router.post('/login', [
  check('email', 'Incluye un correo válido').isEmail(),
  check('password', 'La contraseña es requerida').exists()
], authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getUser);
router.post('/logout', authMiddleware, authController.logout);

// Password recovery
router.post('/forgot-password', [
  check('email', 'Incluye un correo válido').isEmail()
], authController.forgotPassword);

router.post('/verify-code', [
  check('email', 'Incluye un correo válido').isEmail(),
  check('code', 'El código es requerido').not().isEmpty(),
  check('newPassword', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
], authController.verifyCode);

module.exports = router;
