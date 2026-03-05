// Auto-generated backend stub
import { Actor, HttpAgent } from "@dfinity/agent";

export interface backendInterface {
  _initializeAccessControlWithSecret: (secret: string) => Promise<void>;
  ping: () => Promise<string>;
}

const idlFactory = ({ IDL }: { IDL: unknown }) => {
  return (IDL as { Service: (args: unknown) => unknown }).Service({});
};

export async function createActor(canisterId: string, options?: { agentOptions?: object }): Promise<backendInterface> {
  const agent = await HttpAgent.create({ ...options?.agentOptions });
  return Actor.createActor(idlFactory as Parameters<typeof Actor.createActor>[0], {
    agent,
    canisterId,
  }) as unknown as backendInterface;
}

export const canisterId = (typeof process !== "undefined" && process.env?.CANISTER_ID_BACKEND) || "";
