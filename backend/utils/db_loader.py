
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from config import DATABASE_URL
from models import AISData, db
from config import create_app
import sys

# Parse database name from DATABASE_URL
import re
db_name_match = re.search(r'/([a-zA-Z0-9_]+)$', DATABASE_URL)
db_name = db_name_match.group(1) if db_name_match else None

def ensure_database_exists():
    # Connect to default 'postgres' database to check/create target db
    default_url = re.sub(r'/[a-zA-Z0-9_]+$', '/postgres', DATABASE_URL)
    default_engine = create_engine(default_url)
    with default_engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"))
        if not result.scalar():
            print(f"Database '{db_name}' does not exist. Creating...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")

ensure_database_exists()
engine = create_engine(DATABASE_URL)

def load_csv_to_db(csv_path):
    app = create_app()
    from sqlalchemy import inspect
    with app.app_context():
        inspector = inspect(engine)
        print("Existing tables before loading:", inspector.get_table_names())
        if "ais_data" not in inspector.get_table_names():
            print("Creating ais_data table...")
            db.create_all()
        else:
            print("ais_data table already exists.")

        # Clear ais_data table before loading new data
        print("Deleting existing rows from ais_data table...")
        db.session.query(AISData).delete()
        db.session.commit()
        print("Existing rows deleted.")

        print(f"Loading CSV from: {csv_path}")
        try:
            chunksize = 100000
            total_rows = 0
            for chunk in pd.read_csv(csv_path, chunksize=chunksize):
                print(f"Loaded chunk with {len(chunk)} rows. Columns: {list(chunk.columns)}")
                chunk.to_sql("ais_data", engine, if_exists="append", index=False)
                total_rows += len(chunk)
            print(f"✅ Data Loaded Successfully. Total rows loaded: {total_rows}")
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
    
# Allow running from command line
if __name__ == "__main__":
    # Hardcoded CSV file path
    csv_path = r"c:\Users\dell\Desktop\TREND\ASIS Project WESEE\trimmed_ais.csv"
    load_csv_to_db(csv_path)
