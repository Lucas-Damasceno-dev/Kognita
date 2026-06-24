import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(ApiService);

  generateFlashcards(material: string): Observable<string> {
    return this.api.post('/ai/flashcards', material);
  }

  planStudy(goal: string): Observable<string> {
    return this.api.post('/ai/plan-study', goal);
  }
}
