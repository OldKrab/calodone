import type { AgentMessage } from '@earendil-works/pi-agent-core';

import type { DailyGoals, Meal, MealPhoto } from './meal';
import type { GoalProfile } from './goalEstimator';

export type ChatAttachment = MealPhoto;

export type ChatUserMessage = {
  role: 'chatUser';
  text: string;
  attachments: ChatAttachment[];
  timestamp: number;
};

export type ChatMealQuestionMessage = {
  role: 'mealQuestion';
  mealId: string;
  questions: string[];
  timestamp: number;
};

declare module '@earendil-works/pi-agent-core' {
  interface CustomAgentMessages {
    calodoneUser: ChatUserMessage;
    calodoneMealQuestion: ChatMealQuestionMessage;
  }
}

export function newMealQuestionMessage(input: Omit<ChatMealQuestionMessage, 'role'>): ChatMealQuestionMessage {
  return { role: 'mealQuestion', ...input };
}

export function newChatUserMessage(text: string, timestamp = Date.now()): ChatUserMessage {
  return { role: 'chatUser', text: text.trim(), attachments: [], timestamp };
}

export type ChatThread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mealId?: string;
  purpose?: 'meal' | 'clarification';
};

export type ChatUndo =
  | { kind: 'restore_meal'; meal: Meal; expectedMeal?: Meal }
  | { kind: 'delete_meal'; mealId: string; expectedMeal?: Meal }
  | { kind: 'restore_goals'; goals: DailyGoals; expectedGoals?: DailyGoals }
  | { kind: 'restore_goal_profile'; profile?: GoalProfile; expectedProfile?: GoalProfile }
  | { kind: 'imported' };

export type ChatAction = {
  id: string;
  threadId: string;
  label: string;
  createdAt: number;
  undone: boolean;
  canUndo?: boolean;
  undo: ChatUndo;
};

export type ChatTranscript = AgentMessage[];
