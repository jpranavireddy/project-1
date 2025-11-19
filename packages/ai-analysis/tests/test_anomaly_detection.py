"""Property-based tests for anomaly detection.

Feature: dev-performance-tracker, Property 12: Anomaly detection identifies known patterns
Feature: dev-performance-tracker, Property 22: Unvalidated anomalies do not affect scores
Validates: Requirements 4.3, 7.3
"""
import pytest
from datetime import datetime, timedelta
from hypothesis import given, strategies as st, settings, HealthCheck
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance."""
    return AIAnalysisEngine()


@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    base_activity_count=st.integers(min_value=10, max_value=50)
)
def test_productivity_drop_detection(engine, base_activity_count):
    """
    Property 12: Anomaly detection identifies known patterns (Productivity Drop).
    
    A significant drop in activity should be detected as an anomaly.
    
    Validates: Requirements 4.3
    """
    # Arrange: Create a sequence of activities with a sudden drop
    activities = []
    base_date = datetime.now() - timedelta(days=30)
    developer_id = "dev-123"
    
    # 2 weeks of consistent activity
    for i in range(14):
        date = base_date + timedelta(days=i)
        # Add multiple activities per day to establish baseline
        for _ in range(base_activity_count):
            activities.append({
                'id': f"act-{i}-{_}",
                'type': 'commit',
                'timestamp': date,
                'metadata': {'linesAdded': 10, 'linesDeleted': 5}
            })
            
    # 1 week of very low activity (drop)
    for i in range(14, 21):
        date = base_date + timedelta(days=i)
        # Add very few activities (0 or 1)
        if i % 2 == 0:
            activities.append({
                'id': f"act-{i}-0",
                'type': 'commit',
                'timestamp': date,
                'metadata': {'linesAdded': 2, 'linesDeleted': 1}
            })
            
    # Act: Detect anomalies
    anomalies = engine.detect_anomalies(developer_id, activities)
    
    # Assert: Should detect at least one productivity drop
    productivity_drops = [a for a in anomalies if a['type'] == 'productivity_drop']
    assert len(productivity_drops) > 0, "Should detect productivity drop"
    
    # Assert: Anomaly properties
    for anomaly in productivity_drops:
        assert anomaly['developerId'] == developer_id
        assert not anomaly['validated'], "New anomalies should be unvalidated"


def test_unvalidated_anomalies_isolation(engine):
    """
    Property 22: Unvalidated anomalies do not affect scores.
    
    This test verifies that the system flags anomalies as 'validated: False' by default,
    which allows downstream systems to filter them out until validated.
    
    Validates: Requirements 7.3
    """
    # Arrange
    developer_id = "dev-test"
    activities = []
    base_date = datetime.now() - timedelta(days=20)
    
    # Create data that triggers anomaly
    # 10 days high activity
    for i in range(10):
        for j in range(20):
            activities.append({
                'id': f"high-{i}-{j}",
                'type': 'commit',
                'timestamp': base_date + timedelta(days=i),
                'metadata': {}
            })
            
    # 5 days zero activity
    # (No activities added)
    
    # Act
    anomalies = engine.detect_anomalies(developer_id, activities)
    
    # Assert
    assert len(anomalies) > 0
    for anomaly in anomalies:
        assert anomaly['validated'] is False, "Anomalies must be unvalidated by default"
