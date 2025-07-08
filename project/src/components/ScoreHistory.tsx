import React, { useState, useEffect } from 'react';
import { Trophy, Clock, Target, TrendingUp, Calendar, Award, BookOpen, Calculator } from 'lucide-react';
import { useScores } from '../hooks/useScores';
import { UserScore } from '../services/scoreService';

interface ScoreHistoryProps {
  subject?: 'math' | 'english';
  moduleType?: string;
  showFilters?: boolean;
}

const ScoreHistory: React.FC<ScoreHistoryProps> = ({ subject, moduleType, showFilters = true }) => {
  const { getUserScores, getScoreBreakdown, loading } = useScores();
  const [scores, setScores] = useState<UserScore[]>([]);
  const [filter, setFilter] = useState<'all' | 'assessment' | 'game' | 'chapter'>('all');
  const [breakdown, setBreakdown] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'breakdown'>('list');

  useEffect(() => {
    const loadScores = async () => {
      const result = await getUserScores(subject, moduleType);
      if (result.success && result.scores) {
        setScores(result.scores);
      }
      
      // Load breakdown data
      const breakdownResult = await getScoreBreakdown(subject);
      if (breakdownResult.success && breakdownResult.breakdown) {
        setBreakdown(breakdownResult.breakdown);
      }
    };

    loadScores();
  }, [getUserScores, getScoreBreakdown, subject, moduleType]);

  const filteredScores = scores.filter(score => 
    filter === 'all' || score.module_type === filter
  );

  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'assessment': return <Target className="w-5 h-5" />;
      case 'game': return <Trophy className="w-5 h-5" />;
      case 'chapter': return <Award className="w-5 h-5" />;
      default: return <Calendar className="w-5 h-5" />;
    }
  };

  const getModuleTypeName = (type: string) => {
    switch (type) {
      case 'assessment': return 'Assessment';
      case 'game': return 'Game';
      case 'chapter': return 'Chapter';
      case 'challenge': return 'Challenge';
      default: return type;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Score History</h3>
            <p className="text-sm text-gray-600">Your learning progress over time</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'breakdown' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'
              }`}
            >
              Breakdown
            </button>
          </div>

          {/* Filter buttons */}
          {showFilters && viewMode === 'list' && (
            <div className="flex space-x-2">
              {['all', 'assessment', 'game', 'chapter'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType as any)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewMode === 'breakdown' && breakdown ? (
        <div className="space-y-6">
          {/* Subject breakdown */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Performance by Subject</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(breakdown.by_subject).map(([subjectName, data]: [string, any]) => (
                <div key={subjectName} className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${
                      subjectName === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {subjectName === 'math' ? <Calculator className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800 capitalize">{subjectName}</h5>
                      <p className="text-sm text-gray-600">{data.total_scores} activities</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Score</span>
                      <span className="font-medium text-gray-800">{data.average}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Best Score</span>
                      <span className="font-medium text-green-600">{data.best}%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          subjectName === 'math' ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${data.average}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade breakdown */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Performance by Grade</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(breakdown.by_grade).map(([gradeNum, data]: [string, any]) => (
                <div key={gradeNum} className="bg-gray-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-purple-600 mb-2">Grade {gradeNum}</div>
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">{data.total_scores} activities</div>
                    <div className="text-lg font-semibold text-gray-800">{data.average}%</div>
                    <div className="text-xs text-green-600">Best: {data.best}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Module type breakdown */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-4">Activity Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'assessments', name: 'Assessments', icon: Target, color: 'blue' },
                { key: 'games', name: 'Games', icon: Trophy, color: 'purple' },
                { key: 'chapters', name: 'Chapters', icon: BookOpen, color: 'green' },
                { key: 'challenges', name: 'Challenges', icon: Award, color: 'orange' }
              ].map(({ key, name, icon: Icon, color }) => {
                const data = breakdown[key] || [];
                const average = data.length > 0 ? Math.round(data.reduce((sum: number, item: any) => sum + item.percentage, 0) / data.length) : 0;
                
                return (
                  <div key={key} className="bg-gray-50 p-4 rounded-xl text-center">
                    <div className={`w-12 h-12 bg-${color}-100 text-${color}-600 rounded-full flex items-center justify-center mx-auto mb-3`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h5 className="font-medium text-gray-800 mb-1">{name}</h5>
                    <div className="text-sm text-gray-600">{data.length} completed</div>
                    {data.length > 0 && (
                      <div className="text-lg font-semibold text-gray-800">{average}%</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : filteredScores.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">No scores yet</h4>
          <p className="text-gray-600">Complete some assessments or games to see your progress!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredScores.map((score) => (
            <div
              key={score.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  score.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                }`}>
                  {getModuleTypeIcon(score.module_type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-800">
                      {getModuleTypeName(score.module_type)}
                    </h4>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      Grade {score.grade}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      score.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {score.subject.charAt(0).toUpperCase() + score.subject.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <span>{formatDate(score.completed_at)}</span>
                    {score.time_taken > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(score.time_taken)}</span>
                        </div>
                      </>
                    )}
                    {score.attempts > 1 && (
                      <>
                        <span>•</span>
                        <span>{score.attempts} attempts</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-lg font-bold px-3 py-1 rounded-full ${getScoreColor(score.percentage)}`}>
                  {score.percentage}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {score.score}/{score.max_score}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScoreHistory;