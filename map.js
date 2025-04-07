document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("rtls-dashboard");
    const ctx = canvas.getContext("2d");

    let scale = 60;
    let offsetX, offsetY;
    const roomWidth = 7.66;
    const roomHeight = 6.87;
    window.points = []; // Define points como global
    window.pointHistory = new Map(); // Define pointHistory como global

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        offsetX = canvas.width / 17;
        offsetY = canvas.height / 1.1;

        let scaleX = canvas.width / (roomWidth * 1.2);
        let scaleY = canvas.height / (roomHeight * 1.2);
        scale = Math.min(scaleX, scaleY);

        drawStaticElements();
    }

    window.addEventListener("resize", resizeCanvas);

    function transformX(x) {
        return (x * scale) + offsetX;
    }

    function transformY(y) {
        return (-y * scale) + offsetY;
    }

    function drawStaticElements() {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        drawAxes();
        drawLabels();
        drawRoom();
        drawDoor();
    }

    function drawGrid() {
        ctx.strokeStyle = "lightgray";
        ctx.lineWidth = 1;
        ctx.beginPath();

        let step = 0.5 * scale;
        for (let x = offsetX % step; x < canvas.width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for (let y = offsetY % step; y < canvas.height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }

    function drawAxes() {
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, transformY(0));
        ctx.lineTo(canvas.width, transformY(0));
        ctx.moveTo(transformX(0), 0);
        ctx.lineTo(transformX(0), canvas.height);
        ctx.stroke();
    }

    function drawLabels() {
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let step = scale;
        for (let x = offsetX % step; x < canvas.width; x += step) {
            let worldX = Math.round((x - offsetX) / scale);
            ctx.fillText(worldX + "m", x, transformY(0) + 15);
        }
        for (let y = offsetY % step; y < canvas.height; y += step) {
            let worldY = Math.round((offsetY - y) / scale);
            ctx.fillText(worldY + "m", transformX(0) - 20, y);
        }
    }

    function drawRoom() {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 3;
        ctx.strokeRect(transformX(0), transformY(0) - (roomHeight * scale), roomWidth * scale, roomHeight * scale);
    }

    function drawDoor() {
        ctx.fillStyle = "green";
        ctx.fillRect(transformX(7.6) - 5, transformY(6.5) - 10, 10, 20);
        ctx.fillStyle = "black";
        ctx.font = "30px Arial";
        ctx.fillText("Puerta", transformX(7.6) + 50, transformY(6.5));
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
                    history.progress += 0.001; // Reducir el incremento para una interpolación más suave
                    if (history.progress > 1) history.progress = 1;
                }

                let interpolatedX = lerp(history.current.x, history.target.x, history.progress);
                let interpolatedY = lerp(history.current.y, history.target.y, history.progress);

                history.current.x = interpolatedX;
                history.current.y = interpolatedY;

                let transformedX = transformX(interpolatedX);
                let transformedY = transformY(interpolatedY);

                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(transformedX, transformedY, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = "black";
                ctx.font = "10px Arial";
                ctx.fillText(`MAC: ${mac}`, transformedX + 10, transformedY - 10);
            } else {
                console.log(`Punto fuera de la habitación: ${mac} en (${x}, ${y})`);
            }
        });
    }

    function update() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawStaticElements();
        drawPoints();
        requestAnimationFrame(update);
    }

    function lerp(start, end, t) {
        return start + (end - start) * t;
    }

    window.updateCanvas = update;

    resizeCanvas();
    update();
});
