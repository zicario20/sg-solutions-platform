export function AuthErrorSummary({ message }: { message?: string }) { return message ? <p role="alert" tabIndex={-1}>{message}</p> : null; }
