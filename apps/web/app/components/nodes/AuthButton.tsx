'use client';

interface AuthButtonProps {
  authUrl?: string | boolean;
  error?: string | boolean;
  success?: string | boolean;
}

export const AuthButton = ({ authUrl, error, success }: AuthButtonProps) => {
  if (typeof authUrl === 'string' && authUrl) {
    return (
      <button 
        onClick={() => window.open(authUrl, '_blank', 'noopener,noreferrer')}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Click here to authorize
      </button>
    );
  }

  if (typeof error === 'string') {
    return <div className="mt-4 text-red-500">{error}</div>;
  }

  if (typeof success === 'string') {
    return <div className="mt-4 text-green-500">{success}</div>;
  }

  return null;
};
