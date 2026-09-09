/* =========================================================
   AUTONOMOUS VEHICLE
   50 METRE POTHOLE DETECTION + PATH REPLANNING
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const SENSOR_RANGE_METERS = 50;

// Road simulation scale
// 1 meter = 8 pixels
const PIXELS_PER_METER = 8;

const SENSOR_RANGE_PIXELS =
    SENSOR_RANGE_METERS * PIXELS_PER_METER;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const car =
    document.getElementById("car");

const road =
    document.getElementById("road");

const safePath =
    document.getElementById("safePath");

const detectionBox =
    document.getElementById("detectionBox");

const detectionText =
    document.getElementById("detectionText");

const speedDisplay =
    document.getElementById("speed");

const steeringDisplay =
    document.getElementById("steering");

const distanceDisplay =
    document.getElementById("distance");

const obstacleDisplay =
    document.getElementById("obstacleCount");

const confidenceDisplay =
    document.getElementById("confidenceValue");

const confidenceFill =
    document.getElementById("confidenceFill");

const pathStatus =
    document.getElementById("pathStatus");

const surfaceStatus =
    document.getElementById("surfaceStatus");

const startBtn =
    document.getElementById("startBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const resetBtn =
    document.getElementById("resetBtn");


/* =========================================================
   SIMULATION STATE
========================================================= */

let simulationRunning = false;

let carX = 50;

let targetX = 50;

let speed = 32;

let steering = 0;

let detectedDistance = 50;

let aiConfidence = 96;

let lastTime = 0;

let simulationDistance = 0;

let detectionState = "NORMAL";


/* =========================================================
   POTHOLE OBJECT
========================================================= */

const pothole = {

    x: 50,

    y: -600,

    width: 60,

    height: 35,

    detected: false,

    passed: false

};


/* =========================================================
   INITIALIZE
========================================================= */

function initializeSimulation() {

    carX = 50;

    targetX = 50;

    speed = 32;

    steering = 0;

    detectedDistance = 50;

    aiConfidence = 96;

    simulationDistance = 0;

    detectionState = "NORMAL";

    pothole.x = 50;

    pothole.y = -500;

    pothole.detected = false;

    pothole.passed = false;

    detectionBox.classList.remove("show");

    pathStatus.innerText =
        "OPTIMAL";

    surfaceStatus.innerText =
        "IRREGULAR";

    updateDashboard();

    updateCar();

}


/* =========================================================
   START
========================================================= */

startBtn.addEventListener("click", () => {

    simulationRunning = true;

    startBtn.innerHTML =
        "● SIMULATION RUNNING";

});


/* =========================================================
   PAUSE
========================================================= */

pauseBtn.addEventListener("click", () => {

    simulationRunning = false;

    startBtn.innerHTML =
        "▶ RESUME";

});


/* =========================================================
   RESET
========================================================= */

resetBtn.addEventListener("click", () => {

    simulationRunning = false;

    startBtn.innerHTML =
        "▶ START SIMULATION";

    initializeSimulation();

});


/* =========================================================
   CREATE POTHOLE
========================================================= */

function createPothole() {

    const element =
        document.createElement("div");

    element.className =
        "virtual-pothole";

    element.innerHTML =
        `
        <div class="pothole-scan"></div>
        <span>⚠</span>
        `;

    road.appendChild(element);

    pothole.element = element;

    updatePothole();

}


/* =========================================================
   UPDATE POTHOLE POSITION
========================================================= */

function updatePothole() {

    if (!pothole.element)
        return;

    pothole.element.style.left =
        pothole.x + "%";

    pothole.element.style.top =
        pothole.y + "px";

}


/* =========================================================
   SENSOR CALCULATION
========================================================= */

function calculateSensorDistance() {

    /*
       Distance between the vehicle
       and pothole.

       The car is approximately at
       60% road height.

       Pothole moves toward car.
    */

    const carY =
        road.clientHeight * 0.60;

    const potholeY =
        pothole.y;

    let pixelDistance =
        carY - potholeY;

    let meters =
        pixelDistance /
        PIXELS_PER_METER;


    /*
       Keep value within sensor range.
    */

    meters =
        Math.max(
            0,
            Math.min(
                SENSOR_RANGE_METERS,
                meters
            )
        );


    return meters;

}


/* =========================================================
   50 METRE SENSOR
========================================================= */

function detectPothole() {

    const distance =
        calculateSensorDistance();


    detectedDistance =
        Math.round(distance);


    /*
       POTHOLE ENTERS 50m SENSOR RANGE
    */

    if (
        distance <= SENSOR_RANGE_METERS &&
        distance > 20 &&
        !pothole.detected
    ) {

        pothole.detected = true;

        detectionState =
            "DETECTED";

        /*
           Start path planning
        */

        targetX =
            pothole.x < 50
                ? 62
                : 38;

        speed = 22;

        aiConfidence = 94;


        showDetection();

    }


    /*
       CLOSE RANGE
    */

    if (
        distance <= 20 &&
        distance > 5 &&
        pothole.detected
    ) {

        detectionState =
            "AVOIDING";

        speed = 18;

        aiConfidence = 91;

        showAvoidance();

    }


    /*
       POTHOLE PASSED
    */

    if (
        distance <= 5 &&
        !pothole.passed
    ) {

        pothole.passed = true;

        detectionState =
            "CLEAR";

        targetX = 50;

        speed = 30;

        aiConfidence = 97;

        showClear();

    }

}


/* =========================================================
   DETECTION UI
========================================================= */

function showDetection() {

    detectionBox.classList.add("show");

    detectionText.innerText =
        `Pothole detected at ${detectedDistance} m`;

    pathStatus.innerText =
        "OBSTACLE DETECTED";

    pathStatus.style.color =
        "#ff3b30";

    surfaceStatus.innerText =
        "POTHOLE";

    surfaceStatus.style.color =
        "#ff3b30";

}


/* =========================================================
   AVOIDANCE UI
========================================================= */

function showAvoidance() {

    detectionBox.classList.add("show");

    detectionText.innerText =
        `Avoiding pothole • ${detectedDistance} m`;

    pathStatus.innerText =
        "RE-PLANNING PATH";

    pathStatus.style.color =
        "#ff9f0a";

    surfaceStatus.innerText =
        "HAZARD";

    surfaceStatus.style.color =
        "#ff9f0a";

}


/* =========================================================
   CLEAR ROAD
========================================================= */

function showClear() {

    detectionBox.classList.remove("show");

    pathStatus.innerText =
        "SAFE PATH";

    pathStatus.style.color =
        "#32d74b";

    surfaceStatus.innerText =
        "CLEAR";

    surfaceStatus.style.color =
        "#32d74b";

}


/* =========================================================
   CAR MOVEMENT
========================================================= */

function updateCar(deltaTime) {

    /*
       Smoothly move car toward
       calculated safe path.
    */

    const difference =
        targetX - carX;


    carX +=
        difference *
        Math.min(
            1,
            deltaTime * 2.5
        );


    /*
       Steering calculation
    */

    steering =
        difference * 2;


    /*
       Apply position
    */

    car.style.left =
        carX + "%";


    /*
       Rotate vehicle
       according to steering
    */

    const rotation =
        steering * -0.12;


    car.style.transform =
        `
        translate(-50%, -50%)
        rotate(${rotation}deg)
        `;


    /*
       Move safe path
    */

    safePath.style.left =
        targetX + "%";

}


/* =========================================================
   POTHOLE MOVEMENT
========================================================= */

function movePothole(deltaTime) {

    /*
       Road moves toward vehicle.

       Higher speed =
       faster environment movement.
    */

    const movementSpeed =
        speed * 4;


    pothole.y +=
        movementSpeed *
        deltaTime;


    /*
       When pothole passes vehicle,
       reset it far ahead.
    */

    if (
        pothole.y >
        road.clientHeight + 100
    ) {

        resetPothole();

    }


    updatePothole();

}


/* =========================================================
   RESET POTHOLE
========================================================= */

function resetPothole() {

    pothole.y = -500;

    pothole.x =
        Math.random() > 0.5
            ? 43
            : 57;

    pothole.detected = false;

    pothole.passed = false;

    detectionState =
        "NORMAL";

    detectedDistance =
        SENSOR_RANGE_METERS;

}


/* =========================================================
   SENSOR VISUALIZATION
========================================================= */

function updateSensorVisualization() {

    /*
       Make sensor rings react
       to detection.
    */

    const rings =
        document.querySelectorAll(
            ".sensor-ring"
        );


    if (
        detectionState === "DETECTED"
    ) {

        rings.forEach(
            ring => {

                ring.style.borderColor =
                    "rgba(255,59,48,0.65)";

            }
        );

    }


    else if (
        detectionState === "AVOIDING"
    ) {

        rings.forEach(
            ring => {

                ring.style.borderColor =
                    "rgba(255,159,10,0.7)";

            }
        );

    }


    else {

        rings.forEach(
            ring => {

                ring.style.borderColor =
                    "rgba(77,163,255,0.3)";

            }
        );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    speedDisplay.innerText =
        Math.round(speed);

    steeringDisplay.innerText =
        Math.round(steering);

    distanceDisplay.innerText =
        Math.round(detectedDistance);

    obstacleDisplay.innerText =
        pothole.detected
            ? "01"
            : "00";

    confidenceDisplay.innerText =
        Math.round(aiConfidence)
        + "%";

    confidenceFill.style.width =
        aiConfidence + "%";

}


/* =========================================================
   ANIMATION LOOP
========================================================= */

function animationLoop(timestamp) {

    if (!lastTime)
        lastTime = timestamp;


    const deltaTime =
        (timestamp - lastTime)
        / 1000;


    lastTime =
        timestamp;


    if (simulationRunning) {

        simulationDistance +=
            speed *
            deltaTime;


        movePothole(deltaTime);

        detectPothole();

        updateCar(deltaTime);

        updateSensorVisualization();

        updateDashboard();

    }


    requestAnimationFrame(
        animationLoop
    );

}


/* =========================================================
   START ANIMATION
========================================================= */

createPothole();

initializeSimulation();

requestAnimationFrame(
    animationLoop
);
