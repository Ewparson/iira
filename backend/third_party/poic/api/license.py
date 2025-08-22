# === DOWNLOAD AUTH EXCHANGE (license -> one-time URL) ===
import os, time, json, hmac, hashlib, secrets, jwt
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/v1/license", tags=["license"])

# reuse existing globals if present; otherwise define
DOWNLOAD_BASE       = os.environ["DOWNLOAD_BASE"]            # e.g. https://dl.iira.ai/poic
NODE_ASSET          = os.environ.get("NODE_ASSET","poic-node-installer.exe")
GENESIS_PUBKEY_PEM  = os.environ["GENESIS_PUBKEY_PEM"]
GENESIS_PRIVKEY_PEM = os.environ["GENESIS_PRIVKEY_PEM"]
SERVER_HMAC_SECRET  = os.environ["SERVER_HMAC_SECRET"]
DL_TOKEN_TTL_SEC    = int(os.environ.get("DL_TOKEN_TTL_SEC","900"))

def _hmac_sha256(key: bytes, msg: str) -> str:
    return hmac.new(key, msg.encode(), hashlib.sha256).hexdigest()

# LevelDB helpers (reuse yours)
import plyvel
DB_PATH = os.environ.get("POIC_DB","/mnt/c/Users/emaan/OneDrive/Desktop/poic/license-db")
db = plyvel.DB(DB_PATH, create_if_missing=True)
def _put(prefix, key, value): db.put((prefix+key).encode(), json.dumps(value).encode())
def _get(prefix, key):
    raw = db.get((prefix+key).encode())
    return json.loads(raw.decode()) if raw else None

CDN_PATH_NODE = f"/{NODE_ASSET}"

class ExchangeReq(BaseModel):
    license_jwt: str

@router.post("/exchange")
def exchange_download( req: ExchangeReq ):
    # 1) verify license_jwt
    try:
        obj = jwt.decode(req.license_jwt, GENESIS_PUBKEY_PEM, algorithms=["EdDSA"])
    except Exception as e:
        raise HTTPException(400, f"invalid license: {e}")

    lic = obj["lic"]
    lic_id = lic["license_id"]
    rec = _get("license:", lic_id)
    if not rec: raise HTTPException(404, "license not found")

    # Rights check (defaults to 1 download)
    rights = lic.get("rights", {"node_downloads":1})
    max_dl = int(rights.get("node_downloads", 1))
    used = int(rec.get("downloads_used", 0))
    if used >= max_dl:
        raise HTTPException(409, "downloads exhausted")

    # 2) issue one-time dl token (JWT) + HMAC’d CDN URL
    jti = secrets.token_hex(8)
    dl = jwt.encode(
        {"sub": lic_id, "jti": jti, "scope":"node_download", "sku": lic.get("sku","node"),
         "exp": int(time.time()) + DL_TOKEN_TTL_SEC},
        GENESIS_PRIVKEY_PEM, algorithm="EdDSA", headers={"kid":"genesis-ed25519-v1"}
    )

    _put("dltok:", jti, {"used": False, "license_id": lic_id, "ts": int(time.time())})

    exp = int(time.time()) + DL_TOKEN_TTL_SEC
    sig = _hmac_sha256(SERVER_HMAC_SECRET.encode(), f"{CDN_PATH_NODE}|{exp}|{jti}")
    download_url = f"{DOWNLOAD_BASE}{CDN_PATH_NODE}?exp={exp}&jti={jti}&tok={dl}&sig={sig}"

    return {"download_url": download_url, "license_id": lic_id, "expires_at": exp}

@router.get("/dl")
def download_gate(request: Request):
    tok = request.query_params.get("tok")
    jti = request.query_params.get("jti")
    exp = request.query_params.get("exp")
    sig = request.query_params.get("sig")
    if not (tok and jti and exp and sig):
        raise HTTPException(400, "bad url")

    expect = _hmac_sha256(SERVER_HMAC_SECRET.encode(), f"{CDN_PATH_NODE}|{exp}|{jti}")
    if sig != expect or int(exp) < int(time.time()):
        raise HTTPException(403, "expired or tampered")

    # Verify JWT and one-time use
    try:
        obj = jwt.decode(tok, GENESIS_PUBKEY_PEM, algorithms=["EdDSA"])
    except Exception as e:
        raise HTTPException(403, f"invalid token: {e}")

    rec = _get("dltok:", jti)
    if not rec or rec.get("used"): raise HTTPException(409, "token already used")

    # mark used + increment license counter
    rec["used"]=True; rec["used_at"]=int(time.time()); _put("dltok:", jti, rec)
    lic_id = rec["license_id"]
    lrec = _get("license:", lic_id) or {}
    lrec["downloads_used"] = int(lrec.get("downloads_used", 0)) + 1
    _put("license:", lic_id, lrec)

    # redirect to actual blob (private origin/CDN)
    return RedirectResponse(url=f"{DOWNLOAD_BASE}{CDN_PATH_NODE}&ok=1")
