import {
  STRIPE_PROVIDER_CODE,
  type StripePaymentProvider,
  type StripeProviderCapabilities,
} from "./m043-contracts.ts";
import {
  assertStripeProviderOperationDisabled,
  createDisabledStripeRuntimeConfiguration,
} from "./m043-controls.ts";

/**
 * Deliberately non-operational Stripe adapter. It preserves the integration
 * boundary and fails closed until activation is independently approved.
 */
export class StripePaymentAdapter implements StripePaymentProvider {
  readonly providerCode = STRIPE_PROVIDER_CODE;
  readonly runtimeState = createDisabledStripeRuntimeConfiguration().state;
  readonly capabilities: StripeProviderCapabilities = {
    supportsCheckout: false,
    supportsPaymentIntents: false,
    supportsSetupIntents: false,
    supportsInvoices: false,
    supportsRefunds: false,
    supportsDisputes: false,
    supportsSubscriptions: false,
    supportsBillingPortal: false,
    supportsWebhooks: false,
  };

  async createCustomer(
    _input: Parameters<StripePaymentProvider["createCustomer"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_customer");
  }

  async createCheckoutSession(
    _input: Parameters<StripePaymentProvider["createCheckoutSession"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_checkout_session");
  }

  async createPaymentIntent(
    _input: Parameters<StripePaymentProvider["createPaymentIntent"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_payment_intent");
  }

  async createSetupIntent(
    _input: Parameters<StripePaymentProvider["createSetupIntent"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_setup_intent");
  }

  async createInvoice(
    _input: Parameters<StripePaymentProvider["createInvoice"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_invoice");
  }

  async submitRefund(_input: Parameters<StripePaymentProvider["submitRefund"]>[0]): Promise<never> {
    return assertStripeProviderOperationDisabled("submit_refund");
  }

  async createBillingPortalSession(
    _input: Parameters<StripePaymentProvider["createBillingPortalSession"]>[0],
  ): Promise<never> {
    return assertStripeProviderOperationDisabled("create_billing_portal_session");
  }
}
