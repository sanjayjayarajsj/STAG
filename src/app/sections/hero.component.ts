import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollService } from '../services/scroll.service';

const FRAME_COUNT = 190;
const frameUrl = (i: number) => `/assets/scroll/flow/f_${String(i).padStart(3, '0')}.webp`;

@Component({
  selector: 'app-hero',
  standalone: true,
  template: `
    <section id="hero" class="relative w-full bg-ink text-white" aria-label="STAG, real fruit, velvet effervescence">
      <div #stage class="relative h-svh min-h-[560px] w-full overflow-hidden bg-ink">
        <!-- Instant first paint: real <img> in the HTML, the canvas takes over once frames stream in -->
        <picture>
          <img
            src="/assets/scroll/flow/f_001.webp"
            alt=""
            aria-hidden="true"
            width="1920"
            height="1080"
            fetchpriority="high"
            decoding="async"
            class="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <canvas #canvas class="absolute inset-0 h-full w-full" aria-hidden="true"></canvas>

        <!-- Legibility gradients -->
        <div class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/80 to-transparent"></div>
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-ink via-ink/70 to-transparent"></div>
        <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/10 to-transparent max-md:hidden"></div>

        <div class="container-x relative z-10 flex h-full flex-col pb-7 pt-24 sm:pb-9 sm:pt-28">
          <!-- Top meta -->
          <div class="flex items-center justify-between">
            <span class="eyebrow">Edition 01 &mdash; Cold Craft</span>
            <span class="eyebrow hidden !text-neutral-500 sm:inline">Natural Fruit Extracts &bull; Alpine Spring</span>
          </div>

          <!-- Text phases share one grid cell, so they overlap cleanly instead of stacking -->
          <div class="mt-auto grid pb-8 sm:pb-12">
            <div #phase1 class="col-start-1 row-start-1 will-change-transform">
              <span class="eyebrow mb-3 block">Craft Refreshment</span>
              <h1 class="text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Real fruit.<br />
                <span class="font-normal text-neutral-400">Velvet effervescence.</span>
              </h1>
              <p class="mt-4 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-base">
                Organic botanical extracts paired with pure mountain water. Micro-carbonated for an effortless, crisp finish.
              </p>
            </div>

            <div #phase2 class="invisible col-start-1 row-start-1 will-change-transform">
              <span class="eyebrow mb-3 block">Micro-Effervescence</span>
              <h2 class="text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Draught smooth.<br />
                <span class="font-normal text-neutral-400">In every pour.</span>
              </h2>
              <p class="mt-4 max-w-md text-sm leading-relaxed text-neutral-300 sm:text-base">
                Gentle carbonation unlocks genuine fruit aroma and delicate natural sweetness without lingering heaviness.
              </p>
            </div>

            <div #phase3 class="invisible col-start-1 row-start-1 will-change-transform">
              <span class="eyebrow mb-3 block">Ready to Enjoy</span>
              <h2 class="text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">Taste the craft.</h2>
              <div class="mt-7 flex flex-wrap items-center gap-3">
                <button type="button" (click)="go('#collection')" class="btn-primary">Explore Collection</button>
                <button type="button" (click)="go('#philosophy')" class="btn-ghost">Philosophy</button>
              </div>
            </div>
          </div>

          <!-- Bottom: scroll cue + progress -->
          <div class="flex items-center justify-between gap-6">
            <div #cue class="flex items-center gap-2.5 text-neutral-400">
              <span class="flex h-7 w-4 items-start justify-center rounded-full border border-neutral-600 p-1" aria-hidden="true">
                <span class="h-1.5 w-1 animate-pulse rounded-full bg-neutral-300"></span>
              </span>
              <span class="eyebrow !text-neutral-400">
                @if (loadPct() < 100) { Loading {{ loadPct() }}% } @else { Scroll to pour }
              </span>
            </div>
            <div class="h-px w-24 overflow-hidden bg-white/15 sm:w-40" aria-hidden="true">
              <div #bar class="h-full origin-left scale-x-0 bg-white will-change-transform"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLElement>;
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('phase1', { static: true }) phase1!: ElementRef<HTMLElement>;
  @ViewChild('phase2', { static: true }) phase2!: ElementRef<HTMLElement>;
  @ViewChild('phase3', { static: true }) phase3!: ElementRef<HTMLElement>;
  @ViewChild('cue', { static: true }) cue!: ElementRef<HTMLElement>;
  @ViewChild('bar', { static: true }) bar!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly scroll = inject(ScrollService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly loadPct = signal(0);

  private ctx: CanvasRenderingContext2D | null = null;
  private frames: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
  private loadedCount = 0;
  private current = 0;
  private target = 0;
  private lastDrawn = -1;
  private cw = 0;
  private ch = 0;
  private smoothing = 0.14;
  private loopRaf = 0;
  private resizeObserver: ResizeObserver | null = null;
  private resizeRaf = 0;
  private timeline: gsap.core.Timeline | null = null;
  private destroyed = false;

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.scroll.outside(() => this.init());
  }

  private init(): void {
    const reduced = this.scroll.isReducedMotion();
    this.smoothing = reduced ? 1 : 0.14;
    this.ctx = this.canvas.nativeElement.getContext('2d', { alpha: false });

    this.resize();
    this.resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = requestAnimationFrame(() => this.resize());
    });
    this.resizeObserver.observe(this.stage.nativeElement);

    if (reduced) {
      this.showStatic();
    } else {
      this.setupScroll();
    }

    this.preload();
    this.loop();
  }

  /** Preload every frame with batch parallel streaming like index.html */
  private async preload(): Promise<void> {
    // First frame loaded immediately for instant paint
    await this.loadFrame(0);
    this.draw(0, true);

    const rest: number[] = [];
    for (let i = 1; i < FRAME_COUNT; i++) rest.push(i);

    const BATCH = 12;
    for (let i = 0; i < rest.length; i += BATCH) {
      if (this.destroyed) return;
      await Promise.all(rest.slice(i, i + BATCH).map(idx => this.loadFrame(idx)));
    }
  }

  private loadFrame(index: number): Promise<void> {
    return new Promise(resolve => {
      if (this.destroyed) {
        resolve();
        return;
      }
      const img = new Image();
      img.src = frameUrl(index + 1);
      const done = () => {
        this.frames[index] = img;
        this.loadedCount++;
        const p = Math.round((this.loadedCount / FRAME_COUNT) * 100);
        if (p === 100 || p - this.loadPct() >= 5) {
          this.zone.run(() => this.loadPct.set(p));
        }
        resolve();
      };
      if (img.decode) {
        img.decode().then(done, done);
      } else {
        img.onload = done;
        img.onerror = done;
      }
    });
  }

  /** Canvas sizing with HiDPI and CSS pixel coordinate mapping */
  private resize(): void {
    if (!this.ctx) return;
    const el = this.stage.nativeElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cw = el.clientWidth;
    this.ch = el.clientHeight;
    if (!this.cw || !this.ch) return;

    const canvas = this.canvas.nativeElement;
    canvas.width = Math.round(this.cw * dpr);
    canvas.height = Math.round(this.ch * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.lastDrawn = -1;
    this.draw(Math.round(this.current), true);
  }

  /** Responsive draw from index.html: cover landscape, fit width on portrait so can is never cut off */
  private draw(index: number, force = false): void {
    if (!this.ctx || !this.cw || !this.ch) return;
    const last = FRAME_COUNT - 1;
    let k = Math.min(Math.max(index, 0), last);

    // Fall back to nearest loaded frame if current frame is still streaming
    while (k >= 0 && !this.frames[k]) k--;
    if (k < 0) {
      k = index;
      while (k <= last && !this.frames[k]) k++;
      if (k > last) return;
    }
    if (k === this.lastDrawn && !force) return;

    const img = this.frames[k];
    if (!img) return;
    this.lastDrawn = k;

    const iw = img.naturalWidth || 1920;
    const ih = img.naturalHeight || 1080;
    const scale = this.cw / this.ch >= iw / ih ? this.cw / iw : (this.cw < 700 ? this.cw / iw : this.ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;

    this.ctx.fillStyle = '#09090b';
    this.ctx.fillRect(0, 0, this.cw, this.ch);
    this.ctx.drawImage(img, (this.cw - dw) / 2, (this.ch - dh) / 2, dw, dh);
  }

  /** Continuous LERP animation loop: smoothly interpolates current frame toward target */
  private loop = (): void => {
    if (this.destroyed) return;
    this.current += (this.target - this.current) * this.smoothing;
    if (Math.abs(this.target - this.current) < 0.01) this.current = this.target;
    this.draw(Math.round(this.current));
    this.loopRaf = requestAnimationFrame(this.loop);
  };

  private setupScroll(): void {
    const last = FRAME_COUNT - 1;
    const state = { frame: 0 };
    const p1 = this.phase1.nativeElement;
    const p2 = this.phase2.nativeElement;
    const p3 = this.phase3.nativeElement;

    gsap.set([p2, p3], { autoAlpha: 0, y: 28 });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: this.stage.nativeElement,
        start: 'top top',
        end: () => '+=' + Math.round(window.innerHeight * 0.72),
        pin: true,
        anticipatePin: 1,
        scrub: this.scroll.lenis ? true : 0.2,
        invalidateOnRefresh: true
      }
    });

    tl.to(
      state,
      {
        frame: last,
        duration: 1,
        onUpdate: () => {
          this.target = state.frame;
        }
      },
      0
    )
      .to(this.cue.nativeElement, { autoAlpha: 0, duration: 0.06 }, 0)
      .to(this.bar.nativeElement, { scaleX: 1, duration: 1 }, 0)
      .to(p1, { autoAlpha: 0, y: -24, duration: 0.14, ease: 'power2.in' }, 0.14)
      .fromTo(p2, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.16, ease: 'power2.out' }, 0.3)
      .to(p2, { autoAlpha: 0, y: -24, duration: 0.14, ease: 'power2.in' }, 0.58)
      .fromTo(p3, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.18, ease: 'power2.out' }, 0.76);

    this.timeline = tl;
    if (tl.scrollTrigger) this.scroll.addTrigger(tl.scrollTrigger as ScrollTrigger);
  }

  /** Reduced motion: no pin, no scrubbing. Show the finished pour with the call to action. */
  private showStatic(): void {
    gsap.set(this.phase1.nativeElement, { autoAlpha: 0 });
    gsap.set(this.phase3.nativeElement, { autoAlpha: 1 });
    gsap.set(this.cue.nativeElement, { autoAlpha: 0 });
    this.target = FRAME_COUNT - 1;
    this.current = FRAME_COUNT - 1;
  }

  go(target: string): void {
    this.scroll.scrollTo(target);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (!this.isBrowser) return;
    cancelAnimationFrame(this.loopRaf);
    cancelAnimationFrame(this.resizeRaf);
    this.resizeObserver?.disconnect();
    this.timeline?.scrollTrigger?.kill(true);
    this.timeline?.kill();
    this.frames.forEach(img => {
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    });
    this.frames = [];
  }
}
