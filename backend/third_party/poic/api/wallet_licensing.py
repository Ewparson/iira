import os, time, json, secrets, hashlib, hmac, jwt, subprocess, plyvel
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/v1/wallet", tags=["wallet-licensing"])

# ENV
POIC_CLI            = os.environ.get("POIC_CLI","./build/poic_node")
GENESIS_PUBKEY_PEM  = os.environ["GENESIS_PUBKEY_PEM"]
GENESIS_PRIVKEY_PEM = os.environ["GENESIS_PRIVKEY_PEM"]
GENESIS_PAY_ADDR    = os.environ["GENESIS_PAY_ADDR"]               # where buyers send tokens
CONFIRMATIONS_MIN   = int(os.environ.get("CONFIRMATIONS_MIN","1"))
SKU_PRICES          = json.loads(os.environ.get("WALLET_SKU_PRICES_JSON",
                     '{"wallet-10":100,"wallet-100":800,"wallet-1000":6000,"wallet-monthly-unlimited":5000}'))
DB_PATH             = os.environ.get("POIC_DB", r"C:\Users\emaan\OneDrive\Desktop\poic\license-db")
db = plyvel.DB(DB_PATH, create_if_missing=True)

def _sha256(b: bytes)->str: return hashlib.sha256(b).hexdigest()
def _put(p,k,v): db.put((p+k).encode(), json.dumps(v).encode())
def _get(p,k):
    raw=db.get((p+k).encode())
    return json.loads(raw.decode()) if raw else None

# ---------- purchase (anonymous token payment, memo-bound) ----------
class QuoteReq(BaseModel):
    sku: str = Field(pattern="^[a-z0-9-]{3,32}$")
    buyer_pubkey_hex: str = Field(min_length=32, max_length=256)

@router.post("/quote")
def quote(req: QuoteReq):
    if req.sku not in SKU_PRICES: raise HTTPException(400,"unknown sku")
    pid = _sha256(f"{req.sku}|{req.buyer_pubkey_hex}|{secrets.token_hex(16)}".encode())
    memo = _sha256(f"{req.buyer_pubkey_hex}|{req.sku}|{pid}".encode())[:32]
    rec = {"status":"PENDING","sku":req.sku,"amount":SKU_PRICES[req.sku],
           "memo":memo,"buyer_pubkey_hex":req.buyer_pubkey_hex,
           "created_at":int(time.time()),"expires_at":int(time.time())+3600}
    _put("wq:", pid, rec)
    return {"payment_id":pid,"pay_to_addr":GENESIS_PAY_ADDR,"amount":rec["amount"],"memo":memo,"expires_at":rec["expires_at"]}

class VerifyReq(BaseModel):
    payment_id: str

def _find_payment(memo: str, min_amount: int):
    # require CLI: poic_node find-memo <memo> --minconf N -> JSON {"txid":"...","amount":...,"to":"..."}
    try:
        out = subprocess.check_output([POIC_CLI,"find-memo",memo,"--minconf",str(CONFIRMATIONS_MIN)],
                                      stderr=subprocess.STDOUT, timeout=20).decode()
        j = json.loads(out)
        if j.get("amount",0) >= min_amount and j.get("to")==GENESIS_PAY_ADDR:
            return j["txid"]
    except Exception:
        return None
    return None

@router.post("/verify")
def verify(req: VerifyReq):
    rec = _get("wq:", req.payment_id)
    if not rec: raise HTTPException(404,"not found")
    if rec["status"]=="PAID": return {"status":"PAID","txid":rec["txid"]}
    if int(time.time())>rec["expires_at"]:
        rec["status"]="EXPIRED"; _put("wq:", req.payment_id, rec); return {"status":"EXPIRED"}
    txid = _find_payment(rec["memo"], rec["amount"])
    if not txid: return {"status":"PENDING"}
    rec["status"]="PAID"; rec["txid"]=txid; _put("wq:", req.payment_id, rec)
    return {"status":"PAID","txid":txid}

class MintReq(BaseModel):
    payment_id: str

@router.post("/mint-license")
def mint_license(req: MintReq):
    rec = _get("wq:", req.payment_id)
    if not rec: raise HTTPException(404,"not found")
    if rec["status"]!="PAID": raise HTTPException(409,"not paid")
    if rec.get("minted"): raise HTTPException(409,"already minted")

    # rights
    sku = rec["sku"]
    if sku=="wallet-monthly-unlimited":
        rights = {"wallet_mints_unlimited": True, "expires_at": int(time.time()) + 30*24*3600}
    else:
        qty = int(sku.split("-")[1])  # wallet-10 -> 10
        rights = {"wallet_mints": qty}

    payload = {
        "type":"POIC_LICENSE",
        "kind":"WALLET_MINT",
        "sku": sku,
        "buyer_pubkey_hex": rec["buyer_pubkey_hex"],
        "rights": rights,
        "nonce": secrets.token_hex(16),
        "issued_at": int(time.time()),
        "expires_at": rights.get("expires_at")
    }
    tmp = payload.copy()
    lic_id = _sha256(json.dumps(tmp, sort_keys=True).encode())
    payload["license_id"] = lic_id

    # anchor: reuse payment txid holding memo or add separate anchor if you prefer
    txid = rec["txid"]

    license_jwt = jwt.encode({"lic": payload, "txid": txid}, GENESIS_PRIVKEY_PEM,
                              algorithm="EdDSA", headers={"kid":"genesis-ed25519-v1"})
    _put("wlic:", lic_id, {"used":0,"sku":sku,"unlimited":rights.get("wallet_mints_unlimited",False),
                           "limit": rights.get("wallet_mints",0),
                           "expires_at": rights.get("expires_at"), "txid":txid})
    rec["minted"]=True; rec["license_id"]=lic_id; _put("wq:", req.payment_id, rec)
    return {"license_jwt": license_jwt, "license_id": lic_id, "txid": txid}
# ---------- consume: node asks to spend 1 generation ----------
class ConsumeReq(BaseModel):
    license_jwt: str
    new_wallet_pubkey_hex: str

@router.post("/consume")
def consume(req: ConsumeReq):
    try:
        obj = jwt.decode(req.license_jwt, GENESIS_PUBKEY_PEM, algorithms=["EdDSA"])
    except Exception as e:
        raise HTTPException(400, f"invalid license: {e}")

    lic = obj["lic"]; lic_id = lic["license_id"]
    if lic.get("kind")!="WALLET_MINT": raise HTTPException(400,"wrong license kind")

    rec = _get("wlic:", lic_id)
    if not rec: raise HTTPException(404,"license not found")

    now = int(time.time())
    exp = rec.get("expires_at")
    if exp and now > exp: raise HTTPException(409,"license expired")

    if not rec.get("unlimited", False):
        lim = int(rec.get("limit",0)); used = int(rec.get("used",0))
        if used >= lim: raise HTTPException(409,"quota exhausted")
        rec["used"] = used + 1

    # optional: anchor each mint (cheap dust tx with memo=lic_id|#used|<pubkeyhash>)
    seq = int(rec.get("used", 0))
    memo = f"{lic_id}|{seq}"
    try:
        subprocess.check_output([POIC_CLI,"sendto", GENESIS_PAY_ADDR, "1", "--memo", memo],
                                stderr=subprocess.STDOUT, timeout=10)
    except Exception:
        pass  # non-fatal for now

    _put("wlic:", lic_id, rec)

    # return a receipt for the node to embed next to the new wallet
    receipt = jwt.encode(
        {"ok": True, "lic_id": lic_id, "seq": seq, "pubkey": req.new_wallet_pubkey_hex, "ts": now},
        GENESIS_PRIVKEY_PEM, algorithm="EdDSA", headers={"kid":"genesis-ed25519-v1"}
    )
    return {"receipt": receipt, "seq": seq}
