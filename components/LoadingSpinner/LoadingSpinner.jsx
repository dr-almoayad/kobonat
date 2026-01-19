// components/LoadingSpinner/LoadingSpinner.jsx
import './LoadingSpinner.css';

export default function LoadingSpinner({ size = 'medium', message = 'Loading...' }) {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}