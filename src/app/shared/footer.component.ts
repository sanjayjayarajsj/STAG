import { Component, inject } from '@angular/core';
import { ScrollService } from '../services/scroll.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="aura aura-wine border-t border-white/[0.08]">
      <div class="container-x">
        <div class="grid grid-cols-2 gap-10 py-14 sm:py-16 md:grid-cols-4">
          <!-- Brand -->
          <div class="col-span-2">
            <a href="#hero" (click)="go($event, 0)" class="text-xl font-semibold uppercase tracking-widest text-white">STAG</a>
            <p class="mt-3 max-w-xs text-sm leading-relaxed text-neutral-300">
              Botanical craft refreshment poured to perfection. Real fruit extracts, micro-carbonated with pure alpine spring water.
            </p>
          </div>

          <!-- Editions -->
          <nav aria-label="Editions" class="flex flex-col gap-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-neutral-200">Editions</span>
            @for (p of products.products(); track p.id) {
              <a href="#collection" (click)="go($event, '#collection')" class="text-sm text-neutral-400 transition-colors hover:text-white">
                {{ shortName(p.name) }}
              </a>
            }
          </nav>

          <!-- Connect -->
          <nav aria-label="Connect" class="flex flex-col gap-3">
            <span class="text-xs font-semibold uppercase tracking-widest text-neutral-200">Connect</span>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-400 transition-colors hover:text-white">Instagram &#8599;</a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-400 transition-colors hover:text-white">TikTok &#8599;</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" class="text-sm text-neutral-400 transition-colors hover:text-white">X (Twitter) &#8599;</a>
            <a href="mailto:press@stagcraft.co" class="text-sm text-neutral-400 transition-colors hover:text-white">Press &amp; Hospitality</a>
          </nav>
        </div>

        <!-- Trust row + back to top -->
        <div class="flex flex-col items-start justify-between gap-5 border-t border-white/[0.06] py-6 sm:flex-row sm:items-center">
          <ul class="flex flex-wrap gap-x-6 gap-y-2 text-xs text-neutral-400">
            <li class="flex items-center gap-2"><span class="h-1 w-1 rounded-full bg-neutral-600"></span>100% Certified Organic</li>
            <li class="flex items-center gap-2"><span class="h-1 w-1 rounded-full bg-neutral-600"></span>Recyclable aluminium</li>
            <li class="flex items-center gap-2"><span class="h-1 w-1 rounded-full bg-neutral-600"></span>Free shipping over $45</li>
          </ul>
          <button type="button" (click)="scroll.scrollTo(0)" class="btn-ghost !px-4 !py-2 !normal-case !tracking-normal">
            Back to top
            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>

        <!-- Legal -->
        <div class="flex flex-col justify-between gap-3 border-t border-white/[0.06] py-6 text-xs text-neutral-500 md:flex-row md:items-center">
          <span>&copy; {{ year }} STAG Refreshment Co. All rights reserved.</span>
          <div class="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#" (click)="$event.preventDefault()" class="transition-colors hover:text-neutral-300">Privacy Policy</a>
            <a href="#" (click)="$event.preventDefault()" class="transition-colors hover:text-neutral-300">Terms of Service</a>
            <a href="#" (click)="$event.preventDefault()" class="transition-colors hover:text-neutral-300">Cookie Preferences</a>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  readonly scroll = inject(ScrollService);
  readonly products = inject(ProductService);
  readonly year = new Date().getFullYear();

  shortName(name: string): string {
    return name.replace(/^STAG\s+/, '');
  }

  go(event: Event, target: string | number): void {
    event.preventDefault();
    this.scroll.scrollTo(target);
  }
}
