import os
import sys
import logging
from flask.cli import FlaskGroup
from app import create_app, db
from config.config import get_config, validate_config

def setup_logging():
    """
    Configure logging for the application
    """
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('food_findr.log')
        ]
    )
    logger = logging.getLogger(__name__)
    return logger

def create_cli_app():
    """
    Create a Flask CLI application with additional commands
    """
    # Get appropriate configuration
    config_class = get_config()
    
    # Validate configuration
    config_errors = validate_config(config_class)
    if config_errors:
        print("Configuration validation failed:")
        for error in config_errors:
            print(f"- {error}")
        sys.exit(1)
    
    # Create application
    app = create_app(config_class)
    
    # Create a FlaskGroup for additional CLI commands
    cli = FlaskGroup(create_app=lambda: app)
    
    @cli.command("test")
    def run_tests():
        """Run the test suite"""
        import unittest
        
        # Discover and run tests
        test_loader = unittest.TestLoader()
        test_suite = test_loader.discover('tests')
        
        test_runner = unittest.TextTestRunner(verbosity=2)
        result = test_runner.run(test_suite)
        
        # Exit with non-zero status if tests fail
        sys.exit(0 if result.wasSuccessful() else 1)
    
    @cli.command("sync-restaurants")
    def sync_restaurants():
        """
        Manually trigger restaurant data synchronization
        """
        from app.services.data_sync_service import PeriodicSyncManager
        
        print("Starting restaurant data synchronization...")
        sync_log = PeriodicSyncManager.perform_periodic_sync()
        print(f"Sync completed. Details: {sync_log}")
    
    @cli.command("create-db")
    def create_database():
        """
        Create database tables
        """
        with app.app_context():
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully.")
    
    @cli.command("drop-db")
    def drop_database():
        """
        Drop all database tables
        """
        confirm = input("Are you sure you want to drop all database tables? (y/N): ").lower()
        if confirm == 'y':
            with app.app_context():
                print("Dropping database tables...")
                db.drop_all()
                print("Database tables dropped successfully.")
        else:
            print("Database drop cancelled.")
    
    @cli.command("seed-data")
    def seed_database():
        """
        Seed the database with initial data
        """
        from app.services.data_sync_service import PeriodicSyncManager
        
        with app.app_context():
            print("Seeding database with initial restaurant data...")
            sync_log = PeriodicSyncManager.perform_periodic_sync()
            print(f"Data seeding completed. Details: {sync_log}")
    
    return cli

def main():
    """
    Main application entry point
    """
    # Setup logging
    logger = setup_logging()
    
    try:
        # Create CLI application
        cli = create_cli_app()
        
        # Run the CLI application
        cli()
    
    except Exception as e:
        logger.error(f"Application startup failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == '__main__':
    main()