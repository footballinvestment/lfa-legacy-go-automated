# backend/app/utils/content_filter.py
import re
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

class ContentModerationService:
    def __init__(self):
        # Basic prohibited words (expandable from database)
        self.profanity_patterns = [
            r'\b(spam|scam|hack|cheat|bot|fake)\b',
            r'\b(idiot|stupid|dumb|moron)\b',
            r'\b(kill|die|suicide)\b',
            r'\b(nazi|hitler|terrorist)\b',
        ]
        
        # Spam detection patterns
        self.spam_patterns = [
            r'(https?://\S+){2,}',  # Multiple URLs
            r'(.)\1{4,}',  # Repeated characters (aaaaaaa)
            r'\b(buy|sell|cheap|free|click|visit|download)\b.*\b(now|here|link|site)\b',
            r'(\b\w+\b\s*){1,3}\1{3,}',  # Repeated words/phrases
        ]
        
        # Suspicious link patterns
        self.suspicious_domains = [
            'bit.ly', 'tinyurl.com', 't.co', 'short.link',
            'tiny.cc', 'ow.ly', 'is.gd', 'buff.ly'
        ]
    
    def moderate_content(self, content: str, user_id: int = None) -> Dict:
        """
        Content moderation main function
        Returns: {
            'is_allowed': bool,
            'flags': List[str], 
            'severity': str,
            'action': str,
            'filtered_content': str
        }
        """
        flags = []
        severity = "none"
        action = "allow"
        filtered_content = content
        
        # Profanity check
        profanity_matches = self.check_profanity(content)
        if profanity_matches:
            flags.extend(profanity_matches)
            severity = "medium"
            action = "flag"
            # Filter profanity
            filtered_content = self.filter_profanity(content)
        
        # Spam check
        spam_matches = self.check_spam(content)
        if spam_matches:
            flags.extend(spam_matches)
            severity = "high" 
            action = "block"
        
        # URL check
        if self.has_suspicious_urls(content):
            flags.append("suspicious_url")
            severity = "high"
            action = "flag"
        
        # Length check
        if len(content) > 2000:
            flags.append("too_long")
            severity = "medium"
            action = "truncate"
        
        # Caps lock check (excessive uppercase)
        if self.is_excessive_caps(content):
            flags.append("excessive_caps")
            severity = "low"
            action = "flag"
        
        is_allowed = action in ["allow", "flag", "truncate"]
        
        logger.info(f"Content moderation: {len(content)} chars, flags: {flags}, action: {action}")
        
        return {
            'is_allowed': is_allowed,
            'flags': flags,
            'severity': severity,
            'action': action,
            'filtered_content': filtered_content,
            'original_length': len(content),
            'filtered_length': len(filtered_content)
        }
    
    def check_profanity(self, content: str) -> List[str]:
        """Check for profanity in content"""
        matches = []
        content_lower = content.lower()
        
        for i, pattern in enumerate(self.profanity_patterns):
            if re.search(pattern, content_lower, re.IGNORECASE):
                matches.append(f"profanity_pattern_{i+1}")
        
        return matches
    
    def filter_profanity(self, content: str) -> str:
        """Filter out profanity from content"""
        filtered = content
        
        for pattern in self.profanity_patterns:
            # Replace with asterisks
            def replace_with_asterisks(match):
                return '*' * len(match.group())
            
            filtered = re.sub(pattern, replace_with_asterisks, filtered, flags=re.IGNORECASE)
        
        return filtered
    
    def check_spam(self, content: str) -> List[str]:
        """Check for spam patterns"""
        matches = []
        
        for i, pattern in enumerate(self.spam_patterns):
            if re.search(pattern, content, re.IGNORECASE):
                matches.append(f"spam_pattern_{i+1}")
        
        # Length-based spam detection
        if len(content) > 1000:
            matches.append("spam_too_long")
        
        # Repetitive content detection
        words = content.split()
        if len(words) > 10:
            word_freq = {}
            for word in words:
                word_freq[word.lower()] = word_freq.get(word.lower(), 0) + 1
            
            max_freq = max(word_freq.values()) if word_freq else 0
            if max_freq > len(words) * 0.4:  # 40% of words are the same
                matches.append("spam_repetitive")
        
        return matches
    
    def has_suspicious_urls(self, content: str) -> bool:
        """Check for suspicious URLs"""
        url_pattern = r'https?://[^\s]+'
        urls = re.findall(url_pattern, content)
        
        # Too many URLs
        if len(urls) > 2:
            return True
        
        # Check for suspicious domains
        for url in urls:
            if any(domain in url.lower() for domain in self.suspicious_domains):
                return True
        
        return False
    
    def is_excessive_caps(self, content: str) -> bool:
        """Check for excessive uppercase letters"""
        if len(content) < 10:
            return False
        
        uppercase_count = sum(1 for c in content if c.isupper())
        caps_ratio = uppercase_count / len(content)
        
        # More than 60% uppercase is excessive
        return caps_ratio > 0.6
    
    def get_content_score(self, content: str) -> int:
        """Get content quality score (0-100, higher is better)"""
        score = 100
        
        # Deduct points for issues
        moderation_result = self.moderate_content(content)
        
        for flag in moderation_result['flags']:
            if 'profanity' in flag:
                score -= 30
            elif 'spam' in flag:
                score -= 40
            elif 'suspicious_url' in flag:
                score -= 25
            elif 'excessive_caps' in flag:
                score -= 10
            else:
                score -= 5
        
        return max(0, score)

# Global instance
content_moderator = ContentModerationService()

# Helper function for chat message validation
def validate_chat_message(content: str, user_id: int = None) -> Tuple[bool, str, List[str]]:
    """
    Validate chat message content
    Returns: (is_valid, filtered_content, flags)
    """
    result = content_moderator.moderate_content(content, user_id)
    
    return (
        result['is_allowed'],
        result['filtered_content'],
        result['flags']
    )