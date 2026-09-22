// ============================================
// CITYNEXUS — Isometric City Renderer
// Core canvas engine for the living city
// ============================================

export interface CityState {
  smartTraffic: boolean;
  smartEnergy: boolean;
  smartWater: boolean;
  smartWaste: boolean;
  smartSafety: boolean;
  smartEnvironment: boolean;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
}

interface Vehicle {
  x: number;
  y: number;
  speed: number;
  type: 'car' | 'bus' | 'ambulance' | 'drone' | 'waste';
  color: string;
  progress: number;
  roadH: boolean; // true = horizontal road, false = vertical
  roadIdx: number; // which road (0,3,6,9...)
  direction: 1 | -1;
  waiting: boolean;
  waitTime: number;
}

interface Building {
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
  color: string;
  topColor: string;
  rightColor: string;
  glow: number;
  glowTarget: number;
  type: 'residential' | 'commercial' | 'hospital' | 'government' | 'solar';
  energyFlow: number;
  hasSolar: boolean;
  occupancy: number;
  windowSeed: number;
}

interface TrafficLight {
  x: number;
  y: number;
  state: 'red' | 'green' | 'yellow';
  timer: number;
  cycleOffset: number;
}

interface WasteBin {
  x: number;
  y: number;
  fill: number;
  fillRate: number;
  id: number;
  collecting: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

interface Tree {
  x: number;
  y: number;
  size: number;
  phase: number;
  health: number;
}

interface DataLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  speed: number;
}

interface Person {
  x: number;
  y: number;
  progress: number;
  roadH: boolean;
  roadIdx: number;
  direction: 1 | -1;
  speed: number;
}

interface StreetLight {
  x: number;
  y: number;
  on: boolean;
  brightness: number;
}

export type ActiveSystem = 'overview' | 'mobility' | 'energy' | 'water' | 'environment' | 'safety' | 'waste' | 'health' | 'buildings' | 'people';

// Color constants  
const BG = '#060a14';
const ROAD_COLOR = '#0e131f';
const ROAD_ACTIVE = '#111827';
const MARK_DIM = 'rgba(0, 229, 255, 0.08)';
const MARK_BRIGHT = 'rgba(0, 229, 255, 0.25)';
const CYAN = '#00e5ff';
const EMERALD = '#00e676';
const AMBER = '#ffab00';
const RED = '#ff1744';
const SOLAR_Y = '#ffd600';
const WATER_BLUE = '#0091ea';

const BUILDING_PALETTES: Record<string, string[]> = {
  residential: ['#151b2e', '#181f32', '#1c2438'],
  commercial: ['#161d35', '#1a233c', '#1e2842'],
  hospital: ['#141f2c', '#182634', '#1c2c3c'],
  government: ['#191e38', '#1d2440', '#212a48'],
  solar: ['#15202e', '#182636', '#1c2c3e'],
};

const CAR_COLORS = ['#1a237e', '#283593', '#0d47a1', '#01579b', '#004d40', '#1b5e20', '#4a148c', '#b71c1c', '#bf360c', '#1565c0', '#2e7d32', '#6a1b9a'];

function hexToRGB(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

function adjustBrightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRGB(hex);
  return `rgb(${Math.min(255, r * factor | 0)},${Math.min(255, g * factor | 0)},${Math.min(255, b * factor | 0)})`;
}

function lerpColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRGB(a);
  const [r2, g2, b2] = hexToRGB(b);
  return `rgb(${r1 + (r2 - r1) * t | 0},${g1 + (g2 - g1) * t | 0},${b1 + (b2 - b1) * t | 0})`;
}

export class CityRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animationId = 0;
  private time = 0;
  private camera: CameraState;
  private buildings: Building[] = [];
  private vehicles: Vehicle[] = [];
  private trafficLights: TrafficLight[] = [];
  private wasteBins: WasteBin[] = [];
  private particles: Particle[] = [];
  private trees: Tree[] = [];
  private dataLines: DataLine[] = [];
  private persons: Person[] = [];
  private streetLights: StreetLight[] = [];
  private cityState: CityState;
  private activeSystem: ActiveSystem = 'overview';
  private emergencyActive = false;
  private waterAnomaly = false;

  private readonly TW = 36; // tile pixel width half
  private readonly TH = 18; // tile pixel height half
  private readonly GS = 26;  // grid size (tiles)
  private readonly ROAD_INTERVAL = 4; // road every N tiles

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.camera = { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1 };
    this.cityState = {
      smartTraffic: true, smartEnergy: true, smartWater: true,
      smartWaste: true, smartSafety: true, smartEnvironment: true,
    };
    this.buildCity();
  }

  // ===== Isometric conversion =====
  private iso(gx: number, gy: number): [number, number] {
    return [(gx - gy) * this.TW, (gx + gy) * this.TH];
  }

  // ===== City generation =====
  private buildCity() {
    this.buildings = [];
    this.vehicles = [];
    this.trafficLights = [];
    this.wasteBins = [];
    this.trees = [];
    this.dataLines = [];
    this.persons = [];
    this.streetLights = [];

    const GS = this.GS;
    const RI = this.ROAD_INTERVAL;

    // Generate buildings in blocks between roads
    for (let bx = 0; bx < GS; bx++) {
      for (let by = 0; by < GS; by++) {
        // Skip road tiles
        if (bx % RI === 0 || by % RI === 0) continue;

        // Determine zone
        const zoneX = Math.floor(bx / RI);
        const zoneY = Math.floor(by / RI);
        const zoneKey = zoneX * 10 + zoneY;
        
        let bType: Building['type'];
        if (zoneKey % 7 === 0) bType = 'hospital';
        else if (zoneKey % 5 === 0) bType = 'government';
        else if (zoneKey % 3 === 0) bType = 'solar';
        else if (zoneKey % 2 === 0) bType = 'commercial';
        else bType = 'residential';

        // Density check
        if (Math.random() > 0.62) {
          // Plant trees in empty lots
          if (Math.random() > 0.4) {
            this.trees.push({
              x: bx + 0.5, y: by + 0.5,
              size: 3 + Math.random() * 5,
              phase: Math.random() * Math.PI * 2,
              health: 0.7 + Math.random() * 0.3,
            });
          }
          continue;
        }

        const palette = BUILDING_PALETTES[bType];
        const baseColor = palette[Math.floor(Math.random() * palette.length)];
        const height = bType === 'commercial' ? 45 + Math.random() * 90 :
                       bType === 'government' ? 55 + Math.random() * 70 :
                       bType === 'hospital' ? 35 + Math.random() * 45 :
                       bType === 'solar' ? 15 + Math.random() * 25 :
                       20 + Math.random() * 65;

        this.buildings.push({
          x: bx, y: by,
          w: 0.75 + Math.random() * 0.2,
          h: height,
          d: 0.75 + Math.random() * 0.2,
          color: baseColor,
          topColor: adjustBrightness(baseColor, 1.25),
          rightColor: adjustBrightness(baseColor, 0.7),
          glow: 0, glowTarget: 0,
          type: bType,
          energyFlow: Math.random(),
          hasSolar: bType === 'solar' || Math.random() > 0.65,
          occupancy: 0.3 + Math.random() * 0.7,
          windowSeed: Math.random() * 1000 | 0,
        });
      }
    }

    // Vehicles on roads
    for (let r = 0; r < GS; r += RI) {
      for (let i = 0; i < 5; i++) {
        // Horizontal
        this.vehicles.push(this.makeVehicle(true, r, 1));
        this.vehicles.push(this.makeVehicle(true, r, -1));
        // Vertical
        this.vehicles.push(this.makeVehicle(false, r, 1));
        this.vehicles.push(this.makeVehicle(false, r, -1));
      }
    }

    // Add special vehicles
    for (let i = 0; i < 3; i++) {
      const r = (i * this.ROAD_INTERVAL * 2) % this.GS;
      const v = this.makeVehicle(i % 2 === 0, r, 1);
      v.type = 'bus';
      v.color = AMBER;
      v.speed = 0.25;
      this.vehicles.push(v);
    }

    // Drones
    for (let i = 0; i < 4; i++) {
      const v = this.makeVehicle(true, 0, 1);
      v.type = 'drone';
      v.speed = 0.4;
      v.color = '#7c4dff';
      this.vehicles.push(v);
    }

    // Pedestrians
    for (let r = 0; r < GS; r += RI) {
      for (let i = 0; i < 3; i++) {
        this.persons.push({
          x: 0, y: 0,
          progress: Math.random(),
          roadH: Math.random() > 0.5,
          roadIdx: r,
          direction: Math.random() > 0.5 ? 1 : -1,
          speed: 0.08 + Math.random() * 0.06,
        });
      }
    }

    // Traffic lights at intersections
    for (let rx = 0; rx < GS; rx += RI) {
      for (let ry = 0; ry < GS; ry += RI) {
        this.trafficLights.push({
          x: rx, y: ry,
          state: Math.random() > 0.5 ? 'green' : 'red',
          timer: Math.random() * 150 | 0,
          cycleOffset: (rx + ry) * 7,
        });
      }
    }

    // Waste bins
    let binId = 1;
    for (let rx = 2; rx < GS; rx += RI * 2) {
      for (let ry = 2; ry < GS; ry += RI * 2) {
        this.wasteBins.push({
          x: rx + 0.3, y: ry + 0.3,
          fill: 0.1 + Math.random() * 0.5,
          fillRate: 0.0001 + Math.random() * 0.0002,
          id: binId++,
          collecting: false,
        });
      }
    }

    // Street lights along roads
    for (let r = 0; r < GS; r += RI) {
      for (let i = 1; i < GS; i += 2) {
        this.streetLights.push({ x: r + 0.2, y: i, on: true, brightness: 0.8 + Math.random() * 0.2 });
        this.streetLights.push({ x: i, y: r + 0.2, on: true, brightness: 0.8 + Math.random() * 0.2 });
      }
    }

    // Data connection lines
    for (let i = 0; i < 30; i++) {
      const a = this.buildings[Math.floor(Math.random() * this.buildings.length)];
      const b = this.buildings[Math.floor(Math.random() * this.buildings.length)];
      if (a && b && a !== b) {
        this.dataLines.push({
          x1: a.x + a.w / 2, y1: a.y + a.d / 2,
          x2: b.x + b.w / 2, y2: b.y + b.d / 2,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.008,
        });
      }
    }
  }

  private makeVehicle(isH: boolean, roadIdx: number, dir: 1 | -1): Vehicle {
    return {
      x: 0, y: 0,
      speed: 0.2 + Math.random() * 0.35,
      type: 'car',
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      progress: Math.random(),
      roadH: isH,
      roadIdx: roadIdx,
      direction: dir,
      waiting: false,
      waitTime: 0,
    };
  }

  // ===== Public API =====
  public resize() {
    this.dpr = Math.min(window.devicePixelRatio, 2);
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const [cx, cy] = this.iso(this.GS / 2, this.GS / 2);
    this.camera.targetX = this.width / 2 - cx;
    this.camera.targetY = this.height / 2 - cy + 40;
    if (this.time < 5) {
      this.camera.x = this.camera.targetX;
      this.camera.y = this.camera.targetY;
    }
  }

  public setCityState(s: Partial<CityState>) { Object.assign(this.cityState, s); }
  
  public setActiveSystem(sys: ActiveSystem) {
    this.activeSystem = sys;
    this.moveCamera(sys);
  }

  public setEmergency(on: boolean) {
    this.emergencyActive = on;
    if (on && !this.vehicles.some(v => v.type === 'ambulance')) {
      const v = this.makeVehicle(true, 0, 1);
      v.type = 'ambulance';
      v.color = RED;
      v.speed = 0.9;
      this.vehicles.push(v);
    }
  }

  public setWaterAnomaly(on: boolean) { this.waterAnomaly = on; }
  public handleMouseMove(_x: number, _y: number) { /* reserved */ }

  private moveCamera(sys: ActiveSystem) {
    const C = this.GS / 2;
    const targets: Record<string, [number, number, number]> = {
      overview:    [C,  C,  1],
      mobility:    [C,  C,  1.3],
      energy:      [this.GS * 0.7, this.GS * 0.25, 1.5],
      water:       [C,  C,  1.15],
      environment: [this.GS * 0.25, this.GS * 0.25, 1.4],
      safety:      [C,  C,  1.2],
      waste:       [this.GS * 0.3, this.GS * 0.6, 1.4],
      health:      [this.GS * 0.6, this.GS * 0.8, 1.5],
      buildings:   [this.GS * 0.3, this.GS * 0.3, 2],
      people:      [C,  C,  1.1],
    };
    const [gx, gy, z] = targets[sys] ?? targets.overview;
    const [px, py] = this.iso(gx, gy);
    this.camera.targetX = this.width / 2 - px * z;
    this.camera.targetY = this.height / 2 - py * z + 40;
    this.camera.targetZoom = z;
  }

  // ===== Lifecycle =====
  public start() {
    this.resize();
    this.loop();
  }

  public stop() { cancelAnimationFrame(this.animationId); }

  private loop = () => {
    this.time++;
    this.tick();
    this.draw();
    this.animationId = requestAnimationFrame(this.loop);
  };

  // ===== Update =====
  private tick() {
    const dt = 1;
    const lerp = 0.045;
    this.camera.x += (this.camera.targetX - this.camera.x) * lerp;
    this.camera.y += (this.camera.targetY - this.camera.y) * lerp;
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * lerp;

    this.tickTrafficLights(dt);
    this.tickVehicles(dt);
    this.tickPersons(dt);
    this.tickBuildings();
    this.tickWaste();
    this.tickTrees();
    this.tickDataLines();
    this.tickParticles();
    if (this.time % 2 === 0) this.spawnParticles();
  }

  private tickTrafficLights(_dt: number) {
    for (const tl of this.trafficLights) {
      tl.timer++;
      const cycle = this.cityState.smartTraffic ? 80 : 160;
      const greenPhase = cycle * 0.55;
      const yellowPhase = cycle * 0.1;
      const phase = (tl.timer + tl.cycleOffset) % cycle;
      tl.state = phase < greenPhase ? 'green' : phase < greenPhase + yellowPhase ? 'yellow' : 'red';

      // Priority override for ambulance
      if (this.emergencyActive && this.cityState.smartTraffic) {
        for (const v of this.vehicles) {
          if (v.type === 'ambulance') {
            const [ax, ay] = this.vehiclePos(v);
            const [tx, ty] = this.iso(tl.x, tl.y);
            if (Math.abs(ax - tx) < 80 && Math.abs(ay - ty) < 40) {
              tl.state = 'green';
            }
          }
        }
      }
    }
  }

  private vehiclePos(v: Vehicle): [number, number] {
    const GS = this.GS;
    const t = v.progress;
    let gx: number, gy: number;
    if (v.roadH) {
      gx = v.direction > 0 ? t * GS : (1 - t) * GS;
      gy = v.roadIdx + (v.direction > 0 ? 0.15 : -0.15);
    } else {
      gx = v.roadIdx + (v.direction > 0 ? 0.15 : -0.15);
      gy = v.direction > 0 ? t * GS : (1 - t) * GS;
    }
    return this.iso(gx, gy);
  }

  private tickVehicles(_dt: number) {
    for (const v of this.vehicles) {
      if (v.waiting) {
        v.waitTime++;
        const max = this.cityState.smartTraffic ? 30 : v.type === 'bus' ? 80 : 100;
        if (v.waitTime > max || v.type === 'ambulance') {
          v.waiting = false;
          v.waitTime = 0;
        }
        continue;
      }

      let spd = v.speed;
      if (v.type === 'ambulance') spd *= 1.8;
      else if (!this.cityState.smartTraffic) spd *= 0.5;
      else spd *= 1.15;

      v.progress += spd * 0.003;
      if (v.progress >= 1) {
        v.progress -= 1;
        // Randomly pick a new road
        if (Math.random() > 0.5) {
          v.roadH = !v.roadH;
          v.roadIdx = (Math.floor(Math.random() * (this.GS / this.ROAD_INTERVAL)) * this.ROAD_INTERVAL);
        }
        v.direction = Math.random() > 0.5 ? 1 : -1;
      }

      // Traffic light check
      for (const tl of this.trafficLights) {
        if (tl.state !== 'red') continue;
        const [vx, vy] = this.vehiclePos(v);
        const [tx, ty] = this.iso(tl.x, tl.y);
        if (Math.abs(vx - tx) < 15 && Math.abs(vy - ty) < 8) {
          if (v.type !== 'ambulance') {
            v.waiting = true;
            v.waitTime = 0;
          }
        }
      }
    }
  }

  private tickPersons(_dt: number) {
    for (const p of this.persons) {
      p.progress += p.speed * 0.003;
      if (p.progress >= 1) {
        p.progress -= 1;
        if (Math.random() > 0.6) {
          p.roadH = !p.roadH;
          p.roadIdx = (Math.floor(Math.random() * (this.GS / this.ROAD_INTERVAL)) * this.ROAD_INTERVAL);
        }
        p.direction = Math.random() > 0.5 ? 1 : -1;
      }
    }
  }

  private tickBuildings() {
    const isEnergy = this.activeSystem === 'energy';
    const isWater = this.activeSystem === 'water';
    for (const b of this.buildings) {
      if (isEnergy) b.glowTarget = this.cityState.smartEnergy ? 0.35 : 0.8;
      else if (isWater) b.glowTarget = 0.1;
      else b.glowTarget = 0.08 + Math.sin(this.time * 0.008 + b.x * 1.3) * 0.04;
      b.glow += (b.glowTarget - b.glow) * 0.06;
      b.energyFlow = this.cityState.smartEnergy ? 0.3 + Math.sin(this.time * 0.015 + b.x) * 0.15 : 0.75;
    }
  }

  private tickWaste() {
    for (const bin of this.wasteBins) {
      if (!bin.collecting) {
        bin.fill = Math.min(1, bin.fill + bin.fillRate);
        if (this.cityState.smartWaste && bin.fill > 0.82) {
          bin.collecting = true;
          setTimeout(() => { bin.fill = 0.08; bin.collecting = false; }, 2500 + Math.random() * 2000);
        }
      }
    }
  }

  private tickTrees() {
    for (const t of this.trees) {
      t.phase += 0.018;
      t.health = this.cityState.smartEnvironment ?
        Math.min(1, t.health + 0.0008) :
        Math.max(0.3, t.health - 0.0008);
    }
  }

  private tickDataLines() {
    for (const dl of this.dataLines) {
      dl.progress = (dl.progress + dl.speed) % 1;
    }
  }

  private tickParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      p.alpha = Math.min(1, (p.life / p.maxLife) * 2) * 0.6;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private spawnParticles() {
    if (this.particles.length > 250) return;
    const sys = this.activeSystem;

    // Energy particles from solar
    if (sys === 'energy' || sys === 'overview') {
      for (const b of this.buildings) {
        if (!b.hasSolar || Math.random() > 0.06) continue;
        const [px, py] = this.iso(b.x + b.w / 2, b.y + b.d / 2);
        this.particles.push({
          x: px, y: py - b.h - 5,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.4 - Math.random() * 0.6,
          life: 50 + Math.random() * 40 | 0,
          maxLife: 90, size: 1.2 + Math.random(),
          color: SOLAR_Y, alpha: 0.6,
        });
      }
    }

    // Water particles
    if (sys === 'water') {
      for (let i = 0; i < 4; i++) {
        const gx = Math.random() * this.GS;
        const gy = Math.random() * this.GS;
        const [px, py] = this.iso(gx, gy);
        this.particles.push({
          x: px, y: py + 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: Math.random() * 0.2 + 0.1,
          life: 70 + Math.random() * 40 | 0,
          maxLife: 110, size: 1.5 + Math.random(),
          color: WATER_BLUE, alpha: 0.5,
        });
      }
    }

    // Environment particles (clean air)
    if (sys === 'environment') {
      for (const t of this.trees) {
        if (Math.random() > 0.04) continue;
        const [px, py] = this.iso(t.x, t.y);
        this.particles.push({
          x: px, y: py - t.size * 1.5,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.15 - Math.random() * 0.25,
          life: 60 + Math.random() * 30 | 0,
          maxLife: 90, size: 1 + Math.random() * 0.8,
          color: this.cityState.smartEnvironment ? EMERALD : '#555',
          alpha: 0.5,
        });
      }
    }

    // Data particles connecting buildings
    if (sys === 'overview' || sys === 'safety') {
      if (Math.random() > 0.85) {
        const b = this.buildings[Math.random() * this.buildings.length | 0];
        if (b) {
          const [px, py] = this.iso(b.x + b.w / 2, b.y + b.d / 2);
          this.particles.push({
            x: px, y: py - b.h / 2,
            vx: (Math.random() - 0.5) * 1,
            vy: -0.3 - Math.random() * 0.5,
            life: 40 + Math.random() * 30 | 0,
            maxLife: 70, size: 1,
            color: CYAN, alpha: 0.4,
          });
        }
      }
    }
  }

  // ===== Drawing =====
  private draw() {
    const c = this.ctx;
    const W = this.width;
    const H = this.height;

    c.fillStyle = BG;
    c.fillRect(0, 0, W, H);

    // Background grid
    this.drawBgGrid(c, W, H);

    c.save();
    c.translate(this.camera.x, this.camera.y);
    c.scale(this.camera.zoom, this.camera.zoom);

    this.drawGround(c);
    this.drawRoads(c);

    if (this.activeSystem === 'water') this.drawWaterPipes(c);

    this.drawStreetLights(c);
    this.drawTrees(c);

    // Depth-sorted buildings
    const sorted = [...this.buildings].sort((a, b) => (a.x + a.y) - (b.x + b.y));
    for (const b of sorted) this.drawBuilding(c, b);

    this.drawTrafficLights(c);
    this.drawPersons(c);
    this.drawVehicles(c);

    if (this.activeSystem === 'waste') this.drawWasteBins(c);
    if (this.activeSystem === 'overview' || this.activeSystem === 'safety') this.drawDataLines(c);
    if (this.emergencyActive) this.drawEmergency(c);
    if (this.waterAnomaly && this.activeSystem === 'water') this.drawWaterAnomaly(c);

    this.drawParticles(c);

    c.restore();

    this.drawVignette(c, W, H);
    if (this.activeSystem !== 'overview') this.drawScanline(c, W, H);
  }

  private drawBgGrid(c: CanvasRenderingContext2D, W: number, H: number) {
    c.strokeStyle = 'rgba(0,229,255,0.012)';
    c.lineWidth = 0.5;
    const g = 80;
    for (let x = 0; x < W; x += g) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let y = 0; y < H; y += g) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  }

  private drawGround(c: CanvasRenderingContext2D) {
    const pts = [this.iso(0, 0), this.iso(this.GS, 0), this.iso(this.GS, this.GS), this.iso(0, this.GS)];
    c.fillStyle = '#070b15';
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    c.fill();

    // Subtle grid on ground
    c.strokeStyle = 'rgba(0,229,255,0.02)';
    c.lineWidth = 0.5;
    for (let i = 0; i <= this.GS; i++) {
      const [sx, sy] = this.iso(i, 0);
      const [ex, ey] = this.iso(i, this.GS);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(ex, ey); c.stroke();
      const [sx2, sy2] = this.iso(0, i);
      const [ex2, ey2] = this.iso(this.GS, i);
      c.beginPath(); c.moveTo(sx2, sy2); c.lineTo(ex2, ey2); c.stroke();
    }
  }

  private drawRoads(c: CanvasRenderingContext2D) {
    const GS = this.GS;
    const RI = this.ROAD_INTERVAL;
    const isMobility = this.activeSystem === 'mobility';
    const roadFill = isMobility ? ROAD_ACTIVE : ROAD_COLOR;
    const markColor = isMobility ? MARK_BRIGHT : MARK_DIM;

    for (let r = 0; r < GS; r += RI) {
      // Draw road strips
      for (let s = 0; s < GS; s++) {
        // Horizontal road tiles
        const hw = 0.45;
        const a = this.iso(s, r - hw);
        const b = this.iso(s + 1, r - hw);
        const cc2 = this.iso(s + 1, r + hw);
        const d = this.iso(s, r + hw);
        c.fillStyle = roadFill;
        c.beginPath();
        c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        c.lineTo(cc2[0], cc2[1]); c.lineTo(d[0], d[1]);
        c.closePath(); c.fill();

        // Vertical road tiles
        const a2 = this.iso(r - hw, s);
        const b2 = this.iso(r + hw, s);
        const c2 = this.iso(r + hw, s + 1);
        const d2 = this.iso(r - hw, s + 1);
        c.beginPath();
        c.moveTo(a2[0], a2[1]); c.lineTo(b2[0], b2[1]);
        c.lineTo(c2[0], c2[1]); c.lineTo(d2[0], d2[1]);
        c.closePath(); c.fill();
      }

      // Center line markings
      c.strokeStyle = markColor;
      c.lineWidth = 0.5;
      c.setLineDash([6, 10]);
      // Horizontal center line
      const [hsx, hsy] = this.iso(0, r);
      const [hex, hey] = this.iso(GS, r);
      c.beginPath(); c.moveTo(hsx, hsy); c.lineTo(hex, hey); c.stroke();
      // Vertical center line
      const [vsx, vsy] = this.iso(r, 0);
      const [vex, vey] = this.iso(r, GS);
      c.beginPath(); c.moveTo(vsx, vsy); c.lineTo(vex, vey); c.stroke();
      c.setLineDash([]);
    }
  }

  private drawBuilding(c: CanvasRenderingContext2D, b: Building) {
    const sys = this.activeSystem;
    // Dim non-relevant buildings
    let alpha = 1;
    if (sys === 'water') alpha = 0.25;
    else if (sys === 'energy' && b.type !== 'solar' && b.type !== 'commercial') alpha = 0.5;
    else if (sys === 'health' && b.type !== 'hospital') alpha = 0.5;
    c.globalAlpha = alpha;

    const [fx, fy] = this.iso(b.x, b.y + b.d);          // front-left
    const [frx, fry] = this.iso(b.x + b.w, b.y + b.d);  // front-right
    const [brx, bry] = this.iso(b.x + b.w, b.y);         // back-right
    const [blx, bly] = this.iso(b.x, b.y);               // back-left

    const h = b.h;

    // Front face
    c.fillStyle = b.color;
    c.beginPath();
    c.moveTo(fx, fy); c.lineTo(frx, fry); c.lineTo(frx, fry - h); c.lineTo(fx, fy - h);
    c.closePath(); c.fill();

    // Right face
    c.fillStyle = b.rightColor;
    c.beginPath();
    c.moveTo(frx, fry); c.lineTo(brx, bry); c.lineTo(brx, bry - h); c.lineTo(frx, fry - h);
    c.closePath(); c.fill();

    // Top face
    c.fillStyle = b.topColor;
    c.beginPath();
    c.moveTo(blx, bly - h); c.lineTo(brx, bry - h); c.lineTo(frx, fry - h); c.lineTo(fx, fy - h);
    c.closePath(); c.fill();

    // Windows on front face
    const wRows = Math.floor(h / 9);
    const wCols = Math.min(3, Math.floor(b.w * this.TW / 5));
    for (let r = 0; r < wRows; r++) {
      for (let col = 0; col < wCols; col++) {
        const wy = fy - 5 - r * 9;
        const wx = fx + (frx - fx) * (0.18 + col * 0.28);
        const seed = b.windowSeed + r * 7 + col * 13;
        const isLit = this.cityState.smartEnergy ?
          (b.occupancy > 0.4 && Math.sin(seed + this.time * 0.003) > 0.15) :
          Math.sin(seed * 1.7) > -0.35;
        c.fillStyle = isLit ?
          (seed % 5 === 0 ? 'rgba(255,200,100,0.35)' : 'rgba(0,200,255,0.45)') :
          'rgba(255,255,255,0.02)';
        c.fillRect(wx, wy, 2.5, 4);
      }
    }

    // Windows on right face
    for (let r = 0; r < wRows; r++) {
      for (let col = 0; col < wCols; col++) {
        const wy = fry - 5 - r * 9;
        const wx = frx + (brx - frx) * (0.18 + col * 0.28);
        const wyAdj = wy + (bry - fry) * (0.18 + col * 0.28);
        const seed = b.windowSeed + r * 11 + col * 17 + 100;
        const isLit = this.cityState.smartEnergy ?
          (b.occupancy > 0.4 && Math.sin(seed + this.time * 0.003) > 0.15) :
          Math.sin(seed * 1.7) > -0.35;
        c.fillStyle = isLit ?
          (seed % 5 === 0 ? 'rgba(255,200,100,0.3)' : 'rgba(0,200,255,0.35)') :
          'rgba(255,255,255,0.015)';
        c.fillRect(wx, wyAdj, 2.5, 4);
      }
    }

    // Solar panels on top
    if (b.hasSolar && (sys === 'energy' || sys === 'overview')) {
      const scx = (blx + frx) / 2;
      const scy = (bly + fry) / 2 - h;
      c.fillStyle = `rgba(255,214,0,${0.25 + Math.sin(this.time * 0.025) * 0.1})`;
      c.fillRect(scx - 5, scy - 2, 10, 4);
      // Subtle shine
      c.fillStyle = `rgba(255,255,255,${0.05 + Math.sin(this.time * 0.03) * 0.03})`;
      c.fillRect(scx - 4, scy - 1.5, 3, 2);
    }

    // Building edge glow
    if (b.glow > 0.04) {
      const glowCol = b.type === 'hospital' ? EMERALD :
                      b.type === 'solar' ? SOLAR_Y :
                      b.type === 'government' ? '#7c4dff' : CYAN;
      c.strokeStyle = `rgba(${hexToRGB(glowCol).join(',')},${b.glow * 0.4})`;
      c.lineWidth = 0.7;
      c.shadowColor = glowCol;
      c.shadowBlur = b.glow * 25;
      c.beginPath();
      c.moveTo(fx, fy - h); c.lineTo(frx, fry - h); c.lineTo(brx, bry - h);
      c.stroke();
      
      // Vertical edge glow
      c.beginPath();
      c.moveTo(frx, fry); c.lineTo(frx, fry - h);
      c.stroke();
      c.shadowBlur = 0;
    }

    c.globalAlpha = 1;
  }

  private drawTrafficLights(c: CanvasRenderingContext2D) {
    if (this.activeSystem !== 'mobility' && this.activeSystem !== 'overview') return;
    const big = this.activeSystem === 'mobility';
    
    for (const tl of this.trafficLights) {
      const [px, py] = this.iso(tl.x, tl.y);
      const col = tl.state === 'green' ? EMERALD : tl.state === 'yellow' ? AMBER : RED;
      const radius = big ? 2.8 : 1.8;
      
      c.fillStyle = col;
      c.shadowColor = col;
      c.shadowBlur = big ? 10 : 5;
      c.beginPath();
      c.arc(px, py - 6, radius, 0, Math.PI * 2);
      c.fill();

      // Post
      c.shadowBlur = 0;
      c.fillStyle = '#1a1f2e';
      c.fillRect(px - 0.5, py - 6, 1, 6);
    }
  }

  private drawVehicles(c: CanvasRenderingContext2D) {
    for (const v of this.vehicles) {
      const [px, py] = this.vehiclePos(v);

      if (v.type === 'drone') {
        const hover = Math.sin(this.time * 0.06 + v.progress * 10) * 4;
        c.fillStyle = v.color;
        c.shadowColor = v.color;
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(px, py - 85 + hover, 2.5, 0, Math.PI * 2);
        c.fill();
        // Propeller lines
        c.strokeStyle = `rgba(124,77,255,0.3)`;
        c.lineWidth = 0.5;
        const propAngle = this.time * 0.3;
        c.beginPath();
        c.moveTo(px - Math.cos(propAngle) * 5, py - 85 + hover);
        c.lineTo(px + Math.cos(propAngle) * 5, py - 85 + hover);
        c.stroke();
        c.shadowBlur = 0;
        continue;
      }

      const sz = v.type === 'bus' ? 5.5 : v.type === 'ambulance' ? 4.5 : v.type === 'waste' ? 5 : 3;
      
      if (v.type === 'ambulance') {
        c.shadowColor = RED;
        c.shadowBlur = 12 + Math.sin(this.time * 0.2) * 6;
      }

      // Vehicle body
      c.fillStyle = v.color;
      c.beginPath();
      c.ellipse(px, py - 2, sz, sz * 0.45, 0, 0, Math.PI * 2);
      c.fill();

      // Vehicle roof / highlight
      c.fillStyle = adjustBrightness(v.color, 1.4);
      c.beginPath();
      c.ellipse(px, py - 3.5, sz * 0.6, sz * 0.28, 0, 0, Math.PI * 2);
      c.fill();

      // Ambulance light flash
      if (v.type === 'ambulance') {
        const flash = Math.sin(this.time * 0.2) > 0;
        c.fillStyle = flash ? '#ff4444' : '#4444ff';
        c.beginPath();
        c.arc(px, py - 5, 1.5, 0, Math.PI * 2);
        c.fill();
      }

      c.shadowBlur = 0;
    }
  }

  private drawPersons(c: CanvasRenderingContext2D) {
    for (const p of this.persons) {
      const GS = this.GS;
      let gx: number, gy: number;
      if (p.roadH) {
        gx = p.direction > 0 ? p.progress * GS : (1 - p.progress) * GS;
        gy = p.roadIdx + (p.direction > 0 ? 0.35 : -0.35);
      } else {
        gx = p.roadIdx + (p.direction > 0 ? 0.35 : -0.35);
        gy = p.direction > 0 ? p.progress * GS : (1 - p.progress) * GS;
      }
      const [px, py] = this.iso(gx, gy);

      // Head
      c.fillStyle = 'rgba(200,210,230,0.5)';
      c.beginPath();
      c.arc(px, py - 5, 1.2, 0, Math.PI * 2);
      c.fill();
      // Body
      c.fillStyle = 'rgba(150,165,190,0.3)';
      c.fillRect(px - 0.6, py - 3.5, 1.2, 3);
    }
  }

  private drawTrees(c: CanvasRenderingContext2D) {
    const highlight = this.activeSystem === 'environment';
    
    for (const t of this.trees) {
      const [px, py] = this.iso(t.x, t.y);
      const sway = Math.sin(t.phase) * 1.2;
      c.globalAlpha = highlight ? 1 : 0.75;

      // Trunk
      c.fillStyle = '#3e2723';
      c.fillRect(px - 0.5 + sway * 0.2, py - t.size * 0.5, 1.2, t.size * 0.55);

      // Canopy
      const g = t.health;
      const cr = 30 * (1 - g) + 25 | 0;
      const cg = 100 * g + 50 | 0;
      const cb = 35 * g + 20 | 0;
      c.fillStyle = `rgb(${cr},${cg},${cb})`;

      if (highlight && this.cityState.smartEnvironment) {
        c.shadowColor = EMERALD;
        c.shadowBlur = 5 + Math.sin(this.time * 0.025 + t.x) * 3;
      }

      c.beginPath();
      c.arc(px + sway, py - t.size * 0.95, t.size * 0.55, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(px + sway - t.size * 0.25, py - t.size * 0.65, t.size * 0.4, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.arc(px + sway + t.size * 0.3, py - t.size * 0.78, t.size * 0.42, 0, Math.PI * 2);
      c.fill();

      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
  }

  private drawStreetLights(c: CanvasRenderingContext2D) {
    for (const sl of this.streetLights) {
      const [px, py] = this.iso(sl.x, sl.y);
      // Post
      c.fillStyle = '#1e2535';
      c.fillRect(px - 0.3, py - 10, 0.6, 10);
      // Light
      const on = this.cityState.smartEnergy ? (this.time % 400 < 350) : true;
      if (on) {
        c.fillStyle = `rgba(255,220,150,${sl.brightness * 0.5})`;
        c.shadowColor = 'rgba(255,200,100,0.3)';
        c.shadowBlur = 6;
        c.beginPath();
        c.arc(px, py - 10, 1.5, 0, Math.PI * 2);
        c.fill();

        // Light pool on ground
        c.fillStyle = `rgba(255,220,150,${sl.brightness * 0.03})`;
        c.beginPath();
        c.ellipse(px, py, 8, 4, 0, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
      }
    }
  }

  private drawWaterPipes(c: CanvasRenderingContext2D) {
    const GS = this.GS;
    const RI = this.ROAD_INTERVAL;
    
    c.strokeStyle = 'rgba(0,145,234,0.3)';
    c.lineWidth = 2;
    c.setLineDash([5, 10]);

    for (let r = 0; r < GS; r += RI) {
      const [sx, sy] = this.iso(r, 0);
      const [ex, ey] = this.iso(r, GS);
      c.beginPath(); c.moveTo(sx, sy + 6); c.lineTo(ex, ey + 6); c.stroke();
      const [sx2, sy2] = this.iso(0, r);
      const [ex2, ey2] = this.iso(GS, r);
      c.beginPath(); c.moveTo(sx2, sy2 + 6); c.lineTo(ex2, ey2 + 6); c.stroke();
    }
    c.setLineDash([]);

    // Animated water drops flowing
    c.fillStyle = 'rgba(0,145,234,0.7)';
    const off = (this.time * 0.6) % 40;
    for (let r = 0; r < GS; r += RI) {
      for (let d = 0; d < 25; d++) {
        const t = ((d * 40 + off) % (GS * this.TW * 2)) / (GS * this.TW * 2);
        const [px, py] = this.iso(r, t * GS);
        c.beginPath(); c.arc(px, py + 6, 1.3, 0, Math.PI * 2); c.fill();
      }
    }
  }

  private drawWasteBins(c: CanvasRenderingContext2D) {
    for (const bin of this.wasteBins) {
      const [px, py] = this.iso(bin.x, bin.y);
      const isFull = bin.fill > 0.8;

      // Bin body
      c.fillStyle = isFull ? 'rgba(255,171,0,0.5)' : 'rgba(0,230,118,0.3)';
      c.strokeStyle = isFull ? AMBER : EMERALD;
      c.lineWidth = 0.8;
      const bw = 7, bh = 9;
      c.beginPath();
      c.rect(px - bw / 2, py - bh, bw, bh);
      c.fill(); c.stroke();

      // Fill level
      c.fillStyle = isFull ? AMBER : EMERALD;
      c.fillRect(px - bw / 2 + 1, py - bh + 1 + (1 - bin.fill) * (bh - 2), bw - 2, bin.fill * (bh - 2));

      // Label
      c.fillStyle = '#ccc';
      c.font = '5px "JetBrains Mono", monospace';
      c.textAlign = 'center';
      c.fillText(`BIN ${String(bin.id).padStart(3, '0')}`, px, py + 8);
      c.fillText(`${bin.fill * 100 | 0}%`, px, py + 14);

      if (bin.collecting) {
        c.strokeStyle = EMERALD;
        c.shadowColor = EMERALD;
        c.shadowBlur = 8;
        c.lineWidth = 0.6;
        const rad = 10 + Math.sin(this.time * 0.08) * 3;
        c.beginPath(); c.arc(px, py - bh / 2, rad, 0, Math.PI * 2); c.stroke();
        c.shadowBlur = 0;
      }
    }
  }

  private drawDataLines(c: CanvasRenderingContext2D) {
    for (const dl of this.dataLines) {
      const [sx, sy] = this.iso(dl.x1, dl.y1);
      const [ex, ey] = this.iso(dl.x2, dl.y2);
      const yOff = -35;

      c.strokeStyle = 'rgba(0,229,255,0.04)';
      c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(sx, sy + yOff); c.lineTo(ex, ey + yOff); c.stroke();

      // Traveling dot
      const dx = ex - sx;
      const dy = ey - sy;
      c.fillStyle = `rgba(0,229,255,${0.5 + Math.sin(this.time * 0.04) * 0.2})`;
      c.beginPath();
      c.arc(sx + dx * dl.progress, sy + yOff + dy * dl.progress, 1.5, 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawEmergency(c: CanvasRenderingContext2D) {
    const amb = this.vehicles.find(v => v.type === 'ambulance');
    if (!amb) return;
    const [ax, ay] = this.vehiclePos(amb);
    // Assume hospital area
    const [tx, ty] = this.iso(this.GS * 0.6, this.GS * 0.8);

    const pulse = Math.sin(this.time * 0.08) * 0.15 + 0.3;
    c.strokeStyle = `rgba(255,23,68,${pulse})`;
    c.lineWidth = 2.5;
    c.shadowColor = RED;
    c.shadowBlur = 12;
    c.setLineDash([10, 10]);
    c.lineDashOffset = -this.time * 0.8;
    c.beginPath(); c.moveTo(ax, ay - 3); c.lineTo(tx, ty - 3); c.stroke();
    c.setLineDash([]);
    c.shadowBlur = 0;
  }

  private drawWaterAnomaly(c: CanvasRenderingContext2D) {
    const [px, py] = this.iso(this.GS * 0.4, this.GS * 0.4);
    const pulse = Math.sin(this.time * 0.1) * 0.5 + 0.5;

    c.fillStyle = `rgba(255,23,68,${0.12 + pulse * 0.18})`;
    c.beginPath(); c.arc(px, py + 6, 18 + pulse * 6, 0, Math.PI * 2); c.fill();

    c.strokeStyle = RED;
    c.lineWidth = 1.2;
    c.shadowColor = RED;
    c.shadowBlur = 12;
    c.beginPath(); c.arc(px, py + 6, 14, 0, Math.PI * 2); c.stroke();
    c.shadowBlur = 0;

    // Leak drops
    for (let i = 0; i < 4; i++) {
      c.fillStyle = `rgba(0,145,234,${0.4 + Math.random() * 0.3})`;
      c.beginPath();
      c.arc(px + (Math.random() - 0.5) * 12, py + 6 + Math.random() * 10, 1 + Math.random(), 0, Math.PI * 2);
      c.fill();
    }
  }

  private drawParticles(c: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      c.globalAlpha = p.alpha;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  private drawVignette(c: CanvasRenderingContext2D, W: number, H: number) {
    const g = c.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 0.75);
    g.addColorStop(0, 'transparent');
    g.addColorStop(1, 'rgba(6,10,20,0.55)');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }

  private drawScanline(c: CanvasRenderingContext2D, W: number, H: number) {
    const y = (this.time * 0.6) % H;
    c.fillStyle = 'rgba(0,229,255,0.015)';
    c.fillRect(0, y, W, 2);
  }
}
