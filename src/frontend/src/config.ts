// Auto-generated config stub
import { createActor as _createActor, type backendInterface } from "./backend";

export interface AppConfig {
  ii_derivation_origin?: string;
  canisterId?: string;
}

export async function loadConfig(): Promise<AppConfig> {
  return {
    ii_derivation_origin: undefined,
    canisterId: (typeof process !== "undefined" && process.env?.CANISTER_ID_BACKEND) || "aaaaa-aa",
  };
}

export async function createActorWithConfig(options?: { agentOptions?: object }): Promise<backendInterface> {
  const canisterId = (typeof process !== "undefined" && process.env?.CANISTER_ID_BACKEND) || "aaaaa-aa";
  return _createActor(canisterId, options);
}
