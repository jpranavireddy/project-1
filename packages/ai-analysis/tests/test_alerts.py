"""Property-based tests for alert generation.

Feature: dev-performance-tracker, Property 13: Quality issues and negative sentiment generate alerts
Validates: Requirements 4.4, 4.5
"""
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance."""
    return AIAnalysisEngine()


@settings(max_examples=50)
@given(
    quality_score=st.floats(min_value=0.0, max_value=39.0),
    complexity_score=st.floats(min_value=0.0, max_value=29.0),
    doc_score=st.floats(min_value=0.0, max_value=29.0)
)
def test_quality_issues_generate_alerts(engine, quality_score, complexity_score, doc_score):
    """
    Property 13a: Quality issues generate alerts.
    
    Low scores in quality dimensions must trigger alerts.
    
    Validates: Requirements 4.4
    """
    # Arrange: Create a report with low scores
    report = {
        'commitHash': 'test-hash',
        'complexity': complexity_score,
        'documentation': doc_score,
        'standards': 100.0,
        'overallScore': quality_score,
        'issues': []
    }
    
    # Act
    alerts = engine.generate_quality_alerts(report)
    
    # Assert: Should generate alerts
    assert len(alerts) > 0, "Low quality scores must generate alerts"
    
    # Verify alert types
    alert_types = [a['type'] for a in alerts]
    if quality_score < 40:
        assert 'code_quality' in alert_types
    if complexity_score < 30:
        assert 'high_complexity' in alert_types
    if doc_score < 30:
        assert 'poor_documentation' in alert_types


@settings(max_examples=50)
@given(
    negative_ratio=st.floats(min_value=0.41, max_value=1.0),
    total_comments=st.integers(min_value=5, max_value=20)
)
def test_negative_sentiment_generates_alerts(engine, negative_ratio, total_comments):
    """
    Property 13b: Negative sentiment generates alerts.
    
    High ratio of negative comments must trigger alerts.
    
    Validates: Requirements 4.5
    """
    # Arrange: Create sentiment scores with high negative ratio
    num_negative = int(total_comments * negative_ratio)
    num_neutral = total_comments - num_negative
    
    scores = []
    # Add negative scores
    for _ in range(num_negative):
        scores.append({
            'score': -0.8,
            'label': 'negative',
            'confidence': 0.9
        })
    # Add neutral scores
    for _ in range(num_neutral):
        scores.append({
            'score': 0.0,
            'label': 'neutral',
            'confidence': 1.0
        })
        
    # Act
    alerts = engine.generate_sentiment_alerts(123, scores)
    
    # Assert
    assert len(alerts) > 0, "High negative sentiment must generate alerts"
    
    # Verify alert type
    alert_types = [a['type'] for a in alerts]
    assert 'negative_sentiment' in alert_types
