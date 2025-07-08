import { ArrowRight, BookOpen, Calculator, Lightbulb, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { useScores } from '../hooks/useScores';

interface SmartRecommendationsProps {
  subject?: 'math' | 'english';
  grade?: number;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({ subject, grade }) => {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [weakSubject, setWeakSubject] = useState<'math' | 'english' | null>(null);
  const { suggestNextActivities } = useAIAnalysis();
  const { getUserStats } = useScores();

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      
      // Determine weak subject if not specified
      let targetSubject = subject;
      if (!targetSubject) {
        const statsResult = await getUserStats();
        if (statsResult.success && statsResult.stats) {
          const { math, english } = statsResult.stats.subjects;
          targetSubject = math.average < english.average ? 'math' : 'english';
        } else {
          targetSubject = 'math'; // Default fallback
        }
      }
      
      setWeakSubject(targetSubject);
      
      // Get AI recommendations
      const aiRecommendations = await suggestNextActivities(targetSubject);
      if (aiRecommendations && aiRecommendations.length > 0) {
        setRecommendations(aiRecommendations);
      } else {
        // Fallback recommendations based on subject and grade
        const fallbackRecommendations = getFallbackRecommendations(targetSubject, grade || 3);
        setRecommendations(fallbackRecommendations);
      }
      
      setLoading(false);
    };

    loadRecommendations();
  }, [subject, grade, suggestNextActivities, getUserStats]);

  const getFallbackRecommendations = (subj: 'math' | 'english', gradeLevel: number): string[] => {
    const mathRecommendations = {
      1: [
        'Practice counting objects around your home',
        'Work on recognizing numbers 1-20',
        'Try simple addition with toys or snacks',
        'Learn about basic shapes in your environment'
      ],
      2: [
        'Practice addition and subtraction with two-digit numbers',
        'Work on multiplication tables for 2, 5, and 10',
        'Learn about place value with tens and ones',
        'Practice measuring objects with a ruler'
      ],
      3: [
        'Master multiplication tables up to 10',
        'Practice division with simple word problems',
        'Work on understanding fractions with real objects',
        'Learn about different types of angles and shapes'
      ],
      4: [
        'Practice long multiplication and division',
        'Work on decimal operations and place value',
        'Learn about factors and multiples',
        'Practice solving multi-step word problems'
      ],
      5: [
        'Master operations with fractions and decimals',
        'Work on percentage calculations',
        'Practice geometry with area and perimeter',
        'Solve complex word problems with multiple operations'
      ]
    };

    const englishRecommendations = {
      1: [
        'Practice reading simple picture books daily',
        'Work on letter recognition and phonics',
        'Try writing simple sentences about your day',
        'Learn new vocabulary words through stories'
      ],
      2: [
        'Read short stories and answer simple questions',
        'Practice writing complete sentences',
        'Work on spelling common sight words',
        'Learn about rhyming words and patterns'
      ],
      3: [
        'Read chapter books appropriate for your level',
        'Practice writing short paragraphs',
        'Work on grammar rules like punctuation',
        'Expand vocabulary through reading and games'
      ],
      4: [
        'Read diverse texts and discuss main ideas',
        'Practice writing essays with clear structure',
        'Work on advanced grammar and sentence variety',
        'Learn about different types of literature'
      ],
      5: [
        'Read complex texts and analyze themes',
        'Practice creative and persuasive writing',
        'Work on advanced vocabulary and word usage',
        'Learn about literary devices and techniques'
      ]
    };

    const recommendations = subj === 'math' ? mathRecommendations : englishRecommendations;
    return recommendations[gradeLevel as keyof typeof recommendations] || recommendations[3];
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-100">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-yellow-200 rounded w-32"></div>
              <div className="h-3 bg-yellow-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-yellow-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-100">
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-yellow-100 p-3 rounded-full">
          <Lightbulb className="w-6 h-6 text-yellow-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Smart Recommendations</h3>
          <p className="text-sm text-gray-600">
            AI-powered suggestions for {weakSubject ? `${weakSubject} improvement` : 'your learning'}
          </p>
        </div>
      </div>

      {/* Subject indicator */}
      {weakSubject && (
        <div className="flex items-center space-x-2 mb-4">
          <div className={`p-2 rounded-lg ${
            weakSubject === 'math' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {weakSubject === 'math' ? <Calculator className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium text-gray-700 capitalize">
            {weakSubject} Focus Area
          </span>
        </div>
      )}

      {/* Recommendations list */}
      <div className="space-y-3">
        {recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors group"
          >
            <div className="w-8 h-8 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-bold mt-0.5 group-hover:bg-yellow-300 transition-colors">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 text-sm leading-relaxed">{recommendation}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-yellow-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-sm font-medium text-gray-800">Ready to improve?</p>
            <p className="text-xs text-gray-600">Start with the first recommendation and work your way through!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartRecommendations;