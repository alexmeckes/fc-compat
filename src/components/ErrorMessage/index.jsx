export function ErrorMessage({ message }) {
  if (!message) return null;

  return (
    <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-700">
        {message}
      </p>
    </div>
  );
} 