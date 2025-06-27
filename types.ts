export interface User {
  username: string;
}

export interface SetDetail {
  id: string; // Unique ID for the set, e.g., for React keys
  reps?: number;
  weight?: number;
  // Future: duration for timed sets, specific notes for this set
}

export interface Exercise {
  id: string;
  name: string;
  setDetails: SetDetail[]; // Primary way to define sets, reps, weight
  duration?: number; // For exercises like planks, cardio. Used if setDetails is empty or has items with no reps/weight.
  timedSets?: number; // Number of sets/rounds for timed exercises (e.g., 3 rounds of 30s work / 15s pause)
  pause?: number; // in seconds (rest after this exercise before next, or after all sets of this one, or between timed sets)
  notes?: string;

  // @deprecated - These fields are for backward compatibility and will be converted 
  // to setDetails on load in forms. New data should use setDetails.
  sets?: number; 
  reps?: number;
  weight?: number; 
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  exercises: Exercise[];
  // Future: muscleGroups: string[], difficulty: string
}

export interface LoggedWorkout {
  id: string;
  date: string; // YYYY-MM-DD
  templateId?: string; // Optional: if based on a template
  templateName?: string; // Denormalized for display
  exercises: Exercise[]; // Actual performed exercises
  notes?: string; // Overall notes for the workout session
  duration?: number; // Total duration of the workout in minutes
}

export enum AppView {
  DASHBOARD,
  CREATE_TEMPLATE,
  VIEW_TEMPLATE,
  LOG_WORKOUT,
  STATS,
  AUTH
}
