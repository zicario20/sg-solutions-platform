import type {
  AcceptPublicFormCommand,
  AcceptPublicFormResult,
  PublicFormsService,
} from "@atlas/domain";

export class PublicFormsFacade {
  constructor(private readonly service: Pick<PublicFormsService, "accept">) {}

  async acceptPublicSubmission(command: AcceptPublicFormCommand): Promise<AcceptPublicFormResult> {
    return this.service.accept({
      formCode: command.formCode,
      formVersion: command.formVersion,
      locale: command.locale,
      nonce: command.nonce,
      sessionBinding: command.sessionBinding,
      idempotencyKey: command.idempotencyKey,
      correlationId: command.correlationId,
      answers: Object.freeze({ ...command.answers }),
      consents: Object.freeze({ ...command.consents }),
      ...(command.attribution ? { attribution: Object.freeze({ ...command.attribution }) } : {}),
    });
  }
}

export function createProviderDisabledPublicFormsFacade(): Pick<
  PublicFormsFacade,
  "acceptPublicSubmission"
> {
  return {
    async acceptPublicSubmission() {
      return { status: "unavailable", code: "form_unavailable" };
    },
  };
}
