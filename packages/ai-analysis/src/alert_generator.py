"""Alert generation for quality issues and negative sentiment."""
from typing import List
import uuid
from datetime import datetime
import logging

from .types import Alert, CodeQualityReport, SentimentScore, Severity

logger = logging.getLogger(__name__)


class AlertGenerator:
    """Generates alerts for quality issues and negative sentiment."""

    def __init__(self) -> None:
        """Initialize alert generator."""
        pass

    def generate_quality_alerts(
        self, 
        quality_report: CodeQualityReport
    ) -> List[Alert]:
        """
        Generate alerts for code quality issues.

        Args:
            quality_report: Code quality analysis report

        Returns:
            List of alerts for quality issues
        """
        alerts: List[Alert] = []

        # Alert for low overall quality
        if quality_report['overallScore'] < 40:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'code_quality',
                'severity': 'high',
                'message': f"Low code quality detected in commit {quality_report['commitHash']}: score {quality_report['overallScore']:.1f}/100",
                'createdAt': datetime.now(),
                'relatedEntity': quality_report['commitHash']
            })

        # Alert for high complexity
        if quality_report['complexity'] < 30:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'high_complexity',
                'severity': 'medium',
                'message': f"High code complexity in commit {quality_report['commitHash']}: complexity score {quality_report['complexity']:.1f}/100",
                'createdAt': datetime.now(),
                'relatedEntity': quality_report['commitHash']
            })

        # Alert for poor documentation
        if quality_report['documentation'] < 30:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'poor_documentation',
                'severity': 'low',
                'message': f"Insufficient documentation in commit {quality_report['commitHash']}: documentation score {quality_report['documentation']:.1f}/100",
                'createdAt': datetime.now(),
                'relatedEntity': quality_report['commitHash']
            })

        # Alerts for specific issues
        for issue in quality_report['issues']:
            severity: Severity = 'low'
            if 'High code complexity' in issue:
                severity = 'medium'
            elif 'Insufficient documentation' in issue:
                severity = 'low'
            elif 'standards violations' in issue:
                severity = 'low'

            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'quality_issue',
                'severity': severity,
                'message': f"{issue} in commit {quality_report['commitHash']}",
                'createdAt': datetime.now(),
                'relatedEntity': quality_report['commitHash']
            })

        return alerts

    def generate_sentiment_alerts(
        self, 
        pr_number: int,
        sentiment_scores: List[SentimentScore]
    ) -> List[Alert]:
        """
        Generate alerts for negative sentiment in PR comments.

        Args:
            pr_number: Pull request number
            sentiment_scores: List of sentiment analysis results

        Returns:
            List of alerts for negative sentiment
        """
        alerts: List[Alert] = []

        if not sentiment_scores:
            return alerts

        # Count negative comments
        negative_comments = [s for s in sentiment_scores if s['label'] == 'negative']
        negative_ratio = len(negative_comments) / len(sentiment_scores)

        # Alert if more than 40% of comments are negative
        if negative_ratio > 0.4:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'negative_sentiment',
                'severity': 'high',
                'message': f"High negative sentiment detected in PR #{pr_number}: {negative_ratio*100:.1f}% of comments are negative",
                'createdAt': datetime.now(),
                'relatedEntity': str(pr_number)
            })
        elif negative_ratio > 0.25:
            alerts.append({
                'id': str(uuid.uuid4()),
                'type': 'negative_sentiment',
                'severity': 'medium',
                'message': f"Elevated negative sentiment in PR #{pr_number}: {negative_ratio*100:.1f}% of comments are negative",
                'createdAt': datetime.now(),
                'relatedEntity': str(pr_number)
            })

        # Alert for very negative individual comments
        for i, score in enumerate(sentiment_scores):
            if score['score'] < -0.7 and score['confidence'] > 0.8:
                alerts.append({
                    'id': str(uuid.uuid4()),
                    'type': 'very_negative_comment',
                    'severity': 'medium',
                    'message': f"Very negative comment detected in PR #{pr_number} (comment {i+1}): sentiment score {score['score']:.2f}",
                    'createdAt': datetime.now(),
                    'relatedEntity': str(pr_number)
                })

        return alerts

    def generate_combined_alerts(
        self,
        quality_reports: List[CodeQualityReport],
        pr_sentiments: List[tuple[int, List[SentimentScore]]]
    ) -> List[Alert]:
        """
        Generate all alerts from quality reports and sentiment analysis.

        Args:
            quality_reports: List of code quality reports
            pr_sentiments: List of (pr_number, sentiment_scores) tuples

        Returns:
            Combined list of all alerts
        """
        alerts: List[Alert] = []

        # Generate quality alerts
        for report in quality_reports:
            quality_alerts = self.generate_quality_alerts(report)
            alerts.extend(quality_alerts)

        # Generate sentiment alerts
        for pr_number, sentiments in pr_sentiments:
            sentiment_alerts = self.generate_sentiment_alerts(pr_number, sentiments)
            alerts.extend(sentiment_alerts)

        return alerts
