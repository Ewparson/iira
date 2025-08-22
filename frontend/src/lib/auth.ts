import { api } from "./api";
import type { AuthPayload } from "../types";

export async function startChallenge(pubkey: string): Promise<{nonce:string,expires:number,height:number}> {
  return api.post("/v1/auth/challenge", { pubkey });
}

export async function verify(pubkey: string, nonce: string, sig: string): Promise<AuthPayload> {
  return api.post("/v1/auth/verify", { pubkey, nonce, sig });
}

// simple in-memory token store with sessionStorage fallback
let _token = "";
let _rights = 0;

export function getToken() { return _token; }
export function getRights() { return _rights; }

export function loadSession() {
  _token = sessionStorage.getItem("poic_jwt") || "";
  _rights = Number(sessionStorage.getItem("poic_rights") || "0");
}

export function saveSession(token: string, rights: number) {
  _token = token; _rights = rights;
  sessionStorage.setItem("poic_jwt", token);
  sessionStorage.setItem("poic_rights", String(rights));
}

export function logout() {
  _token = ""; _rights = 0;
  sessionStorage.removeItem("poic_jwt");
  sessionStorage.removeItem("poic_rights");
}
