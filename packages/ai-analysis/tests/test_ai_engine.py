"""Unit tests for AI Analysis Engine."""
import pytest
from unittest.mock import MagicMock, patch
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance."""
    return AIAnalysisEngine()


def test_initialization(engine):
    """Test that all components are initialized."""
    assert engine.sentiment_analyzer is not None
    assert engine.anomaly_detector is not None
    assert engine.code_quality_analyzer is not None
    assert engine.recommendation_engine is not None
    assert engine.alert_generator is not None


def test_analyze_sentiment(engine):
    """Test sentiment analysis delegation."""
    # Arrange
    engine.sentiment_analyzer.analyze_sentiment = MagicMock(return_value={'score': 0.5})
    
    # Act
    result = engine.analyze_sentiment("test text")
    
    # Assert
    engine.sentiment_analyzer.analyze_sentiment.assert_called_once_with("test text")
    assert result == {'score': 0.5}


def test_analyze_pr_comments(engine):
    """Test PR comments analysis delegation."""
    # Arrange
    comments = ["test 1", "test 2"]
    engine.sentiment_analyzer.analyze_comments = MagicMock(return_value=[{'score': 0.5}, {'score': -0.5}])
    
    # Act
    result = engine.analyze_pr_comments(comments)
    
    # Assert
    engine.sentiment_analyzer.analyze_comments.assert_called_once_with(comments)
    assert len(result) == 2


def test_detect_anomalies(engine):
    """Test anomaly detection delegation."""
    # Arrange
    dev_id = "dev-1"
    activities = [{'id': '1'}]
    engine.anomaly_detector.detect_anomalies = MagicMock(return_value=[{'type': 'anomaly'}])
    
    # Act
    result = engine.detect_anomalies(dev_id, activities)
    
    # Assert
    engine.anomaly_detector.detect_anomalies.assert_called_once_with(dev_id, activities)
    assert len(result) == 1


def test_analyze_code_quality(engine):
    """Test code quality analysis delegation."""
    # Arrange
    commit = "hash"
    code = "print('hello')"
    engine.code_quality_analyzer.analyze_code_quality = MagicMock(return_value={'score': 100})
    
    # Act
    result = engine.analyze_code_quality(commit, code)
    
    # Assert
    engine.code_quality_analyzer.analyze_code_quality.assert_called_once_with(commit, code, 'python')
    assert result == {'score': 100}


def test_generate_recommendations(engine):
    """Test recommendation generation delegation."""
    # Arrange
    dev_id = "dev-1"
    activities = []
    anomalies = []
    reports = []
    scores = []
    engine.recommendation_engine.generate_recommendations = MagicMock(return_value=[{'title': 'Rec'}])
    
    # Act
    result = engine.generate_recommendations(dev_id, activities, anomalies, reports, scores)
    
    # Assert
    engine.recommendation_engine.generate_recommendations.assert_called_once_with(
        dev_id, activities, anomalies, reports, scores
    )
    assert len(result) == 1


def test_generate_alerts(engine):
    """Test alert generation delegation."""
    # Arrange
    report = {'score': 50}
    engine.alert_generator.generate_quality_alerts = MagicMock(return_value=[{'type': 'alert'}])
    
    # Act
    result = engine.generate_quality_alerts(report)
    
    # Assert
    engine.alert_generator.generate_quality_alerts.assert_called_once_with(report)
    assert len(result) == 1


def test_analyze_developer_comprehensive(engine):
    """Test comprehensive analysis workflow."""
    # Arrange
    dev_id = "dev-1"
    activities = [{'id': '1'}]
    code_samples = [('hash', 'code', 'python')]
    pr_comments = [(1, ['comment'])]
    
    # Mock all internal methods
    engine.detect_anomalies = MagicMock(return_value=['anomaly'])
    engine.analyze_code_quality = MagicMock(return_value={'quality': 'good'})
    engine.analyze_pr_comments = MagicMock(return_value=['sentiment'])
    engine.generate_recommendations = MagicMock(return_value=['rec'])
    engine.alert_generator.generate_combined_alerts = MagicMock(return_value=['alert'])
    
    # Act
    result = engine.analyze_developer_comprehensive(
        dev_id, activities, code_samples, pr_comments
    )
    
    # Assert
    assert result['developerId'] == dev_id
    assert result['anomalies'] == ['anomaly']
    assert len(result['qualityReports']) == 1
    assert len(result['sentimentScores']) == 1
    assert result['recommendations'] == ['rec']
    assert result['alerts'] == ['alert']
    
    # Verify calls
    engine.detect_anomalies.assert_called_once()
    engine.analyze_code_quality.assert_called_once()
    engine.analyze_pr_comments.assert_called_once()
    engine.generate_recommendations.assert_called_once()
