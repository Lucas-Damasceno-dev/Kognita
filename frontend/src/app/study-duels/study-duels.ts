import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { Tilt3dDirective } from '../directives/tilt-3d.directive';

export interface DuelQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

@Component({
  selector: 'app-study-duels',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  templateUrl: './study-duels.html',
  styleUrl: './study-duels.css',
})
export class StudyDuels implements OnInit {
  auth = inject(AuthService);
  private toast = inject(ToastService);
  private confetti = inject(ConfettiService);

  activeTab = signal<'lobby' | 'battle' | 'result'>('lobby');

  // Rival Types
  botRivalName = signal('IA Rival — Foco Bot (Lvl 12)');
  botRivalAvatar = signal('🤖');

  // Battle State
  currentQuestionIndex = signal(0);
  playerScore = signal(0);
  rivalScore = signal(0);
  comboMultiplier = signal(1);
  roundTimeLeft = signal(10);
  private timerId: any = null;

  questions = signal<DuelQuestion[]>([
    {
      id: 'q1',
      question: 'Qual cláusula SQL é utilizada para filtrar registros agregados com a cláusula GROUP BY?',
      options: ['WHERE', 'HAVING', 'FILTER', 'ORDER BY'],
      correctAnswer: 1,
    },
    {
      id: 'q2',
      question: 'No paradigma Orientado a Objetos, o que caracteriza o conceito de Polimorfismo?',
      options: [
        'Capacidade de uma classe derivar de múltiplas superclasses',
        'Incapacidade de alterar métodos herdados',
        'Capacidade de tratar objetos de tipos diferentes com a mesma interface',
        'Ocultação de atributos privados',
      ],
      correctAnswer: 2,
    },
    {
      id: 'q3',
      question: 'Qual estrutura de dados opera no princípio LIFO (Last-In, First-Out)?',
      options: ['Fila (Queue)', 'Pilha (Stack)', 'Árvore Binária', 'Lista Encadeada'],
      correctAnswer: 1,
    },
    {
      id: 'q4',
      question: 'Qual o código de status HTTP que indica recurso não encontrado?',
      options: ['200 OK', '401 Unauthorized', '404 Not Found', '500 Server Error'],
      correctAnswer: 2,
    },
    {
      id: 'q5',
      question: 'Em Angular, qual primitiva de reatividade foi introduzida para substituir a dependência pura do Zone.js?',
      options: ['Observables', 'Signals', 'Promises', 'Redux Store'],
      correctAnswer: 1,
    },
  ]);

  currentQuestion = computed(() => {
    const list = this.questions();
    const idx = this.currentQuestionIndex();
    return idx < list.length ? list[idx] : null;
  });

  ngOnInit(): void {}

  startBattle(): void {
    this.playerScore.set(0);
    this.rivalScore.set(0);
    this.comboMultiplier.set(1);
    this.currentQuestionIndex.set(0);
    this.activeTab.set('battle');
    this.startRoundTimer();
  }

  private startRoundTimer(): void {
    this.roundTimeLeft.set(10);
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      this.roundTimeLeft.update((t) => t - 1);
      if (this.roundTimeLeft() <= 0) {
        this.handleTimeout();
      }
    }, 1000);
  }

  answerQuestion(optionIndex: number): void {
    if (this.timerId) clearInterval(this.timerId);

    const q = this.currentQuestion();
    if (!q) return;

    const isCorrect = optionIndex === q.correctAnswer;
    if (isCorrect) {
      const timeBonus = this.roundTimeLeft() * 10;
      const points = (100 + timeBonus) * this.comboMultiplier();
      this.playerScore.update((s) => s + points);
      this.comboMultiplier.update((c) => Math.min(3, c + 0.5));
      this.toast.success(`Resposta Correta! +${points} pts 🔥`);
    } else {
      this.comboMultiplier.set(1);
      this.toast.error('Resposta Incorreta!');
    }

    // Bot Rival simulated answer
    const botCorrect = Math.random() > 0.3;
    if (botCorrect) {
      this.rivalScore.update((s) => s + Math.floor(80 + Math.random() * 50));
    }

    this.nextRound();
  }

  private handleTimeout(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.comboMultiplier.set(1);
    this.toast.error('Tempo esgotado para esta pergunta!');
    this.nextRound();
  }

  private nextRound(): void {
    const nextIdx = this.currentQuestionIndex() + 1;
    if (nextIdx >= this.questions().length) {
      this.finishBattle();
    } else {
      this.currentQuestionIndex.set(nextIdx);
      this.startRoundTimer();
    }
  }

  private finishBattle(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.activeTab.set('result');

    if (this.playerScore() > this.rivalScore()) {
      this.confetti.fireStreakCelebration();
      this.toast.success('🏆 VOCÊ VENCEU O DUELO! +150 XP e +20 Moedas');
    } else {
      this.toast.info('Duelo encerrado! Bom combate, continue praticando!');
    }
  }

  exitBattle(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.activeTab.set('lobby');
  }
}
