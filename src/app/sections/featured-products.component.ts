import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, PLATFORM_ID, ViewChild, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductService, Product } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { ScrollService } from '../services/scroll.service';
import { RevealDirective } from '../shared/reveal.directive';

const ROTATION_INTERVAL_MS = 1500;

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section
      #sectionEl
      id="collection"
      class="section-y aura aura-rose relative overflow-hidden border-t border-white/[0.06]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Five flavours collection"
      (mouseenter)="onHover(true)"
      (mouseleave)="onHover(false)"
      (focusin)="onHover(true)"
      (focusout)="onHover(false)"
    >
      <!-- Background Ambient Glow dynamically matching active flavour -->
      <div
        class="pointer-events-none absolute -top-40 left-1/2 -z-[1] h-[28rem] w-[46rem] -translate-x-1/2 rounded-full opacity-30 blur-[130px] transition-all duration-700 ease-out"
        [style.background]="activeProduct().accent"
        aria-hidden="true"
      ></div>

      <div class="container-x">
        <!-- Section Header -->
        <div appReveal class="mb-10 flex flex-col justify-between gap-5 md:mb-14 md:flex-row md:items-end">
          <div>
            <div class="mb-3 flex items-center gap-3">
              <span class="eyebrow">The Collection</span>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase text-neutral-300">
                <span class="h-1.5 w-1.5 rounded-full animate-ping" [style.background]="activeProduct().accent"></span>
                Auto-Rotating · 1.5s
              </span>
            </div>
            <h2 class="h-section">
              Five flavours.<br />
              <span class="font-normal text-neutral-400">Pure botanical craft.</span>
            </h2>
          </div>
          <p class="lead max-w-sm">
            Cold-pressed whole fruits, micro-carbonation and untouched basalt spring water. A minimal sensory exploration.
          </p>
        </div>

        <!-- Minimal Flavour Navigation Tabs -->
        <div appReveal class="-mx-5 mb-8 overflow-x-auto px-5 no-scrollbar sm:mx-0 sm:px-0" role="tablist" aria-label="Choose flavour">
          <div class="flex w-max items-center gap-2 rounded-full border border-white/10 bg-card/70 p-1.5 backdrop-blur-md sm:w-auto">
            @for (p of products(); track p.id; let i = $index) {
              <button
                type="button"
                role="tab"
                (click)="select(i)"
                [attr.aria-selected]="active() === i"
                class="group relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all duration-300"
                [class]="active() === i ? 'bg-white text-ink shadow-lg shadow-white/10' : 'text-neutral-400 hover:text-white'"
              >
                <span
                  class="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125"
                  [style.background]="p.accent"
                ></span>
                <span>{{ p.flavor }}</span>
                @if (active() === i) {
                  <span class="text-[10px] opacity-60">0{{ i + 1 }}</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Rotating Carousel Stage -->
        <div
          #viewport
          class="relative mx-auto flex h-[32rem] w-full max-w-5xl items-center justify-center overflow-visible touch-pan-y sm:h-[30rem] lg:h-[28rem]"
        >
          @for (p of products(); track p.id; let i = $index) {
            @let d = diff(i);
            <div
              class="absolute inset-x-0 mx-auto w-full max-w-2xl transition-all duration-[650ms] cubic-bezier(0.16, 1, 0.3, 1) will-change-transform"
              [class]="positionClass(d)"
              (click)="onCardClick(i, d)"
              role="group"
              aria-roledescription="slide"
              [attr.aria-label]="p.flavor + ' (0' + (i + 1) + ' of 0' + products().length + ')'"
              [attr.aria-hidden]="d === 0 ? null : 'true'"
              [attr.inert]="d === 0 ? null : ''"
            >
              <article
                class="group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card/90 shadow-2xl transition-all duration-500 md:flex-row"
                [class]="d === 0 ? 'border-white/25 shadow-2xl ring-1 ring-white/10' : 'border-white/[0.08] hover:border-white/20'"
              >
                <!-- Flavour Glow Wash inside card -->
                <div
                  class="pointer-events-none absolute -right-20 -top-20 h-80 w-80 transition-opacity duration-700"
                  [class]="d === 0 ? 'opacity-70' : 'opacity-20'"
                  [style.background]="'radial-gradient(closest-side, ' + p.accent + '44, transparent)'"
                ></div>

                <!-- Product Photo & Flavour Origin -->
                <div class="relative shrink-0 overflow-hidden bg-surface aspect-[16/10] md:aspect-auto md:w-5/12">
                  <img
                    [src]="p.ingredientImage"
                    [alt]="p.flavor + ' botanical illustration'"
                    width="660"
                    height="440"
                    loading="lazy"
                    decoding="async"
                    class="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/30 md:bg-gradient-to-r md:from-black/10 md:to-black/55"></div>
                  
                  <span class="absolute left-4 top-4 text-xs font-semibold tabular-nums tracking-widest text-white/90">
                    0{{ i + 1 }} / 05
                  </span>

                  <span class="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    <span class="h-2 w-2 rounded-full" [style.background]="p.accent"></span>
                    {{ p.ingredients[0].name || p.flavor }}
                  </span>
                </div>

                <!-- Minimal Display Details -->
                <div class="relative flex flex-1 flex-col justify-between p-6 sm:p-7">
                  <div>
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-xs font-semibold uppercase tracking-widest" [style.color]="p.accent">
                        {{ p.category }} Edition
                      </span>
                      @if (p.badge) {
                        <span class="chip">{{ p.badge }}</span>
                      }
                    </div>

                    <h3 class="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {{ p.name }}
                    </h3>
                    <p class="mt-1 text-xs text-neutral-300 sm:text-sm">
                      {{ p.subtitle }}
                    </p>

                    <!-- Botanical ingredient tags -->
                    <ul class="mt-4 grid grid-cols-2 gap-2.5 border-t border-white/[0.08] pt-3">
                      @for (ing of p.ingredients.slice(0, 4); track ing.name) {
                        <li class="flex items-start gap-2 text-xs text-neutral-300">
                          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" [style.background]="p.accent"></span>
                          <div>
                            <span class="font-medium text-white">{{ ing.name }}</span>
                            <span class="block text-[10px] text-neutral-400">{{ ing.detail }}</span>
                          </div>
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Minimal Interactive Action: Taste Notes / Profile Exploration -->
                  <div class="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-neutral-300">
                        <span class="h-1.5 w-1.5 rounded-full" [style.background]="p.accent"></span>
                        {{ p.profile.carbonation }}
                      </span>
                    </div>

                    <button
                      type="button"
                      (click)="openTasteNotes(p, $event)"
                      class="btn-ghost !px-4 !py-2 !text-xs !rounded-full flex items-center gap-2 transition-all hover:bg-white hover:text-ink hover:border-white"
                      [attr.aria-label]="'Explore ' + p.name + ' taste notes'"
                    >
                      <span>Explore Notes</span>
                      <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            </div>
          }
        </div>

        <!-- Carousel Navigation & Indicators -->
        <div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-6">
          <!-- Counter & Progress Line -->
          <div class="flex items-center gap-3">
            <span class="text-xs font-mono tabular-nums text-neutral-400">
              0{{ active() + 1 }} / 0{{ products().length }}
            </span>
            <div class="flex items-center gap-1.5">
              @for (p of products(); track p.id; let i = $index) {
                <button
                  type="button"
                  (click)="select(i)"
                  [attr.aria-label]="'Go to ' + p.flavor"
                  class="h-1.5 rounded-full transition-all duration-300"
                  [class]="active() === i ? 'w-8 bg-white' : 'w-2 bg-white/20 hover:bg-white/40'"
                  [style.background]="active() === i ? p.accent : null"
                ></button>
              }
            </div>
          </div>

          <!-- Controls: Pause toggle & Prev/Next Arrows -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="toggleAutoPlay()"
              class="icon-btn !h-9 !w-9 !text-xs"
              [attr.aria-label]="isPaused() ? 'Resume automatic sliding' : 'Pause automatic sliding'"
              [title]="isPaused() ? 'Resume sliding' : 'Pause sliding'"
            >
              @if (isPaused()) {
                <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              } @else {
                <svg class="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              }
            </button>

            <button
              type="button"
              (click)="prev()"
              class="icon-btn !h-9 !w-9"
              aria-label="Previous edition"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            <button
              type="button"
              (click)="next()"
              class="icon-btn !h-9 !w-9"
              aria-label="Next edition"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FeaturedProductsComponent implements AfterViewInit, OnDestroy {
  readonly cart = inject(CartService);
  private readonly productsService = inject(ProductService);
  private readonly scroll = inject(ScrollService);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  @ViewChild('sectionEl', { static: true }) sectionEl!: ElementRef<HTMLElement>;
  @ViewChild('viewport', { static: true }) viewport!: ElementRef<HTMLElement>;

  readonly products = this.productsService.products;
  readonly active = signal(0);
  readonly isPaused = signal(false);

  readonly activeProduct = computed<Product>(() => this.products()[this.active()]);

  private timer: ReturnType<typeof setInterval> | null = null;
  private observer: IntersectionObserver | null = null;
  private inView = false;
  private hovering = false;
  private cleanups: (() => void)[] = [];

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;

    this.scroll.outside(() => {
      // Intersection observer to only rotate when visible
      this.observer = new IntersectionObserver(([e]) => {
        this.inView = e.isIntersecting;
        this.syncTimer();
      }, { threshold: 0.15 });

      this.observer.observe(this.sectionEl.nativeElement);

      // Touch swipe support (left = next, right = prev)
      const vp = this.viewport.nativeElement;
      let sx = 0, sy = 0;
      const on = (el: EventTarget, type: string, fn: (e: any) => void, opts?: AddEventListenerOptions) => {
        el.addEventListener(type, fn, opts);
        this.cleanups.push(() => el.removeEventListener(type, fn));
      };

      on(vp, 'touchstart', (e: TouchEvent) => {
        sx = e.touches[0].clientX;
        sy = e.touches[0].clientY;
      }, { passive: true });

      on(vp, 'touchend', (e: TouchEvent) => {
        const dx = sx - e.changedTouches[0].clientX;
        const dy = sy - e.changedTouches[0].clientY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          this.zone.run(() => {
            if (dx > 0) this.next();
            else this.prev();
          });
        }
      }, { passive: true });

      this.startTimer();
    });
  }

  /**
   * Cyclic distance calculation from active index:
   *  0: center active card
   *  1: next card on right
   *  2: far right card
   * -1: previous card on left
   * -2: far left card
   */
  diff(index: number): number {
    const total = this.products().length;
    let d = (index - this.active() + total) % total;
    if (d > total / 2) d -= total;
    return d;
  }

  /**
   * Returns classes for positioning each card in the rotating carousel.
   * Shift is from right to left as active index increments.
   */
  positionClass(d: number): string {
    if (d === 0) {
      // Active center card: sharp, highlighted, full opacity, top z-index
      return 'z-30 translate-x-0 scale-100 opacity-100 blur-0 pointer-events-auto';
    }
    if (d === 1) {
      // Next card arriving from right: scaled down, blurred, lower opacity
      return 'z-20 translate-x-[72%] sm:translate-x-[64%] lg:translate-x-[58%] scale-[0.84] sm:scale-[0.87] opacity-40 sm:opacity-55 blur-[4px] sm:blur-[5px] pointer-events-auto cursor-pointer';
    }
    if (d === -1) {
      // Previous card exiting to left: scaled down, blurred, lower opacity
      return 'z-20 -translate-x-[72%] sm:-translate-x-[64%] lg:-translate-x-[58%] scale-[0.84] sm:scale-[0.87] opacity-40 sm:opacity-55 blur-[4px] sm:blur-[5px] pointer-events-auto cursor-pointer';
    }
    if (d === 2) {
      // Far right card
      return 'z-10 translate-x-[125%] sm:translate-x-[115%] scale-[0.72] opacity-10 sm:opacity-20 blur-[8px] pointer-events-none';
    }
    // Far left card (d === -2)
    return 'z-10 -translate-x-[125%] sm:-translate-x-[115%] scale-[0.72] opacity-10 sm:opacity-20 blur-[8px] pointer-events-none';
  }

  onCardClick(index: number, d: number): void {
    if (d !== 0) {
      this.select(index);
    }
  }

  select(index: number): void {
    const total = this.products().length;
    this.active.set((index + total) % total);
    this.restartTimer();
  }

  next(): void {
    const total = this.products().length;
    this.active.update(i => (i + 1) % total);
    this.restartTimer();
  }

  prev(): void {
    const total = this.products().length;
    this.active.update(i => (i - 1 + total) % total);
    this.restartTimer();
  }

  toggleAutoPlay(): void {
    this.isPaused.update(p => !p);
    this.syncTimer();
  }

  onHover(hovering: boolean): void {
    this.hovering = hovering;
    this.syncTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.inView && !this.hovering && !this.isPaused() && document.visibilityState === 'visible') {
        this.zone.run(() => {
          const total = this.products().length;
          this.active.update(i => (i + 1) % total);
        });
      }
    }, ROTATION_INTERVAL_MS);
  }

  private restartTimer(): void {
    if (this.isBrowser) {
      this.startTimer();
    }
  }

  private syncTimer(): void {
    const shouldRun = this.inView && !this.hovering && !this.isPaused();
    if (!shouldRun && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    } else if (shouldRun && !this.timer) {
      this.startTimer();
    }
  }

  openTasteNotes(product: Product, event: Event): void {
    event.stopPropagation();
    this.cart.openQuickView(product);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.observer?.disconnect();
    this.cleanups.forEach(fn => fn());
  }
}
