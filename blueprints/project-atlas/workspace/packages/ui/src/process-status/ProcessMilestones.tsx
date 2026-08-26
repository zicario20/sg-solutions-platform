import type { ProcessLocale, ProcessMilestoneDto } from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";
export function ProcessMilestones({
  locale,
  items,
}: {
  locale: ProcessLocale;
  items: readonly ProcessMilestoneDto[];
}) {
  const copy = getProcessStatusCopy(locale);
  return (
    <section aria-labelledby="m010-milestones">
      <h2 id="m010-milestones">{copy.milestones}</h2>
      <ol className="m010-milestones">
        {items.map((item) => (
          <li
            key={`${item.label}:${item.state}:${item.date ?? ""}`}
            aria-current={item.state === "current" ? "step" : undefined}
            data-state={item.state}
          >
            <span aria-hidden="true" />
            <strong>{item.label}</strong>
            <span>{copy.milestoneStates[item.state]}</span>
            {item.date ? (
              <time dateTime={item.date}>
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(item.date),
                )}
              </time>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
