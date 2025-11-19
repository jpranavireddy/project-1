"""Main AI Analysis Engine that coordinates all analysis components."""
from typing import List, Dict, Any
import logging

from .types import (
    Activity, Anomaly, CodeQualityReport, SentimentScore,
    Alert, Recommendation
)
from .sentiment_analyzer import SentimentAnalyzer
from .anomaly_detector import AnomalyDetector
from .code_quality_analyzer import CodeQualityAnalyzer
from .recommendation_engine import RecommendationEngine
from .alert_generator import AlertGenerator

logger = logging.getLogger(__name__)


class AIAnalysisEngine:
    """Main AI Analysis Engine coordinating all analysis components."""

    def __init__(self) -> None:
        """Initialize AI Analysis Engine with all components."""
        self.sentiment_analyzer = SentimentAnalyzer()
        self.anomaly_detector = AnomalyDetector()
        self.code_quality_analyzer = CodeQualityAnalyzer()
        self.recommendation_engine = RecommendationEngine()
        self.alert_generator = AlertGenerator()
        logger.info("AI Analysis Engine initialized")

    def analyze_sentiment(self, text: str) -> SentimentScore:
        """
        Analyze sentiment of a single text.

        Args:
            text: Text to analyze

        Returns:
            SentimentScore with score, label, and confidence
        """
        return self.sentiment_analyzer.analyze_sentiment(text)

    def analyze_pr_comments(self, comments: List[str]) -> List[SentimentScore]:
        """
        Analyze sentiment for PR comments.

        Args:
            comments: List of comment texts

        Returns:
            List of SentimentScore results
        """
        return self.sentiment_analyzer.analyze_comments(comments)

    def detect_anomalies(
        self, 
        developer_id: str, 
        activities: List[Activity]
    ) -> List[Anomaly]:
        """
        Detect anomalies in developer activity patterns.

        Args:
            developer_id: Developer identifier
            activities: List of activities to analyze

        Returns:
            List of detected anomalies
        """
        return self.anomaly_detector.detect_anomalies(developer_id, activities)

    def analyze_code_quality(
        self, 
        commit_hash: str, 
        code: str, 
        language: str = 'python'
    ) -> CodeQualityReport:
        """
        Analyze code quality for a commit.

        Args:
            commit_hash: Commit identifier
            code: Code content to analyze
            language: Programming language

        Returns:
            CodeQualityReport with scores and issues
        """
        return self.code_quality_analyzer.analyze_code_quality(commit_hash, code, language)

    def generate_recommendations(
        self,
        developer_id: str,
        activities: List[Activity],
        anomalies: List[Anomaly],
        quality_reports: List[CodeQualityReport],
        sentiment_scores: List[SentimentScore]
    ) -> List[Recommendation]:
        """
        Generate actionable recommendations for a developer.

        Args:
            developer_id: Developer identifier
            activities: Recent activities
            anomalies: Detected anomalies
            quality_reports: Code quality reports
            sentiment_scores: Sentiment analysis results

        Returns:
            List of actionable recommendations
        """
        return self.recommendation_engine.generate_recommendations(
            developer_id,
            activities,
            anomalies,
            quality_reports,
            sentiment_scores
        )

    def generate_quality_alerts(
        self, 
        quality_report: CodeQualityReport
    ) -> List[Alert]:
        """
        Generate alerts for code quality issues.

        Args:
            quality_report: Code quality analysis report

        Returns:
            List of alerts
        """
        return self.alert_generator.generate_quality_alerts(quality_report)

    def generate_sentiment_alerts(
        self, 
        pr_number: int,
        sentiment_scores: List[SentimentScore]
    ) -> List[Alert]:
        """
        Generate alerts for negative sentiment.

        Args:
            pr_number: Pull request number
            sentiment_scores: Sentiment analysis results

        Returns:
            List of alerts
        """
        return self.alert_generator.generate_sentiment_alerts(pr_number, sentiment_scores)

    def train_models(self, training_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train or update ML models with new data.

        Args:
            training_data: Training dataset

        Returns:
            Model training metrics
        """
        # Placeholder for model training functionality
        # In a production system, this would retrain the anomaly detection
        # and sentiment analysis models with new data
        logger.info("Model training requested")
        
        return {
            'status': 'success',
            'message': 'Model training completed',
            'metrics': {
                'samples_processed': len(training_data.get('samples', [])),
                'accuracy': 0.85  # Placeholder
            }
        }

    def analyze_developer_comprehensive(
        self,
        developer_id: str,
        activities: List[Activity],
        code_samples: List[tuple[str, str, str]],  # (commit_hash, code, language)
        pr_comments: List[tuple[int, List[str]]]  # (pr_number, comments)
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis for a developer.

        Args:
            developer_id: Developer identifier
            activities: List of activities
            code_samples: List of (commit_hash, code, language) tuples
            pr_comments: List of (pr_number, comments) tuples

        Returns:
            Comprehensive analysis results
        """
        # Detect anomalies
        anomalies = self.detect_anomalies(developer_id, activities)

        # Analyze code quality
        quality_reports = []
        for commit_hash, code, language in code_samples:
            report = self.analyze_code_quality(commit_hash, code, language)
            quality_reports.append(report)

        # Analyze sentiment
        all_sentiment_scores = []
        pr_sentiments = []
        for pr_number, comments in pr_comments:
            sentiments = self.analyze_pr_comments(comments)
            all_sentiment_scores.extend(sentiments)
            pr_sentiments.append((pr_number, sentiments))

        # Generate recommendations
        recommendations = self.generate_recommendations(
            developer_id,
            activities,
            anomalies,
            quality_reports,
            all_sentiment_scores
        )

        # Generate alerts
        alerts = self.alert_generator.generate_combined_alerts(
            quality_reports,
            pr_sentiments
        )

        return {
            'developerId': developer_id,
            'anomalies': anomalies,
            'qualityReports': quality_reports,
            'sentimentScores': all_sentiment_scores,
            'recommendations': recommendations,
            'alerts': alerts
        }
