'use client'

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ChevronLeftIcon, LogIn, MenuIcon, MessageCircle, UserPlus, X } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { useSidebar } from './ui/sidebar'

function Header() {
  // const { user } = useUser()
  const { toggleSidebar, isMobile, open } = useSidebar()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-black/30 backdrop-blur-xl border-b border-purple-500/20 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section - Sidebar Toggle & Logo */}
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              {/* Sidebar Toggle for Signed In Users */}
              <SignedIn>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSidebar}
                  className="p-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg shrink-0"
                  aria-label={open ? "Close sidebar" : "Open sidebar"}
                >
                  {open ? (
                    <ChevronLeftIcon className="w-5 h-5" />
                  ) : (
                    <MenuIcon className="w-5 h-5" />
                  )}
                </Button>
              </SignedIn>

              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-purple-500/25 transition-all duration-200 shrink-0">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-bold text-lg truncate">
                  Query<span className="text-purple-400">_GPT</span>
                </span>
              </Link>
            </div>

            {/* Center Section - Desktop Navigation */}
            <SignedIn>
              <nav className="hidden lg:flex items-center space-x-1 mx-8">
                <Link 
                  href="/dashboard" 
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/history" 
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  History
                </Link>
                <Link 
                  href="/analytics" 
                  className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  Analytics
                </Link>
              </nav>
            </SignedIn>

            {/* Right Section - Auth Buttons & User Profile */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Mobile Menu Toggle for Signed In Users */}
              <SignedIn>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 text-white hover:bg-white/10 transition-all duration-200 rounded-lg"
                  aria-label="Toggle mobile menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <MenuIcon className="w-5 h-5" />
                  )}
                </Button>
              </SignedIn>

              {/* Auth Buttons for Signed Out Users */}
              <SignedOut>
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost" 
                      size="sm"
                      className="text-white hover:bg-white/10 border border-white/20 transition-all duration-200 hover:border-white/40"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Join</span>
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>

              {/* User Profile for Signed In Users */}
              <SignedIn>
                <div className="flex items-center">
                  <UserButton 
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 hover:ring-2 hover:ring-purple-400 hover:ring-offset-2 hover:ring-offset-transparent transition-all duration-200",
                        userButtonPopoverCard: "bg-white/95 backdrop-blur-xl shadow-2xl border border-white/20",
                        userButtonPopoverActions: "bg-white/95",
                        userButtonPopoverActionButton: "hover:bg-purple-50 transition-colors",
                        userButtonPopoverActionButtonText: "text-gray-700",
                        userButtonPopoverFooter: "bg-white/95"
                      }
                    }}
                    showName={!isMobile}
                  />
                </div>
              </SignedIn>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <SignedIn>
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-purple-500/20 bg-black/40 backdrop-blur-xl">
              <div className="px-4 py-3 space-y-2">
                <Link 
                  href="/dashboard" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  Dashboard
                </Link>
                <Link 
                  href="/history" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  History
                </Link>
                <Link 
                  href="/analytics" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  Analytics
                </Link>
              </div>
            </div>
          )}
        </SignedIn>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}

export default Header

