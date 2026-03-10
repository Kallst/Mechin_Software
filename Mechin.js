document.addEventListener('DOMContentLoaded', () => {
    const btnMecanico = document.getElementById('btn-soy-mecanico');
    const seccionRegistro = document.getElementById('registro-mecanico');
    const mainContent = document.querySelector('body > :not(#registro-mecanico)'); // todo menos el formulario

    btnMecanico.addEventListener('click', (e) => {
        e.preventDefault();

        // Ocultar todo lo demás
        document.querySelectorAll('body > *:not(#registro-mecanico)').forEach(el => el.classList.add('hidden'));

        // Mostrar el formulario como “pantalla completa”
        seccionRegistro.classList.remove('hidden');
        seccionRegistro.classList.add('full-screen');

        // Scroll al inicio
        seccionRegistro.scrollIntoView({ behavior: 'smooth', block: 'start' });

        console.log("Formulario de registro para mecánico desplegado en pantalla completa.");
    });

    // Manejar el envío del formulario
    const formulario = document.querySelector('.mechin-form');
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        alert("¡Gracias! Tu perfil profesional de Mechin está siendo procesado para validación.");

        // Opción: volver a la pantalla principal después de enviar
        seccionRegistro.classList.add('hidden');
        seccionRegistro.classList.remove('full-screen');
        document.querySelectorAll('body > *:not(#registro-mecanico)').forEach(el => el.classList.remove('hidden'));
    });
});