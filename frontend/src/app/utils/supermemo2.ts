export interface SM2Result {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewDate: Date;
}

/**
 * SuperMemo 2 (SM-2) Spaced Repetition Algorithm
 * @param quality User rating from 0 (blackout/wrong) to 5 (perfect recall)
 * @param repetitions Number of consecutive successful reviews
 * @param previousInterval Previous interval in days
 * @param previousEaseFactor Previous ease factor (default 2.5)
 */
export function calculateSM2(
  quality: number,
  repetitions: number,
  previousInterval: number,
  previousEaseFactor: number = 2.5
): SM2Result {
  let reps = repetitions;
  let interval = previousInterval;
  let ef = previousEaseFactor;

  if (quality >= 3) {
    if (reps === 0) {
      interval = 1;
    } else if (reps === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ef);
    }
    reps += 1;
  } else {
    reps = 0;
    interval = 1;
  }

  // Calculate new Ease Factor (EF)
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ef < 1.3) {
    ef = 1.3;
  }

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    repetitions: reps,
    intervalDays: interval,
    easeFactor: parseFloat(ef.toFixed(2)),
    nextReviewDate,
  };
}
