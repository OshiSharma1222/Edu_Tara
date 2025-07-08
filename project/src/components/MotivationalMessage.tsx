import React, { useState, useEffect } from 'react';
import { Star, Heart, Trophy, Sparkles } from 'lucide-react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

interface MotivationalMessageProps {
  score: number;
  subject: 'math' | 'english';
  onClose?: () => void;
}

const MotivationalMessage: React.FC<MotivationalMessageProps> = ({ score, subject, onClose }) => {
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { generateMotivationalMessage } = useAIAnalysis();

  useEffect(() => {
    const loadMessage = async () => {
      const aiMessage = await generateMotivationalMessage(score);
      if (aiMessage) {
        setMessage(aiMessage);
      } else {
        // Fallback motivational messages
        const fallbackMessages = {
          high: [
            "Fantastic work! You're becoming a real expert! 🌟",
            "Amazing! Your hard work is really paying off! 🎉",
            "Excellent job! You should be proud of yourself! 🏆"
          ],
          medium: [
            "Great effort! You're making wonderful progress! 💪",
            "Good job! Keep practicing and you'll get even better! 📚",
            "Nice work! You're on the right track! ⭐"
          ],
          low: [
            "Good try! Every mistake helps you learn something new! 🌱",
            "Keep going! Practice makes perfect! 💫",
            "Don't give up! You're learning and growing! 🌟"
          ]
        };
        
        const category = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
        const messages = fallbackMessages[category];
        setMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
      setLoading(false);
    };

    loadMessage();
  }, [score, generateMotivationalMessage]);

  const getScoreIcon = () => {
    if (score >= 80) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (score >= 60) return <Star className="w-8 h-8 text-blue-500" />;
    return <Heart className="w-8 h-8 text-pink-500" />;
  };

  const getScoreColor = () => {
    if (score >= 80) return 'from-yellow-400 to-orange-500';
    if (score >= 60) return 'from-blue-400 to-purple-500';
    return 'from-pink-400 to-rose-500';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
          <Sparkles className="w-full h-full text-purple-500" />
        </div>
        
        {/* Score display */}
        <div className={`w-20 h-20 bg-gradient-to-br ${getScoreColor()} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
          {getScoreIcon()}
        </div>
        
        {/* Score percentage */}
        <div className="text-4xl font-bold text-gray-800 mb-2">{score}%</div>
        <div className="text-lg text-gray-600 mb-6 capitalize">{subject} Assessment</div>
        
        {/* AI-generated motivational message */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-2xl mb-6">
          <p className="text-lg text-gray-700 leading-relaxed">{message}</p>
        </div>
        
        {/* Continue button */}
        <button
          onClick={onClose}
          className={`bg-gradient-to-r ${getScoreColor()} text-white px-8 py-3 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200`}
        >
          Continue Learning! 🚀
        </button>
        
        {/* Floating elements */}
        <div className="absolute top-4 left-4 animate-bounce">
          <Star className="w-6 h-6 text-yellow-400" />
        </div>
        <div className="absolute bottom-4 right-4 animate-pulse">
          <Heart className="w-5 h-5 text-pink-400" />
        </div>
      </div>
    </div>
  );
};

export default MotivationalMessage;