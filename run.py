#!/usr/bin/env python
"""
Food Findr Project Runner
This script starts both the backend Flask server and the frontend React development server.
"""

import subprocess
import threading
import os
import sys
import time
import signal
import platform

# Track processes so we can terminate them properly
processes = []

def print_colored(text, color="green"):
    """Print colored text to the console"""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "purple": "\033[95m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }
    if platform.system() == "Windows":
        # Windows console may not support ANSI codes without special configuration
        print(text)
    else:
        print(f"{colors.get(color, colors['green'])}{text}{colors['reset']}")

def run_backend():
    """Run the Flask backend server"""
    print_colored("Starting Flask backend...", "blue")
    # Navigate to backend directory
    os.chdir("backend")
    
    # Ensure environment is set up correctly
    flask_env = os.environ.copy()
    flask_env["FLASK_ENV"] = "development"
    
    try:
        # Start the Flask application
        process = subprocess.Popen(
            ["python", "run.py"],
            env=flask_env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(process)
        
        # Print server output with prefix for identification
        for line in process.stdout:
            print_colored(f"[Backend] {line.strip()}", "blue")
            
    except Exception as e:
        print_colored(f"Error starting Flask backend: {str(e)}", "red")
        clean_up()
        sys.exit(1)

def run_frontend():
    """Run the React frontend development server"""
    print_colored("Starting React frontend...", "green")
    # Navigate to frontend directory from project root
    os.chdir("frontend")
    
    try:
        # Start the React development server
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        processes.append(process)
        
        # Print server output with prefix for identification
        for line in process.stdout:
            print_colored(f"[Frontend] {line.strip()}", "green")
            
    except Exception as e:
        print_colored(f"Error starting React frontend: {str(e)}", "red")
        clean_up()
        sys.exit(1)

def clean_up():
    """Terminate all running processes"""
    print_colored("\nShutting down servers...", "yellow")
    for process in processes:
        if process.poll() is None:  # Process is still running
            if platform.system() == "Windows":
                process.send_signal(signal.CTRL_C_EVENT)
            else:
                process.terminate()
    
    # Give processes a moment to terminate gracefully
    time.sleep(1)
    
    # Force kill any remaining processes
    for process in processes:
        if process.poll() is None:
            print_colored(f"Force killing process {process.pid}", "red")
            process.kill()

def signal_handler(sig, frame):
    """Handle termination signals"""
    print_colored("\nReceived termination signal.", "yellow")
    clean_up()
    sys.exit(0)

def main():
    """Main function to run the application"""
    # Register signal handlers for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Remember the project root directory
    project_root = os.getcwd()
    
    try:
        # Check if backend and frontend directories exist
        if not os.path.isdir(os.path.join(project_root, "backend")):
            print_colored("Error: backend directory not found!", "red")
            return
        
        if not os.path.isdir(os.path.join(project_root, "frontend")):
            print_colored("Error: frontend directory not found!", "red")
            return
        
        # Start backend in a separate thread
        backend_thread = threading.Thread(target=run_backend)
        backend_thread.daemon = True
        backend_thread.start()
        
        # Give backend a moment to start before frontend
        time.sleep(2)
        
        # Return to project root
        os.chdir(project_root)
        
        # Start frontend (this will block in the main thread)
        run_frontend()
        
    except KeyboardInterrupt:
        print_colored("\nProcess interrupted by user.", "yellow")
    finally:
        clean_up()

if __name__ == "__main__":
    print_colored("===== Food Findr Application Runner =====", "purple")
    print_colored("Press Ctrl+C to stop all servers", "yellow")
    main()