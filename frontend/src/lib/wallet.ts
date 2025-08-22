// Expect a wallet injected at window.poicWallet with:
// - getPublicKey(): Promise<string>   // hex
// - signHex(msgHex: string): Promise<string> // signature hex over msgHex bytes
declare global {
  interface Window {
    poicWallet?: { getPublicKey(): Promise<string>; signHex(msgHex: string): Promise<string> }
  }
}

export async function getWallet() {
  if (!window.poicWallet) throw new Error("Wallet not found");
  return window.poicWallet!;
}
