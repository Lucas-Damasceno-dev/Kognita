import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { Toast } from '../toast/toast';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout implements OnInit {
  auth = inject(AuthService);
  config = inject(ConfigService);

  isDark = signal(false);
  sidebarOpen = signal(false);

  userXP = computed(() => this.auth.user()?.totalExperience ?? 0);
  userLevel = computed(() => Math.floor(this.userXP() / 100) + 1);
  xpProgress = computed(() => this.userXP() % 100);

  ngOnInit(): void {
    const saved = localStorage.getItem('kognita_theme');
    if (saved === 'dark') {
      this.isDark.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }

  toggleTheme(): void {
    this.isDark.update((v) => !v);
    const theme = this.isDark() ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kognita_theme', theme);
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
