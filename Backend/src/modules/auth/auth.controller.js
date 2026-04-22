const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../../config/db');

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { firstName, lastName, email, phone, city, password, role, specialties } = req.body;

  try {
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length > 0) {
      return res.status(400).json({ msg: 'El usuario ya existe' });
    }

    // Get role id
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Rol inválido' });
    }
    const roleId = roleResult.rows[0].id;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUserResult = await db.query(
      'INSERT INTO users (role_id, first_name, last_name, email, phone, city, password) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [roleId, firstName, lastName, email, phone, city, hashedPassword]
    );
    const userId = newUserResult.rows[0].id;

    // Add specialties if mechanic
    if (role === 'mechanic' && specialties && specialties.length > 0) {
      for (const spec of specialties) {
        await db.query('INSERT INTO mechanic_specialties (user_id, specialty) VALUES ($1, $2)', [userId, spec]);
      }
    }

    // Crear el JWT
    const payload = { user: { id: userId, role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: userId, firstName, lastName, email, role } });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const userResult = await db.query(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Contraseña incorrecta' });
    }

    const payload = { user: { id: user.id, role: user.role_name } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role_name } });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.getUser = async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.city, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [req.user.id]
    );
    res.json(userResult.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.logout = (req, res) => {
  // In a stateless JWT setup logout is typically handled client-side by deleting the token.. usually
  // We'll just return a success message btw
  res.json({ msg: 'Sesión cerrada exitosamente' });
};

exports.forgotPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email } = req.body;
  try {
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Return success even if user not found for security reasons .. kidding
      return res.json({ msg: 'Si el correo existe, se enviará un código de recuperación' });
    }
    const userId = userResult.rows[0].id;

    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000); // 15 mins

    await db.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);
    await db.query('INSERT INTO password_resets (user_id, code, expires_at) VALUES ($1, $2, $3)', [userId, code, expiresAt]);

    // SIMULATE EMAIL SENDING!! Always on console.. bc auth is local
    console.log(`\n========================================`);
    console.log(`📧 SIMULACIÓN DE CORREO ENVIADO A: ${email}`);
    console.log(`🔑 CÓDIGO DE RECUPERACIÓN: ${code}`);
    console.log(`========================================\n`);

    res.json({ msg: 'Si el correo existe, se enviará un código de recuperación' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};

exports.verifyCode = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, code, newPassword } = req.body;
  
  try {
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ msg: 'Código inválido o expirado' });
    
    const userId = userResult.rows[0].id;

    const resetResult = await db.query('SELECT * FROM password_resets WHERE user_id = $1 AND code = $2 AND expires_at > NOW()', [userId, code]);
    
    if (resetResult.rows.length === 0) {
      return res.status(400).json({ msg: 'Código inválido o expirado' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
    await db.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

    res.json({ msg: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Error en el servidor');
  }
};
