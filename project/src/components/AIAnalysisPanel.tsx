import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Target, Lightbulb, Star, BookOpen, Calculator, Clock, Award, ChevronRight, RefreshCw } from 'lucide-react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { useAuth } from '../hooks/useAuth';

interface AIAnalysisPanelProps {
  grade?: number;
  autoAnalyze?: boolean;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ grade, autoAnalyze = false }) => {
  const { analysis, loading, error, analyzeStudentPerformance, clearError } = useAIAnalysis();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'recommendations' | 'insights'>('overview');

  useEffect(() => {
    if (autoAnalyze && user) {
      analyzeStudentPerformance(grade);
    }
  }, [autoAnalyze, user, grade, analyzeStudentPerformance]);

  const handleAnalyze = () => {
    clearError();
    analyzeStudentPerformance(grade);
  };

  const getPerformanceColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'excellent':
      case 'advanced':
        return 'text-green-600 bg-green-100';
      case 'good':
      case 'proficient':
        return 'text-blue-600 bg-blue-100';
      case 'developing':
      case 'basic':
        return 'text-yellow-600 bg-yellow-100';
      case 'needs improvement':
      case 'below basic':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-red-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analysis Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleAnalyze}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analyzing Your Learning...</h3>
          <p className="text-gray-600 mb-4">Our AI is reviewing your performance data</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">AI Learning Analysis</h3>
          <p className="text-gray-600 mb-4">Get personalized insights about your learning progress</p>
          <button
            onClick={handleAnalyze}
            className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2 mx-auto"
          >
            <Brain className="w-5 h-5" />
            <span>Analyze My Progress</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">AI Learning Analysis</h3>
            <p className="text-sm text-gray-600">Personalized insights powered by AI</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh Analysis"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'subjects', label: 'Subjects', icon: BookOpen },
          { id: 'recommendations', label: 'Tips', icon: Lightbulb },
          { id: 'insights', label: 'Insights', icon: TrendingUp }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
              activeTab === id ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Overall Performance */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
              <Award className="w-5 h-5 mr-2 text-purple-600" />
              Overall Performance
            </h4>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(analysis.overall_performance.grade)}`}>
              {analysis.overall_performance.grade}
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-green-50 p-4 rounded-xl">
            <h4 className="font-semibold text-green-800 mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Your Strengths
            </h4>
            <div className="space-y-2">
              {analysis.overall_performance.strengths.map((strength, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="bg-orange-50 p-4 rounded-xl">
            <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Areas to Focus On
            </h4>
            <div className="space-y-2">
              {analysis.overall_performance.improvement_areas.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-700 text-sm">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {/* Math Analysis */}
          {analysis.subject_analysis.math && (
            <div className="bg-blue-50 p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <Calculator className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-blue-800">Mathematics</h4>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(analysis.subject_analysis.math.current_level)}`}>
                    {analysis.subject_analysis.math.current_level}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Focus Topics:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.subject_analysis.math.specific_topics_to_focus.map((topic, index) => (
                      <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-blue-800 mb-2">Recommended Activities:</h5>
                  <div className="space-y-1">
                    {analysis.subject_analysis.math.recommended_activities.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <ChevronRight className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 text-sm">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* English Analysis */}
          {analysis.subject_analysis.english && (
            <div className="bg-green-50 p-4 rounded-xl">
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-green-800">English</h4>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(analysis.subject_analysis.english.current_level)}`}>
                    {analysis.subject_analysis.english.current_level}
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-green-800 mb-2">Focus Topics:</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.subject_analysis.english.specific_topics_to_focus.map((topic, index) => (
                      <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-medium text-green-800 mb-2">Recommended Activities:</h5>
                  <div className="space-y-1">
                    {analysis.subject_analysis.english.recommended_activities.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <ChevronRight className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 text-sm">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {/* Immediate Actions */}
          <div className="bg-yellow-50 p-4 rounded-xl">
            <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              What to Do Next
            </h4>
            <div className="space-y-2">
              {analysis.personalized_recommendations.immediate_actions.map((action, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-yellow-700 text-sm">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Goals */}
          <div className="bg-purple-50 p-4 rounded-xl">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              This Week's Goals
            </h4>
            <div className="space-y-2">
              {analysis.personalized_recommendations.weekly_goals.map((goal, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-purple-700 text-sm">{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motivational Tips */}
          <div className="bg-pink-50 p-4 rounded-xl">
            <h4 className="font-semibold text-pink-800 mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Stay Motivated!
            </h4>
            <div className="space-y-2">
              {analysis.personalized_recommendations.motivational_tips.map((tip, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <span className="text-pink-700 text-sm">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {/* Learning Pattern */}
          <div className="bg-indigo-50 p-4 rounded-xl">
            <h4 className="font-semibold text-indigo-800 mb-3 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Learning Pattern
            </h4>
            <p className="text-indigo-700 text-sm">{analysis.progress_insights.learning_pattern}</p>
          </div>

          {/* Best Performance Time */}
          <div className="bg-cyan-50 p-4 rounded-xl">
            <h4 className="font-semibold text-cyan-800 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Best Learning Time
            </h4>
            <p className="text-cyan-700 text-sm">{analysis.progress_insights.best_performance_time}</p>
          </div>

          {/* Difficulty Progression */}
          <div className="bg-emerald-50 p-4 rounded-xl">
            <h4 className="font-semibold text-emerald-800 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Difficulty Progression
            </h4>
            <p className="text-emerald-700 text-sm">{analysis.progress_insights.difficulty_progression}</p>
          </div>

          {/* Engagement Level */}
          <div className="bg-rose-50 p-4 rounded-xl">
            <h4 className="font-semibold text-rose-800 mb-3 flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Engagement Level
            </h4>
            <p className="text-rose-700 text-sm">{analysis.progress_insights.engagement_level}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisPanel;