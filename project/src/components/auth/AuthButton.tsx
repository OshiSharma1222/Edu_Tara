import React, { useState } from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import AuthModal from './AuthModal';

const AuthButton: React.FC = () => {
  const { user, signOut, loading, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  if (loading) {
    return (
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-gray-700 hidden sm:block">
            {user.user_metadata?.name || user.email.split('@')[0]}
          </span>
        </button>

        {showUserMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowUserMenu(false)}
            />
            {/* Menu */}
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-100">
                <p className="font-medium text-gray-800">
                  {user.user_metadata?.name || 'Student'}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
                {user.user_metadata?.grade && (
                  <p className="text-xs text-gray-500 mt-1">
                    Grade {user.user_metadata.grade}
                  </p>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-2 text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowAuthModal(true)}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
      >
        <LogIn className="w-4 h-4" />
        <span className="font-medium">Sign In</span>
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="signin"
      />
    </>
  );
};

export default AuthButton;