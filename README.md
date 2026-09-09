# TakaGO (Local Mirror)

A full local copy of **[TakaGO](https://csany.vercel.app)** — Counter-Strike Practice Lab with CS2-informed mechanics, Dust II single-player bot arena, spray training, recoil patterns, procedural knife generation, and 3D weapon inspects.

## Quick Start

### Start Server
```bash
npm start
```
or
```bash
node server.js
```

Then open your browser at:
**[http://localhost:3000](http://localhost:3000)**

## Features Preserved

- **3D Dust II Map**: Full world model (`dust2-world.glb`), triangle physics mesh (`dust2-triangles.f32.gz`), navmesh (`dust2-nav.json`), and spawn points (`dust2-spawns.json`).
- **Complete Weapon Arsenal**: 3D models for AK-47, M4A4, M4A1-S, AWP, USP-S, Glock-18, Desert Eagle, Galil AR, and procedural knives (Butterfly & Karambit).
- **Bot Arena & Rigs**: Animated training bot rig, skeletal animations, blend spaces, and clips.
- **Full Audio Suite**: 276 sound files (firing, reloads, knife draw/slashes, footsteps, hits, headshots, and voice confirmations).
- **Offline & Local**: Completely self-contained with no external dependencies required at runtime.
