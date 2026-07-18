import { Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { Skeleton } from '../skeleton/skeleton';
import { Confirm } from '../confirm/confirm';
import { EmptyState } from '../empty-state/empty-state';
import { Flashcard } from '../models/flashcard';
import { Subject } from '../models/subject';

@Component({
  selector: 'app-flashcards',
  imports: [FormsModule, Skeleton, Confirm, EmptyState],
  templateUrl: './flashcards.html',
  styleUrl: './flashcards.css',
})
export class Flashcards implements OnInit {
  private api = inject(ApiService);
  protected auth = inject(AuthService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  flashcards = signal<Flashcard[]>([]);
  dueCards = signal<Flashcard[]>([]);
  subjects = signal<Subject[]>([]);

  loading = signal(true);
  saving = signal(false);
  activeTab = signal<'review' | 'manage'>('review');

  // Form Fields
  editingId = signal<string | null>(null);
  question = '';
  answer = '';
  subjectId = '';
  type = 'TEXT';
  optionsList: string[] = ['', '', '', ''];
  correctOptionIndex = 0;

  // Review Session State
  currentReviewIndex = signal(0);
  showAnswer = signal(false);
  reviewCompleted = signal(false);
  selectedOptionIndex = signal<number | null>(null);
  isCorrectSelection = signal<boolean | null>(null);

  // Confirm delete modal
  showConfirmDelete = signal(false);
  deletingId: string | null = null;

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.loadAllData(user.id);
    }
  }

  loadAllData(userId: string): void {
    this.loading.set(true);
    forkJoin({
      cards: this.api.getFlashcards().pipe(timeout(10000), catchError(() => of([] as Flashcard[]))),
      due: this.api.getDueFlashcards().pipe(timeout(10000), catchError(() => of([] as Flashcard[]))),
      subjects: this.api.getSubjects(userId).pipe(timeout(10000), catchError(() => of([] as Subject[]))),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (res) => {
          this.flashcards.set(res.cards);
          this.dueCards.set(res.due);
          this.subjects.set(res.subjects);
          this.resetReviewSession();
        },
        error: () => {
          this.toast.error('Erro ao carregar flashcards.');
        },
      });
  }

  resetReviewSession(): void {
    this.currentReviewIndex.set(0);
    this.showAnswer.set(false);
    this.reviewCompleted.set(false);
    this.selectedOptionIndex.set(null);
    this.isCorrectSelection.set(null);
  }

  getCurrentCard(): Flashcard | null {
    const due = this.dueCards();
    const index = this.currentReviewIndex();
    if (index >= 0 && index < due.length) {
      return due[index];
    }
    return null;
  }

  revealAnswer(): void {
    this.showAnswer.set(true);
  }

  selectOption(index: number): void {
    if (this.showAnswer()) return;
    const currentCard = this.getCurrentCard();
    if (!currentCard) return;

    this.selectedOptionIndex.set(index);
    const correct = currentCard.correctOptionIndex;
    const isCorrect = index === correct;
    this.isCorrectSelection.set(isCorrect);
    this.revealAnswer();
  }

  getCardOptions(card: Flashcard): string[] {
    if (!card.options) return [];
    try {
      return JSON.parse(card.options);
    } catch {
      return [];
    }
  }

  submitReview(rating: number): void {
    const currentCard = this.getCurrentCard();
    if (!currentCard) return;

    this.api.reviewFlashcard(currentCard.id, rating)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const nextIndex = this.currentReviewIndex() + 1;
          this.showAnswer.set(false);
          this.selectedOptionIndex.set(null);
          this.isCorrectSelection.set(null);
          
          if (nextIndex >= this.dueCards().length) {
            this.reviewCompleted.set(true);
            // Refresh due cards and all cards list in background
            const user = this.auth.user();
            if (user) {
              this.api.getFlashcards().subscribe(cards => this.flashcards.set(cards));
              this.api.getDueFlashcards().subscribe(due => this.dueCards.set(due));
            }
          } else {
            this.currentReviewIndex.set(nextIndex);
          }
        },
        error: () => {
          this.toast.error('Erro ao salvar revisão.');
        }
      });
  }

  saveFlashcard(): void {
    if (!this.question.trim()) {
      this.toast.error('A pergunta é obrigatória.');
      return;
    }
    if (this.type !== 'MULTIPLE_CHOICE' && !this.answer.trim()) {
      this.toast.error('A resposta é obrigatória.');
      return;
    }
    if (this.type === 'MULTIPLE_CHOICE') {
      const validChoices = this.optionsList.filter(c => c.trim().length > 0);
      if (validChoices.length < 2) {
        this.toast.error('Informe pelo menos 2 opções para múltipla escolha.');
        return;
      }
    }

    this.saving.set(true);
    const payload = {
      question: this.question,
      answer: this.type === 'MULTIPLE_CHOICE' ? this.optionsList[this.correctOptionIndex] : this.answer,
      subjectId: this.subjectId ? this.subjectId : null,
      type: this.type,
      options: this.type === 'MULTIPLE_CHOICE' ? JSON.stringify(this.optionsList) : null,
      correctOptionIndex: this.type === 'MULTIPLE_CHOICE' ? this.correctOptionIndex : null
    };

    const id = this.editingId();
    const req = id 
      ? this.api.updateFlashcard(id, payload)
      : this.api.createFlashcard(payload);

    req.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => {
        this.toast.success(id ? 'Flashcard atualizado!' : 'Flashcard criado!');
        this.resetForm();
        const user = this.auth.user();
        if (user) {
          this.loadAllData(user.id);
        }
      },
      error: () => {
        this.toast.error('Erro ao salvar flashcard.');
      }
    });
  }

  editFlashcard(card: Flashcard): void {
    this.editingId.set(card.id);
    this.question = card.question;
    this.answer = card.answer;
    this.subjectId = card.subjectId || '';
    this.type = card.type || 'TEXT';
    this.correctOptionIndex = card.correctOptionIndex || 0;
    this.optionsList = card.options ? JSON.parse(card.options) : ['', '', '', ''];
  }

  resetForm(): void {
    this.editingId.set(null);
    this.question = '';
    this.answer = '';
    this.subjectId = '';
    this.type = 'TEXT';
    this.optionsList = ['', '', '', ''];
    this.correctOptionIndex = 0;
  }

  confirmDelete(id: string): void {
    this.deletingId = id;
    this.showConfirmDelete.set(true);
  }

  deleteFlashcard(): void {
    if (!this.deletingId) return;

    this.api.deleteFlashcard(this.deletingId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Flashcard excluído.');
          this.showConfirmDelete.set(false);
          this.deletingId = null;
          const user = this.auth.user();
          if (user) {
            this.loadAllData(user.id);
          }
        },
        error: () => {
          this.toast.error('Erro ao excluir flashcard.');
        }
      });
  }
}
