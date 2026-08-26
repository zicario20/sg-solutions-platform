import type { ClientProcessDetailDto, ProcessLocale } from "@atlas/client-process-status";
import { getProcessStatusCopy } from "@atlas/i18n";
import { ProcessMilestones } from "./ProcessMilestones.tsx";
import { ProcessNextAction } from "./ProcessNextAction.tsx";
import { ProcessSections } from "./ProcessSections.tsx";
import { ProcessStatusHeader } from "./ProcessStatusHeader.tsx";
import { ProcessStatusState } from "./ProcessStatusStates.tsx";
import { ProcessTimeline } from "./ProcessTimeline.tsx";
import "./ProcessStatus.module.css";
export function ProcessStatusView({
  locale,
  dto,
}: {
  locale: ProcessLocale;
  dto: ClientProcessDetailDto;
}) {
  const copy = getProcessStatusCopy(locale);
  return (
    <main className="m010-process m010-detail">
      <ProcessStatusHeader locale={locale} dto={dto} />
      {dto.availability !== "fresh" ? (
        <ProcessStatusState
          locale={locale}
          state={dto.availability === "empty" ? "unconfirmed" : dto.availability}
        />
      ) : null}
      {dto.nextAction ? <ProcessNextAction locale={locale} action={dto.nextAction} /> : null}
      {dto.blockers?.length ? (
        <section className="m010-blockers" aria-labelledby="m010-blockers">
          <h2 id="m010-blockers">{copy.blockers}</h2>
          <ul>
            {dto.blockers.map((blocker) => (
              <li key={blocker.effect + ":" + blocker.code + ":" + blocker.label}>
                <strong>{blocker.label}</strong>
                <span>{copy.parties[blocker.responsibleParty]}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {dto.milestones?.length ? <ProcessMilestones locale={locale} items={dto.milestones} /> : null}
      {dto.timeline ? (
        <ProcessTimeline
          locale={locale}
          timeline={dto.timeline}
          serviceRef={dto.service.serviceRef}
        />
      ) : null}
      <ProcessSections locale={locale} sections={dto.sections} />
    </main>
  );
}
