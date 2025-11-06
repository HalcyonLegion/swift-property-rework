import os
import sys
from importlib import import_module

sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app using import_module
wsgi = import_module('app')
application = wsgi.app  # Ensure that 'app' is the Flask instance in app.py