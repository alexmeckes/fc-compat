import './styles.css';

export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="error-container">
      <p className="error-message">
        ❌ {message}
      </p>
    </div>
  );
} 