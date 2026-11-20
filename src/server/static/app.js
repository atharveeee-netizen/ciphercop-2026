/**
 * AegisDrone Tactical C2 Console Client
 * Real-time WebSocket telemetry handler, Leaflet map renderer & situational dispatcher.
 */

let map;
let droneMarkers = {};
let targetMarkers = {};
let geofenceLayers = [];
let currentCamera = "UAV-ALPHA-01";
let socket;

// Initialize Tactical GIS Leaflet Map
function initMap() {
    const defaultCenter = [17.445620, 78.349810];
    map = L.map('map', {
        attributionControl: false,
        zoomControl: true
    }).setView(defaultCenter, 18);

    // CartoDB Dark Matter tiles for military/tactical aesthetics
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 21,
        subdomains: 'abcd'
    }).addTo(map);

    console.log("[C2] Tactical GIS Leaflet Map initialized.");
}

// WebSocket Connection
function connectTacticalWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/tactical`;

    console.log(`[C2] Connecting to Tactical WebSocket: ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log("[C2] WebSocket Connection ESTABLISHED (10Hz).");
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleTacticalUpdate(data);
        } catch (err) {
            console.error("[C2] Message parse error:", err);
        }
    };

    socket.onclose = () => {
        console.warn("[C2] WebSocket closed. Reconnecting in 2s...");
        setTimeout(connectTacticalWebSocket, 2000);
    };

    socket.onerror = (err) => {
        console.error("[C2] WebSocket error:", err);
    };
}

// Handle real-time stream packet
function handleTacticalUpdate(data) {
    // 1. Update UAV Telemetry Bar
    const cam = data.current_camera;
    document.getElementById("uav-status").textContent = `${cam.camera_id} (${cam.altitude_agl_m.toFixed(1)}m)`;
    document.getElementById("crowd-flux-val").textContent = `${data.crowd_status.divergence_flux >= 0 ? '+' : ''}${data.crowd_status.divergence_flux.toFixed(2)} m/s`;
    document.getElementById("audit-height").textContent = `BLOCK #${data.audit_block_height}`;

    // 2. Update Drone Marker on Map
    updateDroneMarker(cam);

    // 3. Update Targets on Map
    updateTargetMarkers(data.targets);

    // 4. Update Geofences if not rendered
    if (geofenceLayers.length === 0 && data.geofences) {
        renderGeofences(data.geofences);
    }

    // 5. Update Crowd Barometer
    updateCrowdBarometer(data.crowd_status);

    // 6. Refresh Live Video Feed Frame every ~400ms
    refreshVideoFeed();
}

function updateDroneMarker(cam) {
    const latlng = [cam.latitude, cam.longitude];
    if (!droneMarkers[cam.camera_id]) {
        const droneIcon = L.divIcon({
            className: 'drone-map-icon',
            html: `<div style="background:#00f0ff; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #00f0ff;"></div>`,
            iconSize: [14, 14]
        });
        droneMarkers[cam.camera_id] = L.marker(latlng, { icon: droneIcon }).addTo(map)
            .bindPopup(`<b>${cam.camera_id}</b><br/>Alt: ${cam.altitude_agl_m.toFixed(1)}m<br/>Yaw: ${cam.yaw_deg.toFixed(1)}°`);
    } else {
        droneMarkers[cam.camera_id].setLatLng(latlng);
    }
}

function updateTargetMarkers(targets) {
    document.getElementById("target-count-tag").textContent = `${targets.length} TARGETS TRACKED`;

    targets.forEach(tgt => {
        const tid = tgt.global_track_id;
        const latlng = [tgt.latitude, tgt.longitude];

        const isSuspect = tgt.is_suspect;
        const color = isSuspect ? '#ff3366' : '#00ff9d';
        const pulseStyle = isSuspect ? 'box-shadow:0 0 14px #ff3366; animation:pulse 1s infinite;' : '';

        if (!targetMarkers[tid]) {
            const icon = L.divIcon({
                className: 'target-map-icon',
                html: `<div style="background:${color}; width:10px; height:10px; border-radius:50%; border:1px solid #fff; ${pulseStyle}"></div>`,
                iconSize: [10, 10]
            });
            targetMarkers[tid] = L.marker(latlng, { icon: icon }).addTo(map)
                .bindPopup(`<b>Target: ${tid}</b><br/>Class: ${tgt.class_name}<br/>Speed: ${tgt.ground_speed_kmh} km/h`);
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
        const color = isCritical ? '#ff3366' : '#ffaa00';
        const poly = L.polygon(zone.vertices, {
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 2,
            dashArray: isCritical ? '4, 4' : null
        }).addTo(map).bindPopup(`<b>${zone.zone_name}</b><br/>Type: ${zone.zone_type}<br/>Severity: ${zone.severity}`);
        geofenceLayers.push(poly);
    });
}

function updateCrowdBarometer(status) {
    const badge = document.getElementById("crowd-risk-badge");
    const bar = document.getElementById("crowd-bar-fill");
    const densityVal = document.getElementById("density-val");
    const divFluxVal = document.getElementById("div-flux-val");
    const fightVal = document.getElementById("fight-val");

    densityVal.textContent = `${status.density_pax_sqm.toFixed(1)} pax/m²`;
    divFluxVal.textContent = `${status.divergence_flux >= 0 ? '+' : ''}${status.divergence_flux.toFixed(2)}`;

    let fillPct = Math.min(100, Math.max(10, status.stampede_prob * 100));
    bar.style.width = `${fillPct}%`;

    if (status.stampede_risk === "CRITICAL") {
        badge.textContent = "CRITICAL SURGE";
        badge.className = "risk-badge red";
        bar.style.background = "#ff3366";
    } else if (status.stampede_risk === "ELEVATED") {
        badge.textContent = "ELEVATED DENSITY";
        badge.className = "risk-badge amber";
        bar.style.background = "#ffaa00";
    } else {
        badge.textContent = "LOW RISK";
        badge.className = "risk-badge green";
        bar.style.background = "#00ff9d";
    }

    if (status.fight_detected) {
        fightVal.textContent = "BRAWL / ALTERCATION";
        fightVal.className = "red";
    } else {
        fightVal.textContent = "NORMAL";
        fightVal.className = "green";
    }
}

let lastRefresh = 0;
function refreshVideoFeed() {
    const now = Date.now();
    if (now - lastRefresh > 300) {
        lastRefresh = now;
        const img = document.getElementById("live-feed-img");
        if (img) {
            img.src = `/api/frame/${currentCamera}?t=${now}`;
        }
    }
}

function switchFeed(camId) {
    currentCamera = camId;
    document.querySelectorAll(".feed-btn").forEach(btn => {
        btn.classList.toggle("active", btn.textContent.includes(camId));
    });
    console.log(`[C2] Switched active camera view to: ${camId}`);
    refreshVideoFeed();
}

function triggerEmergencyDispatch() {
    alert("🚨 EMERGENCY DISPATCH PROTOCOL BROADCASTED:\n- First Responders & Tactical UAV Intercept Units alerted.\n- Target GPS coordinates broadcasted to Police CAD network.");
}

// Fetch Blockchain Audit Ledger
async function loadAuditLedger() {
    try {
        const resp = await fetch("/api/audit");
        const data = await resp.json();
        const container = document.getElementById("audit-log");
        container.innerHTML = "";

        data.ledger.forEach(block => {
            const entry = document.createElement("div");
            entry.className = "audit-entry";
            entry.innerHTML = `
                <span class="hash-height">#${block.block_height} [${block.event_type}]</span>
                <span class="hash-val" title="${block.block_hash}">${block.block_hash.substring(0, 32)}...</span>
                <span class="hash-tag">${block.target_id}</span>
            `;
            container.appendChild(entry);
        });
    } catch (err) {
        console.error("Failed to load audit ledger:", err);
    }
}

// Startup
window.addEventListener("DOMContentLoaded", () => {
    initMap();
    connectTacticalWebSocket();
    loadAuditLedger();
    setInterval(loadAuditLedger, 5000);
});
