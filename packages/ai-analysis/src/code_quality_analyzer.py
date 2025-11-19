"""Code quality analysis with complexity, documentation, and standards checks."""
import re
import logging
from typing import List

from .types import CodeQualityReport

logger = logging.getLogger(__name__)


class CodeQualityAnalyzer:
    """Analyzes code quality across multiple dimensions."""

    def __init__(self) -> None:
        """Initialize code quality analyzer."""
        pass

    def analyze_code_quality(self, commit_hash: str, code: str, language: str = 'python') -> CodeQualityReport:
        """
        Analyze code quality for a commit.

        Args:
            commit_hash: Commit identifier
            code: Code content to analyze
            language: Programming language

        Returns:
            CodeQualityReport with scores and issues
        """
        complexity_score = self._analyze_complexity(code, language)
        documentation_score = self._analyze_documentation(code, language)
        standards_score = self._analyze_standards(code, language)

        issues = self._identify_issues(code, language, complexity_score, documentation_score, standards_score)

        overall_score = (complexity_score + documentation_score + standards_score) / 3.0

        return {
            'commitHash': commit_hash,
            'complexity': complexity_score,
            'documentation': documentation_score,
            'standards': standards_score,
            'overallScore': overall_score,
            'issues': issues
        }

    def _analyze_complexity(self, code: str, language: str) -> float:
        """
        Analyze code complexity.

        Returns score from 0 (very complex) to 100 (simple).
        """
        if not code.strip():
            return 100.0

        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]

        if not non_empty_lines:
            return 100.0

        # Count complexity indicators
        complexity_indicators = 0

        # Control flow statements
        control_flow_patterns = [
            r'\bif\b', r'\belse\b', r'\belif\b', r'\bfor\b', 
            r'\bwhile\b', r'\btry\b', r'\bexcept\b', r'\bcatch\b',
            r'\bswitch\b', r'\bcase\b'
        ]
        
        for pattern in control_flow_patterns:
            complexity_indicators += len(re.findall(pattern, code))

        # Nested structures (rough estimate)
        max_indent = 0
        for line in non_empty_lines:
            indent = len(line) - len(line.lstrip())
            max_indent = max(max_indent, indent)

        nesting_level = max_indent // 4  # Assume 4 spaces per level
        complexity_indicators += nesting_level * 2

        # Calculate score (lower complexity = higher score)
        lines_of_code = len(non_empty_lines)
        complexity_ratio = complexity_indicators / max(lines_of_code, 1)

        # Score from 0-100 (inverted so lower complexity = higher score)
        score = max(0, min(100, 100 - (complexity_ratio * 200)))

        return score

    def _analyze_documentation(self, code: str, language: str) -> float:
        """
        Analyze documentation completeness.

        Returns score from 0 (no docs) to 100 (well documented).
        """
        if not code.strip():
            return 100.0

        lines = code.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]

        if not non_empty_lines:
            return 100.0

        # Count documentation
        doc_lines = 0
        
        # Python docstrings and comments
        if language == 'python':
            in_docstring = False
            for line in lines:
                stripped = line.strip()
                if '"""' in stripped or "'''" in stripped:
                    in_docstring = not in_docstring
                    doc_lines += 1
                elif in_docstring or stripped.startswith('#'):
                    doc_lines += 1
        else:
            # Generic comment detection
            for line in lines:
                stripped = line.strip()
                if stripped.startswith('//') or stripped.startswith('#') or \
                   stripped.startswith('/*') or stripped.startswith('*'):
                    doc_lines += 1

        # Count function/class definitions
        function_patterns = [
            r'^\s*def\s+\w+',  # Python
            r'^\s*function\s+\w+',  # JavaScript
            r'^\s*class\s+\w+',  # Multiple languages
        ]
        
        definitions = 0
        for pattern in function_patterns:
            definitions += len(re.findall(pattern, code, re.MULTILINE))

        # Calculate documentation ratio
        if definitions > 0:
            # Expect at least 2 doc lines per definition
            expected_docs = definitions * 2
            doc_ratio = min(1.0, doc_lines / expected_docs)
        else:
            # For code without definitions, expect 10% documentation
            doc_ratio = min(1.0, doc_lines / (len(non_empty_lines) * 0.1))

        score = doc_ratio * 100

        return score

    def _analyze_standards(self, code: str, language: str) -> float:
        """
        Analyze adherence to coding standards.

        Returns score from 0 (poor standards) to 100 (excellent standards).
        """
        if not code.strip():
            return 100.0

        lines = code.split('\n')
        violations = 0
        total_checks = 0

        # Check line length (should be < 100 characters)
        for line in lines:
            if line.strip():
                total_checks += 1
                if len(line) > 100:
                    violations += 1

        # Check for consistent indentation
        indent_sizes = []
        for line in lines:
            if line.strip():
                indent = len(line) - len(line.lstrip())
                if indent > 0:
                    indent_sizes.append(indent)

        if indent_sizes:
            # Check if indentation is consistent (multiples of 2 or 4)
            inconsistent_indent = sum(1 for indent in indent_sizes if indent % 2 != 0)
            total_checks += len(indent_sizes)
            violations += inconsistent_indent

        # Check for proper naming conventions (basic check)
        if language == 'python':
            # Python: snake_case for functions/variables
            bad_names = re.findall(r'\bdef\s+([A-Z]\w+)', code)
            violations += len(bad_names)
            total_checks += len(re.findall(r'\bdef\s+\w+', code))

        # Calculate score
        if total_checks == 0:
            return 100.0

        violation_ratio = violations / total_checks
        score = max(0, min(100, 100 - (violation_ratio * 100)))

        return score

    def _identify_issues(
        self, 
        code: str, 
        language: str,
        complexity_score: float,
        documentation_score: float,
        standards_score: float
    ) -> List[str]:
        """Identify specific code quality issues."""
        issues: List[str] = []

        if complexity_score < 50:
            issues.append("High code complexity detected - consider refactoring")

        if documentation_score < 40:
            issues.append("Insufficient documentation - add docstrings and comments")

        if standards_score < 60:
            issues.append("Coding standards violations detected - check line length and naming conventions")

        # Check for very long functions
        if language == 'python':
            functions = re.findall(r'def\s+\w+.*?(?=\ndef\s|\nclass\s|\Z)', code, re.DOTALL)
            for func in functions:
                func_lines = len([l for l in func.split('\n') if l.strip()])
                if func_lines > 50:
                    issues.append(f"Function exceeds 50 lines ({func_lines} lines) - consider breaking it down")

        return issues
