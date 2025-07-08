import { useState, useEffect, useCallback } from 'react';
import { scoreService, UserScore, ScoreData, ScoreStats, ChapterProgress } from '../services/scoreService';
import { useAuth } from './useAuth';

export const useScores = () => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveScore = useCallback(async (scoreData: ScoreData) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.saveScore(scoreData);
    
    if (!result.success) {
      setError(result.error || 'Failed to save score');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const getUserScores = useCallback(async (subject?: 'math' | 'english', moduleType?: string) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.getUserScores(subject, moduleType);
    
    if (!result.success) {
      setError(result.error || 'Failed to get scores');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const getUserStats = useCallback(async () => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.getUserStats();
    
    if (!result.success) {
      setError(result.error || 'Failed to get stats');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const getBestScore = useCallback(async (moduleType: string, moduleId: string, subject: 'math' | 'english', grade: number) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.getBestScore(moduleType, moduleId, subject, grade);
    
    if (!result.success) {
      setError(result.error || 'Failed to get best score');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const getChapterProgress = useCallback(async (subject: 'math' | 'english', grade: number) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.getChapterProgress(subject, grade);
    
    if (!result.success) {
      setError(result.error || 'Failed to get chapter progress');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const getScoreBreakdown = useCallback(async (subject?: 'math' | 'english', grade?: number) => {
    if (!isAuthenticated) {
      return { success: false, error: 'User not authenticated' };
    }

    setLoading(true);
    setError(null);

    const result = await scoreService.getScoreBreakdown(subject, grade);
    
    if (!result.success) {
      setError(result.error || 'Failed to get score breakdown');
    }

    setLoading(false);
    return result;
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    saveScore,
    getUserScores,
    getUserStats,
    getBestScore,
    getChapterProgress,
    getScoreBreakdown,
    clearError
  };
};