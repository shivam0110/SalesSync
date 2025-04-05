interface AlertProps {
  type: 'success' | 'error';
  message: string;
}

export function Alert({ type, message }: AlertProps) {
  if (!message) return null;

  const styles = {
    success: 'bg-green-50 text-green-800 border-green-400',
    error: 'bg-red-50 text-red-800 border-red-400'
  };

  return (
    <div className={`rounded-md p-4 border ${styles[type]} mb-4`}>
      <p className="text-sm">{message}</p>
    </div>
  );
} 