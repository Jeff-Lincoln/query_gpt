// components/AuthLayout.tsx
'use client';

import { SignIn, SignUp } from '@clerk/nextjs';
import { useState } from 'react';

export function AuthLayout({ }: { children: React.ReactNode }) {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex min-h-screen">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-8">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Query_GPT💯
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your intelligent AI companion for instant answers, creative solutions, and deep insights.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Instant AI responses</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Creative problem solving</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-gray-700">Deep insights & analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Query_GPT💯</h1>
              <p className="text-gray-600 mt-2">Your AI Assistant</p>
            </div>
            
            <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
              {showSignUp ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">
                      Create Account
                    </h2>
                    <p className="text-gray-600 text-center mt-2">
                      Join Query_GPT today
                    </p>
                  </div>
                  <SignUp 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none"
                      }
                    }}
                  />
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowSignUp(false)}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-center">
                      Welcome Back
                    </h2>
                    <p className="text-gray-600 text-center mt-2">
                      Sign in to your account
                    </p>
                  </div>
                  <SignIn 
                    appearance={{
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none"
                      }
                    }}
                  />
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowSignUp(true)}
                      className="text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Dont have an account? Sign up
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}