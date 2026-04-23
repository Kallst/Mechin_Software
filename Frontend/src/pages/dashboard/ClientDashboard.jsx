import React from 'react';
import './ClientDashboard.css';
import useGeolocation from '../../hooks/useGeolocation'; // <-- Sin las llaves { }

const ClientDashboard = () => {
    const { handleSyncLocation, isSyncing } = useGeolocation();

    return (
        <div className="shell">
            <div className="main">
                <div className="content">
                    <div className="greeting">
                        <div>
                            <div className="g-title">Hola, Juan 👋</div>
                            <div className="g-sub">¿Necesitas un mecánico hoy?</div>
                        </div>
                        <button 
                            className="btn-solicitar" 
                            onClick={handleSyncLocation}
                            disabled={isSyncing}
                        >
                            {isSyncing ? 'Sincronizando...' : '+ Solicitar servicio'}
                        </button>
                    </div>
                    {/* Resto del diseño que ya tienes en el CSS... */}
                </div>
            </div>
        </div>
    );
};

export default ClientDashboard;