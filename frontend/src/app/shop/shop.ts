import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

interface ShopItem {
  id: string;
  type: 'freeze' | 'title' | 'border' | 'theme';
  name: string;
  description: string;
  cost: number;
  value: string; // The class name or actual title
  icon: string;
}

@Component({
  selector: 'app-shop',
  imports: [CommonModule],
  templateUrl: './shop.html',
  styleUrl: './shop.css'
})
export class Shop implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  loading = signal(false);

  shopItems: ShopItem[] = [
    {
      id: 'freeze',
      type: 'freeze',
      name: 'Congelador de Sequência',
      description: 'Preserva sua sequência (streak) se você esquecer de estudar por um dia.',
      cost: 200,
      value: 'freeze',
      icon: '❄️'
    },
    {
      id: 'title_survivor',
      type: 'title',
      name: 'Título: Sobrevivente do Código',
      description: 'Defina seu título de perfil como "Sobrevivente do Código".',
      cost: 100,
      value: 'Sobrevivente do Código',
      icon: '🛡️'
    },
    {
      id: 'title_bughunter',
      type: 'title',
      name: 'Título: Destruidor de Bugs',
      description: 'Defina seu título de perfil como "Destruidor de Bugs".',
      cost: 250,
      value: 'Destruidor de Bugs',
      icon: '🐞'
    },
    {
      id: 'title_elite',
      type: 'title',
      name: 'Título: Codificador de Elite',
      description: 'Defina seu título de perfil como "Codificador de Elite".',
      cost: 500,
      value: 'Codificador de Elite',
      icon: '⚡'
    },
    {
      id: 'title_master',
      type: 'title',
      name: 'Título: Mestre da Resiliência',
      description: 'Defina seu título de perfil como "Mestre da Resiliência".',
      cost: 800,
      value: 'Mestre da Resiliência',
      icon: '🧘'
    },
    {
      id: 'title_legend',
      type: 'title',
      name: 'Título: Lendário Sem IA',
      description: 'Defina seu título de perfil como "Lendário Sem IA".',
      cost: 1200,
      value: 'Lendário Sem IA',
      icon: '🔥'
    },
    {
      id: 'border_bronze',
      type: 'border',
      name: 'Borda: Bronze',
      description: 'Equipa uma moldura bronzeada brilhante em volta do seu avatar.',
      cost: 150,
      value: 'border-bronze',
      icon: '🥉'
    },
    {
      id: 'border_silver',
      type: 'border',
      name: 'Borda: Prata',
      description: 'Equipa uma moldura prateada elegante em volta do seu avatar.',
      cost: 300,
      value: 'border-silver',
      icon: '🥈'
    },
    {
      id: 'border_gold',
      type: 'border',
      name: 'Borda: Ouro',
      description: 'Equipa uma moldura dourada majestosa em volta do seu avatar.',
      cost: 500,
      value: 'border-gold',
      icon: '🥇'
    },
    {
      id: 'border_rainbow',
      type: 'border',
      name: 'Borda: Arco-íris Neon',
      description: 'Equipa uma moldura colorida animada em neon em volta do seu avatar.',
      cost: 1000,
      value: 'border-rainbow',
      icon: '🌈'
    },
    {
      id: 'theme_cyberpunk',
      type: 'theme',
      name: 'Tema: Cyberpunk Neon 🌌',
      description: 'Fundo ultra escuro (#050811) com detalhes em ciano neon (#00F0FF) e magenta.',
      cost: 450,
      value: 'cyberpunk',
      icon: '🌌'
    },
    {
      id: 'theme_tokyonight',
      type: 'theme',
      name: 'Tema: Tokyo Night 🌸',
      description: 'Estética japonesa noturna com azul índigo (#1A1B26) e acentos em flor de cerejeira.',
      cost: 450,
      value: 'tokyonight',
      icon: '🌸'
    },
    {
      id: 'theme_nordic',
      type: 'theme',
      name: 'Tema: Nordic Slate 🧊',
      description: 'Fundo cinza azulado fosco minimalista com contraste suave e limpo.',
      cost: 300,
      value: 'nordic',
      icon: '🧊'
    }
  ];

  ngOnInit(): void {
    // Wait for user to be loaded
    this.auth.waitForUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  isEquipped(item: ShopItem): boolean {
    const user = this.auth.user();
    if (!user) return false;
    if (item.type === 'title') {
      return user.title === item.value;
    }
    if (item.type === 'border') {
      return user.avatarBorder === item.value;
    }
    if (item.type === 'theme') {
      return localStorage.getItem('kognita_palette') === item.value;
    }
    return false;
  }

  buyItem(item: ShopItem): void {
    const user = this.auth.user();
    if (!user) return;

    if (user.totalExperience < item.cost) {
      this.toast.error('Você não tem XP suficiente para comprar este item.');
      return;
    }

    this.loading.set(true);

    if (item.type === 'freeze') {
      this.api.buyStreakFreeze()
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (updatedUser) => {
            this.auth.updateUserSession(updatedUser);
            this.toast.success('Congelador de Sequência adquirido!');
          },
          error: () => {
            this.toast.error('Erro ao comprar item.');
          }
        });
    } else if (item.type === 'title') {
      this.api.buyTitle(item.value, item.cost)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (updatedUser) => {
            this.auth.updateUserSession(updatedUser);
            this.toast.success(`Título "${item.value}" comprado e equipado!`);
          },
          error: () => {
            this.toast.error('Erro ao comprar título.');
          }
        });
    } else if (item.type === 'border') {
      this.api.buyBorder(item.value, item.cost)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => this.loading.set(false))
        )
        .subscribe({
          next: (updatedUser) => {
            this.auth.updateUserSession(updatedUser);
            this.toast.success('Borda de avatar comprada e equipada!');
          },
          error: () => {
            this.toast.error('Erro ao comprar borda.');
          }
        });
    } else if (item.type === 'theme') {
      document.documentElement.setAttribute('data-palette', item.value);
      localStorage.setItem('kognita_palette', item.value);
      this.loading.set(false);
      this.toast.success(`Tema "${item.name}" equipado com sucesso! 🎨`);
    }
  }
}
