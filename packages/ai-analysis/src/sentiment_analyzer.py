"""Sentiment analysis for PR comments and issue discussions."""
from typing import List
from transformers import pipeline
import logging

from .types import SentimentScore

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Analyzes sentiment in text using transformer models."""

    def __init__(self) -> None:
        """Initialize sentiment analyzer with pre-trained model."""
        try:
            # Use a lightweight sentiment analysis model
            self._pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU
            )
        except Exception as e:
            logger.error(f"Failed to initialize sentiment analyzer: {e}")
            raise

    def analyze_sentiment(self, text: str) -> SentimentScore:
        """
        Analyze sentiment of a single text.

        Args:
            text: Text to analyze

        Returns:
            SentimentScore with score, label, and confidence
        """
        if not text or not text.strip():
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 1.0
            }

        try:
            result = self._pipeline(text[:512])[0]  # Limit to 512 tokens
            
            # Convert to -1 to 1 scale
            label = result['label'].lower()
            confidence = result['score']
            
            if label == 'positive':
                score = confidence
            elif label == 'negative':
                score = -confidence
            else:
                score = 0.0
            
            # Determine final label based on score
            if score > 0.2:
                final_label = 'positive'
            elif score < -0.2:
                final_label = 'negative'
            else:
                final_label = 'neutral'
            
            return {
                'score': score,
                'label': final_label,
                'confidence': confidence
            }
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0
            }

    def analyze_comments(self, comments: List[str]) -> List[SentimentScore]:
        """
        Analyze sentiment for multiple comments.

        Args:
            comments: List of comment texts

        Returns:
            List of SentimentScore results
        """
        return [self.analyze_sentiment(comment) for comment in comments]

    def get_average_sentiment(self, comments: List[str]) -> SentimentScore:
        """
        Get average sentiment across multiple comments.

        Args:
            comments: List of comment texts

        Returns:
            Average SentimentScore
        """
        if not comments:
            return {
                'score': 0.0,
                'label': 'neutral',
                'confidence': 1.0
            }

        scores = self.analyze_comments(comments)
        avg_score = sum(s['score'] for s in scores) / len(scores)
        avg_confidence = sum(s['confidence'] for s in scores) / len(scores)

        if avg_score > 0.2:
            label = 'positive'
        elif avg_score < -0.2:
            label = 'negative'
        else:
            label = 'neutral'

        return {
            'score': avg_score,
            'label': label,
            'confidence': avg_confidence
        }
