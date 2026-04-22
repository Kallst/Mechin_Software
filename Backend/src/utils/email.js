// ============================================================
// utils/email.js — Envío de correos con Nodemailer + Gmail
//
// Configuración requerida en .env:
//   EMAIL_USER=tu_correo@gmail.com
//   EMAIL_PASS=tu_clave_de_aplicacion  ← NO es tu contraseña normal
//
// Para obtener EMAIL_PASS:
//   1. Ir a myaccount.google.com → Seguridad
//   2. Activar verificación en dos pasos
//   3. Buscar "Contraseñas de aplicaciones"
//   4. Crear una nueva para "Correo / Windows"
//   5. Copiar los 16 caracteres generados → eso es EMAIL_PASS
// ============================================================

const nodemailer = require('nodemailer');

// Crear el transporter una sola vez (se reutiliza en cada envío)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true para puerto 465, false para 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Verificar la conexión al iniciar (solo en desarrollo) ────
if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error) => {
    if (error) {
      console.warn('⚠️  Email no configurado:', error.message);
      console.warn('   El código de recuperación se mostrará en consola.');
    } else {
      console.log('✅ Servicio de correo listo');
    }
  });
}

// ── Función principal de envío ───────────────────────────────
const enviarCorreo = async ({ destinatario, asunto, html }) => {
  // Si no hay credenciales configuradas, simular en consola
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n========================================');
    console.log(`📧 SIMULACIÓN — Para: ${destinatario}`);
    console.log(`📌 Asunto: ${asunto}`);
    console.log('========================================\n');
    return { simulado: true };
  }

  const info = await transporter.sendMail({
    from: `"Mechin" <${process.env.EMAIL_USER}>`,
    to: destinatario,
    subject: asunto,
    html,
  });

  return info;
};

// ── Plantilla: código de recuperación de contraseña ─────────
const enviarCodigoRecuperacion = async (correo, codigo) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 2rem;">
      <div style="background: #1A2130; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
        <h1 style="color: #fff; margin: 0; font-size: 1.5rem;">
          MECH<span style="color: #F97316;">I</span>N
        </h1>
        <p style="color: #9CA3AF; margin: 0.5rem 0 0; font-size: 0.85rem;">
          Tu mecánico de confianza, donde lo necesites
        </p>
      </div>

      <h2 style="color: #111827; font-size: 1.25rem; margin-bottom: 0.5rem;">
        Recuperación de contraseña
      </h2>
      <p style="color: #6B7280; margin-bottom: 1.5rem;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta.
        Usa el siguiente código de verificación:
      </p>

      <div style="background: #F3F4F6; border-radius: 12px; padding: 1.5rem; text-align: center; margin-bottom: 1.5rem;">
        <p style="font-size: 2.5rem; font-weight: bold; letter-spacing: 0.5rem;
                  color: #111827; margin: 0; font-family: monospace;">
          ${codigo}
        </p>
        <p style="color: #9CA3AF; font-size: 0.8rem; margin: 0.5rem 0 0;">
          Este código expira en <strong>15 minutos</strong>
        </p>
      </div>

      <p style="color: #9CA3AF; font-size: 0.8rem; margin-top: 1.5rem;">
        Si no solicitaste este cambio, puedes ignorar este correo.
        Tu contraseña no será modificada.
      </p>
    </div>
  `;

  return enviarCorreo({
    destinatario: correo,
    asunto: 'Código de verificación — Mechin',
    html,
  });
};

module.exports = { enviarCorreo, enviarCodigoRecuperacion };