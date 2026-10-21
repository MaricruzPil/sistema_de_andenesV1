// Tabs
const tabs = document.querySelectorAll('.tab-btn');
const sections = document.querySelectorAll('.tab-section');

// Gráficas (si las usas en otra parte)
let graficaOcupacion = null;
let graficaTiposVehiculo = null;
let graficaEficienciaTurnos;
let cargarHistorial;

// Logout
document.getElementById("btnLogout").addEventListener("click", () => {
  window.location.href = "/logout";
});

// Helper: obtener turno actual del select
function obtenerTurnoActual() {
  const sel = document.getElementById('turno');
  // fallback a "general" si no existe o está vacío
  return sel ? (sel.value || 'general') : 'general';
}

// Listener: cambio de turno → recargar vista activa
const turnoSelect = document.getElementById('turno');
if (turnoSelect) {
  turnoSelect.addEventListener('change', () => {
    recargarVistaActiva();
  });
}

// Determina tab activa y recarga según su contenido
function recargarVistaActiva() {
  const turno = obtenerTurnoActual();
  const activeIndex = Array.from(tabs).findIndex(t => t.classList.contains('active'));
  const activeTab = tabs[activeIndex];
  const texto = (activeTab?.textContent || '').toLowerCase();

  if (texto.includes('vista')) {
    cargarMetricas(turno);
    cargarAndenes(turno);
    cargarEventos(turno);
  }

  if (texto.includes('análisis')) {
    cargarGrafica(turno);
    cargarGraficaTiposVehiculo(turno);
  }

  if (texto.includes('historial')) {
    cargarHistorialEventos(turno);
  }
}

// Tabs behavior
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    tab.classList.add('active');
    sections[index].classList.add('active');

    recargarVistaActiva();
  });
});

// Carga inicial (asegura que haya una pestaña activa)
window.addEventListener('DOMContentLoaded', () => {
  if (tabs.length) {
    tabs[0].classList.add('active');
    sections[0].classList.add('active');
  }
  recargarVistaActiva();
});

// Métricas filtradas por turno
function cargarMetricas(turno = 'general') {
  fetch(`/api/metricas?turno=${encodeURIComponent(turno)}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('metrica-total').textContent = data.total ?? 0;
      document.getElementById('metrica-disponibles').textContent = data.disponibles ?? 0;
      document.getElementById('metrica-ocupados').textContent = data.ocupados ?? 0;
      document.getElementById('metrica-fuera').textContent = data.fuera ?? 0;
      document.getElementById('metrica-alerta').textContent = data.alerta ?? 0;
    })
    .catch(err => console.error('Error cargando métricas:', err));
}

// Andenes filtrados por turno (vista rápida agrupada por naves)
async function cargarAndenes(turno = 'general') {
  try {
    const [resAndenes, resHistorial] = await Promise.all([
      fetch(`/api/andenes?turno=${encodeURIComponent(turno)}`),
      fetch(`/api/historial_andenes?turno=${encodeURIComponent(turno)}`)
    ]);

    const andenes = await resAndenes.json();
    const historial = await resHistorial.json();

    // Indexar historial por id_anden (ajusta clave si en tu API es diferente)
    const historialMap = {};
    historial.forEach(h => {
      // Usa id o id_anden según tu respuesta real
      const key = (h.id_anden ?? h.id);
      if (key != null) historialMap[key] = h;
    });

    const container = document.getElementById('naves-container');
    if (!container) return;
    container.innerHTML = '';

    // Agrupar en bloques: 6,6,6,6,7 (31 andenes)
    const bloques = [
      { nave: 1, cantidad: 6 },
      { nave: 2, cantidad: 6 },
      { nave: 3, cantidad: 6 },
      { nave: 4, cantidad: 6 },
      { nave: 5, cantidad: 7 }
    ];

    let indice = 0;
    bloques.forEach(bloque => {
      const andenesBloque = andenes.slice(indice, indice + bloque.cantidad);
      indice += bloque.cantidad;

      const divNave = document.createElement('div');
      divNave.className = `nave nave-${bloque.nave}`;
      divNave.innerHTML = `
        <h4>Nave ${bloque.nave}</h4>
        <div class="andenes-grid" data-nave="${bloque.nave}"></div>
      `;
      container.appendChild(divNave);

      const grid = divNave.querySelector('.andenes-grid');
      andenesBloque.forEach(anden => {
        const key = (anden.id ?? anden.id_anden);
        const h = historialMap[key] || {};
        const div = document.createElement('div');
        div.className = `anden ${anden.estado}`;
        div.style.position = 'relative';

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-contenido';
        tooltip.innerHTML = `
          <div class="tooltip-tarjeta">
            <div><strong>Andén ${anden.id}</strong> – Nave ${anden.nave}</div>
            <div>Estado: ${anden.estado}</div>
            ${
              anden.estado === 'ocupado' ? `
                <div>Vehículo: ${h.nombre_vehiculo ?? 'N/D'}</div>
                <div>Personas: ${h.personas ?? 'N/D'}</div>
                <div>Inicio: ${h.hora_inicio ?? 'N/D'}</div>
                <div>Duración: ${h.duracion_min ?? anden.tiempo ?? 'N/D'} min</div>
                <div>Revisor: ${h.nombre_checador ?? 'N/D'}</div>
              ` : anden.estado === 'alerta' ? `
                <div>Tiempo transcurrido: ${anden.tiempo ?? 'N/D'} min</div>
              ` : ''
            }
          </div>
        `;

        div.innerHTML = `
          <i class="fa-solid fa-box"></i>
          <span>Andén ${anden.id}</span>
        `;
        div.appendChild(tooltip);
        grid.appendChild(div);
      });
    });
  } catch (err) {
    console.error('Error cargando andenes:', err);
  }
}

// Eventos filtrados por turno
function cargarEventos(turno = 'general') {
  fetch(`/api/eventos?turno=${encodeURIComponent(turno)}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('eventos-container');
      if (!container) return;
      container.innerHTML = '';
      data.forEach(ev => {
        const div = document.createElement('div');
        div.className = 'evento';
        div.innerHTML = `
          <div class="evento-hora">${ev.hora}</div>
          <div class="evento-detalle">
            <strong>Andén ${ev.anden}</strong> - <span class="etiqueta ${String(ev.evento || '').toLowerCase()}">${ev.evento}</span>
            <p>${ev.observaciones || 'Evento registrado'} - ${ev.tipo_vehiculo || ''}</p>
            <p class="evento-vehiculo">${ev.tipo_vehiculo || ''}</p>
          </div>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => console.error('Error cargando eventos:', err));
}

function cargarGrafica() {
  fetch('/api/historial_ocupacion')
    .then(res => res.json())
    .then(data => {
      console.log('Datos recibidos:', data);

      const horas = data.map(d => d.hora);
      const ocupados = data.map(d => d.ocupados);
      const disponibles = data.map(d => d.disponibles);
      const fueraServicio = data.map(d => d.fuera_servicio);
      const alerta = data.map(d => d.alerta);

      const ctx = document.getElementById('grafica-ocupacion').getContext('2d');

      if (graficaOcupacion) {
        graficaOcupacion.destroy();
      }

      graficaOcupacion = new Chart(ctx, {
        type: 'line',
        data: {
          labels: horas,
          datasets: [
            {
              label: 'Ocupados',
              data: ocupados,
              borderColor: '#ef4444',
              backgroundColor: '#fee2e2',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Disponibles',
              data: disponibles,
              borderColor: '#10b981',
              backgroundColor: '#d1fae5',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Fuera de servicio',
              data: fueraServicio,
              borderColor: '#6366f1',
              backgroundColor: '#e0e7ff',
              tension: 0.3,
              fill: false
            },
            {
              label: 'Alerta',
              data: alerta,
              borderColor: '#f59e0b',
              backgroundColor: '#fef3c7',
              tension: 0.3,
              fill: false
              
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Ocupación de Andenes por Hora (últimas 24 horas)'
            },
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Cantidad de andenes'
              }
            },
            x: {
              title: {
                display: true,
                text: 'Hora'
              }
            }
          }
        }
      });
    })
    .catch(err => console.error('Error cargando historial de ocupación:', err));
}

function cargarGraficaTiposVehiculo() {
  fetch('/api/vehiculos_por_tipo')
    .then(res => res.json())
    .then(data => {
      console.log('Tipos de vehículos:', data);

      const ctx = document.getElementById('grafica-tipos').getContext('2d');

      if (graficaTiposVehiculo) {
        graficaTiposVehiculo.destroy();
      }

      graficaTiposVehiculo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.tipos,
          datasets: [{
            label: 'Cantidad actual de vehículos en uso',
            data: data.cantidades,
            backgroundColor: '#eba524ff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Uso actual por tipo de vehículo'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: 'Cantidad' }
            },
            x: {
              title: { display: true, text: 'Tipo de vehículo' }
            }
          }
        }
      });
    })
    .catch(err => console.error('Error cargando tipos de vehículos:', err));
}

function cargarGraficaEficienciaTurnos() {
  fetch('/api/eficiencia_turnos')
    .then(res => res.json())
    .then(data => {
      console.log('Eficiencia por turno:', data);

      const ctx = document.getElementById('grafica-eficiencia').getContext('2d');

      if (graficaEficienciaTurnos) {
        graficaEficienciaTurnos.destroy();
      }

      const colores = ['#10b981', '#f59e0b', '#6366f1', '#ef4444'];

      graficaEficienciaTurnos = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.turnos,
          datasets: [{
            data: data.eficiencias,
            backgroundColor: colores
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: 'Eficiencia porcentual por turno'
            },
            tooltip: {
              callbacks: {
                label: context => `${context.label}: ${context.parsed}%`
              }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    })
    .catch(err => console.error('Error cargando eficiencia por turno:', err));
}
function cargarHistorialEventos() {
  fetch('/api/historial_eventos')
    .then(res => res.json())
    .then(data => {
      const tabla = document.getElementById('tabla-historial');
      tabla.innerHTML = '';

      data.forEach(ev => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${ev.id}</td>
          <td>${ev.fecha}</td>
          <td>${ev.mensaje}</td>
          <td>${ev.vehiculo}</td>
          <td>${ev.excedido}</td>
          <td>${ev.usuario}</td>
          <td>${ev.severidad}</td>
        `;
        tabla.appendChild(fila);
      });
    })
    .catch(err => console.error('Error cargando historial de eventos:', err));
}

document.addEventListener('DOMContentLoaded', () => {
  cargarEventos();
  cargarMetricas();
  cargarGraficaTiposVehiculo();
  cargarGraficaEficienciaTurnos();
  cargarHistorialEventos();
  actualizarDashboard();

});
document.getElementById('btn-exportar').addEventListener('click', () => {
  const elemento = document.getElementById('exportable-dashboard');

  if (!elemento) {
    console.error('No se encontró el contenedor #exportable-dashboard');
    return;
  }

  // Mostrar todas las secciones si están ocultas por pestañas
  document.querySelectorAll('.tab-section').forEach(s => s.classList.add('active'));

  const opciones = {
    margin: 10,
    filename: 'dashboard_operativo.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opciones).from(elemento).save();
});
andenes.forEach(anden => {
  const div = document.createElement('div');
  div.className = `anden ${anden.estado}`;

  // Generar resumen según estado
  let resumen = '';
  if (anden.estado === 'ocupado') {
    resumen = `
      Andén ${anden.id} – Nave ${anden.nave}
      Estado: Ocupado
      Vehículo: ${anden.tipo_vehiculo || 'N/D'}
      Revisor: ${anden.nombre_checador || 'N/D'}
      Personas: ${anden.personas || 'N/D'}
      Inicio: ${anden.inicio || 'N/D'}
      Tiempo: ${anden.tiempo || 'N/D'} min
    `;
  } else if (anden.estado === 'alerta') {
    resumen = `
      Andén ${anden.id} – Nave ${anden.nave}
      Estado: Alerta
      Tiempo transcurrido: ${anden.tiempo || 'N/D'} min
    `;
  } else {
    resumen = `
      Andén ${anden.id} – Nave ${anden.nave}
      Estado: ${anden.estado}
    `;
  }

  div.title = resumen.trim(); // tooltip nativo
  div.innerHTML = `
    <i class="fa-solid fa-box"></i>
    <span>Andén ${anden.id}</span>
  `;
  grid.appendChild(div);
});

function actualizarDashboard() {
  cargarMetricas();
  cargarResumenAndenes();
  cargarEventos();
  cargarGrafica();
  cargarGraficaEficienciaTurnos() 
  cargarGraficaTiposVehiculo(); // barras por tipo
  cargarGraficaDistribucion();  // pastel por estado
  cargarHistorialEventos();    // tabla de historial
}

document.getElementById('btn-actualizar').addEventListener('click', () => {
  actualizarDashboard();
});