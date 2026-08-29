import { describe, expect, it } from "vitest";

import {
  createGlobalSearchConfiguration,
  createSearchIndexSet,
  createSearchQueryCandidate,
  createSearchSurface,
  executeGlobalSearch,
  requestSearchIndexing,
} from "../../packages/global-search/src/index";

describe("M089 global search controlled foundation", () => {
  it("does not execute a query, disclose counts or reveal resource existence", () => {
    const configuration = createGlobalSearchConfiguration({
      permission: "search.configuration.create",
      code: "GLOBAL_SEARCH_BASELINE",
    });
    const surface = createSearchSurface({
      permission: "search.surface.create",
      surfaceCode: "ADMIN_GLOBAL",
      configuration,
      scope: "admin",
    });
    const indexSet = createSearchIndexSet({
      permission: "search.index.create",
      indexSetCode: "ADMIN_SAFE_METADATA",
      configuration,
      surface,
    });
    const query = createSearchQueryCandidate({
      permission: "search.query.prepare",
      queryReference: "query-ref-001",
      surface,
    });
    const result = executeGlobalSearch({ permission: "search.query.execute", query, indexSet });

    expect(result.status).toBe("blocked_runtime_disabled");
    expect(result.queryExecuted).toBe(false);
    expect(result.resultCountDisclosed).toBe(false);
    expect(result.resourceExistenceDisclosed).toBe(false);
  });

  it("rejects raw query text and raw PII from the search contract", () => {
    const configuration = createGlobalSearchConfiguration({
      permission: "search.configuration.create",
      code: "PRIVATE_SEARCH_BASELINE",
    });
    const surface = createSearchSurface({
      permission: "search.surface.create",
      surfaceCode: "CLIENT_PRIVATE",
      configuration,
      scope: "client",
    });

    expect(() =>
      createSearchQueryCandidate({
        permission: "search.query.prepare",
        queryReference: "query-ref-002",
        surface,
        includesRawQueryText: true,
      }),
    ).toThrow("neither raw query text nor sensitive query data");
  });

  it("does not dispatch an indexing request", () => {
    const configuration = createGlobalSearchConfiguration({
      permission: "search.configuration.create",
      code: "INDEX_BASELINE",
    });
    const surface = createSearchSurface({
      permission: "search.surface.create",
      surfaceCode: "PUBLIC_HELP",
      configuration,
      scope: "public",
    });
    const indexSet = createSearchIndexSet({
      permission: "search.index.create",
      indexSetCode: "PUBLIC_HELP_METADATA",
      configuration,
      surface,
    });
    const request = requestSearchIndexing({
      permission: "search.index.request",
      requestCode: "INDEX_REQUEST_001",
      indexSet,
    });

    expect(request.status).toBe("blocked_runtime_disabled");
    expect(request.dispatched).toBe(false);
    expect(request.documentsIndexed).toBe(0);
  });
});
