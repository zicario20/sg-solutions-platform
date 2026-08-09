# M012 Mensajería segura — UX/UI and experience specification

- Owner: Codex Architecture Agent with UI/UX Pro Max design guidance
- Final approver: Product Owner
- Status: Design candidate; no Build gate
- Surface: Client Portal `/client/messages`; scoped secure-message contribution to M025 Admin
- Related requirements: `docs/modules/m012-secure-messaging.md`
- Proposed architecture decision: ADR 016

This document defines the branded, responsive and accessible M012 experience. It is not a Figma
file, route/component implementation, copy approval, provider activation or authorization to handle
real client messages.

## 1. Experience objective

Within the first viewport, a client should understand:

1. which conversation needs attention;
2. the service or account context it belongs to;
3. whether SG Solutions or the client has the next response;
4. what may be shared safely in the message versus through the Document Portal;
5. the one clear next action.

The interface should feel like calm, secure case correspondence—not a social feed, help-desk
terminal or texting app. Operational complexity remains behind progressive disclosure.

## 2. Brand and art direction

Use the approved SG Solutions logo exactly as supplied. Do not redraw, regenerate, recolor or use the
promotional banner behind protected content.

- Premium financial-services clarity, generous white space and restrained motion.
- Navy structure and cobalt actions; cyan for neutral information; green only for verified
  completion; gold for attention with text.
- No message-bubble gradients, glassmorphism, animated typing theatrics, emoji-heavy status,
  decorative locks or social-network reactions.
- Conversation cards resemble professional correspondence and case activity, with friendly language.

| Role | Token/value | Use |
|---|---|---|
| Heading | Manrope | Page, conversation and context headings |
| Body/control | Inter | Messages, metadata, instructions and controls |
| Primary ink | Navy `#0A2540` | Structural text |
| Primary action | Cobalt `#0B63CE` | Send/open/recovery actions |
| Information | Cyan `#00A3E0` | Neutral availability/processing |
| Verified result | Green `#2E7D32` | Resolved only with durable evidence |
| Attention | Gold `#B7791F` | Waiting/action/attachment correction |
| App surface | `#F7F9FC` | Portal background |

Light mode ships first. Dark tokens remain unpublished in Release 1A. Reduced motion preserves all
meaning.

## 3. Information architecture

Client Portal primary destinations remain:

1. Home
2. My Services
3. Process Status
4. Documents
5. Appointments
6. Messages
7. Payments
8. Help Center
9. Settings

Routes use opaque references and `/client` conventions:

- `/client/messages` — all authorized conversations;
- `/client/messages/[publicConversationRef]` — one reauthorized conversation;
- `/client/services/[publicServiceRef]/messages` — service-scoped entry/list;
- service/process/dashboard handoffs provide only an opaque route key; M012 reauthorizes.

Admin does not gain a second inbox. M012 contributes secure conversations to:

- `/admin/communications` — M025-owned unified inbox;
- `/admin/cases/[publicCaseRef]/communications` — scoped case view.

The client never sees queue names, internal assignment, risk labels or other channels unless
explicitly approved.

## 4. Client inbox anatomy

1. Portal header and current authorized context.
2. Page title plus concise privacy guidance.
3. Optional urgent/action-required panel when based on complete authorized facts.
4. Tabs or filters: `All`, `Unread`, `Waiting for you`, `Closed`—exact labels gated by MSG-002.
5. Paginated conversation cards.
6. `Start a conversation` action when MSG-001 allows initiation.
7. Help Center and human support recovery.

Every count is post-authorization. If a source is incomplete, hide the count or label it unavailable;
never show a false zero.

## 5. Conversation card

Stable semantic order:

1. concise client-safe subject;
2. service/account context label;
3. current responsibility text such as `SG Solutions will respond` or `Your response is needed`;
4. client-last-visible-activity time, localized; staff activity/note time cannot affect card order,
   time, cursor, cache/ETag or another Client projection;
5. unread count based on approved read evidence;
6. one action: `Open conversation`.

The preview does not show message body, document name, financial amount, tax/credit detail, staff
name, internal priority or hidden participant. A protected subject uses an approved generic label.

## 6. Conversation detail anatomy

1. Back link with focus restoration.
2. Context header: subject, service/account label, client-safe state and help.
3. Optional typed resource card for an authorized document/appointment/payment/task handoff.
4. Paginated message history with day separators and server evidence times.
5. Human-handoff/temporarily-unavailable banner when applicable.
6. Secure attachment state region.
7. Composer and privacy reminder.

Older messages load through an explicit `Load earlier messages` control. There is no infinite-scroll-
only history. New messages do not steal focus or move the reading position.

## 7. Message presentation

- Client and SG Solutions messages use subtle structural alignment, not color alone.
- Every item exposes author category (`You`, `SG Solutions`, `Virtual assistant` if later approved),
  durable time and accurate availability/read label.
- System notices are structured cards and never masquerade as a person.
- Edited/redacted/withdrawn states show text and an accessible explanation without exposing prior
  content unless policy/actor permits.
- Reply context quotes only a bounded escaped excerpt visible to the same audience; internal text is
  never copied into a client quote.
- Free-text URLs do not auto-unfurl. Typed SG Solutions links use recognizable first-party labels.

## 8. Composer

- Plain multiline text input with visible label, guidance and approved count/limit.
- Primary control: `Send message`. The secondary `Attach securely` control and attachment region are
  absent until MSG-007 and every applicable M011 DOC gate are active; a disabled placeholder must
  not imply availability or call an intent/API. Once approved, it uses only M011.
- No rich-text toolbar, HTML, GIFs, reactions, voice notes, pasted images or link previews in 1A.
- Warning: never send passwords, card numbers or login credentials; documents use the secure portal.
- The send button disables only while the exact command is pending and exposes progress text.
- A lost response uses `Checking whether your message was sent` and retries the same idempotency key.
- Context/session/grant change clears unsent protected text and explains why; no local/offline draft.

## 9. Staff reply and internal note separation

The staff workspace always protects the structural split, but `Add internal note` is absent until
MSG-005 and its role/assurance/revision rules are approved and active. Gate-off renders no note body,
control, route state or service call and never substitutes a generic message visibility toggle.
After activation, the workspace has two independently labeled actions:

### Reply to client

- White/cobalt client-facing composer.
- Persistent audience banner: `This message will be visible to the client`.
- Preview shows exactly the Client DTO presentation.
- Send requires the public-reply permission and current context.

### Add internal note

- Available only while MSG-005 is active for the exact role/context/assurance.
- Gold/navy internal workspace with `Internal — not visible to the client` text and icon.
- Separate route state/form/service command; it is not a toggle in the reply composer.
- No notification, external channel or public AI action is available.
- Compliance-only notes use an additional restricted treatment/permission.

Switching actions never carries text between composers. Keyboard order, accessible names and
confirmation prevent accidental publication.

## 10. Secure attachments

- Gate-off state is the Release 1A default: no attachment button, drop zone, paste target, status
  region, preflight or upload-intent request is rendered or executed. Approved guidance may direct
  the client to human support without claiming a secure upload exists.
- The following flow exists only after MSG-007 and applicable DOC gates are approved and active.
- `Attach securely` opens an M011 preflight bound to this authorized conversation/context.
- Selected files follow M011 type/size/privacy guidance and remain `Uploading`, `Security review`,
  `Available` or `Could not be accepted` independently from the message state.
- A message may be sent without an attachment if M011 fails; UI never says the file was received.
- No thumbnail/preview of untrusted bytes in the conversation.
- Available documents appear as typed cards; view/download opens M011 and reauthorizes.
- Filename, storage key, scanner result and signed URL are not present in conversation markup.

## 11. Typed resource cards

Cards may represent authorized Help Center, document request/document, task, appointment, invoice or
payment handoffs. Each shows:

- approved title and semantic status;
- owner-domain freshness;
- one safe action;
- `Temporarily unavailable` when owner authorization/state cannot be confirmed.

Cards never execute an action from message text, expose raw IDs or imply that payment equals service
authorization. Clicking moves to the owning M011/M013/M014/M023/M067 route, which reauthorizes.

## 12. Human handoff

- Client action: `Ask for a person` remains available when messaging is permitted.
- Confirmation explains that SG Solutions will respond without promising time before MSG-014.
- `Waiting for a team member` and `A team member is responding` are shown only from durable state.
- Future AI is labeled on every response. When human takeover wins, the composer/history never shows
  another AI message accepted afterward.
- A bounded handoff summary is visible only to authorized staff and never replaces transcript
  review. It prefers structured reason/pointers; any derived free text follows the same encrypted
  protected-content boundary as the transcript and never appears in telemetry or notification copy.

## 13. Responsive behavior

### Wide desktop

- Client: 5/7 inbox/thread split may be used only when selecting a thread reauthorizes it.
- Staff: M025 may use queue/context/thread panels; each panel receives authorization-filtered data.
- Composer remains in normal document flow or a non-obscuring sticky footer with keyboard access.

### Tablet

- Inbox and thread become separate views or a full-width drawer with reliable back/focus behavior.
- Filters use an accessible sheet/dialog and show applied-count text.

### Mobile, including 320px

- Inbox → full-screen thread → full-width composer.
- Context header is compact but retains service/account and responsibility.
- Messages reflow without horizontal scrolling; URLs wrap safely.
- Composer respects on-screen keyboard/safe-area and does not hide send/attachment guidance.
- Attachment and resource cards stack; no tiny three-column staff workspace.
- Staff follows queue → context → thread → action steps with public/internal mode always visible.

## 14. Accessibility

- Semantic landmarks/headings and one page `h1`.
- Conversation list is a list; messages use a labeled log/feed region with stable DOM order.
- New-message announcements are polite, concise and batched; history loading does not reread the
  entire transcript.
- Author, audience and state are text, not color/position alone.
- Composer label, hint, count, error and send progress are programmatically associated.
- Error summary receives focus and links to the composer/attachment.
- Dialogs/sheets trap and restore focus; Escape never discards text without confirmation.
- `Load earlier` and `Jump to newest` work with keyboard and screen readers.
- 320px, 200% zoom, high contrast, reduced motion and 44px targets are mandatory.
- Transient typing/read indicators, if later approved, cannot produce noisy live-region updates.

## 15. Bilingual content model

Stable paired ES/EN keys cover navigation, reason/status labels, composer guidance, prohibited-data
warning, attachment states, handoff, notifications, errors, empty/loading states and accessible
announcements.

User-authored text remains in the original language. Translation is a labeled secondary artifact and
never overwrites or silently replaces the source. Missing critical locale copy disables the action
and offers human support rather than mixing legal/privacy instructions.

## 16. Empty, loading and failure states

- No conversations: `You do not have conversations in this context yet` plus permitted start/help.
- No unread: `You are up to date` only after complete authorized read facts.
- No results: retain filters and provide `Clear filters`.
- Loading: stable skeletons; no exposed prior-client content.
- Revoked context/session: remove thread content immediately and return to a safe portal entry.
- Messaging unavailable: preserve no protected offline cache; offer Help Center/approved contact.
- Send uncertain: reconcile by idempotency before allowing a new send.
- Attachment unavailable: keep text composer active and offer M011 retry.
- Notification failure: no alarming client state; portal message remains available.
- AI unavailable: human path remains, with no fake automated response.

## 17. Component and token contracts

- `SecureConversationList`
- `ConversationFilterBar`
- `SecureConversationCard`
- `ConversationContextHeader`
- `MessageHistory`
- `SecureMessageItem`
- `SystemMessageNotice`
- `ResponsibilityBadge`
- `MessageComposer`
- `SecureAttachmentAction`
- `AttachmentStateCard`
- `TypedResourceCard`
- `HumanHandoffPanel`
- `ConversationEmptyState`
- `MessagingErrorSummary`
- `StaffReplyComposer`
- `InternalNoteComposer`
- `StaffConversationContext`
- `RestrictedConversationBanner`

Client components accept only Client DTOs. `InternalNoteComposer` and internal note records cannot be
constructed from Client data or used by `StaffReplyComposer`. Components receive semantic tokens,
copy keys and typed state—not raw provider codes, Storage references or dynamic HTML.

## 18. State presentation matrix

| Durable fact | Client presentation | Treatment |
|---|---|---|
| New staff message available | New message | Cobalt/cyan + text |
| Waiting for client | Your response is needed | Gold attention + composer |
| Waiting for staff | SG Solutions will respond | Neutral cyan; no time promise |
| Human handoff requested | Waiting for a team member | Gold/neutral status |
| Human active | A team member is handling this | Navy/cyan |
| Resolved | Resolved | Green only with durable outcome |
| Closed | Conversation closed | Neutral with approved reopen/help |
| Message command pending | Sending | Cobalt progress text |
| Durable message accepted | Sent in the portal | Neutral check/text; not read |
| Attachment processing | File under security review | Cyan; separate from message |
| Attachment rejected | File could not be accepted | Neutral error + secure retry |
| Resource owner unavailable | Details temporarily unavailable | Neutral recovery |

Exact copy and visible states remain MSG-002/MSG-016 decisions.

## 19. Analytics and privacy boundary

Until MSG-018 is approved, M012 emits no external product analytics. Future coarse events may include
approved route/action/outcome/performance buckets only. Prohibited payloads include:

- message/note body, subject, quoted excerpt or translation;
- conversation/client/service/case/message/document/payment/appointment identifiers;
- filename, typed resource title, amount, status detail or signed URL;
- DOM text, input values, clipboard, keystrokes, session replay, screenshots or autocapture;
- language text, classification, AI prompt/context/output or staff identity.

First-party operational/audit evidence follows M077 and is not PostHog analytics. M092 owns future
report/product-analytics consumption and remains off until MSG-018. M097 separately owns required
content-free, identifier-free operational/security telemetry under its own readiness/activation
policy, including when product analytics is off. M012 owns only minimized domain facts; neither
consumer receives transcript content, direct contact PII, protected identifiers, DOM/session replay
or a parallel transcript store.

## 20. Design validation checklist

- [ ] ES/EN desktop/tablet/mobile flows cover inbox, start, read, reply, safe retry, attachment,
  handoff, resolved/closed and unavailable states.
- [ ] Staff flows prove public reply and internal/compliance note are distinct at every breakpoint.
- [ ] With MSG-005 off, no internal-note body/control/service call exists and no generic audience/
  visibility parameter can emulate one.
- [ ] 320px, 200% zoom, keyboard-only, screen-reader, high-contrast and reduced-motion pass.
- [ ] No body preview or unauthorized count appears in inbox cards/notifications.
- [ ] New message/history pagination preserves focus and reading position.
- [ ] Attachment status cannot imply M011 acceptance or expose unsafe bytes.
- [ ] With MSG-007 or any required DOC gate off, no attachment UI, paste/drop handler, preflight or
  upload-intent call exists; text messaging remains honest and usable.
- [ ] Typed resource cards reauthorize in their owner and show honest unavailable/freshness states.
- [ ] `Sent`, `available`, `delivered` and `read` copy matches the durable fact.
- [ ] Client DTO/component tests prove internal notes/assignments/risk/provider fields are absent.
- [ ] Plain text and links resist stored XSS, phishing, open redirect and automatic unfurl/SSRF.
- [ ] Human takeover prevents later AI publication in the rendered history.
- [ ] No protected draft, transcript or identifier enters browser persistence or analytics.

## 21. Approval boundary

Product Owner approval is required for this design, the M012 PRD, ADR 016 and MSG-001–MSG-020.
Documentation approval still does not authorize routes, components, tables/RLS policies, providers,
AI, notifications, real messages, merge, deployment or `GENERATE`.
