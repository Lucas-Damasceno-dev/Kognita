import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ConfettiService } from '../services/confetti.service';
import { Subject } from '../models/subject';
import { Tilt3dDirective } from '../directives/tilt-3d.directive';

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

@Component({
  selector: 'app-exam-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, Tilt3dDirective],
  templateUrl: './exam-simulator.html',
  styleUrl: './exam-simulator.css',
})

export class ExamSimulator implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private confetti = inject(ConfettiService);

  subjects = signal<Subject[]>([]);
  selectedSubjectId = signal<string>('');
  questionCount = signal<number>(10);
  timeLimitMinutes = signal<number>(15);

  activeState = signal<'config' | 'exam' | 'result'>('config');

  // Exam state
  questions = signal<ExamQuestion[]>([]);
  userAnswers = signal<number[]>([]);
  currentQuestionIdx = signal<number>(0);
  timeLeftSeconds = signal<number>(0);
  private timerId: any = null;

  currentQuestion = computed(() => {
    const list = this.questions();
    const idx = this.currentQuestionIdx();
    return idx < list.length ? list[idx] : null;
  });

  // Results calculation
  finalScore = signal<number>(0);
  isPassed = signal<boolean>(false);
  correctAnswersCount = signal<number>(0);

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.api.getSubjects(user.id).subscribe((subjs) => this.subjects.set(subjs));
    }
  }

  startExam(): void {
    const questionsList: ExamQuestion[] = [
      {
        id: '1',
        question: 'Qual cláusula em SQL é utilizada para agrupar registros e aplicar funções de agregação como SUM e COUNT?',
        options: ['ORDER BY', 'GROUP BY', 'HAVING', 'WHERE'],
        correctAnswerIndex: 1,
      },
      {
        id: '2',
        question: 'No paradigma de Orientação a Objetos, qual princípio garante que uma classe derivada pode substituir a superclasse sem alterar a corretude do programa?',
        options: [
          'Princípio de Inversão de Dependência (DIP)',
          'Princípio de Substituição de Liskov (LSP)',
          'Princípio da Responsabilidade Única (SRP)',
          'Princípio Aberto/Fechado (OCP)',
        ],
        correctAnswerIndex: 1,
      },
      {
        id: '3',
        question: 'Em relação ao modelo OSI de Redes de Computadores, em qual camada operam os protocolos HTTP, HTTPS, SSH e DNS?',
        options: ['Camada de Transporte', 'Camada de Rede', 'Camada de Aplicação', 'Camada de Enlace'],
        correctAnswerIndex: 2,
      },
      {
        id: '4',
        question: 'Em Angular 17+, qual primitiva de reatividade síncrona foi introduzida para melhorar o desempenho e simplificar a detecção de mudanças sem depender exclusivamente de Zone.js?',
        options: ['BehaviorSubject', 'Signals', 'Promises', 'Redux Store'],
        correctAnswerIndex: 1,
      },
      {
        id: '5',
        question: 'Qual das opções abaixo descreve a garantia de Consistência no acrônimo ACID de Banco de Dados?',
        options: [
          'Garante que todas as transações ocorram simultaneamente',
          'Garante que o banco de dados mude de um estado válido para outro estado válido',
          'Garante que os dados fiquem salvos em disco permanente',
          'Garante que nenhuma transação veja o estado intermediário de outra',
        ],
        correctAnswerIndex: 1,
      },
      {
        id: '6',
        question: 'O que o comando git rebase faz em relação ao git merge?',
        options: [
          'Cria um novo commit de mesclagem combinando dois históricos',
          'Reaplica os commits da branch atual no topo de outra branch de forma linear',
          'Apaga todos os commits não enviados para o repositório remoto',
          'Desfaz o último commit sem alterar os arquivos locais',
        ],
        correctAnswerIndex: 1,
      },
      {
        id: '7',
        question: 'Em conteinerização com Docker, qual instrução do Dockerfile é executada em tempo de execução ao iniciar o container?',
        options: ['RUN', 'CMD', 'FROM', 'ENV'],
        correctAnswerIndex: 1,
      },
      {
        id: '8',
        question: 'Em complexidade de algoritmos, qual é a notação de tempo médio da busca binária em um array ordenado de tamanho N?',
        options: ['O(1)', 'O(N)', 'O(log N)', 'O(N log N)'],
        correctAnswerIndex: 2,
      },
      {
        id: '9',
        question: 'Qual o código de status HTTP retornado quando uma requisição é bem-sucedida e um novo recurso foi criado no servidor?',
        options: ['200 OK', '201 Created', '204 No Content', '302 Found'],
        correctAnswerIndex: 1,
      },
      {
        id: '10',
        question: 'Em JavaScript, qual o comportamento da keyword "const"?',
        options: [
          'Impede qualquer modificação nos valores de um objeto atribuído',
          'Impede que a variável seja reatribuída, mas permite modificar propriedades de objetos',
          'Permite reatribuição dentro do mesmo escopo de bloco',
          'Possui escopo global automático',
        ],
        correctAnswerIndex: 1,
      },
    ];

    const limit = Math.min(this.questionCount(), questionsList.length);
    const selected = questionsList.slice(0, limit);

    this.questions.set(selected);
    this.userAnswers.set(new Array(selected.length).fill(-1));
    this.currentQuestionIdx.set(0);
    this.timeLeftSeconds.set(this.timeLimitMinutes() * 60);

    this.activeState.set('exam');
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      this.timeLeftSeconds.update((t) => t - 1);
      if (this.timeLeftSeconds() <= 0) {
        this.finishExam();
      }
    }, 1000);
  }

  selectOption(optionIdx: number): void {
    const qIdx = this.currentQuestionIdx();
    this.userAnswers.update((answers) => {
      const copy = [...answers];
      copy[qIdx] = optionIdx;
      return copy;
    });
  }

  nextQuestion(): void {
    if (this.currentQuestionIdx() < this.questions().length - 1) {
      this.currentQuestionIdx.update((i) => i + 1);
    }
  }

  prevQuestion(): void {
    if (this.currentQuestionIdx() > 0) {
      this.currentQuestionIdx.update((i) => i - 1);
    }
  }

  finishExam(): void {
    if (this.timerId) clearInterval(this.timerId);

    const questionsList = this.questions();
    const answersList = this.userAnswers();
    let correctCount = 0;

    questionsList.forEach((q, idx) => {
      if (answersList[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const score = parseFloat(((correctCount / questionsList.length) * 10).toFixed(1));
    const passed = score >= 7.0;

    this.correctAnswersCount.set(correctCount);
    this.finalScore.set(score);
    this.isPassed.set(passed);
    this.activeState.set('result');

    if (passed) {
      this.confetti.fireStreakCelebration();
      this.toast.success(`🎉 PARABÉNS! Você foi APROVADO no Simulado com Nota ${score}/10.0!`);
    } else {
      this.toast.warning(`Simulado finalizado! Nota: ${score}/10.0. Continue praticando para atingir 7.0.`);
    }
  }

  exitSimulator(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.activeState.set('config');
  }

  formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
