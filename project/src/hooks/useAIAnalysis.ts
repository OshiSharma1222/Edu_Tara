import { useState, useCallback } from 'react';
import { groqAnalysisService, StudentAnalysis, ScoreAnalysisData } from '../services/groqService';
import { useScores } from './useScores';
import { useAuth } from './useAuth';

export const useAIAnalysis = () => {
  const [analysis, setAnalysis] = useState<StudentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getUserScores, getUserStats } = useScores();
  const { user } = useAuth();

  const analyzeStudentPerformance = useCallback(async (grade?: number) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user scores and stats
      const scoresResult = await getUserScores();
      const statsResult = await getUserStats();

      if (!scoresResult.success || !statsResult.success) {
        throw new Error('Failed to fetch user data');
      }

      const scores = scoresResult.scores || [];
      const stats = statsResult.stats;

      if (scores.length === 0) {
        setError('No learning data available for analysis');
        setLoading(false);
        return null;
      }

      // Prepare data for AI analysis
      const analysisData: ScoreAnalysisData = {
        user_email: user.email,
        grade: grade || user.user_metadata?.grade || 3,
        scores: scores.map(score => ({
          subject: score.subject,
          module_type: score.module_type,
          score: score.score,
          max_score: score.max_score,
          percentage: score.percentage,
          time_taken: score.time_taken,
          attempts: score.attempts,
          completed_at: score.completed_at,
          metadata: score.metadata
        })),
        recent_activity: stats?.recent_activity?.slice(0, 10).map(activity => ({
          subject: activity.subject,
          activity_type: activity.module_type,
          performance: activity.percentage,
          date: activity.completed_at
        })) || [],
        learning_preferences: {
          preferred_subjects: stats ? [
            stats.subjects.math.scores > stats.subjects.english.scores ? 'math' : 'english'
          ] : [],
          learning_style: 'interactive',
          difficulty_preference: 'progressive'
        }
      };

      // Get AI analysis
      const aiAnalysis = await groqAnalysisService.analyzeStudentPerformance(analysisData);
      
      if (!aiAnalysis) {
        throw new Error('Failed to generate AI analysis');
      }

      setAnalysis(aiAnalysis);
      setLoading(false);
      return aiAnalysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze performance';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [user, getUserScores, getUserStats]);

  const generateMotivationalMessage = useCallback(async (recentScore: number) => {
    if (!user) return null;

    try {
      const scoresResult = await getUserScores();
      if (!scoresResult.success) return null;

      const analysisData: ScoreAnalysisData = {
        user_email: user.email,
        grade: user.user_metadata?.grade || 3,
        scores: [],
        recent_activity: []
      };

      return await groqAnalysisService.generateMotivationalMessage(analysisData, recentScore);
    } catch (error) {
      console.error('Error generating motivational message:', error);
      return null;
    }
  }, [user, getUserScores]);

  const suggestNextActivities = useCallback(async (weakSubject: 'math' | 'english') => {
    if (!user) return null;

    try {
      const analysisData: ScoreAnalysisData = {
        user_email: user.email,
        grade: user.user_metadata?.grade || 3,
        scores: [],
        recent_activity: []
      };

      return await groqAnalysisService.suggestNextActivities(analysisData, weakSubject);
    } catch (error) {
      console.error('Error suggesting activities:', error);
      return null;
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    loading,
    error,
    analyzeStudentPerformance,
    generateMotivationalMessage,
    suggestNextActivities,
    clearError,
    clearAnalysis
  };
};