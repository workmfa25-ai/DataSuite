from flask import Blueprint, jsonify, request
from sqlalchemy import text
from models import db

ships_bp = Blueprint("ships", __name__)

# Get current ship positions for map display
@ships_bp.route("/", methods=["GET"])
def get_ships():
    # Optional parameters for filtering - Allow large limits for showing all ships
    limit = request.args.get("limit", default=100, type=int)
    
    # For performance, cap the maximum limit but allow up to 150,000 ships
    if limit > 150000:
        limit = 150000
    
    # Get the latest position for each ship (MMSI) - Filter for 7-digit MMSI only
    query = text("""
        WITH latest_positions AS (
            SELECT DISTINCT ON (mmsi) 
                mmsi,
                latitude,
                longitude,
                ship_name,
                ship_type,
                sog,
                cog,
                true_heading,
                destination,
                draught,
                length,
                beam as width,
                rec_time,
                eta
            FROM ais_data 
            WHERE mmsi IS NOT NULL 
            AND LENGTH(mmsi::text) = 7
            AND latitude IS NOT NULL AND longitude IS NOT NULL
            AND latitude BETWEEN -90 AND 90 
            AND longitude BETWEEN -180 AND 180
            ORDER BY mmsi, rec_time DESC
        )
        SELECT * FROM latest_positions
        WHERE latitude != 0 AND longitude != 0
        ORDER BY rec_time DESC
        LIMIT :limit
    """)
    
    result = db.session.execute(query, {"limit": limit}).fetchall()
    
    ships = []
    for row in result:
        ships.append({
            "mmsi": str(row[0]),
            "name": row[3] or f"Vessel {row[0]}",
            "lat": float(row[1]) if row[1] else 0.0,
            "lon": float(row[2]) if row[2] else 0.0,
            "shipType": row[4] or "Unknown",
            "sog": float(row[5]) if row[5] else 0.0,
            "cog": float(row[6]) if row[6] else 0.0,
            "heading": float(row[7]) if row[7] else float(row[6]) if row[6] else 0.0,
            "destination": row[8] or "Unknown",
            "draught": float(row[9]) if row[9] else 0.0,
            "length": float(row[10]) if row[10] else 0.0,
            "width": float(row[11]) if row[11] else 0.0,
            "lastUpdate": str(row[12]) if row[12] else "",
            "eta": row[13] or ""
        })
    
    return jsonify(ships)

# Get ship history by MMSI
@ships_bp.route("/<int:mmsi>")
def ship_history(mmsi):
    query = text("""
        SELECT rec_time, latitude, longitude, sog, destination
        FROM ais_data 
        WHERE mmsi = :mmsi
        ORDER BY rec_time DESC
        LIMIT 100
    """)
    
    result = db.session.execute(query, {"mmsi": mmsi}).fetchall()
    
    data = []
    for row in result:
        data.append({
            "rec_time": str(row[0]),
            "latitude": float(row[1]) if row[1] else 0.0,
            "longitude": float(row[2]) if row[2] else 0.0,
            "sog": float(row[3]) if row[3] else 0.0,
            "destination": row[4] or "Unknown"
        })
    
    return jsonify(data)
