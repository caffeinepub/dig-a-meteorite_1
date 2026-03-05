import type { Principal } from "@icp-sdk/core/principal";

export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export declare class ExternalBlob {
    directURL: string;
    onProgress?: (percentage: number) => void;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array): ExternalBlob;
    getBytes(): Promise<Uint8Array>;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}

export interface CreateActorOptions {
    agentOptions?: object;
    agent?: object;
}

export interface UserProfile {
    name: string;
}

export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}

export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}

export declare function createActor(
    canisterId: string,
    uploadFile: (file: ExternalBlob) => Promise<Uint8Array>,
    downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>,
    options?: CreateActorOptions
): backendInterface;

export declare const canisterId: string;
