import Groq from 'groq-sdk';

// IMPORTANT: For Vite projects, use import.meta.env.VITE_GROQ_API_KEY
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
if (!groqApiKey) {
  throw new Error('VITE_GROQ_API_KEY environment variable is not set. Please set it in your .env file.');
}

const groq = new Groq({
  apiKey: groqApiKey,
  dangerouslyAllowBrowser: true
});

export interface StudentAnalysis {
  overall_performance: {
    grade: string;
    strengths: string[];
    weaknesses: string[];
    improvement_areas: string[];
  };
  subject_analysis: {
    math?: {
      current_level: string;
      specific_topics_to_focus: string[];
      recommended_activities: string[];
      learning_approach: string;
    };
    english?: {
      current_level: string;
      specific_topics_to_focus: string[];
      recommended_activities: string[];
      learning_approach: string;
    };
  };
  personalized_recommendations: {
    immediate_actions: string[];
    weekly_goals: string[];
    study_schedule: string[];
    motivational_tips: string[];
  };
  progress_insights: {
    learning_pattern: string;
    best_performance_time: string;
    difficulty_progression: string;
    engagement_level: string;
  };
}

export interface ScoreAnalysisData {
  user_email: string;
  grade: number;
  scores: Array<{
    subject: 'math' | 'english';
    module_type: string;
    score: number;
    max_score: number;
    percentage: number;
    time_taken: number;
    attempts: number;
    completed_at: string;
    metadata?: any;
  }>;
  recent_activity: Array<{
    subject: 'math' | 'english';
    activity_type: string;
    performance: number;
    date: string;
  }>;
  learning_preferences?: {
    preferred_subjects?: string[];
    learning_style?: string;
    difficulty_preference?: string;
  };
}

class GroqAnalysisService {
  private static instance: GroqAnalysisService;

  private constructor() {}

  static getInstance(): GroqAnalysisService {
    if (!GroqAnalysisService.instance) {
      GroqAnalysisService.instance = new GroqAnalysisService();
    }
    return GroqAnalysisService.instance;
  }

  async analyzeStudentPerformance(data: ScoreAnalysisData): Promise<StudentAnalysis | null> {
    try {
      const prompt = this.buildAnalysisPrompt(data);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an expert educational AI assistant specializing in analyzing student performance data for Indian primary school students (Grades 1-5). You understand the CBSE/NCERT curriculum and can provide culturally relevant, age-appropriate recommendations.

Your analysis should be:
1. Encouraging and positive while being honest about areas for improvement
2. Specific to Indian educational context and curriculum
3. Age-appropriate for the student's grade level
4. Practical and actionable for both students and parents
5. Focused on building confidence while addressing learning gaps

Always respond in valid JSON format matching the StudentAnalysis interface.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-70b-versatile",
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from Groq API');
      }

      return JSON.parse(response) as StudentAnalysis;
    } catch (error) {
      console.error('Error analyzing student performance:', error);
      return null;
    }
  }

  private buildAnalysisPrompt(data: ScoreAnalysisData): string {
    const mathScores = data.scores.filter(s => s.subject === 'math');
    const englishScores = data.scores.filter(s => s.subject === 'english');
    
    const mathAverage = mathScores.length > 0 
      ? Math.round(mathScores.reduce((sum, s) => sum + s.percentage, 0) / mathScores.length)
      : 0;
    
    const englishAverage = englishScores.length > 0 
      ? Math.round(englishScores.reduce((sum, s) => sum + s.percentage, 0) / englishScores.length)
      : 0;

    const recentPerformance = data.recent_activity.slice(0, 10);
    const performanceTrend = this.calculateTrend(recentPerformance);

    return `
Analyze the learning performance of a Grade ${data.grade} student in an Indian primary school context (CBSE/NCERT curriculum).

STUDENT DATA:
- Grade: ${data.grade}
- Total Activities Completed: ${data.scores.length}
- Math Performance: ${mathScores.length} activities, Average: ${mathAverage}%
- English Performance: ${englishScores.length} activities, Average: ${englishAverage}%

DETAILED SCORES:
${data.scores.map(score => 
  `- ${score.subject.toUpperCase()} ${score.module_type}: ${score.percentage}% (${score.score}/${score.max_score}) - ${score.attempts} attempts, ${Math.round(score.time_taken/60)}min`
).join('\n')}

RECENT ACTIVITY TREND: ${performanceTrend}

PERFORMANCE PATTERNS:
${this.analyzePatterns(data.scores)}

Please provide a comprehensive analysis in JSON format with:

1. Overall performance assessment appropriate for Grade ${data.grade}
2. Subject-specific analysis for both Math and English
3. Personalized recommendations considering Indian curriculum context
4. Progress insights and learning patterns
5. Motivational and encouraging tone suitable for a ${data.grade === 1 ? 'first-grader' : `Grade ${data.grade} student`}

Focus on:
- CBSE/NCERT curriculum alignment
- Age-appropriate learning strategies
- Building confidence and motivation
- Practical steps for improvement
- Cultural context and Indian educational values
- Parent involvement suggestions

Respond with valid JSON matching the StudentAnalysis interface structure.`;
  }

  private calculateTrend(recentActivity: any[]): string {
    if (recentActivity.length < 3) return 'Insufficient data';
    
    const recent = recentActivity.slice(0, 3).map(a => a.performance);
    const older = recentActivity.slice(3, 6).map(a => a.performance);
    
    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, p) => sum + p, 0) / older.length : recentAvg;
    
    if (recentAvg > olderAvg + 5) return 'Improving';
    if (recentAvg < olderAvg - 5) return 'Declining';
    return 'Stable';
  }

  private analyzePatterns(scores: any[]): string {
    const patterns = [];
    
    // Time analysis
    const avgTime = scores.reduce((sum, s) => sum + s.time_taken, 0) / scores.length;
    if (avgTime > 300) patterns.push('Takes time to think through problems (good analytical approach)');
    if (avgTime < 60) patterns.push('Quick to respond (may benefit from double-checking)');
    
    // Attempts analysis
    const multipleAttempts = scores.filter(s => s.attempts > 1).length;
    if (multipleAttempts > scores.length * 0.3) {
      patterns.push('Shows persistence by trying multiple times');
    }
    
    // Performance consistency
    const percentages = scores.map(s => s.percentage);
    const variance = this.calculateVariance(percentages);
    if (variance < 100) patterns.push('Consistent performance across activities');
    if (variance > 400) patterns.push('Variable performance - some topics much stronger than others');
    
    return patterns.join('; ') || 'Developing learning patterns';
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / numbers.length;
  }

  async generateMotivationalMessage(studentData: ScoreAnalysisData, recentScore: number): Promise<string | null> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a friendly, encouraging AI tutor for Indian primary school students. Generate a short, motivational message (2-3 sentences) that celebrates the student's effort and encourages continued learning. Use age-appropriate language and positive reinforcement.`
          },
          {
            role: "user",
            content: `A Grade ${studentData.grade} student just scored ${recentScore}% on their recent activity. Generate an encouraging message that acknowledges their effort and motivates them to keep learning.`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.8,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('Error generating motivational message:', error);
      return null;
    }
  }

  async suggestNextActivities(studentData: ScoreAnalysisData, weakSubject: 'math' | 'english'): Promise<string[] | null> {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an educational AI that suggests specific learning activities for Indian primary school students based on CBSE/NCERT curriculum. Provide 3-5 specific, actionable activity suggestions.`
          },
          {
            role: "user",
            content: `A Grade ${studentData.grade} student needs to improve in ${weakSubject}. Based on their recent performance, suggest specific activities or topics they should focus on next. Consider the CBSE/NCERT curriculum for Grade ${studentData.grade}.`
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.7,
        max_tokens: 300
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) return null;

      // Parse the response into an array of activities
      return response.split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(activity => activity.length > 10)
        .slice(0, 5);
    } catch (error) {
      console.error('Error suggesting activities:', error);
      return null;
    }
  }
}

export const groqAnalysisService = GroqAnalysisService.getInstance();

// Vite env type declaration for TypeScript
// This allows import.meta.env.VITE_GROQ_API_KEY to be recognized
interface ImportMeta {
  env: {
    VITE_GROQ_API_KEY?: string;
    [key: string]: any;
  };
}