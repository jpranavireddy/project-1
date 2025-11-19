"""Property-based tests for recommendations.

Feature: dev-performance-tracker, Property 35: Recommendations are actionable and specific
Validates: Requirements 10.3
"""
import pytest
from hypothesis import given, strategies as st, settings
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance."""
    return AIAnalysisEngine()


def test_recommendations_are_actionable_and_specific(engine):
    """
    Property 35: Recommendations are actionable and specific.
    
    All generated recommendations must have:
    - A clear title
    - A description
    - Specific action items
    - A priority level
    
    Validates: Requirements 10.3
    """
    # Arrange: Create inputs that trigger recommendations
    developer_id = "dev-rec-test"
    
    # Trigger code review recommendation (low review ratio)
    activities = []
    for i in range(20):
        activities.append({
            'id': f"act-{i}",
            'type': 'commit',
            'timestamp': '2023-01-01',  # Dummy date
            'metadata': {}
        })
        
    # Trigger quality recommendation (low quality)
    quality_reports = [{
        'commitHash': 'hash',
        'complexity': 20.0,  # Low score
        'documentation': 20.0,
        'standards': 20.0,
        'overallScore': 20.0,
        'issues': []
    }]
    
    # Act
    recommendations = engine.generate_recommendations(
        developer_id,
        activities,
        [],  # anomalies
        quality_reports,
        []   # sentiment
    )
    
    # Assert: Should generate recommendations
    assert len(recommendations) > 0, "Should generate recommendations"
    
    # Assert: Structure of recommendations
    for rec in recommendations:
        # Check required fields
        assert 'title' in rec, "Recommendation must have a title"
        assert 'description' in rec, "Recommendation must have a description"
        assert 'actionItems' in rec, "Recommendation must have action items"
        assert 'priority' in rec, "Recommendation must have a priority"
        
        # Check specificity
        assert len(rec['title']) > 5, "Title should be descriptive"
        assert len(rec['description']) > 10, "Description should be detailed"
        
        # Check actionability
        assert isinstance(rec['actionItems'], list), "Action items must be a list"
        assert len(rec['actionItems']) > 0, "Must provide at least one action item"
        for item in rec['actionItems']:
            assert len(item) > 5, "Action item should be specific"
