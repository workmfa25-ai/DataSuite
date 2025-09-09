import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from flask_cors import CORS

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Enable CORS for all localhost development servers
    CORS(app, origins="*", supports_credentials=False)

    db.init_app(app)

    # Ensure database and table exist on app startup
    from utils.db_loader import ensure_database_exists
    from sqlalchemy import inspect, create_engine
    engine = create_engine(DATABASE_URL)
    with app.app_context():
        # Import models so SQLAlchemy knows about them
        import models
        inspector = inspect(engine)
        print("Existing tables:", inspector.get_table_names())
        if "ais_data" not in inspector.get_table_names():
            print("Creating ais_data table...")
            db.create_all()
        else:
            print("ais_data table already exists.")

    # Register blueprints
    from routes.trends import trends_bp
    from routes.ships import ships_bp
    from routes.ship_types import ship_types_bp
    from routes.heatmaps import heatmaps_bp

    app.register_blueprint(trends_bp, url_prefix="/trends")
    app.register_blueprint(ships_bp, url_prefix="/ships")
    app.register_blueprint(ship_types_bp, url_prefix="/ship-types")
    app.register_blueprint(heatmaps_bp, url_prefix="/heatmaps")

    return app
