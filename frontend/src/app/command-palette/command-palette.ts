import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandPaletteService } from './command-palette.service';
import { ConfigService } from '../services/config.service';
import { triggerHaptic } from '../utils/haptic';

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: 'Ações' | 'Navegação';
  icon: string;
  route?: string;
  actionKey?: 'toggleTheme' | 'toggleChallengeMode';
  shortcut?: string;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.css',
})
export class CommandPalette {
  paletteService = inject(CommandPaletteService);
  private router = inject(Router);
  private configService = inject(ConfigService);
  private elementRef = inject(ElementRef);

  toggleThemeRequest = output<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('resultsList') resultsList!: ElementRef<HTMLDivElement>;

  searchQuery = signal('');
  selectedIndex = signal(0);

  readonly items: CommandItem[] = [
    // Ações Rápidas
    {
      id: 'act-new-task',
      title: 'Criar Tarefa / Desafio',
      description: 'Ir para o painel de desafios e adicionar metas',
      category: 'Ações',
      icon: 'check-square',
      route: '/tasks',
      shortcut: 'Alt + T',
    },
    {
      id: 'act-start-pomo',
      title: 'Iniciar Pomodoro',
      description: 'Iniciar cronômetro de foco e ciclos de estudo',
      category: 'Ações',
      icon: 'clock',
      route: '/pomodoro',
      shortcut: 'Alt + P',
    },
    {
      id: 'act-review-flashcards',
      title: 'Revisar Flashcards',
      description: 'Praticar cartões de memória com repetição espaçada',
      category: 'Ações',
      icon: 'layers',
      route: '/flashcards',
      shortcut: 'Alt + F',
    },
    {
      id: 'act-error-diary',
      title: 'Buscar no Diário de Erros',
      description: 'Consultar registro de falhas e revisões pendentes',
      category: 'Ações',
      icon: 'alert-triangle',
      route: '/error-diary',
      shortcut: 'Alt + E',
    },
    {
      id: 'act-practice',
      title: 'Nova Prática / Simulado',
      description: 'Fazer bateria de questões de fixação',
      category: 'Ações',
      icon: 'target',
      route: '/practice',
    },
    {
      id: 'act-toggle-theme',
      title: 'Alternar Tema (Claro / Escuro)',
      description: 'Trocar entre o modo visual claro e escuro',
      category: 'Ações',
      icon: 'sun-moon',
      actionKey: 'toggleTheme',
    },
    {
      id: 'act-toggle-mode',
      title: 'Alternar Modo de Estudo',
      description: 'Mudar entre Zona de Prova e Modo Livre',
      category: 'Ações',
      icon: 'zap',
      actionKey: 'toggleChallengeMode',
    },

    // Navegação
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Visão geral, estatísticas rápidas e resumo diário',
      category: 'Navegação',
      icon: 'grid',
      route: '/dashboard',
    },
    {
      id: 'nav-tasks',
      title: 'Desafios & Tarefas',
      description: 'Lista completa de missões e objetivos',
      category: 'Navegação',
      icon: 'check-square',
      route: '/tasks',
    },
    {
      id: 'nav-pomodoro',
      title: 'Foco (Timer Pomodoro)',
      description: 'Cronômetro pomodoro e sessões ativas',
      category: 'Navegação',
      icon: 'clock',
      route: '/pomodoro',
    },
    {
      id: 'nav-practice',
      title: 'Prática & Questões',
      description: 'Simulados e resolução de questões',
      category: 'Navegação',
      icon: 'target',
      route: '/practice',
    },
    {
      id: 'nav-flashcards',
      title: 'Flashcards',
      description: 'Decks de estudo e memorização',
      category: 'Navegação',
      icon: 'layers',
      route: '/flashcards',
    },
    {
      id: 'nav-error-diary',
      title: 'Diário de Erros',
      description: 'Análise de falhas e dúvidas catalogadas',
      category: 'Navegação',
      icon: 'alert-triangle',
      route: '/error-diary',
    },
    {
      id: 'nav-subjects',
      title: 'Matérias & Tópicos',
      description: 'Gerenciar disciplinas e seus tópicos',
      category: 'Navegação',
      icon: 'book-open',
      route: '/subjects',
    },
    {
      id: 'nav-analytics',
      title: 'Analytics & Desempenho',
      description: 'Métricas, gráficos e tempo de estudo',
      category: 'Navegação',
      icon: 'bar-chart-2',
      route: '/analytics',
    },
    {
      id: 'nav-leaderboard',
      title: 'Ranking & Gamificação',
      description: 'Tabela de classificação e XP',
      category: 'Navegação',
      icon: 'trophy',
      route: '/leaderboard',
    },
    {
      id: 'nav-history',
      title: 'Histórico de Estudo',
      description: 'Log cronológico de todas as sessões',
      category: 'Navegação',
      icon: 'history',
      route: '/history',
    },
    {
      id: 'nav-calendar',
      title: 'Calendário',
      description: 'Agenda de estudos e eventos previstos',
      category: 'Navegação',
      icon: 'calendar',
      route: '/calendar',
    },
    {
      id: 'nav-job-analyzer',
      title: 'Analisador de Vagas',
      description: 'Mapeamento de editais e competências',
      category: 'Navegação',
      icon: 'briefcase',
      route: '/job-analyzer',
    },
    {
      id: 'nav-profile',
      title: 'Perfil do Usuário',
      description: 'Conquistas, títulos e dados da conta',
      category: 'Navegação',
      icon: 'user',
      route: '/profile',
    },
    {
      id: 'nav-importer',
      title: 'Importar Dados',
      description: 'Importar matérias e flashcards via arquivo',
      category: 'Navegação',
      icon: 'download',
      route: '/importer',
    },
  ];

  filteredItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) {
      return this.items;
    }
    return this.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  });

  constructor() {
    effect(() => {
      if (this.paletteService.isOpen()) {
        this.searchQuery.set('');
        this.selectedIndex.set(0);
        setTimeout(() => {
          this.searchInput?.nativeElement?.focus();
        }, 50);
      }
    });

    effect(() => {
      this.searchQuery();
      this.selectedIndex.set(0);
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      triggerHaptic(20);
      this.paletteService.toggle();
    } else if (this.paletteService.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        this.trapFocus(event);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.navigateSelection(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.navigateSelection(-1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.selectCurrent();
      }
    }
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusableSelector = 'input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])';
    const elements = this.elementRef.nativeElement.querySelectorAll(focusableSelector);
    if (elements.length === 0) return;
    const first = elements[0] as HTMLElement;
    const last = elements[elements.length - 1] as HTMLElement;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        first?.focus();
      }
    }
  }

  navigateSelection(direction: number): void {
    const total = this.filteredItems().length;
    if (total === 0) return;
    triggerHaptic(10);
    let nextIndex = this.selectedIndex() + direction;
    if (nextIndex < 0) {
      nextIndex = total - 1;
    } else if (nextIndex >= total) {
      nextIndex = 0;
    }
    this.selectedIndex.set(nextIndex);
    this.scrollToSelectedItem();
  }

  scrollToSelectedItem(): void {
    setTimeout(() => {
      const container = this.resultsList?.nativeElement;
      if (!container) return;
      const selectedEl = container.querySelector('.cmd-item.selected') as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }

  setSelectedIndex(index: number): void {
    this.selectedIndex.set(index);
  }

  selectItem(item: CommandItem): void {
    triggerHaptic([15, 30]);
    this.close();

    if (item.actionKey === 'toggleTheme') {
      this.toggleThemeRequest.emit();
    } else if (item.actionKey === 'toggleChallengeMode') {
      this.configService.toggleChallengeMode();
    } else if (item.route) {
      this.router.navigateByUrl(item.route);
    }
  }

  selectCurrent(): void {
    const items = this.filteredItems();
    const index = this.selectedIndex();
    if (items.length > 0 && index >= 0 && index < items.length) {
      this.selectItem(items[index]);
    }
  }

  close(): void {
    this.paletteService.close();
  }

  highlightMatch(text: string): string {
    const q = this.searchQuery().trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="cmd-highlight">$1</mark>');
  }
}
