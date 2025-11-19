"""Tests for Flask application."""
import pytest
from unittest.mock import MagicMock, patch
from src.app import app


@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


@patch('src.app.engine')
def test_health_check(mock_engine, client):
    """Test health check endpoint."""
    mock_engine.__bool__.return_value = True
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'


@patch('src.app.engine')
def test_analyze_sentiment(mock_engine, client):
    """Test sentiment analysis endpoint."""
    mock_engine.analyze_sentiment.return_value = {'score': 0.5}
    response = client.post('/api/sentiment/analyze', json={'text': 'test'})
    assert response.status_code == 200
    assert response.json == {'score': 0.5}


@patch('src.app.engine')
def test_analyze_pr_comments(mock_engine, client):
    """Test PR comments analysis endpoint."""
    mock_engine.analyze_pr_comments.return_value = [{'score': 0.5}]
    response = client.post('/api/sentiment/pr-comments', json={'comments': ['test']})
    assert response.status_code == 200
    assert response.json == {'sentiments': [{'score': 0.5}]}


@patch('src.app.engine')
def test_detect_anomalies(mock_engine, client):
    """Test anomaly detection endpoint."""
    mock_engine.detect_anomalies.return_value = [{'type': 'anomaly'}]
    response = client.post('/api/anomalies/detect', json={'developerId': 'dev-1'})
    assert response.status_code == 200
    assert response.json == {'anomalies': [{'type': 'anomaly'}]}


@patch('src.app.engine')
def test_analyze_code_quality(mock_engine, client):
    """Test code quality analysis endpoint."""
    mock_engine.analyze_code_quality.return_value = {'score': 100}
    response = client.post('/api/code-quality/analyze', json={'code': 'print("hi")'})
    assert response.status_code == 200
    assert response.json == {'score': 100}


@patch('src.app.engine')
def test_generate_recommendations(mock_engine, client):
    """Test recommendation generation endpoint."""
    mock_engine.generate_recommendations.return_value = [{'title': 'Rec'}]
    response = client.post('/api/recommendations/generate', json={'developerId': 'dev-1'})
    assert response.status_code == 200
    assert response.json == {'recommendations': [{'title': 'Rec'}]}


@patch('src.app.engine')
def test_generate_quality_alerts(mock_engine, client):
    """Test quality alerts endpoint."""
    mock_engine.generate_quality_alerts.return_value = [{'type': 'alert'}]
    response = client.post('/api/alerts/quality', json={'qualityReport': {}})
    assert response.status_code == 200
    assert response.json == {'alerts': [{'type': 'alert'}]}


@patch('src.app.engine')
def test_generate_sentiment_alerts(mock_engine, client):
    """Test sentiment alerts endpoint."""
    mock_engine.generate_sentiment_alerts.return_value = [{'type': 'alert'}]
    response = client.post('/api/alerts/sentiment', json={'prNumber': 1})
    assert response.status_code == 200
    assert response.json == {'alerts': [{'type': 'alert'}]}


@patch('src.app.engine')
def test_analyze_comprehensive(mock_engine, client):
    """Test comprehensive analysis endpoint."""
    mock_engine.analyze_developer_comprehensive.return_value = {'result': 'ok'}
    response = client.post('/api/analyze/comprehensive', json={'developerId': 'dev-1'})
    assert response.status_code == 200
    assert response.json == {'result': 'ok'}


@patch('src.app.engine')
def test_train_models(mock_engine, client):
    """Test model training endpoint."""
    mock_engine.train_models.return_value = {'status': 'success'}
    response = client.post('/api/models/train', json={'trainingData': {}})
    assert response.status_code == 200
    assert response.json == {'status': 'success'}
