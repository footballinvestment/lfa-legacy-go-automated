import React, { useState, useEffect } from 'react';
import './PasswordStrengthMeter.css';

const PasswordStrengthMeter = ({ password, onValidationChange }) => {
  const [strength, setStrength] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (password && password.length >= 3) {
      const debounceTimer = setTimeout(() => {
        checkPasswordStrength(password);
      }, 500);
      
      return () => clearTimeout(debounceTimer);
    } else {
      setStrength(null);
      onValidationChange(false);
    }
  }, [password]);

  const checkPasswordStrength = async (pwd) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd })
      });
      
      if (!response.ok) {
        throw new Error('Validation failed');
      }
      
      const result = await response.json();
      setStrength(result);
      onValidationChange(result.valid);
    } catch (error) {
      console.error('Password validation failed:', error);
      setStrength({ valid: false, feedback: ['Validation service unavailable'] });
      onValidationChange(false);
    }
    setLoading(false);
  };

  const getStrengthColor = (score) => {
    const colors = {
      0: '#ff4444',
      1: '#ff7744',
      2: '#ffaa44',
      3: '#44ff44',
      4: '#00aa00'
    };
    return colors[score] || '#cccccc';
  };

  const getStrengthText = (level) => {
    const levels = {
      'weak': 'Weak',
      'good': 'Good', 
      'strong': 'Strong',
      'excellent': 'Excellent'
    };
    return levels[level] || 'Unknown';
  };

  if (!password || password.length < 3) {
    return null;
  }

  return (
    <div className="password-strength-meter">
      <div className="strength-bar-container">
        <div className="strength-bar">
          <div 
            className="strength-fill" 
            style={{ 
              width: `${(strength?.score || 0) * 25}%`,
              backgroundColor: getStrengthColor(strength?.score),
              transition: 'width 0.3s ease, background-color 0.3s ease'
            }}
          />
        </div>
        <span className="strength-text">
          {loading ? 'Checking...' : strength?.strength_level ? getStrengthText(strength.strength_level) : ''}
        </span>
      </div>
      
      {strength?.is_breached && (
        <div className="breach-warning">
          🚨 This password has been found in data breaches. Please choose a different password.
        </div>
      )}
      
      {strength?.feedback && strength.feedback.length > 0 && (
        <ul className="feedback-list">
          {strength.feedback.map((feedback, index) => (
            <li key={index} className="feedback-item">
              {feedback}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;