This design system, titled **Clinq Axiom v1.0**, is engineered to provide a high-agency, cinematic environment for the world’s most elite freelancers. It moves away from the "busy SaaS" aesthetic and toward a "focused intelligence" environment.

---

## 1. Brand Identity & Logo Direction
The logo should embody "Connectivity" and "Precision."
*   **The Symbol:** A "C" formed by two interlocking, tapered glass arcs. It represents the meeting of the freelancer and the client, bridged by AI.
*   **The Logotype:** Set in a custom-kerned, wide-track geometric sans.
*   **Visual Treatment:** The logo is not a flat color; it is a **glass object**. It should have a subtle 15° internal refraction and a faint "Electric Cyan" glow from the center.

---

## 2. Color Palette & Lighting
Clinq uses a **Deep-Space Monochromatic** base with **High-Spectrum** accents.

### Core Surface Colors
| Layer | Hex Code | Usage |
| :--- | :--- | :--- |
| **Foundation** | `#070B14` | The void. Absolute background. |
| **Canvas** | `#0B1020` | Primary application background. |
| **Glass Base** | `RGBA(255, 255, 255, 0.03)` | Frosted card backgrounds. |
| **Elevated Glass**| `RGBA(255, 255, 255, 0.08)` | Modals and popovers. |

### Semantic Accents
*   **AI Pulse (Primary):** `#00F2FE` (Electric Cyan) — Used for intelligence scores and active AI states.
*   **Focus (Secondary):** `#6C5DD3` (Neon Indigo) — Used for primary actions and focused pipelines.
*   **Energy:** `#A155B9` (Soft Violet) — Used for earnings and growth metrics.

---

## 3. Typography System
Clean, readable, and authoritative.
*   **Primary Font:** *Geist Sans* (or *Inter* as a fallback).
*   **Weights:** 300 (Light) for body, 500 (Medium) for UI labels, 200 (Extra Light) for large headings.
*   **Tracking:** `-0.02em` for headings; `+0.05em` for small uppercase labels to give a "technical" feel.

---

## 4. The Glassmorphism Rules
To avoid the "cheap" look, Clinq uses **Layered Refraction**.
*   **Background Blur:** `30px` to `50px`.
*   **Backdrop Filter:** `saturate(180%) blur(40px)`.
*   **Opacity:** Never exceed 10% opacity for glass cards to maintain the "cinematic" dark aesthetic.
*   **Masking:** Use a subtle grain texture (2% opacity) on top of glass panels to simulate physical frosted material.

---

## 5. Border Styles & Lighting
Borders are not lines; they are **Reflections of Light**.
*   **Default Border:** `1px solid RGBA(255, 255, 255, 0.05)`.
*   **The "Active Edge":** A linear gradient border: `Transparent -> Electric Cyan (30%) -> Transparent`. This creates a localized "shimmer" effect that moves as you hover.
*   **Corner Radius:** `12px` for cards, `8px` for buttons, `100px` for pills.

---

## 6. Component System

### Button System
*   **Primary:** A "Solid Glass" button. Deep indigo background with a 1px cyan top-edge highlight.
*   **Ghost:** No background, just the 1px light-refractive border.
*   **Interaction:** On hover, the button’s internal glow increases by 15%, and the shadow expands.

### Card System
*   **Anatomy:** No visible headers or footers. Content is separated by "Light Gutters" (empty space with a faint glow).
*   **Elevation:** Use **Colored Shadows** instead of black. A card hovering over the canvas casts a soft `#00F2FE` (Cyan) shadow with a 40px spread at 5% opacity.

---

## 7. Iconography & Motion Philosophy

### Icon Style
*   **Linear-Technical:** 1.5pt stroke icons.
*   **Feature:** "Broken" paths (paths that don't fully connect) to give an architectural, futuristic blueprint feel.
*   **Active State:** Icons glow and slightly increase in stroke weight when active.

### Motion Language (The "Vercel" Influence)
Motion in Clinq is **snappy but fluid**.
*   **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (The Standard Ease).
*   **Staggering:** List items never appear all at once; they "stream" in with a 20ms delay between items.
*   **The AI Pulse:** Whenever the AI is thinking, a soft "light wave" travels across the borders of the relevant cards.

---

## 8. Spacing & Grid System
*   **Base Unit:** `4px`.
*   **Standard Padding:** `24px` for cards, `12px` for compact modules.
*   **The "Breathing" Principle:** Maintain high negative space. The UI should never feel cramped. If a dashboard is full, use "Semantic Hiding" (blurring out non-essential info until hover).

---

## 9. Futuristic AI Aesthetic: The "Clinq Orb"
Every screen features the **Clinq Orb**—a generative, 3D animated sphere of light in the corner.
*   **Function:** It serves as the global AI status indicator. 
*   **Visualization:** It’s a mesh of floating particles that reacts to user activity. When you type a proposal, the particles accelerate. When you win a bid, it pulses violet and cyan.

---

## 10. Dashboard Layout Structure
The dashboard follows the **"Command Center"** layout inspired by Arc Browser.
*   **Left Rail:** A vertical, slim navigation bar with iconic representations.
*   **Global Search:** A persistent, command-K style bar at the top, but designed as a floating glass pill.
*   **Utility Panels:** Collapsible panels on the right for "Lead Intelligence" and "AI Insights."

---

## 11. Dark Mode System
Clinq is **Dark-First**. 
*   **Contrast:** High contrast between text (`#F4F7FA`) and background (`#070B14`).
*   **Depth:** Depth is achieved through blur and lighting, not by using lighter shades of gray. This keeps the interface feeling "infinite" and "void-like," similar to a high-end IDE.