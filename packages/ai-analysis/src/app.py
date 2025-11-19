from flask import Flask, jsonify, request
from dotenv import load_dotenv
import logging

from .ai_analysis_engine import AIAnalysisEngine

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize AI Analysis Engine
try:
    engine = AIAnalysisEngine()
    logger.info("AI Analysis Engine initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize AI Analysis Engine: {e}")
    engine = None


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok' if engine else 'degraded',
        'service': 'ai-analysis'
    })


@app.route('/api/sentiment/analyze', methods=['POST'])
def analyze_sentiment():
    """Analyze sentiment of text."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    text = data.get('text', '')
    
    result = engine.analyze_sentiment(text)
    return jsonify(result)


@app.route('/api/sentiment/pr-comments', methods=['POST'])
def analyze_pr_comments():
    """Analyze sentiment of PR comments."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    comments = data.get('comments', [])
    
    results = engine.analyze_pr_comments(comments)
    return jsonify({'sentiments': results})


@app.route('/api/anomalies/detect', methods=['POST'])
def detect_anomalies():
    """Detect anomalies in developer activities."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    developer_id = data.get('developerId')
    activities = data.get('activities', [])
    
    anomalies = engine.detect_anomalies(developer_id, activities)
    return jsonify({'anomalies': anomalies})


@app.route('/api/code-quality/analyze', methods=['POST'])
def analyze_code_quality():
    """Analyze code quality."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    commit_hash = data.get('commitHash')
    code = data.get('code', '')
    language = data.get('language', 'python')
    
    report = engine.analyze_code_quality(commit_hash, code, language)
    return jsonify(report)


@app.route('/api/recommendations/generate', methods=['POST'])
def generate_recommendations():
    """Generate recommendations for a developer."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    developer_id = data.get('developerId')
    activities = data.get('activities', [])
    anomalies = data.get('anomalies', [])
    quality_reports = data.get('qualityReports', [])
    sentiment_scores = data.get('sentimentScores', [])
    
    recommendations = engine.generate_recommendations(
        developer_id,
        activities,
        anomalies,
        quality_reports,
        sentiment_scores
    )
    return jsonify({'recommendations': recommendations})


@app.route('/api/alerts/quality', methods=['POST'])
def generate_quality_alerts():
    """Generate alerts for code quality issues."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    quality_report = data.get('qualityReport')
    
    alerts = engine.generate_quality_alerts(quality_report)
    return jsonify({'alerts': alerts})


@app.route('/api/alerts/sentiment', methods=['POST'])
def generate_sentiment_alerts():
    """Generate alerts for negative sentiment."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    pr_number = data.get('prNumber')
    sentiment_scores = data.get('sentimentScores', [])
    
    alerts = engine.generate_sentiment_alerts(pr_number, sentiment_scores)
    return jsonify({'alerts': alerts})


@app.route('/api/analyze/comprehensive', methods=['POST'])
def analyze_comprehensive():
    """Perform comprehensive analysis for a developer."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    developer_id = data.get('developerId')
    activities = data.get('activities', [])
    code_samples = data.get('codeSamples', [])
    pr_comments = data.get('prComments', [])
    
    # Convert code samples to tuples
    code_tuples = [(s['commitHash'], s['code'], s.get('language', 'python')) 
                   for s in code_samples]
    
    # Convert PR comments to tuples
    pr_tuples = [(c['prNumber'], c['comments']) for c in pr_comments]
    
    results = engine.analyze_developer_comprehensive(
        developer_id,
        activities,
        code_tuples,
        pr_tuples
    )
    return jsonify(results)


@app.route('/api/models/train', methods=['POST'])
def train_models():
    """Train or update ML models."""
    if not engine:
        return jsonify({'error': 'AI Analysis Engine not available'}), 503
    
    data = request.get_json()
    training_data = data.get('trainingData', {})
    
    metrics = engine.train_models(training_data)
    return jsonify(metrics)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
