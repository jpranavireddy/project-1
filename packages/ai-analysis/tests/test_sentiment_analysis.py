"""Property-based tests for sentiment analysis.

Feature: dev-performance-tracker, Property 11: Sentiment analysis is applied to PR comments
Validates: Requirements 4.2
"""
import pytest
from unittest.mock import MagicMock
from hypothesis import given, strategies as st, settings, HealthCheck
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance with mocked sentiment analyzer."""
    engine = AIAnalysisEngine()
    # Mock the internal pipeline to avoid loading heavy models
    engine.sentiment_analyzer._pipeline = MagicMock(return_value=[{'label': 'POSITIVE', 'score': 0.9}])
    return engine


@settings(max_examples=100, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    comments=st.lists(
        st.text(
            alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
            min_size=1,
            max_size=200
        ),
        min_size=1,
        max_size=10
    )
)
def test_sentiment_analysis_applied_to_pr_comments(engine, comments):
    """
    Property 11: Sentiment analysis is applied to PR comments.
    
    For any pull request with review comments, processing the PR should 
    generate sentiment scores for the comments.
    
    Validates: Requirements 4.2
    """
    # Act: Analyze PR comments
    sentiment_scores = engine.analyze_pr_comments(comments)
    
    # Assert: Sentiment scores are generated for all comments
    assert len(sentiment_scores) == len(comments), \
        "Sentiment analysis should generate scores for all comments"
    
    # Assert: Each sentiment score has required fields
    for score in sentiment_scores:
        assert 'score' in score, "Sentiment score must have 'score' field"
        assert 'label' in score, "Sentiment score must have 'label' field"
        assert 'confidence' in score, "Sentiment score must have 'confidence' field"


@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    comment=st.text(
        alphabet=st.characters(whitelist_categories=('L', 'N', 'P', 'Z')),
        min_size=1,
        max_size=200
    )
)
def test_single_comment_sentiment_analysis(engine, comment):
    """Test that single comment sentiment analysis produces valid results."""
    # Act
    sentiment = engine.analyze_sentiment(comment)
    
    # Assert: Valid sentiment structure
    assert 'score' in sentiment
    assert 'label' in sentiment
    assert 'confidence' in sentiment


def test_empty_comments_handling(engine):
    """Test that empty comments are handled gracefully."""
    # Act
    sentiment = engine.analyze_sentiment("")
    
    # Assert: Returns neutral sentiment for empty text
    assert sentiment['label'] == 'neutral'
    assert sentiment['score'] == 0.0
