import type { ClientServiceCardDto, ClientServiceLocale } from "@atlas/client-services";
import { getClientServicesCopy } from "@atlas/i18n";

export function ClientServiceCard({
  item,
  locale,
}: {
  item: ClientServiceCardDto;
  locale: ClientServiceLocale;
}) {
  const copy = getClientServicesCopy(locale);
  return (
    <article className="m009-card">
      <div className="m009-card-top">
        <span>
          {copy.reference} {item.publicReference}
        </span>
        <span className="m009-state">{item.publicStateLabel}</span>
      </div>
      <p className="m009-context">
        <strong>{copy.context}:</strong> {item.context.label}
      </p>
      <h2>{item.serviceName}</h2>
      <p>{item.categoryLabel}</p>
      <dl className="m009-axes">
        <div>
          <dt>{copy.axes.commercial}</dt>
          <dd>{item.axisLabels.commercial}</dd>
        </div>
        <div>
          <dt>{copy.axes.financial}</dt>
          <dd>{item.axisLabels.financial}</dd>
        </div>
        <div>
          <dt>{copy.axes.activation}</dt>
          <dd>{item.axisLabels.activation}</dd>
        </div>
        <div>
          <dt>{copy.axes.fulfillment}</dt>
          <dd>{item.axisLabels.fulfillment}</dd>
        </div>
      </dl>
      {item.currentMilestone ? (
        <p>
          <strong>{copy.milestone}:</strong> {item.currentMilestone.label} ·{" "}
          {item.currentMilestone.stateLabel}
        </p>
      ) : null}
      <p>
        <strong>{copy.progress}:</strong> {item.milestones.completed}/{item.milestones.total}
      </p>
      {item.nextStepLabel ? (
        <p>
          <strong>{copy.nextStep}:</strong> {item.nextStepLabel}
        </p>
      ) : null}
      <div className="m009-card-footer">
        <time dateTime={item.updatedAt}>
          {copy.updated}:{" "}
          {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
            new Date(item.updatedAt),
          )}
        </time>
        <a
          href={`/client/services/${encodeURIComponent(item.opaqueRef)}`}
          aria-label={copy.openFor(item.serviceName, item.publicReference)}
        >
          {copy.open}
        </a>
      </div>
    </article>
  );
}
