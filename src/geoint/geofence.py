"""
AegisDrone-GEOINT: Polygon Geofencing & Dynamic Perimeter Breach Monitor
Detects intrusions into high-security zones, VIP enclosures, and restricted flight sectors.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional


@dataclass
class GeofencePolygon:
    """Geofence boundary defined by ordered WGS84 vertices."""
    zone_id: str
    zone_name: str
    zone_type: str  # RESTRICTED_ZONE, VIP_CORRIDOR, CROWD_SURGE_ZONE, EXIT_PORTAL
    severity: str   # INFO, WARNING, CRITICAL
    vertices: List[List[float]]  # [[lat1, lon1], [lat2, lon2], ...]


class GeofenceManager:
    """Manages active geofences and tests target points for perimeter breaches."""

    def __init__(self):
        self.geofences: Dict[str, GeofencePolygon] = {}

    def register_geofence(self, zone: GeofencePolygon) -> None:
        """Adds a geofence zone to the active monitor."""
        self.geofences[zone.zone_id] = zone

    def point_in_polygon(self, lat: float, lon: float, polygon: List[List[float]]) -> bool:
        """
        Jordan curve crossing theorem to test if point (lat, lon) is inside a polygon.
        Polygon vertices: [[lat1, lon1], [lat2, lon2], ...]
        """
        n = len(polygon)
        if n < 3:
            return False

        inside = False
        j = n - 1
        for i in range(n):
            lat_i, lon_i = polygon[i]
            lat_j, lon_j = polygon[j]

            # Ray-cast horizontally along longitude
            if ((lat_i > lat) != (lat_j > lat)) and (
                lon < (lon_j - lon_i) * (lat - lat_i) / (lat_j - lat_i) + lon_i
            ):
                inside = not inside
            j = i

        return inside

    def evaluate_target(self, target_id: str, lat: float, lon: float) -> List[Dict[str, Any]]:
        """
        Evaluates a target's position against all registered geofences.
        Returns a list of breach alerts if inside any restricted zones.
        """
        alerts = []
        for zone in self.geofences.values():
            is_inside = self.point_in_polygon(lat, lon, zone.vertices)
            if is_inside:
                alerts.append({
                    "target_id": target_id,
                    "zone_id": zone.zone_id,
                    "zone_name": zone.zone_name,
                    "zone_type": zone.zone_type,
                    "severity": zone.severity,
                    "latitude": lat,
                    "longitude": lon,
                    "message": f"Target {target_id} breached {zone.zone_name} [{zone.zone_type}]"
                })
        return alerts
