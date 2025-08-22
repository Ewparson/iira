// src/App.js
import React from "react";
import "./index.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import LightRays from "./components/LightRays";

import Landing        from "./pages/Landing";
import Signup         from "./pages/Signup";
import Login          from "./pages/Login";
import VerifyEmail    from "./pages/Verify";
import EmailVerified  from "./pages/EmailVerified";
import Welcome        from "./pages/Welcome";
import Company        from "./pages/Company";
import Developers     from "./pages/Developers";
import Legal          from "./pages/Legal";
import Enable2FA      from "./pages/Enable2FA";
import Mail           from "./pages/Notifications";
import Onboarding     from "./pages/Onboarding";
import AddPayment     from "./pages/AddPayment";
import Admin          from "./pages/Admin";
import KycQrInvite    from "./pages/KycQrInvite";
import MobileKyc      from "./pages/MobileKyc";
import IntellaCoin    from "./pages/IntellaCoin";
import CheckoutResult from "./pages/CheckoutResult";
import PrivateLayout  from "./components/PrivateLayout";

const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="relative min-h-dvh bg-neutral-950 text-neutral-50 overflow-hidden">
          {/* background rays */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <LightRays
              className="h-full w-full"
              raysOrigin="top-center"
              raysColor="#b30000"
              raysSpeed={1.3}
              lightSpread={0.85}
              rayLength={1.2}
              followMouse={true}
              mouseInfluence={0.12}
              noiseAmount={0.08}
              distortion={0.05}
            />
          </div>

          {/* app UI */}
          <div className="relative z-10">
            <NavBar />
            <main className="relative">
              <Routes>
                <Route path="/"             element={<Landing />} />
                <Route path="/signup"       element={<Signup />} />
                <Route path="/signin"       element={<Login />} />
                <Route path="/login"        element={<Login />} />
                <Route path="/verify"       element={<VerifyEmail />} />
                <Route path="/verified"     element={<EmailVerified />} />
                <Route path="/buy"          element={<CheckoutResult />} />
                <Route path="/pay/success"  element={<CheckoutResult />} />

                <Route element={<PrivateLayout />}>
                  <Route path="/welcome"        element={<Welcome />} />
                  <Route path="/IntellaCoin"    element={<IntellaCoin />} />
                  <Route path="/company"        element={<Company />} />
                  <Route path="/developers"     element={<Developers />} />
                  <Route path="/legal"          element={<Legal />} />
                  <Route path="/enable-2fa"     element={<Enable2FA />} />
                  <Route path="/mail"           element={<Mail />} />
                  <Route path="/onboarding"     element={<Onboarding />} />
                  <Route path="/kyc-qr-invite"  element={<KycQrInvite />} />
                  <Route path="/mobile-kyc"     element={<MobileKyc />} />
                  <Route path="/admin"          element={<Admin />} />
                  <Route
                    path="/add-payment"
                    element={
                      stripePromise ? (
                        <Elements stripe={stripePromise}>
                          <AddPayment />
                        </Elements>
                      ) : (
                        <AddPayment />
                      )
                    }
                  />
                </Route>
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
