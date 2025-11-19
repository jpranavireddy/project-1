"""Property-based tests for code quality analysis dimensions.

Feature: dev-performance-tracker, Property 10: Code quality analysis covers all required dimensions
Validates: Requirements 4.1
"""
import pytest
from hypothesis import given, strategies as st, settings, HealthCheck
from src.ai_analysis_engine import AIAnalysisEngine


@pytest.fixture
def engine():
    """Create AI Analysis Engine instance."""
    return AIAnalysisEngine()


@settings(max_examples=50, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(
    code=st.text(min_size=1, max_size=1000),
    language=st.sampled_from(['python', 'javascript', 'typescript'])
)
def test_code_quality_analysis_dimensions(engine, code, language):
    """
    Property 10: Code quality analysis covers all required dimensions.
    
    For any code input, the analysis must return scores for:
    - Complexity
    - Documentation
    - Standards compliance
    
    Validates: Requirements 4.1
    """
    # Act: Analyze code quality
    # Use a dummy commit hash
    report = engine.analyze_code_quality("dummy-hash", code, language)
    
    # Assert: All dimensions are present
    assert 'complexity' in report, "Report must include complexity score"
    assert 'documentation' in report, "Report must include documentation score"
    assert 'standards' in report, "Report must include standards score"
    assert 'overallScore' in report, "Report must include overall score"
    
    # Assert: Scores are in valid range [0, 100]
    for dimension in ['complexity', 'documentation', 'standards', 'overallScore']:
        score = report[dimension]
        assert 0 <= score <= 100, f"{dimension} score {score} must be between 0 and 100"
    
    # Assert: Issues list is present (can be empty)
    assert 'issues' in report, "Report must include issues list"
    assert isinstance(report['issues'], list), "Issues must be a list"
