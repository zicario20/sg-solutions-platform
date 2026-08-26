export function AuthField({
  label,
  type = "text",
  name,
  autoComplete,
  error,
  hint,
  required = true,
  minLength,
}: {
  label: string;
  type?: string;
  name?: string;
  autoComplete?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  minLength?: number;
}) {
  const stableName =
    name ?? (type === "email" ? "email" : type === "password" ? "password" : "value");
  const id = `auth-${stableName}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  return (
    <p className="auth-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={stableName}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
      />
      {hint && !error ? (
        <span id={hintId} className="auth-hint">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </p>
  );
}
export function authFormAttributes(flow: "sign-in" | "register" | "recovery" | "reset") {
  return {
    action:
      flow === "sign-in"
        ? "/api/auth/login"
        : flow === "register"
          ? "/api/auth/register"
          : flow === "reset"
            ? "/api/auth/reset"
            : "/api/auth/recovery",
    method: "post" as const,
  };
}
