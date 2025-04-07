const MQTT_BROKER = "ws://192.168.1.102:9001";  
const MQTT_TOPIC = "rtls_db/ubicaciones";

const client = mqtt.connect(MQTT_BROKER, {
    username: 'tu_usuario',
    password: 'tu_contraseña'
});

client.on("connect", () => {
    console.log(" Conectado al broker MQTT");
    client.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
            console.log(` Suscrito al topic: ${MQTT_TOPIC}`);
        } else {
            console.error(" Error al suscribirse:", err);
        }
    });
});

client.on("message", (topic, message) => {
    let data;
    try {
        const messageString = message.toString();

        if (messageString.includes("NaN")) {
            console.warn("Mensaje descartado: contiene valores NaN en el JSON bruto", messageString);
            return;
        }

        data = JSON.parse(messageString);
    } catch (e) {
        console.error("Error al parsear el mensaje:", e);
        return;
    }

    // console.log("Datos recibidos:", data);
    window.updatePoints([data]); // Pasamos un array como esperas
});

client.on("error", (err) => {
    console.error(" Error en MQTT:", err);
});

window.updatePoints = function (newData) {
    newData.forEach(newPoint => {
        const existingPointIndex = window.points.findIndex(point => point.dispositivo === newPoint.dispositivo);
        if (existingPointIndex !== -1) {
             console.log(`Actualizando punto existente: ${newPoint.dispositivo}`);
            window.points[existingPointIndex] = newPoint;
        } else {
             console.log(`Agregando nuevo punto: ${newPoint.dispositivo}`);
            window.points.push(newPoint);
        }
    });

    // console.log("Estado actualizado de points:", window.points);
    window.updateCanvas(); // Esto llama al render del canvas
};
