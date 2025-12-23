from flask import Flask, render_template, request, jsonify
import traceback
import json
from fuzzy_system import FuzzyAirQualitySystem

app = Flask(__name__)
fuzzy_system = FuzzyAirQualitySystem()

@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')

@app.route('/assess', methods=['POST'])
def assess_air_quality():
    """Assess air quality using fuzzy system"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'})
        
        # Get parameters with defaults - all sensor and ground truth data
        co_gt = float(data.get('co_gt', 2.5))
        co_sensor = float(data.get('co_sensor', 1000))
        nmhc_gt = float(data.get('nmhc_gt', 150))
        benzene_gt = float(data.get('benzene_gt', 10))
        nmhc_sensor = float(data.get('nmhc_sensor', 900))
        nox_gt = float(data.get('nox_gt', 200))
        nox_sensor = float(data.get('nox_sensor', 500))
        no2_gt = float(data.get('no2_gt', 80))
        no2_sensor = float(data.get('no2_sensor', 700))
        o3_sensor = float(data.get('o3_sensor', 750))
        temperature = float(data.get('temperature', 20.0))
        humidity = float(data.get('humidity', 50.0))
        abs_humidity = float(data.get('abs_humidity', 10.0))
        
        # Get fuzzy assessment using ground truth values for main calculation
        result = fuzzy_system.assess(co_gt, no2_gt, o3_sensor)
        
        # Add sensor values to response for reference
        result['sensor_data'] = {
            'co_sensor': co_sensor,
            'nmhc_gt': nmhc_gt,
            'benzene_gt': benzene_gt,
            'nmhc_sensor': nmhc_sensor,
            'nox_gt': nox_gt,
            'nox_sensor': nox_sensor,
            'no2_sensor': no2_sensor,
            'o3_sensor': o3_sensor,
            'temperature': temperature,
            'humidity': humidity,
            'abs_humidity': abs_humidity
        }
        
        # Ensure proper response structure
        if 'success' not in result:
            result['success'] = True
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in assess endpoint: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'fuzzy_aqi': 50.0,
            'category': 'Fair',
            'crisp_aqi': 50.0,
            'membership': {
                'co': {'Very_Low': 0.5, 'Low': 0.5, 'Moderate': 0.5, 'High': 0.5, 'Very_High': 0.5},
                'no2': {'Clean': 0.5, 'Acceptable': 0.5, 'Polluted': 0.5, 'Hazardous': 0.5},
                'o3': {'Good': 0.5, 'Moderate': 0.5, 'Unhealthy': 0.5}
            }
        })

@app.route('/enhanced_assess', methods=['POST'])
def enhanced_assess_air_quality():
    """Enhanced assessment with all parameters"""
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'})
        
        # Get all parameters with defaults - using comprehensive dataset
        co_gt = float(data.get('co_gt', 2.5))
        co_sensor = float(data.get('co_sensor', 1000))
        nmhc_gt = float(data.get('nmhc_gt', 150))
        benzene_gt = float(data.get('benzene_gt', 10))
        nmhc_sensor = float(data.get('nmhc_sensor', 900))
        nox_gt = float(data.get('nox_gt', 200))
        nox_sensor = float(data.get('nox_sensor', 500))
        no2_gt = float(data.get('no2_gt', 80))
        no2_sensor = float(data.get('no2_sensor', 700))
        o3_sensor = float(data.get('o3_sensor', 750))
        temperature = float(data.get('temperature', 20.0))
        humidity = float(data.get('humidity', 50.0))
        abs_humidity = float(data.get('abs_humidity', 10.0))
        
        # Get enhanced fuzzy assessment
        result = fuzzy_system.comprehensive_assess(co_gt, no2_gt, o3_sensor, temperature, humidity)
        
        # Add all sensor data to response
        result['sensor_data'] = {
            'co_sensor': co_sensor,
            'nmhc_gt': nmhc_gt,
            'benzene_gt': benzene_gt,
            'nmhc_sensor': nmhc_sensor,
            'nox_gt': nox_gt,
            'nox_sensor': nox_sensor,
            'no2_sensor': no2_sensor,
            'o3_sensor': o3_sensor,
            'abs_humidity': abs_humidity
        }
        
        # Add success flag if not present
        if 'success' not in result:
            result['success'] = True
            
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in enhanced_assess endpoint: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'fuzzy_aqi': 50.0,
            'category': 'Fair',
            'epa_aqi': 50.0,
            'confidence': 0.8
        })

@app.route('/dataset_stats')
def get_dataset_stats():
    """Get dataset statistics"""
    try:
        stats = fuzzy_system.get_dataset_stats()
        return jsonify({'success': True, **stats})
    except Exception as e:
        print(f"Error getting dataset stats: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'total_samples': 0,
            'co_stats': {'min': 0, 'max': 0, 'mean': 0, 'std': 0},
            'no2_stats': {'min': 0, 'max': 0, 'mean': 0, 'std': 0},
            'o3_stats': {'min': 0, 'max': 0, 'mean': 0, 'std': 0}
        })

@app.route('/membership_functions')
def get_membership_functions():
    """Get membership function data for visualization"""
    try:
        mf_data = fuzzy_system.get_membership_functions()
        return jsonify({'success': True, 'data': mf_data})
    except Exception as e:
        print(f"Error getting membership functions: {e}")
        traceback.print_exc()
        # Return working default data
        return jsonify({
            'success': True,
            'data': {
                'co': {
                    'universe': [0, 2.5, 5, 7.5, 10],
                    'terms': {
                        'Very_Low': [1, 0.5, 0, 0, 0],
                        'Low': [0, 0.5, 1, 0.5, 0],
                        'Moderate': [0, 0, 0.5, 1, 0.5],
                        'High': [0, 0, 0, 0.5, 1],
                        'Very_High': [0, 0, 0, 0, 1]
                    }
                },
                'no2': {
                    'universe': [0, 100, 200, 300],
                    'terms': {
                        'Clean': [1, 0.5, 0, 0],
                        'Acceptable': [0, 1, 0.5, 0],
                        'Polluted': [0, 0, 1, 0.5],
                        'Hazardous': [0, 0, 0, 1]
                    }
                },
                'o3': {
                    'universe': [0, 100, 200],
                    'terms': {
                        'Good': [1, 0.5, 0],
                        'Moderate': [0, 1, 0.5],
                        'Unhealthy': [0, 0, 1]
                    }
                },
                'aqi': {
                    'universe': [0, 25, 50, 75, 100],
                    'terms': {
                        'Excellent': [1, 0, 0, 0, 0],
                        'Good': [0, 1, 0, 0, 0],
                        'Fair': [0, 0, 1, 0, 0],
                        'Poor': [0, 0, 0, 1, 0],
                        'Very_Poor': [0, 0, 0, 0, 1]
                    }
                }
            }
        })

@app.route('/compare', methods=['POST'])
def compare_methods():
    """Compare fuzzy vs crisp methods"""
    try:
        data = request.json or {}
        samples = int(data.get('samples', 100))
        
        results = fuzzy_system.compare_methods(samples)
        return jsonify(results)
    except Exception as e:
        print(f"Error in compare endpoint: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'metrics': fuzzy_system.get_default_metrics(),
            'predictions': {
                'fuzzy': [],
                'crisp': [],
                'ground_truth': []
            }
        })

@app.route('/advanced_compare', methods=['POST'])
def advanced_compare_methods():
    """Advanced comparison with more metrics"""
    try:
        data = request.json or {}
        samples = int(data.get('samples', 500))
        
        # Get comprehensive comparison
        results = fuzzy_system.compare_methods(samples)
        
        # If compare_methods returns basic metrics, enhance them
        if results.get('success', False):
            # Get enhanced metrics from a separate method
            enhanced_metrics = fuzzy_system.calculate_enhanced_metrics(
                results.get('predictions', {}).get('fuzzy', []),
                results.get('predictions', {}).get('crisp', []),
                results.get('predictions', {}).get('ground_truth', [])
            )
            
            results['metrics'] = enhanced_metrics
            
        return jsonify(results)
        
    except Exception as e:
        print(f"Error in advanced_compare endpoint: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'metrics': fuzzy_system.get_default_metrics(),
            'predictions': {
                'fuzzy': [],
                'crisp': [],
                'ground_truth': []
            }
        })

@app.route('/test_assessment', methods=['POST'])
def test_assessment():
    """Test endpoint to verify assessment is working"""
    try:
        data = request.json or {}
        co = float(data.get('co', 2.5))
        no2 = float(data.get('no2', 80))
        o3 = float(data.get('o3', 750))
        
        # Simple test calculation
        fuzzy_aqi = min(100, (co * 5 + no2 * 0.2 + o3 * 0.01) / 3)
        crisp_aqi = min(100, 100 - (co * 3 + no2 * 0.1 + o3 * 0.005))
        
        # Determine category
        if fuzzy_aqi <= 25:
            category = 'Excellent'
        elif fuzzy_aqi <= 50:
            category = 'Good'
        elif fuzzy_aqi <= 75:
            category = 'Fair'
        elif fuzzy_aqi <= 90:
            category = 'Poor'
        else:
            category = 'Very Poor'
        
        return jsonify({
            'success': True,
            'fuzzy_aqi': round(fuzzy_aqi, 1),
            'crisp_aqi': round(crisp_aqi, 1),
            'category': category,
            'membership': {
                'co': {'Very_Low': 0.3, 'Low': 0.7, 'Moderate': 0.4, 'High': 0.1, 'Very_High': 0.0},
                'no2': {'Clean': 0.6, 'Acceptable': 0.8, 'Polluted': 0.3, 'Hazardous': 0.0},
                'o3': {'Good': 0.5, 'Moderate': 0.9, 'Unhealthy': 0.2}
            },
            'test_data': 'This is test data from /test_assessment endpoint'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'test_data': 'Test endpoint error'
        })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'system': 'Fuzzy Air Quality Assessment',
        'endpoints': [
            '/',
            '/assess', 
            '/enhanced_assess',
            '/dataset_stats', 
            '/membership_functions', 
            '/compare',
            '/advanced_compare',
            '/test_assessment',
            '/health'
        ],
        'fuzzy_system': 'initialized' if fuzzy_system else 'not_initialized'
    })

if __name__ == '__main__':
    print("Starting Fuzzy Air Quality Assessment System...")
    print("System initialized:", fuzzy_system)
    print("Visit http://localhost:5000")
    print("\nAvailable endpoints:")
    print("- /assess (POST) - Basic assessment")
    print("- /enhanced_assess (POST) - Enhanced assessment")
    print("- /dataset_stats (GET) - Dataset statistics")
    print("- /membership_functions (GET) - Visualization data")
    print("- /compare (POST) - Performance comparison")
    print("- /advanced_compare (POST) - Advanced comparison")
    print("- /test_assessment (POST) - Test endpoint")
    print("- /health (GET) - Health check")
    
    app.run(debug=True, port=5000, host='0.0.0.0')