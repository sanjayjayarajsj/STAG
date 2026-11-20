import { Component, ElementRef, HostListener, ViewChild, effect, inject } from '@angular/core';
import { CartService } from '../services/cart.service';
import { ScrollService } from '../services/scroll.service';
import { trapTab } from './a11y';

@Component({
  selector: 'app-not-available-dialog',
  standalone: true,
  template: `
    @if (cart.isNotAvailableOpen()) {
      <div
        class="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
        (keydown)="onKeydown($event)"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 animate-fade-in bg-black/75 backdrop-blur-sm"
          (click)="close()"
        ></div>

        <!-- Dialog Card -->
        <div
          #panel
          role="dialog"
          aria-modal="true"
          aria-labelledby="not-available-title"
          tabindex="-1"
          data-lenis-prevent
          class="relative z-10 w-full max-w-lg animate-pop-in overflow-hidden rounded-3xl border border-white/10 bg-card/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <!-- Ambient Glow -->
          <div
            class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rose-500/20 blur-3xl"
            aria-hidden="true"
          ></div>
          <div
            class="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl"
            aria-hidden="true"
          ></div>

          <!-- Close button -->
          <button
            type="button"
            (click)="close()"
            class="icon-btn absolute right-4 top-4 z-20 !h-9 !w-9 !border-white/10 bg-white/[0.04] text-neutral-400 hover:text-white"
            aria-label="Close dialog"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>

          <div class="relative z-10">
            <!-- Icon Badge -->
            <div class="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.05] text-amber-400 shadow-inner">
              <svg class="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <!-- Header -->
            <div class="mt-4">
              <span class="eyebrow !text-amber-400/90">Orders Currently Paused</span>
              <h2 id="not-available-title" class="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Not Available Now
              </h2>
            </div>

            <!-- Body Message -->
            <p class="mt-3 text-sm leading-relaxed text-neutral-300">
              Thank you for your interest in STAG. We are currently hand-crafting and conditioning our next limited batch of cold-pressed editions. Online checkout and ordering are temporarily unavailable.
            </p>

            <div class="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs text-neutral-400">
              <div class="flex items-center gap-2 font-medium text-white">
                <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Next Batch Release in Preparation
              </div>
              <p class="mt-1 leading-relaxed">
                Reserve your spot on our private mailing list to get early access the moment new inventory drops.
              </p>
            </div>

            <!-- Actions -->
            <div class="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                (click)="close()"
                class="btn-ghost w-full sm:w-auto"
              >
                Close
              </button>
              <button
                type="button"
                (click)="notifyMe()"
                class="btn-primary w-full sm:w-auto"
              >
                Notify Me on Drop
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class NotAvailableDialogComponent {
  readonly cart = inject(CartService);
  private readonly scroll = inject(ScrollService);

  private panelEl: HTMLElement | null = null;
  private locked = false;
  private returnFocus: HTMLElement | null = null;

  @ViewChild('panel') set panel(ref: ElementRef<HTMLElement> | undefined) {
    this.panelEl = ref?.nativeElement ?? null;
    if (this.panelEl) setTimeout(() => this.panelEl?.focus(), 30);
  }

  constructor() {
    effect(() => {
      const isOpen = this.cart.isNotAvailableOpen();
      if (isOpen === this.locked) return;
      this.locked = isOpen;
      if (isOpen) {
        this.scroll.lock();
        if (this.scroll.isBrowser) this.returnFocus = document.activeElement as HTMLElement | null;
      } else {
        this.scroll.unlock();
        this.returnFocus?.focus?.();
        this.returnFocus = null;
      }
    });
  }

  close(): void {
    this.cart.closeNotAvailableDialog();
  }

  notifyMe(): void {
    this.close();
    // Scroll to newsletter section smoothly
    setTimeout(() => {
      this.scroll.scrollTo('#newsletter');
    }, 150);
  }

  onKeydown(event: KeyboardEvent): void {
    trapTab(event, this.panelEl);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cart.isNotAvailableOpen()) this.close();
  }
}
