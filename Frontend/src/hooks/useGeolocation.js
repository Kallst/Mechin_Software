import { useState } from 'react';
import { updateLocationInDB } from '../services/geolocation.service';

const useGeolocation = () => { // Cambiado a export default al final
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncLocation = async () => {
        if (!navigator.geolocation) return alert("GPS no soportado");
        setIsSyncing(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                await updateLocationInDB(pos.coords.latitude, pos.coords.longitude);
                alert("Ubicación actualizada");
            } catch (err) {
                console.error("Error al guardar:", err);
            } finally {
                setIsSyncing(false);
            }
        });
    };
    return { handleSyncLocation, isSyncing };
};

export default useGeolocation;