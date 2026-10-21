from flask import Flask, render_template, request, jsonify, url_for, session, redirect
import os
import pymysql
import pymysql.cursors
from datetime import datetime, timedelta
from werkzeug.security import check_password_hash, generate_password_hash
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-only-secret-change-me")

def get_connection():
    return pymysql.connect(
        host=os.environ.get("MYSQL_HOST", "localhost"),
        user=os.environ.get("MYSQL_USER", "root"),
        password=os.environ.get("MYSQL_PASSWORD", ""),
        db=os.environ.get("MYSQL_DATABASE", "logistica_trupper"),
        port=int(os.environ.get("MYSQL_PORT", "3306")),
        cursorclass=pymysql.cursors.DictCursor
    )

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    usuario = data.get("usuario")
    contrasena = data.get("contrasena")

    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT * FROM usuarios WHERE usuario = %s", (usuario,))
            user = cursor.fetchone()

            if not user:
                return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

            if not check_password_hash(user['contraseña'], contrasena):
                return jsonify({"success": False, "message": "Contraseña incorrecta"}), 401

            if not user['activo']:
                return jsonify({"success": False, "message": "Usuario inactivo"}), 403

            # ✅ Aquí ya puedes usar user sin error
            session['nombre_usuario'] = user['nombre_completo']
            session['id_usuario'] = user['id_usuario']
            session['rol'] = user['rol']

            if user['rol'] == "checador":
                return jsonify({"success": True, "redirect": url_for('checador')})
            elif user['rol'] == "gerente":
                return jsonify({"success": True, "redirect": url_for('gerente')})
            elif user['rol'] == "administrador":
                return jsonify({"success": True, "redirect": url_for('admin')})
            else:
                return jsonify({"success": False, "message": "Rol no reconocido"}), 403

    except Exception as e:
        app.logger.error(f"Error en login: {e}")
        return jsonify({"success": False, "message": "Error interno"}), 500
    finally:
        conn.close()


@app.route('/gerente')
def gerente():
    return render_template('Gerente.html')

@app.route('/admin')
def admin():
    return render_template('Admin.html')

@app.route('/checador')
def checador():
    nombre = session.get('nombre_usuario', 'Usuario')
    id_usuario = session.get('id_usuario', None)
    return render_template('checador.html', nombre_usuario=nombre, id_usuario=id_usuario)

@app.route("/api/metricas")
def metricas():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Métricas por estado de andenes
            cursor.execute("""
                SELECT estado, COUNT(*) AS cantidad
                FROM andenes
                GROUP BY estado
            """)
            estados = cursor.fetchall()

        total = sum(row['cantidad'] for row in estados)
        disponibles = next((r['cantidad'] for r in estados if r['estado'] == 'disponible'), 0)
        ocupados = next((r['cantidad'] for r in estados if r['estado'] == 'ocupado'), 0)
        fuera = next((r['cantidad'] for r in estados if r['estado'] == 'fuera_de_servicio'), 0)
        alerta = next((r['cantidad'] for r in estados if r['estado'] == 'alerta'), 0)


        return jsonify({
            "total": total,
            "disponibles": disponibles,
            "ocupados": ocupados,
            "fuera": fuera,
            "alerta": alerta
        })

    except Exception as e:
        app.logger.error(f"Error en /api/metricas: {e}")
        return jsonify({"error": "Error interno al obtener métricas"}), 500
    finally:
        conn.close()

@app.route("/api/andenes")
def get_andenes():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    id_anden AS id,               -- identificador único global (1 al 31)
                    numero_anden,                 -- número visible dentro de la nave
                    id_nave AS nave,              -- agrupación real por nave
                    estado,
                    id_tipo_vehiculo AS tipo_vehiculo,
                    hora_inicio AS inicio,
                    TIMESTAMPDIFF(MINUTE, IFNULL(hora_inicio, NOW()), NOW()) AS tiempo
                FROM andenes
                ORDER BY id_anden ASC
            """)
            andenes = cursor.fetchall()
        return jsonify(andenes)
    except Exception as e:
        app.logger.error(f"Error en /api/andenes: {e}")
        return jsonify({"error": "Error interno al obtener andenes"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/api/historial_andenes")
def get_historial_andenes():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT hc.id_anden,
                       hc.id_nave AS nave,
                       hc.nombre_vehiculo,
                       hc.hora_inicio,
                       hc.hora_fin,
                       hc.duracion_min,
                       hc.personas,
                       hc.excedido,
                       hc.minutos_excedidos,
                       hc.nombre_checador,
                       hc.nombre_turno,
                       hc.notas_final,
                       hc.incidente
                FROM historial_cargas hc
                INNER JOIN (
                    SELECT id_anden, MAX(fecha_creacion) AS ultima
                    FROM historial_cargas
                    GROUP BY id_anden
                ) ult ON hc.id_anden = ult.id_anden AND hc.fecha_creacion = ult.ultima
                ORDER BY hc.id_anden ASC
            """)
            historial = cursor.fetchall()
        return jsonify(historial)
    except Exception as e:
        app.logger.error(f"Error en /api/historial_andenes: {e}")
        return jsonify({"error": "Error interno al obtener historial"}), 500
    finally:
        if conn:
            conn.close()

@app.route("/api/eventos")
def get_eventos():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    a.numero_anden AS anden,
                    e.tipo_evento AS evento,
                    DATE_FORMAT(e.fecha_creacion, '%H:%i') AS hora,
                    e.nombre_vehiculo AS tipo_vehiculo,
                    e.mensaje AS observaciones
                FROM eventos e
                JOIN andenes a ON a.id_anden = e.id_anden
                ORDER BY e.fecha_creacion DESC
                LIMIT 10
            """)
            eventos = cursor.fetchall()
        return jsonify(eventos)
    except Exception as e:
        app.logger.error(f"Error en /api/eventos: {e}")
        return jsonify({"error": "Error interno al obtener eventos"}), 500
    finally:
        if conn:
            conn.close()

from datetime import datetime, timedelta

@app.route("/api/historial_ocupacion")
def historial_ocupacion():
    conn = get_connection()
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        # 1. Ocupación por hora (últimas 24 horas)
        cursor.execute("""
            SELECT 
                DATE_FORMAT(hora_inicio, '%H:%i') AS hora,
                COUNT(*) AS ocupados,
                SUM(CASE WHEN excedido THEN 1 ELSE 0 END) AS excedidos
            FROM historial_cargas
            WHERE hora_inicio >= NOW() - INTERVAL 24 HOUR
            GROUP BY DATE_FORMAT(hora_inicio, '%H:%i')
            ORDER BY hora
        """)
        ocupacion = cursor.fetchall()

        # 2. Estado actual de los andenes
        cursor.execute("""
            SELECT 
                SUM(CASE WHEN estado = 'disponible' THEN 1 ELSE 0 END) AS disponibles,
                SUM(CASE WHEN estado = 'fuera_de_servicio' THEN 1 ELSE 0 END) AS fuera_servicio
            FROM andenes
        """)
        estado_actual = cursor.fetchone()
    conn.close()

    # Completar horas faltantes
    horas_existentes = {r['hora'] for r in ocupacion}
    ahora = datetime.now().replace(minute=0, second=0, microsecond=0)
    horas = [(ahora - timedelta(hours=i)).strftime("%H:%M") for i in reversed(range(24))]

    resultado = []
    for h in horas:
        match = next((r for r in ocupacion if r['hora'] == h), None)
        resultado.append({
            "hora": h,
            "ocupados": match["ocupados"] if match else 0,
            "alerta": match["excedidos"] if match else 0,
            "disponibles": estado_actual["disponibles"],
            "fuera_servicio": estado_actual["fuera_servicio"]
        })

    return jsonify(resultado)

@app.route("/api/vehiculos_por_tipo")
def vehiculos_por_tipo():
    conn = get_connection()
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT 
                tv.nombre AS tipo_vehiculo,
                COUNT(*) AS cantidad
            FROM historial_cargas hc
            JOIN tipos_vehiculo tv ON hc.id_tipo_vehiculo = tv.id_tipo
            GROUP BY tv.nombre
            ORDER BY cantidad DESC
        """)
        datos = cursor.fetchall()
    conn.close()

    resultado = {
        "tipos": [row["tipo_vehiculo"] for row in datos],
        "cantidades": [row["cantidad"] for row in datos]
    }

    return jsonify(resultado)


@app.route("/api/eficiencia_turnos")
def eficiencia_turnos():
    conn = get_connection()
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT id_turno, ROUND(eficiencia_porcentual, 2) AS eficiencia
            FROM v_eficiencia_turno
            ORDER BY id_turno
        """)
        datos = cursor.fetchall()
    conn.close()

    # Mapeo de id_turno a etiquetas personalizadas
    etiquetas = {
        1: "1ro",
        2: "2do",
        3: "4to_inicio",
        4: "4to_fin"
    }

    resultado = {
        "turnos": [etiquetas.get(row['id_turno'], f"{row['id_turno']}° turno") for row in datos],
        "eficiencias": [row["eficiencia"] for row in datos]
    }

    return jsonify(resultado)


@app.route("/api/historial_eventos")
def historial_eventos():
    conn = get_connection()
    with conn.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("""
            SELECT 
                id_historial,
                hora_inicio,
                notas,
                nombre_vehiculo,
                excedido,
                nombre_checador
            FROM historial_cargas
            ORDER BY hora_inicio DESC
            LIMIT 100
        """)
        datos = cursor.fetchall()
    conn.close()

    resultado = []
    for row in datos:
        resultado.append({
            "id": row["id_historial"],
            "fecha": row["hora_inicio"].strftime("%d/%m %H:%M"),
            "mensaje": row["notas"] or "—",
            "vehiculo": row["nombre_vehiculo"] or "—",
            "excedido": "Sí" if row["excedido"] else "No",
            "usuario": row["nombre_checador"] or "—",
            "severidad": "Alta" if row["excedido"] else "Baja"
        })

    return jsonify(resultado)

@app.route("/api/andenes_disponibles")
def andenes_disponibles():
    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    id_anden AS id,
                    id_nave AS nave
                FROM andenes
                WHERE estado != 'ocupado'
                ORDER BY id_anden
            """)
            disponibles = cursor.fetchall()
        return jsonify(disponibles)
    except Exception as e:
        app.logger.error(f"Error en /api/andenes_disponibles: {e}")
        return jsonify({"error": "Error interno al obtener andenes"}), 500
    finally:
        conn.close()

@app.route("/api/cargas_en_progreso")
def cargas_en_progreso():
    nombre_checador = session.get("nombre_usuario", None)
    if not nombre_checador:
        return jsonify({"error": "Usuario no autenticado"}), 401

    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    id_anden AS id,
                    id_nave,
                    TIMESTAMPDIFF(MINUTE, hora_inicio, NOW()) AS minutos
                FROM andenes
                WHERE estado = 'ocupado' AND nombre_checador = %s
                ORDER BY hora_inicio DESC
            """, (nombre_checador,))
            cargas = cursor.fetchall()

            for carga in cargas:
                minutos = carga['minutos']
                horas = minutos // 60
                mins = minutos % 60
                carga['tiempo'] = f"{horas}h {mins}min"

        return jsonify(cargas)
    except Exception as e:
        app.logger.error(f"Error en /api/cargas_en_progreso: {e}")
        return jsonify({"error": "Error interno al obtener cargas"}), 500
    finally:
        conn.close()

@app.route("/logout", methods=["GET", "POST"])
def logout():
    session.clear()
    return redirect(url_for("index"))

@app.route("/api/turnos_activos")
def turnos_activos():
    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT id_turno, nombre_turno
                FROM turnos
                WHERE activo = TRUE
                ORDER BY id_turno
            """)
            turnos = cursor.fetchall()
        return jsonify(turnos)
    except Exception as e:
        app.logger.error(f"Error en /api/turnos_activos: {e}")
        return jsonify({"error": "Error interno al obtener turnos"}), 500
    finally:
        conn.close()


@app.route("/api/datos_anden/<int:id_anden>")
def datos_anden(id_anden):
    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT a.id_anden, a.id_nave, t.nombre AS tipo_vehiculo, t.personas_requeridas
                FROM andenes a
                LEFT JOIN tipos_vehiculo t ON a.id_tipo_vehiculo = t.id_tipo
                WHERE a.id_anden = %s
            """, (id_anden,))
            datos = cursor.fetchone()
            if datos:
                return jsonify(datos)
            else:
                return jsonify({"error": "Andén no encontrado"}), 404
    except Exception as e:
        app.logger.error(f"Error en /api/datos_anden: {e}")
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()

@app.route("/api/tipos_vehiculo")
def tipos_vehiculo():
    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("SELECT id_tipo, nombre, personas_requeridas FROM tipos_vehiculo")
            tipos = cursor.fetchall()
            return jsonify(tipos)
    except Exception as e:
        app.logger.error(f"Error en /api/tipos_vehiculo: {e}")
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()

@app.route("/api/iniciar_carga", methods=["POST"])
def iniciar_carga():
    data = request.get_json()
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Insertar en historial_cargas
            cursor.execute("""
                INSERT INTO historial_cargas (
                    id_anden, id_nave, id_tipo_vehiculo, nombre_vehiculo,
                    hora_inicio, hora_fin, duracion_min, personas,
                    cambio_manual, notas,
                    id_turno, nombre_turno,
                    id_checador, nombre_checador
                )
                VALUES (%s, %s, %s, %s, NOW(), NULL, NULL, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data["id_anden"],
                data["id_nave"],
                data["id_tipo_vehiculo"],
                data["nombre_vehiculo"],
                data["personas"],
                data["cambio_manual"],
                data["notas"],
                data["id_turno"],
                data["nombre_turno"],
                data["id_checador"],
                data["nombre_checador"]
            ))

            # Actualizar estado y campos en andenes
            cursor.execute("""
                UPDATE andenes
                SET estado = 'ocupado',
                    id_tipo_vehiculo = %s,
                    hora_inicio = NOW(),
                    id_checador = %s,
                    nombre_checador = %s,
                    notas_inicio = %s
                WHERE id_anden = %s
            """, (
                data["id_tipo_vehiculo"],
                data["id_checador"],
                data["nombre_checador"],
                data["notas"],
                data["id_anden"]
            ))

            conn.commit()
            return jsonify({"success": True})
    except Exception as e:
        app.logger.error(f"Error en /api/iniciar_carga: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route("/api/datos_anden_ocupado/<int:id_anden>")
def datos_anden_ocupado(id_anden):
    conn = get_connection()
    try:
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute("""
                SELECT 
                    a.id_anden,
                    a.id_nave,
                    a.hora_inicio,
                    tv.nombre AS nombre_vehiculo,
                    a.nombre_checador,
                    TIMESTAMPDIFF(MINUTE, a.hora_inicio, NOW()) AS minutos,
                    tv.tiempo_maximo_horas
                FROM andenes a
                JOIN tipos_vehiculo tv ON a.id_tipo_vehiculo = tv.id_tipo
                WHERE a.id_anden = %s AND a.estado = 'ocupado'
            """, (id_anden,))
            data = cursor.fetchone()
            if not data:
                return jsonify({"error": "Andén no encontrado o no ocupado"}), 404

            # Convertir tiempo máximo de horas a minutos
            tiempo_maximo_min = int(float(data["tiempo_maximo_horas"]) * 60)
            data["tiempo_promedio"] = tiempo_maximo_min  # ← lo que usa el frontend

            # Formato adicional para mostrar duración
            minutos = data["minutos"]
            horas = minutos // 60
            mins = minutos % 60
            data["tiempo"] = f"{horas}h {mins}min"

            return jsonify(data)
    except Exception as e:
        app.logger.error(f"Error en /api/datos_anden_ocupado: {e}")
        return jsonify({"error": "Error interno"}), 500
    finally:
        conn.close()
        
@app.route("/api/finalizar_carga/<int:id_anden>", methods=["POST"])
def finalizar_carga(id_anden):
    datos = request.get_json()
    observaciones = datos.get("observaciones", "")
    causa = datos.get("causa", "")

    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Buscar carga activa en el andén
        cursor.execute("""
            SELECT hc.id_historial, hc.hora_inicio, tv.tiempo_maximo_horas
            FROM historial_cargas hc
            JOIN andenes a ON hc.id_anden = a.id_anden
            JOIN tipos_vehiculo tv ON hc.id_tipo_vehiculo = tv.id_tipo
            WHERE hc.id_anden = %s AND hc.hora_fin IS NULL
        """, (id_anden,))
        carga = cursor.fetchone()

        if not carga:
            cursor.close()
            conn.close()
            return jsonify({"error": "No hay carga activa en ese andén"}), 404

        id_historial = carga["id_historial"]
        hora_inicio = carga["hora_inicio"]
        tiempo_maximo_horas = carga["tiempo_maximo_horas"]

        ahora = datetime.now()
        duracion_min = int((ahora - hora_inicio).total_seconds() / 60)
        tiempo_maximo_min = int(float(tiempo_maximo_horas) * 60)

        excedido = int(duracion_min > tiempo_maximo_min)
        minutos_excedidos = max(0, duracion_min - tiempo_maximo_min)

        # Actualizar historial de carga
        cursor.execute("""
            UPDATE historial_cargas
            SET hora_fin = %s,
                duracion_min = %s,
                excedido = %s,
                minutos_excedidos = %s,
                notas_final = %s,
                incidente = %s
            WHERE id_historial = %s
        """, (
            ahora,
            duracion_min,
            excedido,
            minutos_excedidos,
            observaciones if observaciones else None,
            causa if causa else None,
            id_historial
        ))

        # Liberar el andén
        cursor.execute("""
            UPDATE andenes
            SET estado = 'disponible'
            WHERE id_anden = %s
        """, (id_anden,))

        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"success": True})

    except Exception as e:
        print("Error al finalizar carga:", e)
        return jsonify({"error": "Error interno"}), 500

# Obtener todos los usuarios
@app.route("/api/usuarios", methods=["GET"])
def obtener_usuarios():
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT 
                id_usuario, 
                nombre_completo AS nombre, 
                usuario, 
                rol, 
                activo, 
                fecha_creacion, 
                fecha_actualizacion 
            FROM usuarios
        """)
        datos = cursor.fetchall()
    conn.close()
    return jsonify(datos)

@app.route("/api/usuarios", methods=["POST"])
def crear_usuario():
    data = request.json
    hashed = generate_password_hash(data["contraseña"])
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO usuarios (nombre_completo, usuario, contraseña, rol)
            VALUES (%s, %s, %s, %s)
        """, (data["nombre"], data["usuario"], hashed, data["rol"]))
        conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario creado"}), 201

@app.route("/api/usuarios/<int:id_usuario>", methods=["PUT"])
def actualizar_usuario(id_usuario):
    data = request.json
    conn = get_connection()
    with conn.cursor() as cursor:
        if "contraseña" in data and data["contraseña"]:
            hashed = generate_password_hash(data["contraseña"])
            cursor.execute("""
                UPDATE usuarios
                SET nombre_completo = %s, usuario = %s, contraseña = %s, rol = %s
                WHERE id_usuario = %s
            """, (data["nombre"], data["usuario"], hashed, data["rol"], id_usuario))
        else:
            cursor.execute("""
                UPDATE usuarios
                SET nombre_completo = %s, usuario = %s, rol = %s
                WHERE id_usuario = %s
            """, (data["nombre"], data["usuario"], data["rol"], id_usuario))
        conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario actualizado"})

@app.route("/api/usuarios/<int:id_usuario>", methods=["DELETE"])
def eliminar_usuario(id_usuario):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))
        conn.commit()
    conn.close()
    return jsonify({"mensaje": "Usuario eliminado"})

@app.route("/api/andenes/<int:id>/estado", methods=["PUT"])
def cambiar_estado_anden(id):
    nuevo_estado = request.json.get("estado")
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("UPDATE andenes SET estado = %s WHERE id_anden = %s", (nuevo_estado, id))
        conn.commit()
    conn.close()
    return jsonify({"mensaje": "Estado actualizado"})

if __name__ == "__main__":
    app.run(debug=True)
