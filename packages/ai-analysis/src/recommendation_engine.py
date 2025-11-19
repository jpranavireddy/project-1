"""Recommendation generation based on analysis results."""
from typing import List
import uuid
from datetime import datetime
import logging

from .types import (
    Activity, Anomaly, CodeQualityReport, SentimentScore,
    Recommendation, Severity
)

logger = logging.getLogger(__name__)


class RecommendationEngine:
    """Generates actionable recommendations for developers."""

    def __init__(self) -> None:
        """Initialize recommendation engine."""
        pass

    def generate_recommendations(
        self,
        developer_id: str,
        activities: List[Activity],
        anomalies: List[Anomaly],
        quality_reports: List[CodeQualityReport],
        sentiment_scores: List[SentimentScore]
    ) -> List[Recommendation]:
        """
        Generate recommendations based on analysis results.

        Args:
            developer_id: Developer identifier
            activities: Recent activities
            anomalies: Detected anomalies
            quality_reports: Code quality reports
            sentiment_scores: Sentiment analysis results

        Returns:
            List of actionable recommendations
        """
        recommendations: List[Recommendation] = []

        # Analyze activity patterns
        activity_recs = self._analyze_activity_patterns(developer_id, activities)
        recommendations.extend(activity_recs)

        # Analyze anomalies
        anomaly_recs = self._analyze_anomalies(developer_id, anomalies)
        recommendations.extend(anomaly_recs)

        # Analyze code quality
        quality_recs = self._analyze_code_quality(developer_id, quality_reports)
        recommendations.extend(quality_recs)

        # Analyze collaboration sentiment
        sentiment_recs = self._analyze_sentiment(developer_id, sentiment_scores)
        recommendations.extend(sentiment_recs)

        return recommendations

    def _analyze_activity_patterns(
        self, 
        developer_id: str, 
        activities: List[Activity]
    ) -> List[Recommendation]:
        """Generate recommendations based on activity patterns."""
        recommendations: List[Recommendation] = []

        if not activities:
            return recommendations

        # Count activity types
        activity_counts = {
            'commit': 0,
            'pull_request': 0,
            'issue': 0,
            'review': 0
        }

        for activity in activities:
            activity_type = activity['type']
            if activity_type in activity_counts:
                activity_counts[activity_type] += 1

        total_activities = sum(activity_counts.values())

        # Check for low code review participation
        if total_activities > 10:
            review_ratio = activity_counts['review'] / total_activities
            if review_ratio < 0.15:  # Less than 15% reviews
                target_reviews = int(total_activities * 0.20 - activity_counts['review'])
                recommendations.append({
                    'id': str(uuid.uuid4()),
                    'developerId': developer_id,
                    'type': 'code_review_participation',
                    'title': 'Increase Code Review Participation',
                    'description': f'Your code review participation is at {review_ratio*100:.1f}%. Aim for at least 20% of activities.',
                    'actionItems': [
                        f'Review {target_reviews} more pull requests this week',
                        'Set aside 30 minutes daily for code reviews',
                        'Subscribe to PR notifications for your team'
                    ],
                    'priority': 'medium',
                    'createdAt': datetime.now()
                })

        # Check for low PR activity
        if total_activities > 10:
            pr_ratio = activity_counts['pull_request'] / total_activities
            if pr_ratio < 0.10:  # Less than 10% PRs
                recommendations.append({
                    'id': str(uuid.uuid4()),
                    'developerId': developer_id,
                    'type': 'pull_request_creation',
                    'title': 'Create More Pull Requests',
                    'description': 'Consider breaking your work into smaller, more frequent pull requests for better collaboration.',
                    'actionItems': [
                        'Break large features into smaller PRs',
                        'Aim for PRs under 400 lines of code',
                        'Submit PRs at least twice per week'
                    ],
                    'priority': 'low',
                    'createdAt': datetime.now()
                })

        return recommendations

    def _analyze_anomalies(
        self, 
        developer_id: str, 
        anomalies: List[Anomaly]
    ) -> List[Recommendation]:
        """Generate recommendations based on detected anomalies."""
        recommendations: List[Recommendation] = []

        # Check for productivity drops
        productivity_drops = [a for a in anomalies if a['type'] == 'productivity_drop']
        if productivity_drops:
            high_severity = [a for a in productivity_drops if a['severity'] == 'high']
            if high_severity:
                recommendations.append({
                    'id': str(uuid.uuid4()),
                    'developerId': developer_id,
                    'type': 'productivity_recovery',
                    'title': 'Address Productivity Drop',
                    'description': 'A significant drop in activity has been detected. Consider if there are blockers or support needed.',
                    'actionItems': [
                        'Identify any blockers or dependencies',
                        'Reach out to team lead if you need support',
                        'Review your current task priorities'
                    ],
                    'priority': 'high',
                    'createdAt': datetime.now()
                })

        return recommendations

    def _analyze_code_quality(
        self, 
        developer_id: str, 
        quality_reports: List[CodeQualityReport]
    ) -> List[Recommendation]:
        """Generate recommendations based on code quality."""
        recommendations: List[Recommendation] = []

        if not quality_reports:
            return recommendations

        # Calculate average scores
        avg_complexity = sum(r['complexity'] for r in quality_reports) / len(quality_reports)
        avg_documentation = sum(r['documentation'] for r in quality_reports) / len(quality_reports)
        avg_standards = sum(r['standards'] for r in quality_reports) / len(quality_reports)

        # Low complexity score (high complexity)
        if avg_complexity < 50:
            recommendations.append({
                'id': str(uuid.uuid4()),
                'developerId': developer_id,
                'type': 'code_complexity',
                'title': 'Reduce Code Complexity',
                'description': f'Your average code complexity score is {avg_complexity:.1f}/100. Simpler code is easier to maintain.',
                'actionItems': [
                    'Break down complex functions into smaller ones',
                    'Reduce nesting levels in control flow',
                    'Extract repeated logic into helper functions',
                    'Consider using design patterns for complex logic'
                ],
                'priority': 'high',
                'createdAt': datetime.now()
            })

        # Low documentation score
        if avg_documentation < 40:
            recommendations.append({
                'id': str(uuid.uuid4()),
                'developerId': developer_id,
                'type': 'documentation',
                'title': 'Improve Code Documentation',
                'description': f'Your documentation score is {avg_documentation:.1f}/100. Better documentation helps team collaboration.',
                'actionItems': [
                    'Add docstrings to all functions and classes',
                    'Document complex logic with inline comments',
                    'Include usage examples in docstrings',
                    'Update documentation when changing code'
                ],
                'priority': 'medium',
                'createdAt': datetime.now()
            })

        # Low standards score
        if avg_standards < 60:
            recommendations.append({
                'id': str(uuid.uuid4()),
                'developerId': developer_id,
                'type': 'coding_standards',
                'title': 'Follow Coding Standards',
                'description': f'Your coding standards score is {avg_standards:.1f}/100. Consistent style improves code readability.',
                'actionItems': [
                    'Keep lines under 100 characters',
                    'Use consistent indentation (4 spaces)',
                    'Follow naming conventions for your language',
                    'Run linter before committing code'
                ],
                'priority': 'low',
                'createdAt': datetime.now()
            })

        return recommendations

    def _analyze_sentiment(
        self, 
        developer_id: str, 
        sentiment_scores: List[SentimentScore]
    ) -> List[Recommendation]:
        """Generate recommendations based on sentiment analysis."""
        recommendations: List[Recommendation] = []

        if not sentiment_scores:
            return recommendations

        # Calculate average sentiment
        avg_sentiment = sum(s['score'] for s in sentiment_scores) / len(sentiment_scores)

        # Check for negative sentiment
        negative_count = sum(1 for s in sentiment_scores if s['label'] == 'negative')
        negative_ratio = negative_count / len(sentiment_scores)

        if negative_ratio > 0.3:  # More than 30% negative
            recommendations.append({
                'id': str(uuid.uuid4()),
                'developerId': developer_id,
                'type': 'collaboration_tone',
                'title': 'Improve Collaboration Tone',
                'description': f'{negative_ratio*100:.1f}% of your recent communications show negative sentiment. Positive collaboration improves team health.',
                'actionItems': [
                    'Focus on constructive feedback in code reviews',
                    'Acknowledge good work from teammates',
                    'Use "we" language instead of "you" when discussing issues',
                    'Take breaks if feeling frustrated before responding'
                ],
                'priority': 'medium',
                'createdAt': datetime.now()
            })

        return recommendations
