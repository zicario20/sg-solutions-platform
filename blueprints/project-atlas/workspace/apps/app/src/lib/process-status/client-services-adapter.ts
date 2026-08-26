import type { AuthorizedProcessRoot } from "@atlas/client-process-status";
import type {
  AuthorizedServiceChoicePort,
  AuthorizedServiceRootPort,
} from "@atlas/client-services";
export function createClientServicesProcessAdapter(
  choices: AuthorizedServiceChoicePort,
  roots: AuthorizedServiceRootPort<AuthorizedProcessRoot>,
) {
  return Object.freeze({ choices, roots });
}
