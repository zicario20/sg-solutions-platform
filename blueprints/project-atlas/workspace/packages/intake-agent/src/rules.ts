import type { IntakeRuleCycleResult, IntakeRuleDependency } from "./contracts.js";

export function detectIntakeRuleCycles(
  dependencies: readonly IntakeRuleDependency[],
): IntakeRuleCycleResult {
  const graph = new Map<string, string[]>();
  for (const dependency of dependencies) {
    const targets = graph.get(dependency.source) ?? [];
    targets.push(dependency.target);
    graph.set(dependency.source, targets);
    if (!graph.has(dependency.target)) {
      graph.set(dependency.target, []);
    }
  }
  const visited = new Set<string>();
  const inPath = new Set<string>();
  const path: string[] = [];
  const visit = (node: string): readonly string[] | undefined => {
    if (inPath.has(node)) {
      const cycleStart = path.indexOf(node);
      return [...path.slice(cycleStart), node];
    }
    if (visited.has(node)) {
      return undefined;
    }
    visited.add(node);
    inPath.add(node);
    path.push(node);
    for (const target of graph.get(node) ?? []) {
      const cycle = visit(target);
      if (cycle) {
        return cycle;
      }
    }
    path.pop();
    inPath.delete(node);
    return undefined;
  };
  for (const node of graph.keys()) {
    const cycle = visit(node);
    if (cycle) {
      return { hasCycle: true, cycle };
    }
  }
  return { hasCycle: false, cycle: [] };
}
