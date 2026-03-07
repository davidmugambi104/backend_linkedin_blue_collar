# ----- FILE: backend/app/docs/routes.py -----
"""
API Documentation routes
"""
from flask import Blueprint, jsonify, send_file
import yaml
import os

docs_bp = Blueprint('docs', __name__)

@docs_bp.route('/openapi.yaml')
def openapi_spec():
    """Serve OpenAPI specification"""
    spec_path = os.path.join(os.path.dirname(__file__), 'openapi.yaml')
    try:
        with open(spec_path, 'r') as f:
            spec = yaml.safe_load(f)
        return jsonify(spec)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@docs_bp.route('/')
def api_docs():
    """API documentation redirect"""
    return jsonify({
        'message': 'WorkForge API Documentation',
        'version': '1.0.0',
        'endpoints': {
            'spec': '/api/docs/openapi.yaml',
            'swagger_ui': '/api/docs/ui',
            'redoc': '/api/docs/redoc'
        }
    })
