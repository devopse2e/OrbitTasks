import React from 'react';
import '../styles/Auth.css'; // Use Auth.css for error-message class

function ErrorMessage({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}

export default ErrorMessage;
