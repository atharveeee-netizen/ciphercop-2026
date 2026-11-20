/**
 * AegisDrone Tactical Avionic C2 Console Client
 * Integrates HTML5 Canvas Artificial Horizon, Cockpit Gauges, Mission Stepper,
 * Leaflet 4D Raycasted GIS, Dual-Camera Video HUD, Crowd Divergence & Blockchain Vault.
 * Reference Architecture: halilxibrahim/uav-telemetry-dashboard (MIT)
 */

// Global State
let map;
let droneMarkers = {};
let targetMarkers = {};
let geofenceLayers = [];
let currentCamera = "UAV-ALPHA-01";
let privacyEnabled = true;
let socket;

// Horizon & Avionic Physics State
let currentPitch = -25.0;
let currentRoll = 0.0;
let currentYaw = 145.0;
let targetPitch = -25.0;
let targetRoll = 0.0;
let targetYaw = 145.0;

const SIZE = 240;
const CENTER = SIZE / 2;
const DEG_TO_RAD = Math.PI / 180;
const PIXELS_PER_DEGREE = 3.5;

// Mission Phase Definitions
const MISSION_PHASES = [
    { id: "PRE_FLIGHT", label: "PRE-FLIGHT" },
    { id: "TAKEOFF", label: "TAKEOFF" },
    { id: "EN_ROUTE", label: "EN ROUTE" },
    { id: "ON_STATION", label: "ON STATION" },
    { id: "RTL", label: "RTL" },
    { id: "LANDING", label: "LANDING" }
];

// Cardinal Direction Helper
function headingToCardinal(deg) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(((deg % 360 + 360) % 360) / 22.5) % 16;
    return directions[index];
}

// ==========================================================================
// 1. HTML5 Canvas Artificial Horizon (Attitude Indicator)
// ==========================================================================
function initArtificialHorizon() {
    const canvas = document.getElementById("horizon-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    canvas.style.width = `${SIZE}px`;
    canvas.style.height = `${SIZE}px`;

    function renderLoop() {
        // Smooth linear interpolation (lerp) towards target angles
        currentPitch += (targetPitch - currentPitch) * 0.15;
        currentRoll += (targetRoll - currentRoll) * 0.15;
        currentYaw += (targetYaw - currentYaw) * 0.15;

        drawHorizon(ctx, dpr, currentPitch, currentRoll);
        requestAnimationFrame(renderLoop);
    }
    requestAnimationFrame(renderLoop);
}

function drawHorizon(ctx, dpr, pitch, roll) {
    ctx.save();
    ctx.clearRect(0, 0, SIZE * dpr, SIZE * dpr);
    ctx.scale(dpr, dpr);

    // Circular Clip
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, CENTER - 2, 0, Math.PI * 2);
    ctx.clip();

    // Rotate for aircraft roll
    ctx.translate(CENTER, CENTER);
    ctx.rotate(-roll * DEG_TO_RAD);

    const pitchOffset = pitch * PIXELS_PER_DEGREE;

    // Sky Gradient (Navy to Tactical Cyan-Blue)
    const skyGrad = ctx.createLinearGradient(0, -CENTER - pitchOffset - 80, 0, pitchOffset);
    skyGrad.addColorStop(0, '#0f2952');
    skyGrad.addColorStop(1, '#1e40af');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-CENTER - 60, -CENTER - 200, SIZE + 120, CENTER + 200 + pitchOffset);

    // Ground Gradient (Aviation Amber-Brown)
    const gndGrad = ctx.createLinearGradient(0, pitchOffset, 0, CENTER + 200 + pitchOffset);
    gndGrad.addColorStop(0, '#78350f');
    gndGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = gndGrad;
    ctx.fillRect(-CENTER - 60, pitchOffset, SIZE + 120, CENTER + 200);

    // White Horizon Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-CENTER - 60, pitchOffset);
    ctx.lineTo(CENTER + 60, pitchOffset);
    ctx.stroke();

    // Pitch Ladder
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let deg = -40; deg <= 40; deg += 10) {
        if (deg === 0) continue;
        const y = pitchOffset - deg * PIXELS_PER_DEGREE;
        const halfWidth = deg % 20 === 0 ? 28 : 16;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-halfWidth, y);
        ctx.lineTo(halfWidth, y);
        ctx.stroke();
        ctx.fillText(`${Math.abs(deg)}`, halfWidth + 12, y + 3);
    }

    // Reset transform back to center circle for Roll arc
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Roll Indicator Arc
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, CENTER - 14, -Math.PI * 5 / 6, -Math.PI / 6);
    ctx.stroke();

    // Roll Tick Marks
    const rollTicks = [0, 10, 20, 30, 45, 60, -10, -20, -30, -45, -60];
    for (const tick of rollTicks) {
        const angle = (-90 + tick) * DEG_TO_RAD;
        const r1 = CENTER - 14;
        const r2 = CENTER - (Math.abs(tick) % 30 === 0 ? 6 : 10);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = Math.abs(tick) % 30 === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(CENTER + Math.cos(angle) * r1, CENTER + Math.sin(angle) * r1);
        ctx.lineTo(CENTER + Math.cos(angle) * r2, CENTER + Math.sin(angle) * r2);
        ctx.stroke();
    }

    // Roll Triangle Pointer (Cyan)
    const rollAngle = (-90 - roll) * DEG_TO_RAD;
    const triR = CENTER - 14;
    const tx = CENTER + Math.cos(rollAngle) * triR;
    const ty = CENTER + Math.sin(rollAngle) * triR;
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx - 4, ty + 7);
    ctx.lineTo(tx + 4, ty + 7);
    ctx.closePath();
    ctx.fill();

    // Fixed Aircraft Reference (Yellow Wings & Center Reticle)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(CENTER - 45, CENTER);
    ctx.lineTo(CENTER - 14, CENTER);
    ctx.stroke();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(CENTER + 14, CENTER);
    ctx.lineTo(CENTER + 45, CENTER);
    ctx.stroke();
    // Center Dot
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Outer Dark Bezel Ring
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, CENTER - 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

// ==========================================================================
// 2. Mission Phase Progression Stepper
// ==========================================================================
function updateMissionBar(mission) {
    const container = document.getElementById("mission-phases");
    if (!container) return;

    const currentPhase = mission.phase || "PRE_FLIGHT";
    const currentIndex = MISSION_PHASES.findIndex(p => p.id === currentPhase);

    let html = "";
    MISSION_PHASES.forEach((p, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;

        const dotClass = isDone ? "phase-dot completed" : (isActive ? "phase-dot active" : "phase-dot");
        const labelClass = isDone ? "phase-label completed" : (isActive ? "phase-label active" : "phase-label");

        html += `
            <div class="phase-node">
                <div class="${dotClass}"></div>
                <span class="${labelClass}">${p.label}</span>
            </div>
        `;
        if (idx < MISSION_PHASES.length - 1) {
            const lineClass = isDone ? "phase-line completed" : "phase-line";
            html += `<div class="${lineClass}"></div>`;
        }
    });

    container.innerHTML = html;
    document.getElementById("mission-progress-val").textContent = `${mission.progress}%`;
    document.getElementById("flight-timer").textContent = mission.elapsed_formatted || "00:00";
}

// ==========================================================================
// 3. Tactical GIS Leaflet Map
// ==========================================================================
function initMap() {
    const defaultCenter = [17.445620, 78.349810];
    map = L.map('map', {
        attributionControl: false,
        zoomControl: true
    }).setView(defaultCenter, 18);

    // CartoDB Dark Matter tiles for avionic military dark UI
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 21,
        subdomains: 'abcd'
    }).addTo(map);

    console.log("[C2] Tactical GIS Leaflet Map initialized.");
}

function updateDroneMarker(cam) {
    const latlng = [cam.latitude, cam.longitude];
    const isUAV = cam.camera_id.includes("UAV");
    const heading = cam.yaw_deg || 0;

    if (!droneMarkers[cam.camera_id]) {
        const droneIcon = L.divIcon({
            className: 'uav-marker-icon',
            html: isUAV ? `
                <div style="transform: rotate(${heading}deg); transition: transform 0.2s;">
                    <svg width="28" height="28" viewBox="0 0 32 32">
                        <polygon points="16,4 24,26 16,21 8,26" fill="#00e5ff" stroke="#fff" stroke-width="1.2" opacity="0.95" />
                    </svg>
                </div>
            ` : `
                <div style="background:#f59e0b; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px #f59e0b;"></div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
        droneMarkers[cam.camera_id] = L.marker(latlng, { icon: droneIcon }).addTo(map)
            .bindPopup(`<b>${cam.camera_id}</b><br/>Alt: ${cam.altitude_agl_m.toFixed(1)}m<br/>Yaw: ${cam.yaw_deg.toFixed(1)}°`);
    } else {
        droneMarkers[cam.camera_id].setLatLng(latlng);
    }
}

function updateTargetMarkers(targets) {
    document.getElementById("target-count-tag").textContent = `${targets.length} TARGETS`;

    targets.forEach(tgt => {
        const tid = tgt.global_track_id;
        const latlng = [tgt.latitude, tgt.longitude];

        const isSuspect = tgt.is_suspect;
        const color = isSuspect ? '#ef4444' : '#22c55e';
        const pulse = isSuspect ? 'box-shadow:0 0 12px #ef4444; animation:pulse 1s infinite;' : '';

        if (!targetMarkers[tid]) {
            const icon = L.divIcon({
                className: 'target-marker-icon',
                html: `<div style="background:${color}; width:10px; height:10px; border-radius:50%; border:1.5px solid #fff; ${pulse}"></div>`,
                iconSize: [10, 10]
            });
            targetMarkers[tid] = L.marker(latlng, { icon: icon }).addTo(map)
                .bindPopup(`<b>Target ${tid}</b><br/>Class: ${tgt.class_name}<br/>Speed: ${tgt.ground_speed_kmh} km/h<br/>Dist to Nadir: ${tgt.ground_distance_m || 0}m`);
        } else {
            targetMarkers[tid].setLatLng(latlng);
        }

        // Suspect Watchlist Hit card update
        if (isSuspect) {
            document.getElementById("suspect-name").textContent = tgt.suspect_name || "Rohan Sharma";
            document.getElementById("suspect-gps").textContent = `${tgt.latitude.toFixed(6)}, ${tgt.longitude.toFixed(6)}`;
            document.getElementById("suspect-cam").textContent = tgt.camera_source || currentCamera;
        }
    });
}

function renderGeofences(geofences) {
    geofences.forEach(zone => {
        const isCritical = zone.severity === "CRITICAL";
        const color = isCritical ? '#ef4444' : '#f59e0b';
        const poly = L.polygon(zone.vertices, {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: isCritical ? '6, 6' : null
        }).addTo(map).bindPopup(`<b>${zone.zone_name}</b><br/>Type: ${zone.zone_type}<br/>Severity: ${zone.severity}`);
        geofenceLayers.push(poly);
    });
}

// ==========================================================================
// 4. Cockpit Instrument Gauges & Sensors
// ==========================================================================
function updateInstruments(cam, sensors) {
    // Heading
    const yaw = cam.yaw_deg || 0;
    document.getElementById("val-hdg").textContent = `${Math.round(yaw).toString().padStart(3, '0')}°`;
    document.getElementById("val-hdg-cardinal").textContent = headingToCardinal(yaw);
    const needle = document.getElementById("compass-needle");
    if (needle) {
        needle.setAttribute("transform", `rotate(${yaw}, 14, 14)`);
    }

    // Altitude
    const alt = cam.altitude_agl_m || 0;
    document.getElementById("val-alt").textContent = alt.toFixed(1);
    const altPct = Math.min(100, Math.max(10, (alt / 100.0) * 100));
    document.getElementById("bar-alt-fill").style.height = `${altPct}%`;

    // Speed
    const spd = cam.ground_speed_mps || 0;
    document.getElementById("val-spd").textContent = spd.toFixed(1);
    document.getElementById("val-spd-kmh").textContent = `${(spd * 3.6).toFixed(1)} km/h`;
    const spdPct = Math.min(100, Math.max(10, (spd / 25.0) * 100));
    document.getElementById("bar-spd-fill").style.width = `${spdPct}%`;

    // Battery
    const bat = cam.battery_pct || 98.0;
    document.getElementById("val-bat").textContent = bat.toFixed(1);
    document.getElementById("bar-bat-fill").style.width = `${bat}%`;

    // Horizon Readouts
    targetPitch = cam.pitch_deg || -25.0;
    targetRoll = cam.roll_deg || 0.0;
    targetYaw = yaw;
    document.getElementById("val-pitch").textContent = `${targetPitch >= 0 ? '+' : ''}${targetPitch.toFixed(1)}°`;
    document.getElementById("val-roll").textContent = `${targetRoll >= 0 ? '+' : ''}${targetRoll.toFixed(1)}°`;
    document.getElementById("val-yaw").textContent = `${targetYaw.toFixed(1)}°`;

    // Sensors
    if (sensors) {
        document.getElementById("sensor-temp").textContent = `${sensors.temperature_c}°C`;
        document.getElementById("sensor-pres").textContent = `${sensors.pressure_hpa} hPa`;
        document.getElementById("sensor-wind").textContent = `${sensors.wind_speed_mps} m/s`;
        document.getElementById("sensor-sats").textContent = `${sensors.satellites} SATS`;
        document.getElementById("sensor-hdop").textContent = `${sensors.hdop}`;
        document.getElementById("sensor-rssi").textContent = `${sensors.rssi_dbm} dBm`;
    }

    // HUD bottom readouts
    document.getElementById("hud-cam-id").textContent = cam.camera_id;
    document.getElementById("hud-alt-txt").textContent = `ALT: ${alt.toFixed(1)}m`;
    document.getElementById("hud-spd-txt").textContent = `SPD: ${spd.toFixed(1)}m/s`;
}

// ==========================================================================
// 5. Intelligent Multi-Level Alert Feed
// ==========================================================================
function updateAlerts(alerts) {
    const container = document.getElementById("alerts-feed");
    const badge = document.getElementById("alert-badge-count");
    if (!container || !alerts) return;

    badge.textContent = `${alerts.length} ACTIVE`;

    let html = "";
    alerts.forEach(a => {
        const lvlClass = a.level.toLowerCase();
        html += `
            <div class="alert-item ${lvlClass}">
                <div class="alert-header ${lvlClass}">
                    <span>[${a.level}] ${a.title}</span>
                    <span class="alert-time">${a.timestamp_iso}</span>
                </div>
                <div class="alert-msg">${a.message}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ==========================================================================
// 6. Crowd Panic & Stampede Barometer
// ==========================================================================
function updateCrowdBarometer(status) {
    const badge = document.getElementById("crowd-risk-badge");
    const bar = document.getElementById("crowd-bar-fill");
    const densityVal = document.getElementById("density-val");
    const divFluxVal = document.getElementById("div-flux-val");
    const fightVal = document.getElementById("fight-val");

    densityVal.textContent = `${status.density_pax_sqm.toFixed(1)} pax/m²`;
    divFluxVal.textContent = `${status.divergence_flux >= 0 ? '+' : ''}${status.divergence_flux.toFixed(2)} m/s`;

    let fillPct = Math.min(100, Math.max(12, status.stampede_prob * 100));
    bar.style.width = `${fillPct}%`;

    if (status.stampede_risk === "CRITICAL") {
        badge.textContent = "CRITICAL SURGE";
        badge.className = "risk-badge red";
        bar.style.background = "#ef4444";
    } else if (status.stampede_risk === "ELEVATED") {
        badge.textContent = "ELEVATED";
        badge.className = "risk-badge amber";
        bar.style.background = "#f59e0b";
    } else {
        badge.textContent = "LOW RISK";
        badge.className = "risk-badge green";
        bar.style.background = "#22c55e";
    }

    if (status.fight_detected) {
        fightVal.textContent = "ALTERCATION";
        fightVal.className = "c-val red";
    } else {
        fightVal.textContent = "NORMAL";
        fightVal.className = "c-val green";
    }
}

// ==========================================================================
// 7. Video Feed & Privacy Redaction Toggle
// ==========================================================================
let lastVideoRefresh = 0;
function refreshVideoFeed() {
    const now = Date.now();
    if (now - lastVideoRefresh > 300) {
        lastVideoRefresh = now;
        const img = document.getElementById("live-feed-img");
        if (img) {
            img.src = `/api/frame/${currentCamera}?privacy=${privacyEnabled}&t=${now}`;
        }
    }
}

function switchFeed(camId) {
    currentCamera = camId;
    document.getElementById("btn-feed-uav").classList.toggle("active", camId.includes("UAV"));
    document.getElementById("btn-feed-cctv").classList.toggle("active", camId.includes("CCTV"));
    refreshVideoFeed();
}

function togglePrivacyFilter() {
    privacyEnabled = !privacyEnabled;
    const btn = document.getElementById("btn-privacy");
    const hudBadge = document.getElementById("hud-privacy-badge");

    if (privacyEnabled) {
        btn.textContent = "DPDP 2023: ACTIVE";
        btn.classList.add("active");
        hudBadge.textContent = "DPDP MASKING: ON";
        hudBadge.style.color = "#22c55e";
        hudBadge.style.borderColor = "#22c55e";
    } else {
        btn.textContent = "RAW LAW ENFORCEMENT";
        btn.classList.remove("active");
        btn.style.color = "#ef4444";
        btn.style.borderColor = "#ef4444";
        hudBadge.textContent = "UNMASKED POLICE FEED";
        hudBadge.style.color = "#ef4444";
        hudBadge.style.borderColor = "#ef4444";
    }
    refreshVideoFeed();
}

// ==========================================================================
// 8. Blockchain Proof-of-Surveillance Ledger
// ==========================================================================
async function loadAuditLedger() {
    try {
        const resp = await fetch("/api/audit");
        const data = await resp.json();
        const container = document.getElementById("audit-log");
        if (!container) return;

        container.innerHTML = "";
        data.ledger.forEach(block => {
            const entry = document.createElement("div");
            entry.className = "audit-entry";
            entry.innerHTML = `
                <span class="hash-height">#${block.block_height} [${block.event_type}]</span>
                <span class="hash-val" title="${block.block_hash}">${block.block_hash.substring(0, 24)}...</span>
                <span class="hash-tag">${block.target_id}</span>
            `;
            container.appendChild(entry);
        });
    } catch (err) {
        console.error("Failed to load audit ledger:", err);
    }
}

function dispatchIntercept() {
    alert("🚨 INTERCEPT DISPATCH EXECUTED:\n- First responder unit mobilized to suspect GPS coordinates.\n- Chain-of-custody recorded to Proof-of-Surveillance Ledger.");
}

function triggerEmergencyDispatch() {
    alert("🚨 EMERGENCY DISPATCH PROTOCOL BROADCASTED:\n- High-priority alert triggered across ISB CipherCop Tactical Network.\n- Multi-UAV cordon deployed around crowd surge zone.");
}

// ==========================================================================
// 9. WebSocket Telemetry Hub
// ==========================================================================
function connectTacticalWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/tactical`;

    console.log(`[C2] Connecting to Tactical WebSocket: ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log("[C2] WebSocket Connection ESTABLISHED (10Hz).");
        document.getElementById("conn-dot").className = "status-dot live";
        document.getElementById("conn-status").textContent = "WS CONNECTED";
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleTacticalPacket(data);
        } catch (err) {
            console.error("[C2] Message parse error:", err);
        }
    };

    socket.onclose = () => {
        document.getElementById("conn-dot").className = "status-dot";
        document.getElementById("conn-status").textContent = "WS DISCONNECTED";
        setTimeout(connectTacticalWebSocket, 2000);
    };

    socket.onerror = (err) => {
        console.error("[C2] WebSocket error:", err);
    };
}

function handleTacticalPacket(data) {
    const cam = data.current_camera;

    // 1. Update Gauges, Horizon & Sensors
    updateInstruments(cam, data.sensors);

    // 2. Update Mission Stepper Bar
    if (data.mission) {
        updateMissionBar(data.mission);
    }

    // 3. Update Leaflet Map Markers & Geofences
    updateDroneMarker(cam);
    if (data.targets) {
        updateTargetMarkers(data.targets);
    }
    if (geofenceLayers.length === 0 && data.geofences) {
        renderGeofences(data.geofences);
    }

    // 4. Update Alerts & Crowd
    if (data.alerts) {
        updateAlerts(data.alerts);
    }
    if (data.crowd_status) {
        updateCrowdBarometer(data.crowd_status);
    }

    // 5. Refresh Video Feed Frame
    refreshVideoFeed();
}

// Clock updates
function updateClock() {
    const now = new Date();
    const utcStr = now.toUTCString().split(' ')[4] + ' UTC';
    const clockEl = document.getElementById("utc-clock");
    if (clockEl) clockEl.textContent = utcStr;
}

// Initialization on DOM Load
window.addEventListener("DOMContentLoaded", () => {
    initMap();
    initArtificialHorizon();
    connectTacticalWebSocket();
    loadAuditLedger();
    setInterval(loadAuditLedger, 4000);
    setInterval(updateClock, 1000);
    updateClock();
});
