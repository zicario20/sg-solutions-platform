export function AuthErrorSummary({ message }: { message?: string }) {
  return message ? (
    <p className="auth-alert" role="alert" tabIndex={-1}>
      {message}
    </p>
  ) : null;
}
