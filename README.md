# 🛞 Cute Tire Explorer — 3D Standalone Tire Rolling Simulator

A cute, colorful, and friendly 3D interactive experience built with **Three.js**.

Inspired by claymation toy aesthetics, this simulator features a **single standalone 3D tire** rolling smoothly across the curved surface of a vibrant, friendly spherical Earth.

---

## 🎨 Visual Direction & Design

- **The Main Subject — Standalone Tire:**
  - The tire is a single, independent 3D toy object that rolls on its own.
  - **Zero car, chassis, frame, or vehicle parts.**
  - Chunky, rounded silhouette with tactile clay-like rubber, smooth bevels, and raised 3D tread blocks.
  - Features the signature **cute clay toy face** in the rim center (blue pill eyes with glossy pupils, button nose, and joyful curved clay smile), inspired directly by classic clay toys.
  - Alternative toy rims: 5-Spoke Star, Candy Swirl, Retro Multi-spoke, and Minimal Disc.

- **Cute 3D Earth:**
  - Large spherical planet with warm pastel-blue oceans and raised, pillowy green continents.
  - Cute smiling Earth face on the equator ocean with blushing pink cheeks.
  - Soft, puffy 3D clay clouds drifting in playful orbits.
  - Cheerful studio lighting with soft shadows, subtle rim highlights, and twinkling pastel stars in space.
  - Scattered collectible stars and flowers that pop with particles and joyful chimes when rolled over.

- **Curved Surface Rolling Physics:**
  - Tire rolls along great circles directly on the Earth sphere surface:
    $$\Delta \theta_{roll} = \frac{\Delta s}{r_{tire}}$$
  - Orientation automatically aligns with the local surface normal $\vec{N}$ to prevent slipping or sinking.
  - Tangent steering vector $\vec{F}$ and axle vector $\vec{R}$ re-orthonormalized to eliminate numerical drift.
  - Springy bounce / jump mechanics with toy-like squash & stretch.

---

## 🎮 Controls

### Desktop Keyboard
- **Drive Forward / Backward:** `W` / `S` or `↑` / `↓`
- **Steer Left / Right:** `A` / `D` or `←` / `→`
- **Bounce / Jump:** `Spacebar`
- **Turbo Boost:** Hold `Shift`
- **Cute Squeak / Honk:** `H`
- **Camera View:** `C` (Cycles between **Follow**, **Orbit 360°**, and **Wide Planet**)
- **Reset Position:** `R` or ♻️ button

### Mobile / Touch Devices
- **On-Screen D-Pad:** 4-way direction buttons on the bottom left.
- **Jump Button (🦘):** Spring bounce over obstacles.
- **Turbo Button (⚡):** High-speed sprint with dynamic particle trails.

---

## 🛠️ Real-Time Customization

Click the **🎨 Customize Tire** button to adjust in real time:
1. **Tread Patterns:** Chevron V-Groove, Chunky Cleats, Paddle Tracks, Cute Hearts, Smooth Slick.
2. **Rim Styles:** Cute Smiley Face, 5-Spoke Star, Candy Swirl, Retro Spokes, Minimal Disc.
3. **Dimensions:** Tire Diameter, Tread Width, and Rim Ratio sliders.
4. **Materials & Colors:**
   - Rubber Clay Color (deep charcoal, pastel pink, sky blue, neon green, etc.)
   - Rim Color
   - Face / Accent Color
   - Surface Roughness & Glossiness
   - Decorative Sidewall Rings toggle
5. **Cute Extras:**
   - Face Gyro Steady toggle (face stays upright vs tumbles with wheel rotation)
   - Spring Antenna Topper (Star Spring, Heart Spring)
   - Earth Face toggle (Show/Hide the cute face on the ocean)
6. **Quick Presets:** Clay Buddy, Monster Truck, Bubblegum, Golden Trophy, Tractor Toy, Mint Swirl.

---

## 🚀 Quick Start

### 1. Run Locally with Vite
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### 2. Build for Production / GitHub Pages
```bash
npm run build
```
The optimized static build will be generated in the `dist/` directory, ready to be hosted on any static web server or GitHub Pages.

---

## 🌐 Deploy to GitHub Pages

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/deploy.yml`:

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Cute Standalone Tire 3D Simulator"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. In your GitHub repository settings:
   - Navigate to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` will automatically build and publish the site!

---

## 📦 Tech Stack
- **Three.js** (WebGL 3D graphics, procedural geometry generation, shadow mapping, PBR materials)
- **Vite** (Next-generation frontend tooling and static bundler)
- **Web Audio API** (Zero-asset procedural synth sound effects for rolling hum, chimes, bounce, and clicks)
- **Vanilla Modern CSS & Glassmorphism UI**
