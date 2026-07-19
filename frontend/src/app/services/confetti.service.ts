import { Injectable } from '@angular/core';

export interface ConfettiOptions {
  count?: number;
  origin?: { x: number; y: number };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'strip';
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
}

@Injectable({
  providedIn: 'root',
})
export class ConfettiService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: Particle[] = [];
  private animationFrameId: number | null = null;

  private colors = [
    '#2563EB', '#7C3AED', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#06B6D4', '#8B5CF6', '#FACC15',
  ];

  private initCanvas(): void {
    if (typeof document === 'undefined') return;

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'kognita-confetti-canvas';
      Object.assign(this.canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '99999',
      });
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }

    if (this.canvas) {
      const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      this.canvas.width = (typeof window !== 'undefined' ? window.innerWidth : 800) * dpr;
      this.canvas.height = (typeof window !== 'undefined' ? window.innerHeight : 600) * dpr;
    }
  }

  public fireConfetti(options?: ConfettiOptions): void {
    if (typeof window === 'undefined') return;
    this.initCanvas();
    if (!this.ctx || !this.canvas) return;

    const count = options?.count ?? 90;
    const dpr = window.devicePixelRatio || 1;
    const originX = (options?.origin?.x ?? 0.5) * this.canvas.width;
    const originY = (options?.origin?.y ?? 0.6) * this.canvas.height;

    for (let i = 0; i < count; i++) {
      const angle = Math.PI * (Math.random() * 1.4 - 1.2); // upward cone
      const speed = (Math.random() * 14 + 7) * dpr;
      const shapes: ('square' | 'circle' | 'strip')[] = ['square', 'circle', 'strip'];

      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed + (Math.random() * 4 - 2),
        vy: Math.sin(angle) * speed - (Math.random() * 4 + 2),
        size: (Math.random() * 8 + 6) * dpr,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        gravity: 0.25 * dpr,
        drag: 0.98,
      });
    }

    if (!this.animationFrameId) {
      this.animate();
    }
  }

  public fireStreakCelebration(): void {
    if (typeof window === 'undefined') return;
    this.initCanvas();
    if (!this.ctx || !this.canvas) return;

    // Fire dual corner cannons
    this.fireCannon({ x: 0.1, y: 0.8 }, 70, Math.PI * -0.25);
    this.fireCannon({ x: 0.9, y: 0.8 }, 70, Math.PI * -0.75);

    // Center pop after slight delay
    setTimeout(() => {
      this.fireConfetti({ count: 110, origin: { x: 0.5, y: 0.4 } });
    }, 250);
  }

  private fireCannon(originRatio: { x: number; y: number }, count: number, baseAngle: number): void {
    if (!this.canvas) return;
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const originX = originRatio.x * this.canvas.width;
    const originY = originRatio.y * this.canvas.height;

    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * 0.6;
      const angle = baseAngle + spread;
      const speed = (Math.random() * 18 + 12) * dpr;
      const shapes: ('square' | 'circle' | 'strip')[] = ['square', 'circle', 'strip'];

      this.particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (Math.random() * 10 + 6) * dpr,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        alpha: 1,
        decay: Math.random() * 0.012 + 0.005,
        gravity: 0.28 * dpr,
        drag: 0.975,
      });
    }

    if (!this.animationFrameId) {
      this.animate();
    }
  }

  private animate = (): void => {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > this.canvas.height + 50) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'strip') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    } else {
      this.animationFrameId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  };
}
