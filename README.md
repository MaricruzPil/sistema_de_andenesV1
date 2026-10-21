# Sistema de Control de Andenes

**Prototipo de aplicación web para el registro, seguimiento y análisis de operaciones de carga en andenes logísticos.**

Este proyecto se desarrolló como una propuesta académica de digitalización del área de embarques de una empresa ferretera, tomando como referencia una operación de **31 andenes**. Su finalidad es concentrar en un solo sistema la información que normalmente se consulta o registra de forma manual: disponibilidad de andenes, inicio y fin de cargas, personal asignado, observaciones, incidencias e indicadores operativos.

> **Estado del proyecto:** prototipo de demostración con desarrollo local en Python, Flask y MySQL. No representa un sistema desplegado oficialmente ni en operación productiva dentro de TRUPER. 

## ¿Por qué se hizo?

En el proceso de embarques se identificó la necesidad de contar con información más accesible y trazable para supervisar las cargas. Entre los problemas que motivaron la propuesta se encuentran:

- Registro manual o disperso de las operaciones y sus tiempos.
- Dificultad para conocer oportunamente qué andenes están disponibles u ocupados.
- Poca visibilidad del personal asignado a cada carga.
- Dificultad para documentar incidencias, retrasos y tiempos muertos.
- Falta de indicadores consolidados para analizar la utilización de andenes y la operación por turno.

El sistema busca **facilitar el registro y la consulta de información**, así como ofrecer datos para el seguimiento operativo y la toma de decisiones. No se afirma una reducción comprobada de tiempos o costos, ya que ese impacto requeriría una evaluación en un entorno real.

## Objetivo y alcance

Desarrollar una aplicación web que permita:

1. Registrar el inicio y la finalización de operaciones de carga.
2. Consultar el estado de los andenes y las cargas en progreso.
3. Capturar el tipo de vehículo, personal asignado, observaciones e incidencias.
4. Almacenar un historial de operaciones y eventos.
5. Presentar métricas, gráficas e información de ocupación para gerencia.
6. Administrar el acceso a las funciones mediante usuarios y roles.

El proyecto se centra en la **supervisión y trazabilidad de las operaciones de carga**. No automatiza físicamente los andenes, la asignación de rutas ni el proceso logístico completo.

## ¿Hasta dónde se llegó?

La versión documentada del prototipo contempla tres interfaces principales —**Checador, Gerente y Administrador**— y los módulos descritos a continuación.

| Módulo | Funciones incluidas en la versión descrita |
| --- | --- |
| Acceso | Inicio de sesión y acceso diferenciado según el rol. |
| Operación de andenes | Consulta de disponibilidad, registro de cargas, finalización y actualización del estado. |
| Seguimiento | Cargas en progreso, historial, observaciones e incidencias. |
| Panel gerencial | Métricas, ocupación, gráficas e historial de operación. |
| Administración | Consulta y mantenimiento de usuarios, roles y estados de andenes. |
| Reportes | Exportación del panel gerencial a PDF. |

### Estado de implementación y despliegue

- **Desarrollo local:** se trabajó con Flask como backend, MySQL como base de datos y HTML, CSS y JavaScript para las interfaces.
- **Prototipo funcional:** se desarrolló una versión de demostración para ejecutar y probar los flujos principales de los diferentes roles en un entorno local.


## Tecnologías utilizadas

| Capa | Tecnologías |
| --- | --- |
| Backend | Python, Flask |
| Base de datos | MySQL, PyMySQL |
| Frontend | HTML, CSS, JavaScript |
| Visualización | Chart.js |
| Iconografía | Font Awesome |
| Desarrollo local | Visual Studio Code, MySQL Workbench |

### Arquitectura general

```text
Usuario (navegador)
        |
        v
HTML / CSS / JavaScript
        |
        | Solicitudes HTTP a rutas y API
        v
Python + Flask
        |
        | Consultas SQL mediante PyMySQL
        v
Base de datos MySQL
```

La aplicación utiliza el backend Flask para procesar operaciones y consultar MySQL; el frontend no debe conectarse directamente a la base de datos ni almacenar credenciales.

## Roles y forma de uso

### 1. Checador

Es el perfil orientado al registro de las operaciones de carga.

1. Inicia sesión con sus credenciales.
2. Consulta los andenes y selecciona uno disponible.
3. Indica el tipo de vehículo y la cantidad de personas asignadas.
4. Registra el inicio de la carga y, si es necesario, añade observaciones.
5. Consulta sus cargas en progreso.
6. Al finalizar, registra el cierre de la operación, incluyendo observaciones finales o incidentes.
7. El sistema registra la duración y actualiza el estado del andén.

### 2. Gerente

Es el perfil de consulta y análisis de la operación.

1. Inicia sesión y accede al dashboard gerencial.
2. Revisa el estado general de los andenes.
3. Consulta indicadores y gráficas de ocupación, vehículos y turnos.
4. Revisa el historial de cargas y los eventos registrados.
5. Exporta la información del dashboard a PDF cuando lo necesita.

### 3. Administrador

Es el perfil de mantenimiento operativo del sistema.

1. Inicia sesión y accede al panel de administración.
2. Consulta el estado de los andenes y, cuando corresponde, lo modifica manualmente.
3. Crea, edita o elimina cuentas de usuario.
4. Asigna los roles de acceso correspondientes.

## Estructura del proyecto

La siguiente es la estructura principal documentada; pueden existir otros archivos auxiliares en el repositorio.

```text
.
├── app.py
├── requirements.txt
├── .env.example
├── templates/
│   ├── index.html
│   ├── checador.html
│   ├── Gerente.html
│   └── Admin.html
└── static/
    ├── css/
    └── js/
```

- `app.py`: aplicación Flask y lógica de las rutas.
- `requirements.txt`: dependencias Python.
- `.env.example`: referencia de las variables de configuración, sin secretos reales.
- `templates/`: plantillas de las pantallas de la aplicación.
- `static/`: hojas de estilo y scripts utilizados por las interfaces.

## Instalación y ejecución local


### 1. Obtener el código

### 2. Crear el entorno virtual

```powershell
python -m venv .venv
```

Activarlo desde PowerShell en Windows:

```powershell
.venv\Scripts\Activate.ps1
```

### 3. Instalar dependencias

```powershell
python -m pip install -r requirements.txt
```

### 4. Configurar las variables de entorno

Crea el archivo `.env` a partir del ejemplo:

```powershell
Copy-Item .env.example .env
```

Configura los valores apropiados para tu entorno.

### 5. Preparar la base de datos

La aplicación requiere una base de datos MySQL con las tablas, relaciones y objetos SQL correspondientes. El **respaldo con datos reales no se incluye en el repositorio**. Para ejecutarla en otro equipo debes crear o restaurar una base de datos de demostración autorizada y actualizar la configuración de `.env`.

Entidades principales documentadas:

- `usuarios`
- `andenes`
- `historial_cargas`
- `eventos`
- `tipos_vehiculo`
- `turnos`

El proyecto también contempla vistas SQL para métricas de operación y eficiencia. Los nombres y la estructura definitiva deben verificarse contra el esquema utilizado por la versión del código que se publique.

### 6. Ejecutar la aplicación

Desde la carpeta raíz:

```powershell
python app.py
```

Si Flask inicia correctamente con la configuración local esperada, abre:

```text
http://127.0.0.1:5000
```

Inicia sesión con una cuenta de pruebas autorizada y accede al panel según su rol.

## Flujo general de una operación

```text
Inicio de sesión
       |
       v
Selección de rol y panel
       |
       v
Checador selecciona un andén disponible
       |
       v
Registra vehículo, personal y observaciones
       |
       v
Inicia la carga -> andén ocupado
       |
       v
Finaliza la carga y registra incidencias
       |
       v
Se calcula la duración y se libera el andén
       |
       v
La operación queda en el historial
       |
       v
Gerencia consulta métricas y reportes
```

## API principal

Rutas documentadas para la aplicación. Su disponibilidad y comportamiento exactos deben corresponder con la versión de `app.py` publicada.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/login` | Iniciar sesión. |
| `GET` | `/api/andenes` | Consultar el estado de los andenes. |
| `GET` | `/api/metricas` | Consultar indicadores operativos. |
| `POST` | `/api/iniciar_carga` | Registrar el inicio de una carga. |
| `POST` | `/api/finalizar_carga/<id>` | Finalizar una carga determinada. |
| `GET` | `/api/historial_eventos` | Consultar el historial de eventos. |
| `GET` | `/api/usuarios` | Consultar usuarios. |
| `POST` | `/api/usuarios` | Crear usuarios. |
| `PUT` | `/api/usuarios/<id>` | Editar usuarios. |
| `DELETE` | `/api/usuarios/<id>` | Eliminar usuarios. |

## Usuarios de demostración

Para pruebas locales se han contemplado cuentas asociadas a los roles `checador_demo`, `gerente_demo` y `admin_demo`. Su disponibilidad depende de los registros existentes en la base de datos de prueba.

## Trabajo pendiente y posibles mejoras

1. Completar y verificar la migración de MySQL local a un servicio de base de datos en la nube.
2. Validar el despliegue del backend Flask y la conexión segura con MySQL desde el proveedor de alojamiento seleccionado.
3. Realizar pruebas de los endpoints, autenticación, permisos, sesiones y manejo de errores.
4. Comprobar la consistencia de los indicadores mediante datos de prueba y distintos escenarios operativos.
5. Mejorar la documentación del esquema SQL, las variables requeridas y el procedimiento de inicialización.
6. Evaluar el rendimiento, la experiencia de uso móvil y la actualización oportuna de los estados.
7. Preparar, si se autoriza, una evaluación piloto que permita medir resultados reales antes de considerar su uso productivo.

## Limitaciones

- El proyecto es un **prototipo académico/de demostración**, no una solución certificada ni implantada oficialmente.
- La información y los indicadores dependen de la calidad de los registros ingresados por los usuarios.
- No dispone de datos históricos reales suficientes para afirmar mejoras cuantitativas en productividad.
- Requiere conectividad y disponibilidad de la aplicación y de su base de datos.
- No incluye la automatización física del proceso ni una integración empresarial completa con otros sistemas.

## Contexto académico

Este desarrollo forma parte de una propuesta tecnológica orientada a mejorar la visibilidad de los procesos de embarque mediante registro digital, trazabilidad, paneles de consulta y análisis de información. Sirve como demostración de la integración de desarrollo web, bases de datos y herramientas de visualización aplicadas a un problema de logística.
