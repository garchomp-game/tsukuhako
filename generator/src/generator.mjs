import { planGeneration } from './core/plan.mjs';
import { applyGeneration } from './core/apply.mjs';
import { diagnoseHost } from './core/diagnostics.mjs';
export { hash } from './core/common.mjs';
export { loadCatalog as catalog } from './core/catalog.mjs';
export { planGeneration, applyGeneration, diagnoseHost };

// Preserve the synchronous 0.1.x create API and its return keys.
export function create(root, id, destination, options = {}, hooks = {}) {
  try {
    const plan = planGeneration(root, { templateId: id, destination, ...options });
    const result = applyGeneration(root, plan, hooks);
    return { id, destination: result.destination, project: result.projectName, port: plan.request.port, sha256: result.archiveSha256 };
  } catch (error) {
    // Legacy regression hooks are not accepted by any user-facing API.
    if (Object.keys(hooks).length && error.cause) error.message += ` (${error.cause.message})`;
    throw error;
  }
}
export const doctor = diagnoseHost;
