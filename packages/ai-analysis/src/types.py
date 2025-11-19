"""Type definitions for AI Analysis Engine."""
from typing import TypedDict, Literal, List, Optional
from datetime import datetime


ActivityType = Literal['commit', 'pull_request', 'issue', 'review']
AnomalyType = Literal['productivity_drop', 'unusual_pattern', 'quality_issue']
Severity = Literal['low', 'medium', 'high']
Trend = Literal['increasing', 'stable', 'decreasing']


class ActivityMetadata(TypedDict, total=False):
    """Activity metadata."""
    commitHash: Optional[str]
    prNumber: Optional[int]
    issueNumber: Optional[int]
    linesAdded: Optional[int]
    linesDeleted: Optional[int]
    filesChanged: Optional[int]
    reviewComments: Optional[List[str]]


class Activity(TypedDict):
    """Developer activity."""
    id: str
    type: ActivityType
    developerId: str
    repositoryId: str
    timestamp: datetime
    metadata: ActivityMetadata


class TimeRange(TypedDict):
    """Time range."""
    start: datetime
    end: datetime


class Anomaly(TypedDict):
    """Detected anomaly."""
    id: str
    developerId: str
    type: AnomalyType
    severity: Severity
    description: str
    detectedAt: datetime
    affectedTimeRange: TimeRange
    validated: bool


class CodeQualityReport(TypedDict):
    """Code quality analysis report."""
    commitHash: str
    complexity: float
    documentation: float
    standards: float
    overallScore: float
    issues: List[str]


class SentimentScore(TypedDict):
    """Sentiment analysis result."""
    score: float  # -1 (negative) to 1 (positive)
    label: Literal['positive', 'neutral', 'negative']
    confidence: float


class Alert(TypedDict):
    """Alert for quality issues or negative sentiment."""
    id: str
    type: str
    severity: Severity
    message: str
    createdAt: datetime
    relatedEntity: str  # developerId, commitHash, or prNumber


class Recommendation(TypedDict):
    """Actionable recommendation for developer."""
    id: str
    developerId: str
    type: str
    title: str
    description: str
    actionItems: List[str]
    priority: Severity
    createdAt: datetime
