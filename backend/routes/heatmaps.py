from flask import Blueprint, jsonify
from config import db
from models import AISData
from sqlalchemy import func, Numeric

heatmaps_bp = Blueprint("heatmaps", __name__)

# 1. Heatmap for ship activity
@heatmaps_bp.route("/ships-active")
def ships_active_heatmap():
    # Aggregate ship positions into a grid for the heatmap
    # The resolution of the grid can be adjusted
    result = db.session.query(
        func.round(AISData.latitude.cast(Numeric), 2).label("lat"),
        func.round(AISData.longitude.cast(Numeric), 2).label("lon"),
        func.count(AISData.mmsi).label("intensity")
    ).group_by("lat", "lon").all()

    return jsonify([{"lat": r.lat, "lon": r.lon, "intensity": r.intensity} for r in result])

# 2. Heatmap for average speed
@heatmaps_bp.route("/average-speed")
def average_speed_heatmap():
    # Aggregate average speed into a grid for the heatmap
    result = db.session.query(
        func.round(AISData.latitude.cast(Numeric), 2).label("lat"),
        func.round(AISData.longitude.cast(Numeric), 2).label("lon"),
        func.avg(AISData.sog).label("avg_speed")
    ).group_by("lat", "lon").all()

    return jsonify([{"lat": r.lat, "lon": r.lon, "intensity": float(r.avg_speed)} for r in result])
