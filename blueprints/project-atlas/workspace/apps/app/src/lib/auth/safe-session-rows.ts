export function toSafeAuthSessionRows(
  sessions: readonly Readonly<{ id: string; current: boolean; createdAtLabel: string }>[],
  sessionLabel: string,
): readonly Readonly<{ key: string; label: string; current: boolean; createdAtLabel: string }>[] {
  return Object.freeze(sessions.slice(0, 20).map((session, index) => Object.freeze({
    key: `session-${index + 1}`,
    label: `${sessionLabel} ${index + 1}`,
    current: session.current,
    createdAtLabel: session.createdAtLabel,
  })));
}
