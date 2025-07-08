import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Award, Target, Calendar, Clock } from 'lucide-react';
import { useScores } from '../hooks/useScores';

interface DetailedScoreViewProps {
  subject?: 'math' | 'english';
  grade?: number;
}

const DetailedScoreView: React.FC<DetailedScoreViewProps> = ({ subject, grade }) => {
  const { getScoreBreakdown, getChapterProgress, loading } = useScores();
  const [breakdown, setBreakdown] = useState<any>(null);
  const [chapterProgress, setChapterProgress] = useState<any[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'chapters' | 'trends'>('overview');

  useEffect(() => {
    const loadData = async () => {
      // Load score breakdown
      const breakdownResult = await getScoreBreakdown(subject, grade);
      if (breakdownResult.success) {
        setBreakdown(breakdownResult.breakdown);
      }

      // Load chapter progress if subject and grade are specified
      if (subject && grade) {
        const progressResult = await getChapterProgress(subject, grade);
        if (progressResult.success) {
          setChapterProgress(progressResult.chapters || []);
        }
      }
    };

    loadData();
  }, [getScoreBreakdown, getChapterProgress, subject, grade]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <div className="bg-indigo-100 p-3 rounded-full">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Detailed Analytics</h3>
            <p className="text-sm text-gray-600">
              {subject && grade 
                ? `${subject.charAt(0).toUpperCase() + subject.slice(1)} - Grade ${grade}`
                : 'Overall Performance'}
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'chapters', label: 'Chapters', icon: Award },
            { id: 'trends', label: 'Trends', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveView(id as any)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeView === 'overview' && breakdown && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-blue-600">
                {breakdown.assessments?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Assessments</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-purple-600">
                {breakdown.games?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Games</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-green-600">
                {breakdown.chapters?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Chapters</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl text-center">
              <div className="text-2xl font-bold text-orange-600">
                {breakdown.challenges?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Challenges</div>
            </div>
          </div>

          {/* Subject Performance */}
          {Object.keys(breakdown.by_subject).length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Subject Performance</h4>
              <div className="space-y-3">
                {Object.entries(breakdown.by_subject).map(([subjectName, data]: [string, any]) => (
                  <div key={subjectName} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        subjectName === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                      }`}>
                        <span className="font-bold">{subjectName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 capitalize">{subjectName}</h5>
                        <p className="text-sm text-gray-600">{data.total_scores} activities completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-800">{data.average}%</div>
                      <div className="text-sm text-gray-600">Average</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'chapters' && (
        <div className="space-y-4">
          {chapterProgress.length > 0 ? (
            <>
              <h4 className="font-semibold text-gray-800">Chapter Progress</h4>
              <div className="space-y-3">
                {chapterProgress.map((chapter) => (
                  <div key={chapter.chapter_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        chapter.percentage >= 80 ? 'bg-green-100 text-green-600' :
                        chapter.percentage >= 60 ? 'bg-blue-100 text-blue-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800">{chapter.chapter_name}</h5>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{chapter.attempts} attempts</span>
                          <span>•</span>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(chapter.last_completed).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        chapter.percentage >= 80 ? 'text-green-600' :
                        chapter.percentage >= 60 ? 'text-blue-600' :
                        'text-orange-600'
                      }`}>
                        {chapter.percentage}%
                      </div>
                      <div className="text-sm text-gray-600">Best Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-800 mb-2">No Chapter Progress</h4>
              <p className="text-gray-600">Complete some chapters to see your progress here!</p>
            </div>
          )}
        </div>
      )}

      {activeView === 'trends' && breakdown && (
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-800">Performance Trends</h4>
          
          {/* Recent Activity */}
          <div>
            <h5 className="font-medium text-gray-700 mb-3">Recent Activity</h5>
            <div className="space-y-2">
              {Object.values(breakdown.by_subject).flatMap((subjectData: any) => 
                subjectData.recent?.slice(0, 5) || []
              ).sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
              .slice(0, 8).map((score: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      score.subject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                    }`}>
                      <span className="text-xs font-bold">{score.subject.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {score.module_type.charAt(0).toUpperCase() + score.module_type.slice(1)}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(score.completed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${
                    score.percentage >= 80 ? 'text-green-600' :
                    score.percentage >= 60 ? 'text-blue-600' :
                    'text-orange-600'
                  }`}>
                    {score.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedScoreView;