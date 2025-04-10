// map.js completo adaptado para 2 canvas

document.addEventListener("DOMContentLoaded", function () {
    const realtimeCanvas = document.getElementById("rtls-dashboard");
    const trajectoryCanvas = document.getElementById("trajectory-layer");
    const ctxRealtime = realtimeCanvas.getContext("2d");
    const ctxTrajectory = trajectoryCanvas.getContext("2d");

    console.log(ctxTrajectory);

    let scale = 60;
    let offsetX, offsetY;
    const roomWidth = 6.66;
    const roomHeight = 6.87;
    window.points = [];
    window.pointHistory = new Map();

    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        [realtimeCanvas, trajectoryCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });

        offsetX = width / 17;
        offsetY = height / 1.1;

        let scaleX = width / (roomWidth * 1.2);
        let scaleY = height / (roomHeight * 1.2);
        scale = Math.min(scaleX, scaleY);


        drawStaticElements(ctxTrajectory); // Solo en la capa de trayectoria
    }

    window.addEventListener("resize", resizeCanvas);

    function transformX(x) {
        return (x * scale) + offsetX;
    }

    function transformY(y) {
        return (-y * scale) + offsetY;
    }

    function drawStaticElements(ctxRealtime) {
        ctxRealtime.clearRect(0, 0, realtimeCanvas.width, realtimeCanvas.height);
        // ctxRealtime.fillStyle = "#ffffff";
        // ctxRealtime.fillRect(0, 0, realtimeCanvas.width, realtimeCanvas.height);

        drawGrid(ctxRealtime);
        drawAxes(ctxRealtime);
        drawLabels(ctxRealtime);
        drawRoom(ctxRealtime);
        drawDoor(ctxRealtime);
    }

    function drawStaticTrajectoryElements(ctx) {
        
        drawGrid(ctxTrajectory);
        drawAxes(ctxTrajectory);
        drawLabels(ctxTrajectory);
        drawRoom(ctxTrajectory);
        drawDoor(ctxTrajectory);
    }

    function drawGrid(ctxRealtime) {
        ctxRealtime.strokeStyle = "lightgray";
        ctxRealtime.lineWidth = 1;
        ctxRealtime.beginPath();

        let step = 0.5 * scale;
        for (let x = offsetX % step; x < realtimeCanvas.width; x += step) {
            ctxRealtime.moveTo(x, 0);
            ctxRealtime.lineTo(x, realtimeCanvas.height);
        }
        for (let y = offsetY % step; y < realtimeCanvas.height; y += step) {
            ctxRealtime.moveTo(0, y);
            ctxRealtime.lineTo(realtimeCanvas.width, y);
        }
        ctxRealtime.stroke();
    }

    function drawAxes(ctx) {
        ctxRealtime.strokeStyle = "black";
        ctxRealtime.lineWidth = 3;
        ctxRealtime.beginPath();
        ctxRealtime.moveTo(0, transformY(0));
        ctxRealtime.lineTo(realtimeCanvas.width, transformY(0));
        ctxRealtime.moveTo(transformX(0), 0);
        ctxRealtime.lineTo(transformX(0), realtimeCanvas.height);
        ctxRealtime.stroke();
    }

    function drawLabels(ctx) {
        ctxRealtime.fillStyle = "black";
        ctxRealtime.font = "12px Arial";
        ctxRealtime.textAlign = "center";
        ctxRealtime.textBaseline = "middle";
        let step = scale;
        for (let x = offsetX % step; x < realtimeCanvas.width; x += step) {
            let worldX = Math.round((x - offsetX) / scale);
            ctxRealtime.fillText(worldX + "m", x, transformY(0) + 15);
        }
        for (let y = offsetY % step; y < realtimeCanvas.height; y += step) {
            let worldY = Math.round((offsetY - y) / scale);
            ctxRealtime.fillText(worldY + "m", transformX(0) - 20, y);
        }
    }

    function drawRoom(ctxRealtime) {
        ctxRealtime.strokeStyle = "blue";
        ctxRealtime.lineWidth = 3;
        ctxRealtime.strokeRect(transformX(0), transformY(0) - (roomHeight * scale), roomWidth * scale, roomHeight * scale);
    }

    function drawDoor(ctxRealtime) {
        ctxRealtime.fillStyle = "green";
        ctxRealtime.fillRect(transformX(6.6) - 5, transformY(6.5) - 10, 10, 20);
        ctxRealtime.fillStyle = "black";
        ctxRealtime.font = "30px Arial";
        // ctxRealtime.fillText("Puerta", transformX(6.6) + 50, transformY(6.5));
    }

    function addToHistory(mac, x, y) {
        if (!pointHistory.has(mac)) {
            pointHistory.set(mac, { current: { x, y }, target: { x, y }, progress: 1 });
        } else {
            let history = pointHistory.get(mac);
            history.target = { x, y };
            history.progress = 0;
        }
    }

    function drawPoints() {
        window.points.forEach(point => {
            let mac = point.dispositivo;
            let x = point.ubicacion.x;
            let y = point.ubicacion.y;

            if (x >= 0 && x <= roomWidth && y >= 0 && y <= roomHeight) {
                addToHistory(mac, x, y);

                let history = window.pointHistory.get(mac);
                if (history.progress < 1) {
                    history.progress += 0.001;
                    if (history.progress > 1) history.progress = 1;
                }

                let interpolatedX = lerp(history.current.x, history.target.x, history.progress);
                let interpolatedY = lerp(history.current.y, history.target.y, history.progress);

                history.current.x = interpolatedX;
                history.current.y = interpolatedY;

                let transformedX = transformX(interpolatedX);
                let transformedY = transformY(interpolatedY);


                ctxRealtime.fillStyle = "red";
                ctxRealtime.beginPath();
                ctxRealtime.arc(transformedX, transformedY, 5, 0, Math.PI * 2);
                ctxRealtime.fill();

                ctxRealtime.fillStyle = "black";
                ctxRealtime.font = "10px Arial";
                ctxRealtime.fillText(`MAC: ${mac}`, transformedX + 10, transformedY - 10);
            }
        });
    }

    function update() {
        ctxRealtime.clearRect(0, 0, realtimeCanvas.width, realtimeCanvas.height);
        drawStaticElements(ctxRealtime); // opcional, si querés superponer guías
        drawPoints();
        requestAnimationFrame(update);
    }

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    async function fetchTrajectory(deviceId, from, to) {
        const res = await fetch(`http://localhost:3000/api/trayectoria?device=${deviceId}&from=${from}&to=${to}`);
        const data = await res.json();
        return data;
    }

    async function getTrajectoryData(deviceId, from, to) {
        try {
            const trajectoryData = await fetchTrajectory(deviceId, from, to);

            return trajectoryData.map(point => ({
                x: point.x,
                y: point.y,
                timestamp: new Date(point.timestamp)
                
            }));
        } catch (error) {
            console.error("Error al obtener la trayectoria:", error);
            return [];
        }
    }

    async function drawTrajectory(deviceId, from, to) {
        // Limpiar el canvas de trayectoria antes de dibujar
        ctxTrajectory.clearRect(0, 0, trajectoryCanvas.width, trajectoryCanvas.height);

        trajectoryCanvas.style.zIndex = 2;

        const rect = trajectoryCanvas.getBoundingClientRect();

        const trajectory = await getTrajectoryData(deviceId, from, to);

        trajectory.forEach(point => {
            // console.log(`Coordenadas originales: x=${point.x}, y=${point.y}`); // Mostrar valores originales
            const x = transformX(point.x);
            const y = transformY(point.y);
            // console.log(`Coordenadas transformadas: x=${x}, y=${y}`); // Mostrar valores transformados

            // Verificar si las coordenadas transformadas están dentro del canvas
            if (x >= 0 && x <= trajectoryCanvas.width && y >= 0 && y <= trajectoryCanvas.height) {
                ctxTrajectory.fillStyle = "blue"; // Cambia a un color llamativo
                ctxTrajectory.beginPath();
                ctxTrajectory.arc(x, y, 5, 0, Math.PI * 2); // Aumenta el radio para hacerlo más visible
                ctxTrajectory.fill();
            } else {
                console.warn(`Coordenadas fuera del canvas: x=${x}, y=${y}`);
            }
        });

        
    }

    window.drawTrajectory = drawTrajectory;
    window.drawStaticElements = drawStaticElements;
    window.drawStaticTrajectoryElements = drawStaticTrajectoryElements;
    window.updateCanvas = update;

    resizeCanvas();
    update();

    
});
