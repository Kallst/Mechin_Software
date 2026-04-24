import React from 'react';
import './UbicacionVisual.css';

const UbicacionVisual = ({ direccion }) => {
    return (
        <div className="location-card-mech">
            <div className="location-header-mech">
                <span className="loc-icon-mech">📍</span>
                <div className="loc-text-container">
                    <p className="loc-label-mech">Dirección de atención</p>
                    <p className="loc-address-mech">{direccion || "Ubicación no definida"}</p>
                </div>
            </div>
            
            {/* Contenedor de la animación */}
            <div className="road-container-mech">
                <div className="road-stripes-mech"></div>
                <div className="car-animation-mech">
                    🚗💨
                </div>
            </div>
            
            <p className="loc-footer-mech">El mecánico llegará a este punto</p>
        </div>
    );
};

export default UbicacionVisual;