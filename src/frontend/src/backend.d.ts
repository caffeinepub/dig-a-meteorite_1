// Type declarations for backend
export interface backendInterface {
  _initializeAccessControlWithSecret: (secret: string) => Promise<void>;
  ping: () => Promise<string>;
}

export declare function createActor(canisterId: string, options?: { agentOptions?: object }): Promise<backendInterface>;
export declare const canisterId: string;
