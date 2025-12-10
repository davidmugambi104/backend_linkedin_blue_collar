# ----- FILE: backend/app/utils/geo.py -----
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points on the Earth.
    Uses the Haversine formula.

    Args:
        lat1, lon1: Latitude and longitude of point 1 (in decimal degrees)
        lat2, lon2: Latitude and longitude of point 2 (in decimal degrees)

    Returns:
        Distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # Haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Earth's radius in kilometers
    radius = 6371.0

    # Calculate the distance
    distance = radius * c

    return distance

def is_within_radius(lat1, lon1, lat2, lon2, radius_km):
    """
    Check if two points are within a specified radius.

    Args:
        lat1, lon1: Latitude and longitude of point 1
        lat2, lon2: Latitude and longitude of point 2
        radius_km: Radius in kilometers

    Returns:
        True if distance <= radius_km, False otherwise
    """
    if not all([lat1, lon1, lat2, lon2]):
        return False

    distance = calculate_distance(lat1, lon1, lat2, lon2)
    return distance <= radius_km

def get_bounding_box(lat, lon, radius_km):
    """
    Get approximate bounding box coordinates for a point and radius.
    This is a simplified calculation and may not be perfectly accurate near poles.

    Args:
        lat, lon: Center point coordinates
        radius_km: Radius in kilometers

    Returns:
        Dictionary with min_lat, max_lat, min_lon, max_lon
    """
    # Earth's radius in kilometers
    radius = 6371.0

    # Convert radius to degrees (approximate)
    lat_delta = radius_km / 110.574  # 1 degree of latitude ~ 110.574 km
    lon_delta = radius_km / (111.320 * math.cos(math.radians(lat)))  # 1 degree of longitude varies with latitude

    return {
        'min_lat': lat - lat_delta,
        'max_lat': lat + lat_delta,
        'min_lon': lon - lon_delta,
        'max_lon': lon + lon_delta
    }
