import api from './api'; // Ahora sí funcionará porque pusimos 'export default'

export const updateLocationInDB = async (latitud, longitud) => {
    // Esto enviará los datos a http://localhost:5000/api/geolocation/update
    return await api.put('/geolocation/update', { latitud, longitud });
};