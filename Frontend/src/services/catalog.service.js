const BASE_URL = 'http://localhost:5000/api/catalog';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

// ─── MECHIN-43 + 46 + 47: Catálogo con búsqueda y filtros ───
const getCatalogo = async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.nombre)       params.append('nombre', filtros.nombre);
    if (filtros.categoria_id) params.append('categoria_id', filtros.categoria_id);
    if (filtros.marca)        params.append('marca', filtros.marca);
    if (filtros.estado)       params.append('estado', filtros.estado);
    if (filtros.tienda_id)    params.append('tienda_id', filtros.tienda_id);
    if (filtros.page)         params.append('page', filtros.page);
    if (filtros.limit)        params.append('limit', filtros.limit);

    const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        headers: getAuthHeaders()
    });
    return res.json();
};

// ─── MECHIN-44: Detalle del repuesto ────────────────────────
const getRepuestoById = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return res.json();
};

// ─── Categorías ──────────────────────────────────────────────
const getCategorias = async () => {
    const res = await fetch(`${BASE_URL}/meta/categorias`, {
        headers: getAuthHeaders()
    });
    return res.json();
};

// ─── MECHIN-40: Registrar repuesto ──────────────────────────
const crearRepuesto = async (datos) => {
    const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos)
    });
    return res.json();
};

// ─── MECHIN-41: Editar repuesto ──────────────────────────────
const editarRepuesto = async (id, datos) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(datos)
    });
    return res.json();
};

// ─── MECHIN-42: Eliminar repuesto ───────────────────────────
const eliminarRepuesto = async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return res.json();
};

// ─── MECHIN-49: Cambiar estado ───────────────────────────────
const cambiarEstado = async (id, estado) => {
    const res = await fetch(`${BASE_URL}/${id}/estado`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado })
    });
    return res.json();
};

const catalogService = {
    getCatalogo,
    getRepuestoById,
    getCategorias,
    crearRepuesto,
    editarRepuesto,
    eliminarRepuesto,
    cambiarEstado
};

export default catalogService;