import { supabase } from '../lib/supabase';

export interface UserScore {
  id: string;
  user_id: string;
  module_type: 'assessment' | 'game' | 'chapter' | 'challenge';
  module_id: string;
  subject: 'math' | 'english';
  grade: number;
  score: number;
  max_score: number;
  percentage: number;
  time_taken: number;
  attempts: number;
  completed_at: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ScoreData {
  module_type: 'assessment' | 'game' | 'chapter' | 'challenge';
  module_id: string;
  subject: 'math' | 'english';
  grade: number;
  score: number;
  max_score: number;
  time_taken?: number;
  chapter_id?: string;
  chapter_name?: string;
  metadata?: Record<string, any>;
}

export interface ScoreStats {
  total_scores: number;
  average_percentage: number;
  best_score: number;
  total_time: number;
  subjects: {
    math: {
      scores: number;
      average: number;
      best: number;
    };
    english: {
      scores: number;
      average: number;
      best: number;
    };
  };
  recent_activity: UserScore[];
}

export interface ChapterProgress {
  chapter_id: string;
  chapter_name: string;
  subject: 'math' | 'english';
  grade: number;
  best_score: number;
  attempts: number;
  last_completed: string;
  percentage: number;
}

class ScoreService {
  // Save a new score or update existing one
  async saveScore(scoreData: ScoreData): Promise<{ success: boolean; score?: UserScore; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if score already exists for this module
      const { data: existingScore } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_type', scoreData.module_type)
        .eq('module_id', scoreData.module_id)
        .eq('subject', scoreData.subject)
        .eq('grade', scoreData.grade)
        .single();

      let result;

      if (existingScore) {
        // Update existing score if new score is better
        if (scoreData.score > existingScore.score) {
          const { data, error } = await supabase
            .from('user_scores')
            .update({
              score: scoreData.score,
              max_score: scoreData.max_score,
              time_taken: scoreData.time_taken || 0,
              attempts: existingScore.attempts + 1,
              metadata: scoreData.metadata || {},
              completed_at: new Date().toISOString()
            })
            .eq('id', existingScore.id)
            .select()
            .single();

          result = { data, error };
        } else {
          // Just increment attempts
          const { data, error } = await supabase
            .from('user_scores')
            .update({
              attempts: existingScore.attempts + 1
            })
            .eq('id', existingScore.id)
            .select()
            .single();

          result = { data, error };
        }
      } else {
        // Insert new score
        const { data, error } = await supabase
          .from('user_scores')
          .insert({
            user_id: user.id,
            ...scoreData,
            time_taken: scoreData.time_taken || 0,
            metadata: {
              ...scoreData.metadata,
              chapter_id: scoreData.chapter_id,
              chapter_name: scoreData.chapter_name
            }
          })
          .select()
          .single();

        result = { data, error };
      }

      if (result.error) {
        return { success: false, error: result.error.message };
      }

      return { success: true, score: result.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get user's scores for a specific subject
  async getUserScores(subject?: 'math' | 'english', moduleType?: string): Promise<{ success: boolean; scores?: UserScore[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (subject) {
        query = query.eq('subject', subject);
      }

      if (moduleType) {
        query = query.eq('module_type', moduleType);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, scores: data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get user's score statistics
  async getUserStats(): Promise<{ success: boolean; stats?: ScoreStats; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: scores, error } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!scores || scores.length === 0) {
        return {
          success: true,
          stats: {
            total_scores: 0,
            average_percentage: 0,
            best_score: 0,
            total_time: 0,
            subjects: {
              math: { scores: 0, average: 0, best: 0 },
              english: { scores: 0, average: 0, best: 0 }
            },
            recent_activity: []
          }
        };
      }

      // Calculate statistics
      const mathScores = scores.filter(s => s.subject === 'math');
      const englishScores = scores.filter(s => s.subject === 'english');

      const stats: ScoreStats = {
        total_scores: scores.length,
        average_percentage: Math.round(scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length),
        best_score: Math.max(...scores.map(s => s.percentage)),
        total_time: scores.reduce((sum, s) => sum + s.time_taken, 0),
        subjects: {
          math: {
            scores: mathScores.length,
            average: mathScores.length > 0 ? Math.round(mathScores.reduce((sum, s) => sum + s.percentage, 0) / mathScores.length) : 0,
            best: mathScores.length > 0 ? Math.max(...mathScores.map(s => s.percentage)) : 0
          },
          english: {
            scores: englishScores.length,
            average: englishScores.length > 0 ? Math.round(englishScores.reduce((sum, s) => sum + s.percentage, 0) / englishScores.length) : 0,
            best: englishScores.length > 0 ? Math.max(...englishScores.map(s => s.percentage)) : 0
          }
        },
        recent_activity: scores.slice(0, 10) // Last 10 activities
      };

      return { success: true, stats };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get best score for a specific module
  async getBestScore(moduleType: string, moduleId: string, subject: 'math' | 'english', grade: number): Promise<{ success: boolean; score?: UserScore; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('module_type', moduleType)
        .eq('module_id', moduleId)
        .eq('subject', subject)
        .eq('grade', grade)
        .order('score', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        return { success: false, error: error.message };
      }

      return { success: true, score: data || undefined };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get chapter progress for a specific subject and grade
  async getChapterProgress(subject: 'math' | 'english', grade: number): Promise<{ success: boolean; chapters?: ChapterProgress[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('subject', subject)
        .eq('grade', grade)
        .eq('module_type', 'chapter')
        .order('completed_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Group by chapter and get best scores
      const chapterMap = new Map<string, ChapterProgress>();
      
      data?.forEach(score => {
        const chapterId = score.metadata?.chapter_id || score.module_id;
        const chapterName = score.metadata?.chapter_name || `Chapter ${chapterId}`;
        
        if (!chapterMap.has(chapterId) || chapterMap.get(chapterId)!.best_score < score.score) {
          chapterMap.set(chapterId, {
            chapter_id: chapterId,
            chapter_name: chapterName,
            subject,
            grade,
            best_score: score.score,
            attempts: data.filter(s => (s.metadata?.chapter_id || s.module_id) === chapterId).length,
            last_completed: score.completed_at,
            percentage: score.percentage
          });
        }
      });

      return { success: true, chapters: Array.from(chapterMap.values()) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get detailed score breakdown by subject and grade
  async getScoreBreakdown(subject?: 'math' | 'english', grade?: number): Promise<{ success: boolean; breakdown?: any; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      let query = supabase
        .from('user_scores')
        .select('*')
        .eq('user_id', user.id);

      if (subject) query = query.eq('subject', subject);
      if (grade) query = query.eq('grade', grade);

      const { data, error } = await query.order('completed_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      // Create breakdown by module type
      const breakdown = {
        assessments: data?.filter(s => s.module_type === 'assessment') || [],
        games: data?.filter(s => s.module_type === 'game') || [],
        chapters: data?.filter(s => s.module_type === 'chapter') || [],
        challenges: data?.filter(s => s.module_type === 'challenge') || [],
        by_grade: {} as Record<number, any>,
        by_subject: {} as Record<string, any>
      };

      // Group by grade
      [1, 2, 3, 4, 5].forEach(gradeNum => {
        const gradeScores = data?.filter(s => s.grade === gradeNum) || [];
        if (gradeScores.length > 0) {
          breakdown.by_grade[gradeNum] = {
            total_scores: gradeScores.length,
            average: Math.round(gradeScores.reduce((sum, s) => sum + s.percentage, 0) / gradeScores.length),
            best: Math.max(...gradeScores.map(s => s.percentage)),
            subjects: {
              math: gradeScores.filter(s => s.subject === 'math'),
              english: gradeScores.filter(s => s.subject === 'english')
            }
          };
        }
      });

      // Group by subject
      ['math', 'english'].forEach(subjectName => {
        const subjectScores = data?.filter(s => s.subject === subjectName) || [];
        if (subjectScores.length > 0) {
          breakdown.by_subject[subjectName] = {
            total_scores: subjectScores.length,
            average: Math.round(subjectScores.reduce((sum, s) => sum + s.percentage, 0) / subjectScores.length),
            best: Math.max(...subjectScores.map(s => s.percentage)),
            recent: subjectScores.slice(0, 5)
          };
        }
      });

      return { success: true, breakdown };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  // Get leaderboard for a specific module (top scores)
  async getLeaderboard(moduleType: string, moduleId: string, subject: 'math' | 'english', grade: number, limit: number = 10): Promise<{ success: boolean; leaderboard?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_scores')
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq('module_type', moduleType)
        .eq('module_id', moduleId)
        .eq('subject', subject)
        .eq('grade', grade)
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        return { success: false, error: error.message };
      }

      // Format leaderboard data
      const leaderboard = data?.map((entry, index) => ({
        rank: index + 1,
        name: entry.users?.name || 'Anonymous',
        score: entry.score,
        percentage: entry.percentage,
        completed_at: entry.completed_at
      })) || [];

      return { success: true, leaderboard };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const scoreService = new ScoreService();