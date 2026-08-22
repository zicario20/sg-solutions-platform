import type { ClientServiceDetailDto, ClientServiceListDto, ClientServiceSectionDto } from "./contracts.ts";
import { parseClientServiceDetailDto, parseClientServiceListDto } from "./contracts.ts";

export function serializeClientServiceSection(section: ClientServiceSectionDto): ClientServiceSectionDto {
  if (section.state === "fresh") return { state: "fresh", generatedAt: section.generatedAt, data: section.data };
  if (section.state === "empty") return { state: "empty", generatedAt: section.generatedAt };
  return section.reason
    ? { state: section.state, generatedAt: section.generatedAt, reason: section.reason }
    : { state: section.state, generatedAt: section.generatedAt };
}

export function serializeClientServiceList(value: unknown): ClientServiceListDto {
  return parseClientServiceListDto(value);
}

export function serializeClientServiceDetail(value: unknown): ClientServiceDetailDto {
  const parsed = parseClientServiceDetailDto(value);
  return {
    ...parsed,
    sections: Object.fromEntries(Object.entries(parsed.sections).map(([name, section]) => [name, serializeClientServiceSection(section)])) as ClientServiceDetailDto["sections"]
  };
}
