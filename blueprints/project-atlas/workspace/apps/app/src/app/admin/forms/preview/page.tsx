export const dynamic = "force-dynamic";

export default function PublicFormPreviewPage(): never {
  // M006 intentionally fails closed until the staff authentication owner supplies
  // an exact forms.definition_preview grant. The domain preview model is synthetic
  // and read-only; no publish, mutate or submission endpoint exists here.
  throw new Error(
    "Public form preview is provider-disabled until staff authorization is integrated.",
  );
}
