import { Question, Response } from '../types';

/**
 * Analyze student responses and recommend topics and difficulty for next quiz.
 * @param responses - Array of recent Response objects (should include topic and difficulty info via question lookup)
 * @param questions - Array of all possible questions (for topic/difficulty lookup)
 */
export function getQuizRecommendation(responses: Response[], questions: Question[]): {
  recommendedTopics: string[];
  recommendedDifficulty: 'easy' | 'medium' | 'hard';
  topicAccuracy: Record<string, number>;
  overallAccuracy: number;
} {
  if (!responses.length) {
    return {
      recommendedTopics: [],
      recommendedDifficulty: 'easy',
      topicAccuracy: {},
      overallAccuracy: 0,
    };
  }

  // Map questionId to question for topic/difficulty lookup
  const questionMap: Record<string, Question> = {};
  for (const q of questions) {
    questionMap[q.id] = q;
  }

  // Calculate accuracy per topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  let correctCount = 0;
  for (const r of responses) {
    const q = questionMap[r.questionId];
    if (!q) continue;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, total: 0 };
    topicStats[q.topic].total++;
    if (r.isCorrect) {
      topicStats[q.topic].correct++;
      correctCount++;
    }
  }

  // Calculate accuracy per topic
  const topicAccuracy: Record<string, number> = {};
  for (const topic in topicStats) {
    topicAccuracy[topic] = topicStats[topic].correct / topicStats[topic].total;
  }

  // Find weakest topics (lowest accuracy)
  const sortedTopics = Object.entries(topicAccuracy)
    .sort((a, b) => a[1] - b[1])
    .map(([topic]) => topic);
  const recommendedTopics = sortedTopics.slice(0, 2); // Focus on 2 weakest topics

  // Calculate overall accuracy
  const overallAccuracy = correctCount / responses.length;

  // Recommend difficulty
  let recommendedDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  if (overallAccuracy > 0.85) recommendedDifficulty = 'hard';
  else if (overallAccuracy < 0.5) recommendedDifficulty = 'easy';

  return {
    recommendedTopics,
    recommendedDifficulty,
    topicAccuracy,
    overallAccuracy,
  };
} 