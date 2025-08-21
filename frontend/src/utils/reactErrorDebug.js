// React Error #130 Debug Utility
// Detects objects being rendered as React children

import React from 'react';

// Error Boundary to catch React Error #130
export class ReactError130Catcher extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Check if this is React Error #130 specifically
    if (error.message && (
      error.message.includes('130') ||
      error.message.includes('invalid element') ||
      error.message.includes('object as a React child')
    )) {
      console.error('🚨 REACT ERROR #130 CAUGHT:', error);
      return { hasError: true };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔥 React Error Boundary Caught:', error);
    console.error('📍 Error Info:', errorInfo);
    console.error('📊 Component Stack:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          background: '#ff1744',
          color: 'white',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <h1>🚨 React Error #130 Detected!</h1>
          <div style={{
            background: '#000',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '20px',
            fontFamily: 'monospace',
            fontSize: '14px',
            maxWidth: '800px',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#ff6b6b' }}>Error Details:</h3>
            <pre>{this.state.error && this.state.error.toString()}</pre>
            {this.state.errorInfo && (
              <>
                <h3 style={{ color: '#ff6b6b', marginTop: '20px' }}>Component Stack:</h3>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Function to detect object renders in React
export function detectObjectRender() {
  console.log('🔍 React Error #130 Detection Active');
  
  // Override React.createElement to detect object renders
  const originalCreateElement = React.createElement;
  
  React.createElement = function(type, props, ...children) {
    // Check children for objects
    const processedChildren = children.map((child, index) => {
      if (child !== null && typeof child === 'object' && !React.isValidElement(child)) {
        // Check if it's an array
        if (Array.isArray(child)) {
          return child; // Arrays are usually fine
        }
        
        // Check if it's a plain object
        if (child.constructor === Object || child.constructor === undefined) {
          console.error('🚨 DETECTED OBJECT RENDER - React Error #130 Source:', {
            component: type?.name || type,
            childIndex: index,
            problematicObject: child,
            stackTrace: new Error().stack
          });
          
          // Try to safely stringify the object
          try {
            return JSON.stringify(child);
          } catch (e) {
            return '[Object - cannot stringify]';
          }
        }
      }
      return child;
    });
    
    return originalCreateElement(type, props, ...processedChildren);
  };
  
  console.log('✅ Object render detection installed');
}

// Function to safely render potentially problematic values
export function safeRender(value, fallback = '') {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'object') {
    if (React.isValidElement(value)) {
      return value;
    }
    
    if (Array.isArray(value)) {
      return value; // Let React handle arrays
    }
    
    // For plain objects, try to extract a meaningful value
    if (value.toString && typeof value.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue !== '[object Object]') {
        return stringValue;
      }
    }
    
    // Last resort - stringify
    try {
      return JSON.stringify(value);
    } catch (e) {
      return fallback;
    }
  }
  
  return value;
}

// Component to safely display user/object data
export const SafeDisplay = ({ value, fallback = '', prefix = '' }) => {
  const safeValue = safeRender(value, fallback);
  return <>{prefix}{safeValue}</>;
};