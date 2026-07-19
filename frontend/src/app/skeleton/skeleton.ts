import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    @switch (mode()) {
      @case ('dashboard') {
        <div class="sk-dashboard">
          <div class="sk-row">
            <div class="sk-card-lg"></div>
            <div class="sk-card-lg"></div>
            <div class="sk-card-lg"></div>
          </div>
          <div class="sk-row">
            <div class="sk-chart"></div>
            <div class="sk-chart-sm"></div>
          </div>
          <div class="sk-list">
            <div class="sk-line"></div>
            <div class="sk-line"></div>
            <div class="sk-line"></div>
          </div>
        </div>
      }
      @case ('kanban') {
        <div class="sk-kanban">
          <div class="sk-col">
            @for (_ of [1, 2, 3]; track $index) {
              <div class="sk-card"></div>
            }
          </div>
          <div class="sk-col">
            @for (_ of [1, 2]; track $index) {
              <div class="sk-card"></div>
            }
          </div>
          <div class="sk-col"><div class="sk-card"></div></div>
        </div>
      }
      @case ('list') {
        <div class="sk-list">
          @for (_ of [1, 2, 3, 4]; track $index) {
            <div class="sk-list-item">
              <div class="sk-line w-60"></div>
              <div class="sk-line w-30"></div>
            </div>
          }
        </div>
      }
      @case ('pomodoro') {
        <div class="sk-pomodoro">
          <div class="sk-circle"></div>
          <div class="sk-row sk-controls">
            <div class="sk-btn"></div>
            <div class="sk-btn"></div>
          </div>
        </div>
      }
      @case ('table') {
        <div class="sk-table">
          <div class="sk-table-header">
            <div class="sk-line w-20"></div>
            <div class="sk-line w-40"></div>
            <div class="sk-line w-20"></div>
            <div class="sk-line w-20"></div>
          </div>
          @for (_ of [1, 2, 3, 4, 5]; track $index) {
            <div class="sk-table-row">
              <div class="sk-line w-20"></div>
              <div class="sk-line w-40"></div>
              <div class="sk-line w-20"></div>
              <div class="sk-line w-20"></div>
            </div>
          }
        </div>
      }
      @default {
        <div class="sk-text"><div class="sk-line" [style.width.%]="width()"></div></div>
      }
    }
  `,
  styles: [
    `
      @keyframes shimmer {
        0% {
          background-position: -400px 0;
        }
        100% {
          background-position: 400px 0;
        }
      }
      .sk-dashboard,
      .sk-kanban,
      .sk-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem 0;
      }
      .sk-row {
        display: flex;
        gap: 1rem;
      }
      .sk-card-lg {
        flex: 1;
        height: 100px;
        border-radius: 12px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-card {
        height: 80px;
        border-radius: 10px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-chart {
        flex: 2;
        height: 160px;
        border-radius: 12px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-chart-sm {
        flex: 1;
        height: 160px;
        border-radius: 12px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-kanban {
        flex-direction: row;
        gap: 1rem;
      }
      .sk-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .sk-list-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 1rem;
        background: var(--bg-card);
        border-radius: 8px;
      }
      .sk-line {
        height: 14px;
        border-radius: 99px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-line.w-60 {
        width: 60%;
      }
      .sk-line.w-30 {
        width: 30%;
      }
      .sk-line.w-40 {
        width: 40%;
      }
      .sk-text {
        padding: 2rem 0;
      }
      .sk-text .sk-line {
        width: 100%;
      }
      .sk-pomodoro {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 3rem 0;
      }
      .sk-circle {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-controls {
        justify-content: center;
      }
      .sk-btn {
        width: 120px;
        height: 40px;
        border-radius: 8px;
        background: linear-gradient(
          90deg,
          var(--chart-bar-bg) 25%,
          var(--bg-card) 50%,
          var(--chart-bar-bg) 75%
        );
        background-size: 800px 100%;
        animation: shimmer 1.5s infinite;
      }
      .sk-table {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 0;
      }
      .sk-table-header,
      .sk-table-row {
        display: flex;
        gap: 1rem;
        padding: 0.75rem 1rem;
        align-items: center;
      }
      .sk-table-header {
        border-bottom: 1px solid var(--border);
        margin-bottom: 0.25rem;
      }
      .sk-table-header .sk-line {
        height: 12px;
      }
      .sk-table-row {
        background: var(--bg-card);
        border-radius: 8px;
      }
      .sk-table-row .sk-line {
        height: 14px;
      }
      .sk-table-row .sk-line.w-20 {
        width: 20%;
      }
      .sk-table-row .sk-line.w-40 {
        width: 40%;
      }
      @media (max-width: 900px) {
        .sk-kanban {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class Skeleton {
  mode = input<'dashboard' | 'kanban' | 'list' | 'text' | 'pomodoro' | 'table'>('text');
  width = input(100);
}
