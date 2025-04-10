const MQTT_BROKER = "ws://192.168.1.102:9001";  
const MQTT_TOPIC = "rtls_db/ubicaciones";

let qualityThreshold = 50; // Valor inicial de calidad (puedes ajustarlo desde el control deslizante)

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
    updateDeviceSelect(data.dispositivo);
    console.log("calidad:", data.quality);
    console.log("umbral:", qualityThreshold);
    if (data.quality < qualityThreshold) {
        const warningMessage = `Ubicación descartada (${data.dispositivo}): calidad (${data.quality}%) inferior al umbral (${qualityThreshold}%)`;
        console.warn(warningMessage);
        addDiscardedMessage(warningMessage);
        return;
    }
    window.updatePoints([data]); // Pasamos un array como esperas
     // Actualizar dinámicamente el select de dispositivos
    
});

client.on("error", (err) => {
    console.error(" Error en MQTT:", err);
});

// Función para actualizar el umbral de calidad desde el control deslizante
window.setQualityThreshold = function (newThreshold) {
    qualityThreshold = newThreshold;
    console.log(`Umbral de calidad actualizado a: ${qualityThreshold}%`);
};

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

// Función para actualizar el select de dispositivos
function updateDeviceSelect(mac) {
    const deviceSelect = document.getElementById("device-select");
    const existingOption = Array.from(deviceSelect.options).find(option => option.value === mac);

    if (!existingOption) {
        const newOption = document.createElement("option");
        newOption.value = mac;
        newOption.textContent = mac;
        deviceSelect.appendChild(newOption);
        console.log(`Dispositivo agregado al select: ${mac}`);
    }
}

// Función para agregar mensajes descartados al contenedor
function addDiscardedMessage(message) {
    const discardedList = document.getElementById("discarded-list");
    const listItem = document.createElement("li");
    listItem.textContent = message;
    discardedList.appendChild(listItem);

    // Limitar el número de mensajes mostrados (opcional)
    if (discardedList.children.length > 10) {
        discardedList.removeChild(discardedList.firstChild);
    }
}

