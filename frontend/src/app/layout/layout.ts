import { Component, inject, signal, OnInit, computed, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { Toast } from '../toast/toast';
import { CommandPalette } from '../command-palette/command-palette';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { Achievement } from '../achievement/achievement';
import { triggerHaptic } from '../utils/haptic';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast, CommandPalette, Achievement],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit, OnDestroy {
  auth = inject(AuthService);
  config = inject(ConfigService);

  @HostListener('window:keydown', ['$event'])
  handleGlobalHotkey(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      triggerHaptic([20, 40]);
      this.config.toggleFocusZone();
    }
  }

  cmdPaletteService = inject(CommandPaletteService);

  isDark = signal(false);
  sidebarOpen = signal(false);
  sidebarCollapsed = signal(false);
  routeAnimating = signal(false);
  currentPalette = signal('default');
  navGroupsCollapsed = signal<Record<string, boolean>>(this.loadNavGroupState());

  private router = inject(Router);
  private routerSub: Subscription | null = null;

  userXP = computed(() => this.auth.user()?.totalExperience ?? 0);
  userLevel = computed(() => Math.floor(this.userXP() / 100) + 1);
  xpProgress = computed(() => this.userXP() % 100);
  userCoins = computed(() => this.auth.user()?.coins ?? 0);

  isFocusZoneActive = computed(() => this.config.focusZone());

  toggleFocusZone(): void {
    triggerHaptic([20, 40]);
    this.config.toggleFocusZone();
  }

  avatarGlowClass = computed(() => {
    const level = this.userLevel();
    if (level >= 20) return 'avatar-glow-20';
    if (level >= 10) return 'avatar-glow-10';
    if (level >= 5) return 'avatar-glow-5';
    return 'avatar-glow-1';
  });

  ngOnInit(): void {
    const saved = localStorage.getItem('kognita_theme');
    if (saved === 'dark') {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedPalette = localStorage.getItem('kognita_palette');
    if (savedPalette && savedPalette !== 'default') {
      this.currentPalette.set(savedPalette);
      document.documentElement.setAttribute('data-palette', savedPalette);
    }

    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          this.routeAnimating.set(false);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            this.routeAnimating.set(true);
          }));
        });
      } else {
        this.routeAnimating.set(false);
        setTimeout(() => this.routeAnimating.set(true), 20);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleTheme(): void {
    triggerHaptic([15, 30]);
    this.isDark.update((v) => !v);
    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kognita_theme', theme);
  }

  toggleSidebar(): void {
    triggerHaptic([15, 30]);
    this.sidebarOpen.update((v) => !v);
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleCollapse(): void {
    triggerHaptic(15);
    this.sidebarCollapsed.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  onNavClick(): void {
    triggerHaptic([15, 30]);
    this.closeSidebar();
  }

  openCommandPalette(): void {
    triggerHaptic([15, 30]);
    this.cmdPaletteService.open();
  }

  toggleNavGroup(group: string): void {
    this.navGroupsCollapsed.update((state) => {
      const next = { ...state, [group]: !state[group] };
      localStorage.setItem('kognita_nav_groups', JSON.stringify(next));
      return next;
    });
  }

  private loadNavGroupState(): Record<string, boolean> {
    try {
      const saved = localStorage.getItem('kognita_nav_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { main: false, progress: false, tools: false };
  }

  setPalette(palette: string): void {
    this.currentPalette.set(palette);
    if (palette === 'default') {
      document.documentElement.removeAttribute('data-palette');
      localStorage.removeItem('kognita_palette');
    } else {
      document.documentElement.setAttribute('data-palette', palette);
      localStorage.setItem('kognita_palette', palette);
    }
  }
}
