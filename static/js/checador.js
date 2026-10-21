document.getElementById("btnLogout").addEventListener("click", () => {
  window.location.href = "/logout";
});
let tiposVehiculo = [];
const idChecador = parseInt(document.getElementById("id-checador").value);
const nombreChecador = document.getElementById("nombre-checador").value;

function cargarAndenesDisponibles() {
  fetch("/api/andenes_disponibles")
    .then(res => res.json())
    .then(data => {
      const contenedor = document.querySelector(".andenes-container");
      const contador = document.getElementById("contador-andenes");

      contenedor.innerHTML = "";
      contador.textContent = `${data.length} disponibles`;

      data.forEach(anden => {
        const btn = document.createElement("button");
        btn.className = "btn-anden";
        btn.innerHTML = `
          <div class="btn-label-anden">Andén ${anden.id}</div>
          <div class="btn-label-nave">Nave ${anden.nave}</div>
        `;

        btn.dataset.id = anden.id;
/*         btn.textContent = ` Andén ${anden.id} \nNave ${anden.nave}`; */
        contenedor.appendChild(btn);
      });
    })
    .catch(err => console.error("Error cargando andenes disponibles:", err));
}

document.addEventListener("click", (e) => {
  const boton = e.target.closest(".btn-anden");
  if (boton) {
    const idAnden = boton.dataset.id;
    if (!idAnden || isNaN(idAnden)) {
      console.error("ID de andén inválido:", idAnden);
      return;
    }
    abrirFormularioCarga(idAnden);
  }
});


function cargarCargasEnProgreso() {
  fetch("/api/cargas_en_progreso")
    .then(res => res.json())
    .then(data => {
      const contenedor = document.querySelector(".carga-en-progreso");
      contenedor.innerHTML = "";

      const titulo = document.createElement("h3");
      titulo.textContent = "Finalizar mis cargas en progreso:";
      contenedor.appendChild(titulo);

      const grupoBotones = document.createElement("div");
      grupoBotones.className = "contenedor-cargas";
      contenedor.appendChild(grupoBotones);

      data.forEach(carga => {
        const btn = document.createElement("button");
        btn.className = "btn-finalizar-carga";
        btn.dataset.id = carga.id;
        btn.innerHTML = `
          Andén ${carga.id}<br>
          <span class="tiempo">${carga.tiempo}</span>
          ${carga.excedido ? '<span class="alerta-dot"></span>' : ''}
        `;
        grupoBotones.appendChild(btn);
      });
    })
    .catch(err => console.error("Error cargando cargas en progreso:", err));
}

function cargarTurnos() {
  fetch("/api/turnos_activos")
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("turno");
      select.innerHTML = ""; // Limpia opciones anteriores

      data.forEach(turno => {
        const option = document.createElement("option");
        option.value = turno.id_turno;
        option.textContent = turno.nombre_turno;
        select.appendChild(option);
      });
    })
    .catch(err => console.error("Error cargando turnos:", err));
}

document.addEventListener("click", (e) => {
  const boton = e.target.closest(".btn-anden");
  if (boton) {
    const idAnden = boton.dataset.id;
    abrirFormularioCarga(idAnden);
  }
});

function abrirFormularioCarga(idAnden) {
  Promise.all([
    fetch(`/api/datos_anden/${idAnden}`).then(res => res.json()),
    fetch("/api/tipos_vehiculo").then(res => res.json())
  ])
  .then(([andenData, tiposData]) => {
    if (andenData.error || tiposData.error) return;

    tiposVehiculo = tiposData;

    // Llenar datos del andén
    document.getElementById("form-anden").textContent = andenData.id_anden;
    document.getElementById("dato-anden").textContent = andenData.id_anden;
    document.getElementById("dato-nave").textContent = andenData.id_nave;

    // Llenar select de vehículos
    const select = document.getElementById("form-vehiculo");
    select.innerHTML = "";
    tiposVehiculo.forEach(tipo => {
      const option = document.createElement("option");
      option.value = tipo.id_tipo;
      option.textContent = tipo.nombre;
      select.appendChild(option);
    });

    // Seleccionar el tipo actual del andén
    const tipoActual = tiposVehiculo.find(t => t.nombre === andenData.tipo_vehiculo);
    if (tipoActual) {
      select.value = tipoActual.id_tipo;
      document.getElementById("form-personas").value = tipoActual.personas_requeridas;
      document.getElementById("form-sugerido").textContent = `Sugerido para ${tipoActual.nombre}: ${tipoActual.personas_requeridas} personas`;
    } else {
      document.getElementById("form-personas").value = "";
      document.getElementById("form-sugerido").textContent = "";
    }

    // Mostrar el modal
    document.getElementById("modal-formulario").classList.remove("oculto");
  })
  .catch(err => console.error("Error al cargar datos del andén o tipos de vehículo:", err));
}


function cargarTiposVehiculo() {
  fetch("/api/tipos_vehiculo")
    .then(res => res.json())
    .then(data => {
      tiposVehiculo = data;
      const select = document.getElementById("form-vehiculo");
      select.innerHTML = "";

      data.forEach(tipo => {
        const option = document.createElement("option");
        option.value = tipo.id_tipo;
        option.textContent = tipo.nombre;
        select.appendChild(option);
      });

      // Disparar evento manualmente para inicializar cantidad sugerida
      select.dispatchEvent(new Event("change"));
    })
    .catch(err => console.error("Error cargando tipos de vehículo:", err));
}

document.getElementById("form-vehiculo").addEventListener("change", (e) => {
  const idSeleccionado = parseInt(e.target.value);
  const tipo = tiposVehiculo.find(t => t.id_tipo === idSeleccionado);
  if (tipo) {
    document.getElementById("form-personas").value = tipo.personas_requeridas;
    document.getElementById("form-sugerido").textContent = `Sugerido para ${tipo.nombre}: ${tipo.personas_requeridas} personas`;
  }
});

document.querySelector(".cerrar-modal").addEventListener("click", () => {
  document.getElementById("modal-formulario").classList.add("oculto");
});

document.querySelector(".btn-cancelar").addEventListener("click", () => {
  document.getElementById("modal-formulario").classList.add("oculto");
});

document.querySelector(".btn-iniciar-carga").addEventListener("click", () => {
  const idAnden = parseInt(document.getElementById("dato-anden").textContent);
  const idNave = parseInt(document.getElementById("dato-nave").textContent);
  const idTipoVehiculo = parseInt(document.getElementById("form-vehiculo").value);
  const nombreVehiculo = document.getElementById("form-vehiculo").selectedOptions[0].textContent;
  const personas = parseInt(document.getElementById("form-personas").value);
  const sugerido = tiposVehiculo.find(t => t.id_tipo === idTipoVehiculo)?.personas_requeridas || 0;
  const cambioManual = personas !== sugerido;
  const observaciones = document.getElementById("form-observaciones").value;

  const turnoSelect = document.getElementById("turno");
  const idTurno = parseInt(turnoSelect.value);
  const nombreTurno = turnoSelect.selectedOptions[0].textContent;

  const payload = {
  id_anden: idAnden,
  id_nave: idNave,
  id_tipo_vehiculo: idTipoVehiculo,
  nombre_vehiculo: nombreVehiculo,
  personas: personas,
  cambio_manual: cambioManual,
  notas: observaciones,
  id_turno: idTurno,
  nombre_turno: nombreTurno,
  id_checador: idChecador,
  nombre_checador: nombreChecador
};

  fetch("/api/iniciar_carga", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("Carga registrada correctamente");
      document.getElementById("modal-formulario").classList.add("oculto");
      cargarAndenesDisponibles();
    } else {
      alert("Error al registrar la carga");
      console.error(data.error);
    }
  })
  .catch(err => {
    console.error("Error en la solicitud:", err);
    alert("Error al conectar con el servidor");
  });
});

document.addEventListener("click", (e) => {
  const boton = e.target.closest(".btn-finalizar-carga"); // ← debe coincidir
  if (boton) {
    const idAnden = boton.dataset.id;
    abrirFormularioFinalizacion(idAnden);
  }
});

function abrirFormularioFinalizacion(idAnden) {
  fetch(`/api/datos_anden_ocupado/${idAnden}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) return alert("Andén no disponible");

      // Mostrar datos básicos
      document.getElementById("final-anden").textContent = data.id_anden;
      document.getElementById("final-dato-anden").textContent = data.id_anden;
      document.getElementById("final-dato-nave").textContent = data.id_nave;
      document.getElementById("final-dato-vehiculo").textContent = data.nombre_vehiculo;
      document.getElementById("final-dato-checador").textContent = data.nombre_checador;

      // Ajustar hora de inicio a zona local (México)
      // Ajustar hora de inicio a zona local (México)
      const horaUTC = new Date(data.hora_inicio); // ya viene en GMT
      horaUTC.setHours(horaUTC.getHours() - 6);   // ajusta a UTC-6

// Formatear fecha completa en español
      const fechaFormateada = horaUTC.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

      const horaFormateada = horaUTC.toLocaleTimeString("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
});

      document.getElementById("final-dato-hora").textContent = `${fechaFormateada} a las ${horaFormateada}`;


      // Calcular tiempo transcurrido usando data.minutos
      const minutos = data.minutos;
      const horas = Math.floor(minutos / 60);
      const restoMin = minutos % 60;

      let tiempoTexto = "hace ";
      if (horas > 0) tiempoTexto += `${horas} ${horas === 1 ? "hora" : "horas"} `;
      if (restoMin > 0 || horas === 0) tiempoTexto += `${restoMin} ${restoMin === 1 ? "minuto" : "minutos"}`;

document.getElementById("final-dato-tiempo").textContent = tiempoTexto.trim();

      // Mostrar alerta si excedido
      const excedido = minutos > data.tiempo_promedio;
      document.getElementById("btn-excedido").classList.toggle("oculto", !excedido);

      // Mostrar modal
      document.getElementById("modal-finalizar").classList.remove("oculto");
    })
    .catch(err => console.error("Error al abrir formulario de finalización:", err));
}

document.addEventListener("click", (e) => {
  if (e.target.matches(".finalizar-cerrar") || e.target.matches(".finalizar-cancelar")) {
    document.getElementById("modal-finalizar").classList.add("oculto");
  }
});

document.querySelector(".finalizar-confirmar").addEventListener("click", () => {
  const idAnden = document.getElementById("final-anden").textContent;
  const observaciones = document.getElementById("final-observaciones").value.trim();
  const causa = document.getElementById("final-incidente").value.trim();

  fetch(`/api/finalizar_carga/${idAnden}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ observaciones, causa })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Carga finalizada correctamente");
        document.getElementById("modal-finalizar").classList.add("oculto");
      } else {
        alert("Error al finalizar carga");
      }
    })
    .catch(err => console.error("Error al finalizar carga:", err));
});



document.addEventListener("DOMContentLoaded", () => {
  cargarAndenesDisponibles();
  cargarCargasEnProgreso();
  cargarTurnos();

});
