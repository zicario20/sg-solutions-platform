from app.pipelines.fallback import FallbackPolicy


def test_two_misunderstood_turns_offer_only_constrained_options() -> None:
    decision = FallbackPolicy().next(unrecognized_turns=2, failure=None)
    assert decision.action == "continue"
    assert decision.prompt_key == "constrained_transfer_message_callback"
    assert decision.requires_facade_receipt is False


def test_three_misunderstood_turns_request_safe_transfer() -> None:
    decision = FallbackPolicy().next(unrecognized_turns=3, failure=None)
    assert decision.action == "transfer"
    assert decision.requires_facade_receipt is True


def test_facade_failure_never_claims_a_business_fallback() -> None:
    decision = FallbackPolicy().next(
        unrecognized_turns=0,
        failure="facade_unavailable",
    )
    assert decision.action == "end"
    assert decision.requires_facade_receipt is False
    assert decision.prompt_key == "platform_unavailable_end_honestly"


def test_media_failure_uses_transfer_and_human_failure_uses_callback() -> None:
    policy = FallbackPolicy()
    media = policy.next(unrecognized_turns=0, failure="media_unavailable")
    human = policy.next(unrecognized_turns=0, failure="human_unavailable")
    assert (media.action, media.requires_facade_receipt) == ("transfer", True)
    assert (human.action, human.requires_facade_receipt) == ("callback", True)


def test_provider_voicemail_is_impossible_until_explicitly_enabled() -> None:
    disabled = FallbackPolicy().next(
        unrecognized_turns=0,
        failure="provider_unavailable",
    )
    synthetic_enabled = FallbackPolicy(synthetic_provider_voicemail_enabled=True).next(
        unrecognized_turns=0,
        failure="facade_unavailable",
    )
    assert disabled.action == "callback"
    assert disabled.requires_facade_receipt is True
    assert synthetic_enabled.action == "voicemail"
    assert synthetic_enabled.requires_facade_receipt is False
