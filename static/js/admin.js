document.getElementById("logout").addEventListener("click", () => {
  window.location.href = "/logout";
});
// =======================
// Navegación entre vistas
// =======================
function mostrarVista(vistaId) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById(`view-${vistaId}`).style.display = 'block';
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-view="${vistaId}"]`).classList.add('active');
}

// =======================
// DASHBOARD: Andenes
// =======================
async function cargarDashboard() {
  const [resAndenes, resHistorial] = await Promise.all([
    fetch('/api/andenes'),
    fetch('/api/historial_andenes')
  ]);

  const andenes = await resAndenes.json();
  const historial = await resHistorial.json();

  const historialMap = {};
  historial.forEach(h => {
    historialMap[h.id_anden] = h;
  });

  const container = document.getElementById('andenContainer');
  container.innerHTML = '';

  const bloques = [
    { nave: 1, cantidad: 6 },
    { nave: 2, cantidad: 6 },
    { nave: 3, cantidad: 6 },
    { nave: 4, cantidad: 6 },
    { nave: 5, cantidad: 7 }
  ];

  let libres = 0, ocupados = 0, alerta = 0, fuera = 0;
  let indice = 0;

  bloques.forEach(bloque => {
    const andenesBloque = andenes.slice(indice, indice + bloque.cantidad);
    indice += bloque.cantidad;

    const bloqueDiv = document.createElement('div');
    bloqueDiv.className = 'nave-bloque';
    bloqueDiv.innerHTML = `<h4 style="margin-bottom:8px;">Nave ${bloque.nave}</h4>`;

    const grid = document.createElement('div');
    grid.className = 'anden-list';

    andenesBloque.forEach(anden => {
      if (anden.estado === 'disponible') libres++;
      else if (anden.estado === 'ocupado') ocupados++;
      else if (anden.estado === 'alerta') alerta++;
      else if (anden.estado === 'fuera_de_servicio') fuera++;

      const h = historialMap[anden.id] || {};
      const card = document.createElement('div');
      card.className = `anden-card ${anden.estado}`;
      card.innerHTML = `
        <div class="titulo">Andén ${anden.id}</div>
        <div class="estado">Estado: <span>${anden.estado}</span></div>
        <div class="detalle">Vehículo: ${anden.tipo_vehiculo || h.nombre_vehiculo || '—'}</div>
        <div class="detalle">Persona: ${anden.persona || h.personas || '—'}</div>
        <div class="detalle">Revisor: ${anden.revisor || h.nombre_checador || '—'}</div>
        <div class="detalle">Inicio: ${anden.inicio ? formatHora(anden.inicio) : h.hora_inicio || '—'}</div>
        <div class="detalle">Duración: ${anden.tiempo || h.duracion_min || '—'} min</div>
        <select onchange="actualizarEstado(${anden.id}, this.value)">
          <option value="">Cambiar estado</option>
          <option value="disponible">Disponible</option>
          <option value="ocupado">Ocupado</option>
          <option value="alerta">Alerta</option>
          <option value="fuera_de_servicio">Fuera de servicio</option>
        </select>
      `;
      grid.appendChild(card);
    });

    bloqueDiv.appendChild(grid);
    container.appendChild(bloqueDiv);
  });

  document.getElementById('libresCount').textContent = libres;
  document.getElementById('ocupadosCountSide').textContent = ocupados;
  document.getElementById('alertaCount').textContent = alerta;
  document.getElementById('fueraServicioCount').textContent = fuera;
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function actualizarEstado(id, estado) {
  if (!estado) return;
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  })
    .then(res => res.json())
    .then(() => cargarDashboard());
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function actualizarEstado(id, estado) {
  if (!estado) return;
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  })
    .then(res => res.json())
    .then(() => cargarDashboard());
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function actualizarEstado(id, estado) {
  if (!estado) return;
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  })
    .then(res => res.json())
    .then(() => cargarDashboard());
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function actualizarEstado(id, estado) {
  if (!estado) return;
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  })
    .then(res => res.json())
    .then(() => cargarDashboard());
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function liberarAnden(id) {
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado: 'disponible' })
  })
    .then(res => res.json())
    .then(() => {
      alert('Andén liberado');
      cargarDashboard();
    });
}

// =======================
// USUARIOS: CRUD
// =======================
function cargarUsuarios() {
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(data => {
      const tbody = document.getElementById('usuariosTbody');
      tbody.innerHTML = '';
      data.forEach(u => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${u.nombre}</td>
          <td>${u.usuario}</td>
          <td>${u.rol}</td>
          <td>
            <button class="btn ghost" onclick="editarUsuario(${u.id_usuario})"><i class="fa-solid fa-pen"></i></button>
            <button class="btn ghost" onclick="eliminarUsuario(${u.id_usuario})"><i class="fa-solid fa-trash"></i></button>
          </td>
        `;
        tbody.appendChild(fila);
      });
    });
}

function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(() => cargarUsuarios());
}

function editarUsuario(id) {
  fetch('/api/usuarios')
    .then(res => res.json())
    .then(data => {
      const usuario = data.find(u => u.id_usuario === id);
      if (!usuario) return;

      document.getElementById('modalUsuario').classList.add('show');
      const form = document.getElementById('formUsuario');
      form.innerHTML = `
        <h3>Editar usuario</h3>
        <div class="form-row">
          <div>
            <label>Nombre completo</label>
            <input type="text" name="nombre" value="${usuario.nombre}" required />
          </div>
          <div>
            <label>Usuario</label>
            <input type="text" name="usuario" value="${usuario.usuario}" required />
          </div>
        </div>
        <div class="form-row">
          <div>
            <label>Contraseña (opcional)</label>
            <input type="password" name="contraseña" placeholder="Dejar en blanco para no cambiar" />
          </div>
          <div>
            <label>Rol</label>
            <select name="rol" required>
              <option value="">Selecciona rol</option>
              <option value="checador" ${usuario.rol === 'checador' ? 'selected' : ''}>Checador</option>
              <option value="gerente" ${usuario.rol === 'gerente' ? 'selected' : ''}>Gerente</option>
              <option value="administrador" ${usuario.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
          <button type="button" class="btn ghost" onclick="cerrarModalUsuario()">Cancelar</button>
          <button type="submit" class="btn">Guardar</button>
        </div>
      `;

      form.onsubmit = e => {
        e.preventDefault();
        const nombre = form.nombre.value;
        const usuarioVal = form.usuario.value;
        const rol = form.rol.value;
        const contraseña = form.contraseña.value;

        const payload = { nombre, usuario: usuarioVal, rol };
        if (contraseña) payload.contraseña = contraseña;

        fetch(`/api/usuarios/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(res => res.json())
          .then(() => {
            cerrarModalUsuario();
            cargarUsuarios();
          });
      };
    });
}

document.getElementById('nuevoUsuarioBtn').addEventListener('click', () => {
  document.getElementById('modalUsuario').classList.add('show');
  const form = document.getElementById('formUsuario');
  form.innerHTML = `
    <h3>Nuevo usuario</h3>
    <div class="form-row">
      <div>
        <label>Nombre completo</label>
        <input type="text" name="nombre" required />
      </div>
      <div>
        <label>Usuario</label>
        <input type="text" name="usuario" required />
      </div>
    </div>
    <div class="form-row">
      <div>
        <label>Contraseña</label>
        <input type="password" name="contraseña" required />
      </div>
      <div>
        <label>Rol</label>
        <select name="rol" required>
          <option value="">Selecciona rol</option>
          <option value="checador">Checador</option>
          <option value="gerente">Gerente</option>
          <option value="administrador">Administrador</option>
        </select>
      </div>
    </div>
    <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
      <button type="button" class="btn ghost" onclick="cerrarModalUsuario()">Cancelar</button>
      <button type="submit" class="btn">Guardar</button>
    </div>
  `;

  form.onsubmit = e => {
    e.preventDefault();
    const nombre = form.nombre.value;
    const usuario = form.usuario.value;
    const contraseña = form.contraseña.value;
    const rol = form.rol.value;

    fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, usuario, contraseña, rol })
    })
      .then(res => res.json())
      .then(() => {
        cerrarModalUsuario();
        cargarUsuarios();
      });
  };
});

function cerrarModalUsuario() {
  document.getElementById('modalUsuario').classList.remove('show');
}

function formatHora(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function actualizarEstado(id, estado) {
  if (!estado) return;
  fetch(`/api/andenes/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado })
  })
    .then(res => res.json())
    .then(() => cargarDashboard());
}

// =======================
// Inicialización
// =======================
document.addEventListener('DOMContentLoaded', () => {
  mostrarVista('dashboard');
  cargarDashboard();

  document.querySelector('[data-view="dashboard"]').addEventListener('click', () => {
    mostrarVista('dashboard');
    cargarDashboard();
  });

  document.querySelector('[data-view="usuarios"]').addEventListener('click', () => {
    mostrarVista('usuarios');
    cargarUsuarios();
  });
});