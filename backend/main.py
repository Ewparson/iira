from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

app = FastAPI()

# 1) Connect Wallet
@app.post("/api/connect-wallet")
async def connect_wallet(file: UploadFile = File(...)):
    # TODO: run your PoIC wallet verifier here
    contents = await file.read()
    # placeholder: parse public key / address
    address = verify_wallet_file(contents)
    return {"address": address}

# 2) Buy Shadow PoIC
class BuyRequest(BaseModel):
    usd_amount: float
    wallet_address: str

@app.post("/api/buy")
async def buy(request: BuyRequest):
    # TODO: call Stripe API to create checkout session
    session_url = create_stripe_session(request.usd_amount, request.wallet_address)
    return {"checkout_url": session_url}

# 3) Sell PoIC for USD
class SellRequest(BaseModel):
    poic_amount: float
    wallet_address: str

@app.post("/api/sell")
async def sell(request: SellRequest):
    # TODO: validate balance, create payout via Stripe/ACH
    payout_status = process_sell(request.wallet_address, request.poic_amount)
    return {"status": payout_status}
