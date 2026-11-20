import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { CartService } from '../services/cart.service';
import { ProductService, Product } from '../services/product.service';
import { ScrollService } from '../services/scroll.service';
import { RevealDirective } from '../shared/reveal.directive';

interface DetailExtras {
  number: string;
  glow: string;
  cutout: { src: string; w: number; h: number };
  backdrop: string;
  description: string;
  specs: { label: string; value: string }[];
  notes: string[];
}

interface DetailItem extends DetailExtras {
  product: Product;
}

// Editing copy or art for a slide happens here; name, price and packs come from ProductService.
const EXTRAS: Record<string, DetailExtras> = {
  'stag-original': {
    number: '01',
    glow: '#6366f1',
    cutout: { src: '/assets/details/original-can.webp', w: 348, h: 619 },
    backdrop: '/assets/details/original-bg.webp',
    description:
      'Sourced from subterranean volcanic basalt aquifers. Natural mineral clarity meets cold needle-point effervescence for an ultra-pure, weightless refreshment with zero lingering sweetness.',
    specs: [
      { label: 'Source', value: 'Basalt Aquifer' },
      { label: 'Carbonation', value: '4.5 Bar Micro-Fizz' },
      { label: 'Calories', value: '0 kcal' },
      { label: 'Sugar', value: '0g Added' }
    ],
    notes: ['Basalt Mineral Spring', 'Needle Micro-CO2', 'Natural Electrolytes', 'Crystalline Finish']
  },
  'stag-black-coffee': {
    number: '02',
    glow: '#d97706',
    cutout: { src: '/assets/details/black-coffee-can.webp', w: 586, h: 618 },
    backdrop: '/assets/details/black-coffee-bg.webp',
    description:
      'Single-origin high-altitude Arabica cold-distilled over 24 hours. Intricate dark cacao aroma and roasted vanilla notes elevated with champagne-grade fine effervescence.',
    specs: [
      { label: 'Extraction', value: '24hr Cryo-Distilled' },
      { label: 'Carbonation', value: 'Champagne CO2' },
      { label: 'Calories', value: '5 kcal' },
      { label: 'Roast', value: 'Dark Cacao Blend' }
    ],
    notes: ['Single-Origin Arabica', 'Cold-Steeped Agave', 'Madagascar Vanilla', 'Velvet Crema Bubbles']
  },
  'stag-lime': {
    number: '03',
    glow: '#10b981',
    cutout: { src: '/assets/details/lime-can.webp', w: 692, h: 624 },
    backdrop: '/assets/details/lime-bg.webp',
    description:
      'Hand-harvested Tahitian lime zest paired with aromatic Japanese yuzu over ultra-fine micro-bubbles. Finished with a trace of flake sea salt for unadulterated sensory revival.',
    specs: [
      { label: 'Harvest', value: 'Cold-Pressed Citrus' },
      { label: 'Carbonation', value: 'Sharp Needle-Point' },
      { label: 'Calories', value: '10 kcal' },
      { label: 'Mineral Finish', value: 'Maldon Sea Salt' }
    ],
    notes: ['Tahitian Lime Zest', 'Japanese Yuzu', 'Maldon Flake Salt', 'Electric Effervescence']
  }
};

const AUTOPLAY_MS = 7000;

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CurrencyPipe, RevealDirective],
  template: `
    <section
      #section
      id="details"
      class="relative w-full overflow-hidden border-t border-white/[0.06] bg-ink py-20 sm:py-24 lg:py-28"
      role="region"
      aria-roledescription="carousel"
      aria-label="Product details"
      tabindex="0"
      (keydown.arrowleft)="manual(-1)"
      (keydown.arrowright)="manual(1)"
    >
      <!-- Header + tabs -->
      <div appReveal class="container-x mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <span class="eyebrow mb-3 block">Sensory Profiles &bull; Cold Distilled</span>
          <h2 class="h-section">Product details</h2>
        </div>
        <div class="-mx-5 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0" role="tablist" aria-label="Choose edition">
          <div class="flex w-max gap-1.5 rounded-full border border-white/10 bg-card/80 p-1.5">
            @for (item of items(); track item.product.id; let i = $index) {
              <button
                type="button"
                role="tab"
                (click)="manual(0, i)"
                [attr.aria-selected]="active() === i"
                class="rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors duration-500"
                [class]="active() === i ? 'bg-white text-ink' : 'text-neutral-400 hover:text-white'"
              >
                {{ item.number }} &mdash; {{ short(item.product.name) }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Stage: every slide shares one grid cell and is animated in/out as a layered scene -->
      <div #viewport class="relative w-full touch-pan-y overflow-hidden">
        <div class="grid">
          @for (item of items(); track item.product.id; let i = $index) {
            <div
              class="relative col-start-1 row-start-1 flex items-center overflow-hidden bg-surface transition-opacity duration-[800ms] ease-out"
              [class]="active() === i ? 'opacity-100' : 'pointer-events-none opacity-0'"
              role="group"
              aria-roledescription="slide"
              [attr.aria-label]="i + 1 + ' of ' + items().length"
              [attr.aria-hidden]="active() === i ? null : 'true'"
              [attr.inert]="active() === i ? null : ''"
            >
              <!-- Backdrop: slow settle-in zoom -->
              <img
                [src]="item.backdrop"
                alt=""
                width="1920"
                height="1072"
                loading="lazy"
                decoding="async"
                class="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-[2400ms] ease-out"
                [class]="on(i) ? 'scale-100' : 'scale-110'"
              />
              <div class="pointer-events-none absolute inset-0 bg-black/55 lg:bg-gradient-to-r lg:from-black/70 lg:via-black/25 lg:to-black/70"></div>
              <div class="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink to-transparent"></div>
              <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink to-transparent"></div>

              <!-- Oversized edition number drifts in behind the can -->
              <span
                class="pointer-events-none absolute -left-2 top-4 select-none text-[9rem] font-semibold leading-none tracking-tighter text-white/[0.05] transition-[transform,opacity] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:text-[15rem] lg:left-[6%] lg:top-1/2 lg:-translate-y-1/2 lg:text-[22rem]"
                [class]="numberClass(i)"
                aria-hidden="true"
              >
                {{ item.number }}
              </span>

              <div class="container-x relative z-10 grid items-center gap-8 py-14 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-20">
                <!-- Can -->
                <div class="relative flex items-center justify-center lg:col-span-6">
                  <div
                    class="pointer-events-none absolute h-72 w-72 transition-[transform,opacity] duration-[1400ms] ease-out lg:h-[28rem] lg:w-[28rem]"
                    [class]="on(i) ? 'scale-100 opacity-70' : 'scale-50 opacity-0'"
                    [style.background]="'radial-gradient(closest-side, ' + item.glow + '66, transparent)'"
                  ></div>
                  <div
                    class="transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    [class]="canClass(i)"
                    [style.transition-delay.ms]="on(i) ? 200 : 0"
                  >
                    <img
                      [src]="item.cutout.src"
                      [alt]="item.product.name + ' can'"
                      [attr.width]="item.cutout.w"
                      [attr.height]="item.cutout.h"
                      [style.aspect-ratio]="item.cutout.w + ' / ' + item.cutout.h"
                      loading="lazy"
                      decoding="async"
                      class="relative h-[40svh] w-auto max-w-full object-contain motion-safe:animate-float lg:h-[62vh]"
                    />
                  </div>
                </div>

                <!-- Content: each block reveals in sequence -->
                <div class="flex flex-col gap-5 lg:col-span-6">
                  <div class="flex items-center gap-3 transition-[transform,opacity] duration-700 ease-out" [class]="rise(i)" [style.transition-delay.ms]="delay(i, 0)">
                    <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-1 text-xs font-medium uppercase tracking-widest text-neutral-200">
                      <span class="h-1.5 w-1.5 rounded-full" [style.background]="item.glow"></span>
                      Edition {{ item.number }} / 0{{ items().length }}
                    </span>
                    <span class="eyebrow">{{ item.product.category }}</span>
                  </div>

                  <div>
                    <!-- Masked line reveal -->
                    <div class="overflow-hidden pb-1">
                      <h3
                        class="text-3xl font-semibold uppercase leading-none tracking-tight text-white transition-transform duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:text-5xl lg:text-6xl"
                        [class]="on(i) ? 'translate-y-0' : 'translate-y-full'"
                        [style.transition-delay.ms]="delay(i, 1)"
                      >
                        {{ item.product.name }}
                      </h3>
                    </div>
                    <p class="mt-3 text-xs font-medium uppercase tracking-widest text-neutral-300 transition-[transform,opacity] duration-700 ease-out sm:text-sm" [class]="rise(i)" [style.transition-delay.ms]="delay(i, 2)">
                      {{ item.product.subtitle }}
                    </p>
                  </div>

                  <p class="max-w-xl text-sm leading-relaxed text-neutral-200 transition-[transform,opacity] duration-700 ease-out sm:text-base" [class]="rise(i)" [style.transition-delay.ms]="delay(i, 3)">
                    {{ item.description }}
                  </p>

                  <div class="grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-4">
                    @for (spec of item.specs; track spec.label; let n = $index) {
                      <div
                        class="rounded-xl border border-white/[0.1] bg-black/40 p-3.5 backdrop-blur-md transition-[transform,opacity] duration-700 ease-out"
                        [class]="rise(i)"
                        [style.transition-delay.ms]="delay(i, 4 + n * 0.5)"
                      >
                        <span class="block text-xs font-medium uppercase tracking-wider text-neutral-400">{{ spec.label }}</span>
                        <span class="mt-0.5 block text-sm font-medium text-white">{{ spec.value }}</span>
                      </div>
                    }
                  </div>

                  <div class="flex flex-wrap gap-2 transition-[transform,opacity] duration-700 ease-out" [class]="rise(i)" [style.transition-delay.ms]="delay(i, 6.5)">
                    @for (note of item.notes; track note) {
                      <span class="chip">{{ note }}</span>
                    }
                  </div>

                  <div
                    class="flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-white/[0.1] pt-5 transition-[transform,opacity] duration-700 ease-out"
                    [class]="rise(i)"
                    [style.transition-delay.ms]="delay(i, 7)"
                  >
                    <div>
                      <span class="block text-xs uppercase tracking-wider text-neutral-400">4-Pack &bull; 355ml</span>
                      <span class="text-2xl font-semibold text-white">{{ item.product.price | currency }}</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-3">
                      <button type="button" (click)="cart.openNotAvailableDialog()" class="btn-primary">Buy Now</button>
                      <button type="button" (click)="cart.addItem(item.product)" class="btn-ghost">Add to Bag</button>
                      <button type="button" (click)="cart.openQuickView(item.product)" class="btn-ghost bg-white/[0.04]">Quick View</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Controls -->
      <div class="container-x mt-8 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <span class="text-xs tabular-nums text-neutral-300">0{{ active() + 1 }} / 0{{ items().length }}</span>
          <div class="h-[2px] w-24 overflow-hidden rounded-full bg-neutral-800 sm:w-32" aria-hidden="true">
            <div class="h-full origin-left rounded-full bg-white transition-transform duration-700 ease-out" [style.transform]="'scaleX(' + progress() + ')'"></div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" (click)="manual(-1)" class="icon-btn" aria-label="Previous edition">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" (click)="manual(1)" class="icon-btn" aria-label="Next edition">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  `
})
export class ProductDetailsComponent implements AfterViewInit, OnDestroy {
  readonly cart = inject(CartService);
  private readonly products = inject(ProductService);
  private readonly scroll = inject(ScrollService);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('section', { static: true }) section!: ElementRef<HTMLElement>;
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLElement>;

  readonly items = computed<DetailItem[]>(() =>
    Object.keys(EXTRAS)
      .map(id => ({ id, product: this.products.byId(id) }))
      .filter((x): x is { id: string; product: Product } => !!x.product)
      .map(x => ({ product: x.product, ...EXTRAS[x.id] }))
  );
  readonly active = signal(0);
  readonly ready = signal(false);
  readonly progress = computed(() => (this.active() + 1) / this.items().length);

  private timer: ReturnType<typeof setInterval> | null = null;
  private inView = false;
  private hovering = false;
  private stopped = false; // set once the visitor takes control
  private observer: IntersectionObserver | null = null;
  private cleanups: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const reduced = this.scroll.isReducedMotion();

    this.scroll.outside(() => {
      const sec = this.section.nativeElement;
      const vp = this.viewport.nativeElement;
      const on = (el: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions) => {
        el.addEventListener(type, fn, opts);
        this.cleanups.push(() => el.removeEventListener(type, fn));
      };

      // Autoplay only while visible, never while hovered/focused, and never for reduced motion
      this.observer = new IntersectionObserver(([e]) => {
        this.inView = e.isIntersecting;
        if (e.isIntersecting && !this.ready()) this.zone.run(() => this.ready.set(true));
        this.syncAutoplay();
      }, { threshold: 0.15 });
      this.observer.observe(sec);

      on(sec, 'mouseenter', () => { this.hovering = true; this.syncAutoplay(); });
      on(sec, 'mouseleave', () => { this.hovering = false; this.syncAutoplay(); });
      on(sec, 'focusin', () => { this.hovering = true; this.syncAutoplay(); });
      on(sec, 'focusout', () => { this.hovering = false; this.syncAutoplay(); });

      // Swipe: only counts when the gesture is clearly horizontal, so vertical scrolling never flips slides
      let sx = 0, sy = 0;
      on(vp, 'touchstart', (e: TouchEvent) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      on(vp, 'touchend', (e: TouchEvent) => {
        const dx = sx - e.changedTouches[0].clientX;
        const dy = sy - e.changedTouches[0].clientY;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) this.zone.run(() => this.manual(dx > 0 ? 1 : -1));
      }, { passive: true });

      // Trackpad horizontal swipe
      let cooling = false;
      on(vp, 'wheel', (e: WheelEvent) => {
        if (cooling || Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
        cooling = true;
        this.zone.run(() => this.manual(e.deltaX > 0 ? 1 : -1));
        setTimeout(() => (cooling = false), 700);
      }, { passive: true });

      if (reduced) this.stopped = true;
    });
  }

  private syncAutoplay(): void {
    const shouldRun = this.inView && !this.hovering && !this.stopped;
    if (shouldRun && !this.timer) {
      this.timer = setInterval(() => this.zone.run(() => this.step(1)), AUTOPLAY_MS);
    } else if (!shouldRun && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private step(dir: number): void {
    const n = this.items().length;
    this.active.update(i => (i + dir + n) % n);
  }

  /** Any user-driven change permanently stops autoplay so the page never moves on its own again. */
  manual(dir: number, index?: number): void {
    this.stopped = true;
    this.syncAutoplay();
    if (index !== undefined) this.active.set(index);
    else this.step(dir);
  }


  // ---- Scene animation helpers (full class strings so Tailwind can see them) ----

  /** Slides before the active one exit left; slides after it wait on the right. */
  /** True for the active slide once the section has scrolled into view (so the first entrance plays on screen). */
  on(i: number): boolean {
    return this.ready() && i === this.active();
  }

  private side(i: number): number {
    return i < this.active() ? -1 : 1;
  }

  canClass(i: number): string {
    if (this.on(i)) return 'translate-x-0 rotate-0 scale-100 opacity-100';
    return this.side(i) < 0
      ? '-translate-x-24 -rotate-12 scale-75 opacity-0'
      : 'translate-x-24 rotate-12 scale-75 opacity-0';
  }

  numberClass(i: number): string {
    if (this.on(i)) return 'translate-x-0 opacity-100';
    return this.side(i) < 0 ? '-translate-x-32 opacity-0' : 'translate-x-32 opacity-0';
  }

  rise(i: number): string {
    return this.on(i) ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0';
  }

  /** Stagger: later blocks wait a little longer to appear; leaving slides don't wait at all. */
  delay(i: number, step: number): number {
    return this.on(i) ? Math.round(300 + step * 70) : 0;
  }

  short(name: string): string {
    return name.replace(/^STAG\s+/, '');
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.observer?.disconnect();
    this.cleanups.forEach(fn => fn());
  }
}
