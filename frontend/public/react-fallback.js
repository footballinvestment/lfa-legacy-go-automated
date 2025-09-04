// React Fallback for when React doesn't load
if (typeof React === 'undefined') {
  console.log("React not available, creating fallback");
  
  window.React = {
    version: 'fallback',
    createElement: function(tag, props, ...children) {
      return { tag, props, children };
    }
  };
  
  console.log("React fallback created");
}