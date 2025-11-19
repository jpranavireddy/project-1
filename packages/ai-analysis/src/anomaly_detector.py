"""Anomaly detection for developer activity patterns."""
from typing import List
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import IsolationForest
import logging
import uuid

from .types import Activity, Anomaly, TimeRange, AnomalyType, Severity

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detects anomalies in developer activity patterns."""

    def __init__(self, contamination: float = 0.1) -> None:
        """
        Initialize anomaly detector.

        Args:
            contamination: Expected proportion of anomalies (0.0 to 0.5)
        """
        self.contamination = contamination
        self._model = IsolationForest(
            contamination=contamination,
            random_state=42,
            n_estimators=100
        )

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
        if len(activities) < 10:
            # Not enough data for anomaly detection
            return []

        anomalies: List[Anomaly] = []

        # Check for productivity drops
        productivity_anomalies = self._detect_productivity_drops(developer_id, activities)
        anomalies.extend(productivity_anomalies)

        # Check for unusual patterns
        pattern_anomalies = self._detect_unusual_patterns(developer_id, activities)
        anomalies.extend(pattern_anomalies)

        return anomalies

    def _detect_productivity_drops(
        self, 
        developer_id: str, 
        activities: List[Activity]
    ) -> List[Anomaly]:
        """Detect sudden drops in productivity."""
        if len(activities) < 14:
            return []

        # Sort activities by timestamp
        sorted_activities = sorted(activities, key=lambda a: a['timestamp'])

        # Calculate daily activity counts
        daily_counts = self._calculate_daily_counts(sorted_activities)
        
        if len(daily_counts) < 7:
            return []

        # Use rolling window to detect drops
        window_size = 7
        anomalies: List[Anomaly] = []

        for i in range(window_size, len(daily_counts)):
            recent_avg = np.mean(daily_counts[i-window_size:i])
            current = daily_counts[i]

            # Detect significant drop (more than 70% decrease)
            if recent_avg > 2 and current < recent_avg * 0.3:
                date = sorted_activities[0]['timestamp'] + timedelta(days=i)
                anomalies.append({
                    'id': str(uuid.uuid4()),
                    'developerId': developer_id,
                    'type': 'productivity_drop',
                    'severity': 'high' if current == 0 else 'medium',
                    'description': f'Significant productivity drop detected: {current} activities vs {recent_avg:.1f} average',
                    'detectedAt': datetime.now(),
                    'affectedTimeRange': {
                        'start': date,
                        'end': date + timedelta(days=1)
                    },
                    'validated': False
                })

        return anomalies

    def _detect_unusual_patterns(
        self, 
        developer_id: str, 
        activities: List[Activity]
    ) -> List[Anomaly]:
        """Detect unusual activity patterns using Isolation Forest."""
        if len(activities) < 20:
            return []

        # Extract features for each activity
        features = self._extract_features(activities)
        
        if len(features) < 20:
            return []

        try:
            # Fit and predict
            predictions = self._model.fit_predict(features)
            
            anomalies: List[Anomaly] = []
            for i, pred in enumerate(predictions):
                if pred == -1:  # Anomaly detected
                    activity = activities[i]
                    anomalies.append({
                        'id': str(uuid.uuid4()),
                        'developerId': developer_id,
                        'type': 'unusual_pattern',
                        'severity': 'low',
                        'description': f'Unusual activity pattern detected for {activity["type"]} activity',
                        'detectedAt': datetime.now(),
                        'affectedTimeRange': {
                            'start': activity['timestamp'],
                            'end': activity['timestamp'] + timedelta(hours=1)
                        },
                        'validated': False
                    })

            return anomalies
        except Exception as e:
            logger.error(f"Unusual pattern detection failed: {e}")
            return []

    def _calculate_daily_counts(self, activities: List[Activity]) -> List[int]:
        """Calculate daily activity counts."""
        if not activities:
            return []

        start_date = activities[0]['timestamp'].date()
        end_date = activities[-1]['timestamp'].date()
        
        days = (end_date - start_date).days + 1
        counts = [0] * days

        for activity in activities:
            day_index = (activity['timestamp'].date() - start_date).days
            if 0 <= day_index < days:
                counts[day_index] += 1

        return counts

    def _extract_features(self, activities: List[Activity]) -> np.ndarray:
        """Extract numerical features from activities."""
        features = []
        
        for activity in activities:
            feature_vector = [
                # Hour of day
                activity['timestamp'].hour,
                # Day of week
                activity['timestamp'].weekday(),
                # Activity type (encoded)
                self._encode_activity_type(activity['type']),
                # Lines changed (if available)
                activity['metadata'].get('linesAdded', 0) + 
                activity['metadata'].get('linesDeleted', 0),
                # Files changed
                activity['metadata'].get('filesChanged', 0),
            ]
            features.append(feature_vector)

        return np.array(features)

    def _encode_activity_type(self, activity_type: str) -> int:
        """Encode activity type as integer."""
        encoding = {
            'commit': 0,
            'pull_request': 1,
            'issue': 2,
            'review': 3
        }
        return encoding.get(activity_type, 0)
