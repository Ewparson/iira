// src/components/NavBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import emblemImg from "../emblem.png"; // round emblem button

/* ---------- Inline PillNav (no separate file) ---------- */
function PillNav({
  logoSrc,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  ease = "power3.easeOut",
  baseColor = "#000",
  pillColor = "#fff",
  hoveredPillTextColor = "#fff",
  pillTextColor,
  onMobileMenuClick,
  initialLoadAnimation = true,
}) {
  const resolvedPillTextColor = pillTextColor ?? baseColor;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const circleRefs = useRef([]);
  const tlRefs = useRef([]);
  const activeTweenRefs = useRef([]);
  const logoImgRef = useRef(null);
  const logoTweenRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const navItemsRef = useRef(null);
  const logoRef = useRef(null);
  const containerRef = useRef(null);

  const updateNavOffset = () => {
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = Math.ceil(r.bottom + 24); // bottom of fixed nav + breathing room
    document.documentElement.style.setProperty("--nav-offset", `${px}px`);
  };

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle) => {
        if (!circle?.parentElement) return;
        const pill = circle.parentElement;
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;

        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector(".pill-label");
        const white = pill.querySelector(".pill-label-hover");
        if (label) gsap.set(label, { y: 0 });
        if (white) gsap.set(white, { y: h + 12, opacity: 0 });

        const index = circleRefs.current.indexOf(circle);
        if (index === -1) return;

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        if (white) {
          gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0);
        }
        tlRefs.current[index] = tl;
      });

      requestAnimationFrame(updateNavOffset);
    };

    layout();
    const onResize = () => {
      layout();
      updateNavOffset();
    };
    window.addEventListener("resize", onResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        layout();
        updateNavOffset();
      }).catch(() => {});
    }

    const menu = mobileMenuRef.current;
    if (menu) gsap.set(menu, { visibility: "hidden", opacity: 0, scaleY: 1 });

    if (initialLoadAnimation) {
      const logoEl = logoRef.current;
      const navItems = navItemsRef.current;
      if (logoEl) {
        gsap.set(logoEl, { scale: 0 });
        gsap.to(logoEl, { scale: 1, duration: 0.6, ease, onComplete: updateNavOffset });
      }
      if (navItems) {
        gsap.set(navItems, { width: 0, overflow: "hidden" });
        gsap.to(navItems, { width: "auto", duration: 0.6, ease, onUpdate: updateNavOffset, onComplete: updateNavOffset });
      }
    } else {
      updateNavOffset();
    }

    return () => window.removeEventListener("resize", onResize);
  }, [items, ease, initialLoadAnimation]);

  const handleEnter = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: "auto" });
  };
  const handleLeave = (i) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: "auto" });
  };
  const handleLogoEnter = () => {
    const img = logoImgRef.current;
    if (!img) return;
    logoTweenRef.current?.kill();
    gsap.set(img, { rotate: 0 });
    logoTweenRef.current = gsap.to(img, { rotate: 360, duration: 0.2, ease, overwrite: "auto" });
  };
  const toggleMobileMenu = () => {
    const open = !isMobileMenuOpen;
    setIsMobileMenuOpen(open);

    const hamburger = hamburgerRef.current;
    const menu = mobileMenuRef.current;

    if (hamburger) {
      const lines = hamburger.querySelectorAll(".hamburger-line");
      if (open) {
        gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease });
      } else {
        gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease });
        gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease });
      }
    }

    if (menu) {
      if (open) {
        gsap.set(menu, { visibility: "visible" });
        gsap.fromTo(
          menu,
          { opacity: 0, y: 10, scaleY: 1 },
          {
            opacity: 1,
            y: 0,
            scaleY: 1,
            duration: 0.3,
            ease,
            transformOrigin: "top center",
            onComplete: updateNavOffset,
          }
        );
      } else {
        gsap.to(menu, {
          opacity: 0,
          y: 10,
          scaleY: 1,
          duration: 0.2,
          ease,
          transformOrigin: "top center",
          onComplete: () => {
            gsap.set(menu, { visibility: "hidden" });
            updateNavOffset();
          },
        });
      }
    }

    onMobileMenuClick?.();
  };

  const cssVars = {
    "--base": baseColor,
    "--pill-bg": pillColor,
    "--hover-text": hoveredPillTextColor,
    "--pill-text": resolvedPillTextColor,
  };

  return (
    <>
      <div className="pill-nav-container" ref={containerRef}>
        <style>{`
          .pill-nav-container {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 99;
          }
          @media (max-width: 768px) { .pill-nav-container { left: 0; transform: none; width: 100%; } }

          /* spacer consumes layout space beneath the fixed nav */
          .pill-nav-spacer { height: var(--nav-offset, 96px); }

          .pill-nav { --nav-h: 42px; --logo: 36px; --pill-pad-x: 18px; --pill-gap: 3px;
            width: max-content; display: flex; align-items: center; box-sizing: border-box; }
          @media (max-width: 768px) { .pill-nav { width: 100%; justify-content: space-between; padding: 0 1rem; } }

          .pill-nav-items { position: relative; display: flex; align-items: center; height: var(--nav-h); background: var(--base, #000); border-radius: 9999px; }

          .pill-logo { width: var(--nav-h); height: var(--nav-h); border-radius: 50%; background: var(--base, #000);
            padding: 8px; display: inline-flex; align-items: center; justify-content: center; overflow: hidden; }
          .pill-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }

          .pill-list { list-style: none; display: flex; align-items: stretch; gap: var(--pill-gap); margin: 0; padding: 3px; height: 100%; }
          .pill-list > li { display: flex; height: 100%; }

          .pill { display: inline-flex; align-items: center; justify-content: center; height: 100%;
            padding: 0 var(--pill-pad-x); background: var(--pill-bg, #fff); color: var(--pill-text, var(--base, #000));
            text-decoration: none; border-radius: 9999px; box-sizing: border-box; font-weight: 600; font-size: 16px; line-height: 0;
            text-transform: uppercase; letter-spacing: .2px; white-space: nowrap; cursor: pointer; position: relative; overflow: hidden; }
          .pill .hover-circle { position: absolute; left: 50%; bottom: 0; border-radius: 50%; background: var(--base, #000);
            z-index: 1; display: block; pointer-events: none; will-change: transform; }
          .pill .label-stack { position: relative; display: inline-block; line-height: 1; z-index: 2; }
          .pill .pill-label { position: relative; z-index: 2; display: inline-block; line-height: 1; will-change: transform; }
          .pill .pill-label-hover { position: absolute; left: 0; top: 0; color: var(--hover-text, #fff); z-index: 3; display: inline-block; will-change: transform, opacity; }

          .pill.is-active::after { content: ''; position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%);
            width: 12px; height: 12px; background: var(--base, #000); border-radius: 50px; z-index: 4; }

          .desktop-only { display: block; } .mobile-only { display: none; }
          @media (max-width: 768px) { .desktop-only { display: none; } .mobile-only { display: block; } }

          .mobile-menu-button { width: var(--nav-h); height: var(--nav-h); border-radius: 50%; background: var(--base, #000); border: none; display: none;
            flex-direction: column; align-items: center; justify-content: center; gap: 4px; cursor: pointer; padding: 0; position: relative; }
          @media (max-width: 768px) { .mobile-menu-button { display: flex; } }

          .hamburger-line { width: 16px; height: 2px; background: var(--pill-bg, #fff); border-radius: 1px; transition: all .01s ease; transform-origin: center; }

          .mobile-menu-popover { position: absolute; top: 3em; left: 1rem; right: 1rem; background: var(--base, #f0f0f0);
            border-radius: 27px; box-shadow: 0 8px 32px rgba(0,0,0,.12); z-index: 998; opacity: 0; transform-origin: top center; visibility: hidden; }
          .mobile-menu-list { list-style: none; margin: 0; padding: 3px; display: flex; flex-direction: column; gap: 3px; }
          .mobile-menu-popover .mobile-menu-link { display: block; padding: 12px 16px; color: var(--pill-text, #fff); background-color: var(--pill-bg, #fff);
            text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 50px; transition: all .2s ease; }
          .mobile-menu-popover .mobile-menu-link:hover { cursor: pointer; background-color: var(--base); color: var(--hover-text, #fff); }
        `}</style>

        <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
          {/* Round emblem button (links to first item href if present) */}
          {items?.[0]?.href && !items[0].href.startsWith("http") ? (
            <Link
              className="pill-logo"
              to={items[0].href}
              aria-label="Home"
              onMouseEnter={handleLogoEnter}
              role="menuitem"
              ref={(el) => { logoRef.current = el; }}
            >
              <img src={logoSrc} alt={logoAlt} ref={logoImgRef} />
            </Link>
          ) : (
            <a
              className="pill-logo"
              href={items?.[0]?.href || "#"}
              aria-label="Home"
              onMouseEnter={handleLogoEnter}
              ref={(el) => { logoRef.current = el; }}
            >
              <img src={logoSrc} alt={logoAlt} ref={logoImgRef} />
            </a>
          )}

          <div className="pill-nav-items desktop-only" ref={navItemsRef}>
            <ul className="pill-list" role="menubar">
              {items.map((item, i) => {
                const isRouter = item.href && !/^https?:|^\/\/|^mailto:|^tel:|^#/.test(item.href);
                const active = activeHref === item.href;
                const cls = `pill${active ? " is-active" : ""}`;
                const isImagePill = !!item.image;

                return (
                  <li key={item.href || `item-${i}`} role="none">
                    {isRouter ? (
                      <Link
                        role="menuitem"
                        to={item.href}
                        className={cls}
                        aria-label={item.ariaLabel || item.label || item.alt || "nav"}
                        onMouseEnter={!isImagePill ? () => handleEnter(i) : undefined}
                        onMouseLeave={!isImagePill ? () => handleLeave(i) : undefined}
                      >
                        {!isImagePill ? (
                          <>
                            <span
                              className="hover-circle"
                              aria-hidden="true"
                              ref={(el) => { circleRefs.current[i] = el; }}
                            />
                            <span className="label-stack">
                              <span className="pill-label">{item.label}</span>
                              <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
                            </span>
                          </>
                        ) : (
                          <img src={item.image} alt={item.alt || "nav"} className="h-[22px] w-auto block" />
                        )}
                      </Link>
                    ) : (
                      <a
                        role="menuitem"
                        href={item.href}
                        className={cls}
                        aria-label={item.ariaLabel || item.label || item.alt || "nav"}
                        onMouseEnter={!isImagePill ? () => handleEnter(i) : undefined}
                        onMouseLeave={!isImagePill ? () => handleLeave(i) : undefined}
                      >
                        {!isImagePill ? (
                          <>
                            <span
                              className="hover-circle"
                              aria-hidden="true"
                              ref={(el) => { circleRefs.current[i] = el; }}
                            />
                            <span className="label-stack">
                              <span className="pill-label">{item.label}</span>
                              <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
                            </span>
                          </>
                        ) : (
                          <img src={item.image} alt={item.alt || "nav"} className="h-[22px] w-auto block" />
                        )}
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            className="mobile-menu-button mobile-only"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
            ref={hamburgerRef}
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </nav>

        <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
          <ul className="mobile-menu-list">
            {items.map((item, i) => {
              const isRouter = item.href && !/^https?:|^\/\/|^mailto:|^tel:|^#/.test(item.href);
              const active = activeHref === item.href;
              const cls = `mobile-menu-link${active ? " is-active" : ""}`;
              return (
                <li key={item.href || `mobile-item-${i}`}>
                  {isRouter ? (
                    <Link to={item.href} className={cls} onClick={() => { setIsMobileMenuOpen(false); updateNavOffset(); }}>
                      {item.image ? <img src={item.image} alt={item.alt || "nav"} className="h-[22px] w-auto" /> : item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className={cls} onClick={() => { setIsMobileMenuOpen(false); updateNavOffset(); }}>
                      {item.image ? <img src={item.image} alt={item.alt || "nav"} className="h-[22px] w-auto" /> : item.label}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Non-fixed spacer pushes the page content below the nav */}
      <div className="pill-nav-spacer" aria-hidden="true" />
    </>
  );
}

/* ---------- Exported NavBar that uses PillNav ---------- */
export default function NavBar() {
  const { pathname } = useLocation();

  const items = [
    { label: "IIRA", href: "/" },
    { label: "IntellaCoin", href: "/IntellaCoin" },
    { label: "Legal",       href: "/legal" },
    { label: "Developers",  href: "/developers" },
    { label: "Company",     href: "/company" },
    { label: "Sign In",     href: "/signin" },
    { label: "Sign Up",     href: "/signup" },
  ];

  return (
    <PillNav
      logoSrc={emblemImg}
      logoAlt="Emblem"
      items={items}
      activeHref={pathname}
      ease="power2.easeOut"
      baseColor="#000000"
      pillColor="#ffffff"
      hoveredPillTextColor="#ffffff"
      pillTextColor="#000000"
    />
  );
}
