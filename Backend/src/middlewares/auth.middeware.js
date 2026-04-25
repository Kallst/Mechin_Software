const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Leer el token del header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ ok: false, message: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ ok: false, message: 'Token inválido o expirado.' });
    }
};

module.exports = authMiddleware;