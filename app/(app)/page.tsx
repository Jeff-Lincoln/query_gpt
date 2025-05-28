import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignUpButton, SignInButton } from "@clerk/nextjs";
import { 
  ArrowRight, 
  MessageCircle, 
  Sparkles, 
  Zap, 
  Shield, 
  Globe, 
  Brain, 
  Users, 
  UserPlus, 
  Star,
  ChevronRight,
  Play,
  Check,
  TrendingUp,
  Code,
  Lightbulb,
  Heart,
  Award,
  LogIn
} from "lucide-react";

export default function Home() {
  return (
    <>
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          {/* Hero Section */}
          <main className="container mx-auto px-4 py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              
              {/* Hero Content */}
              <div className="text-center mb-20">
                {/* Badge */}
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 rounded-full mb-8 hover:border-purple-400/50 transition-all duration-300 group">
                  <Sparkles className="w-5 h-5 text-purple-400 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-purple-300 text-sm font-medium mr-3">Powered by Advanced AI</span>
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map((star) => (
                      <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white mb-8 leading-tight">
                  Meet Your
                  <br />
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent relative">
                    AI Assistant
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-pink-600/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-1000"></div>
                  </span>
                  <span className="text-5xl md:text-6xl animate-bounce">✨</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                  Unlock the power of AI with Query_GPT. Get instant answers, creative solutions, 
                  and intelligent insights for everything from travel planning to complex coding challenges.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
                  <SignUpButton mode="modal">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-10 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                    >
                      <UserPlus className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                      Start Free Today
                      <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </SignUpButton>
                  
                  <SignInButton mode="modal">
                    <Button
                      variant="outline" 
                      size="lg"
                      className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-10 py-6 text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1 group"
                    >
                      <LogIn className="w-5 h-5 mr-3" />
                      Sign In
                    </Button>
                  </SignInButton>
                </div>

                {/* Interactive Demo Preview */}
                <div className="bg-black/20 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 max-w-5xl mx-auto shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse delay-100"></div>
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse delay-200"></div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400 text-sm font-medium">Query_GPT Live Demo</div>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-6 text-left">
                    <div className="flex justify-end animate-fade-in">
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-6 py-4 max-w-md shadow-lg">
                        <p className="text-sm font-medium">How do I optimize my React app for better performance?</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-start animate-fade-in delay-500">
                      <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl px-6 py-6 max-w-3xl border border-white/20 shadow-lg">
                        <div className="flex items-start space-x-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <Brain className="w-4 h-4 text-white" />
                          </div>
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-purple-300">Here are the top React optimization strategies:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Use React.memo for components</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Implement code splitting</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Optimize bundle size</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Check className="w-4 h-4 text-green-400" />
                                <span>Use virtual scrolling</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-20">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    desc: "Get instant responses powered by cutting-edge AI technology",
                    gradient: "from-yellow-500 to-orange-500",
                    delay: "delay-0"
                  },
                  {
                    icon: Brain,
                    title: "Super Intelligent",
                    desc: "Advanced reasoning and context understanding for accurate results",
                    gradient: "from-purple-500 to-pink-500",
                    delay: "delay-100"
                  },
                  {
                    icon: Shield,
                    title: "Secure & Private",
                    desc: "Enterprise-grade security with end-to-end encryption",
                    gradient: "from-green-500 to-emerald-500",
                    delay: "delay-200"
                  }
                ].map((feature, idx) => (
                  <div key={idx} className={`bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 text-center hover:bg-white/10 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group ${feature.delay}`}>
                    <div className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:rotate-6 transition-transform duration-300`}>
                      <feature.icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>

              {/* Use Cases Section */}
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Perfect For <span className="text-purple-400">Every Need</span>
                </h2>
                <p className="text-gray-300 text-xl mb-16 max-w-3xl mx-auto leading-relaxed">
                  From creative writing to complex problem-solving, Query_GPT adapts to your unique requirements
                </p>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { icon: Globe, title: "Travel Planning", desc: "Visa requirements, destinations, itineraries", color: "text-blue-400" },
                    { icon: Code, title: "Coding Help", desc: "Debug code, learn frameworks, optimize performance", color: "text-green-400" },
                    { icon: Lightbulb, title: "Creative Writing", desc: "Stories, blogs, marketing copy, brainstorming", color: "text-yellow-400" },
                    { icon: TrendingUp, title: "Business Insights", desc: "Market analysis, strategy, data interpretation", color: "text-purple-400" }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 group">
                      <item.icon className={`w-12 h-12 ${item.color} mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`} />
                      <h4 className="text-white font-bold text-lg mb-3">{item.title}</h4>
                      <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Proof Stats */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/20 rounded-3xl p-12 mb-20 shadow-2xl">
                <div className="grid md:grid-cols-4 gap-8 text-center">
                  {[
                    { number: "2M+", label: "Queries Answered", icon: MessageCircle },
                    { number: "99.9%", label: "Uptime", icon: Zap },
                    { number: "150K+", label: "Happy Users", icon: Users },
                    { number: "4.9/5", label: "User Rating", icon: Star }
                  ].map((stat, idx) => (
                    <div key={idx} className="group">
                      <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <div className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                        {stat.number}
                      </div>
                      <div className="text-gray-300 font-medium">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              <div className="text-center mb-20">
                <h2 className="text-4xl font-bold text-white mb-16">Loved by <span className="text-pink-400">Thousands</span></h2>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      name: "Sarah Chen",
                      role: "Travel Blogger",
                      content: "Query_GPT helped me plan my entire European trip. The visa requirements and cultural insights were spot-on!",
                      avatar: "SC"
                    },
                    {
                      name: "Marcus Johnson",
                      role: "Software Developer",
                      content: "Best coding assistant I've ever used. It explains complex concepts clearly and helps debug issues quickly.",
                      avatar: "MJ"
                    },
                    {
                      name: "Emma Wilson",
                      role: "Content Creator",
                      content: "My creative writing has improved dramatically. Query_GPT is like having a writing mentor available 24/7.",
                      avatar: "EW"
                    }
                  ].map((testimonial, idx) => (
                    <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                          {testimonial.avatar}
                        </div>
                        <div className="text-left">
                          <div className="text-white font-semibold">{testimonial.name}</div>
                          <div className="text-gray-400 text-sm">{testimonial.role}</div>
                        </div>
                      </div>
                      <p className="text-gray-300 italic leading-relaxed">{testimonial.content}</p>
                      <div className="flex justify-center mt-4 space-x-1">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final CTA */}
              <div className="text-center bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-lg border border-purple-500/30 rounded-3xl p-16 shadow-2xl">
                <Award className="w-16 h-16 text-purple-400 mx-auto mb-8" />
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
                  Ready to <span className="text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">Transform</span> Your Workflow?
                </h2>
                <p className="text-gray-300 text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of professionals who trust Query_GPT for their daily AI assistance needs. 
                  Start your free journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                  <SignUpButton mode="modal">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group"
                    >
                      <Heart className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                      Start Your Journey
                      <Sparkles className="ml-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    </Button>
                  </SignUpButton>
                  
                  <Button
                    variant="outline"
                    size="lg" 
                    className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-12 py-6 text-xl font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  >
                    <Play className="mr-3 w-6 h-6" />
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </main>

          {/* Enhanced Footer */}
          <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-lg">
            <div className="container mx-auto px-4 py-12">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="flex items-center space-x-3 mb-6 md:mb-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white font-bold text-xl">
                    Query<span className="text-purple-400">_GPT</span>
                  </span>
                </div>
                <div className="text-gray-400 text-center md:text-right">
                  <p className="mb-2">© 2024 Query_GPT. Powered by Advanced AI Technology.</p>
                  <p className="text-sm">Made with ❤️ for the future of AI assistance</p>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to Query<span className="text-purple-400">_GPT</span>
            </h1>
            <p className="text-gray-300 text-xl mb-8">
              Your AI assistant is ready to help you with anything you need.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </div>
      </SignedIn>
    </>
  );
}


// import { Button } from "@/components/ui/button";
// import { SignedIn, SignedOut, SignUpButton } from "@clerk/nextjs";
// import { ArrowRight, MessageCircle, Sparkles, Zap, Shield, Globe, Brain, Users, UserPlus } from "lucide-react";

// export default function Home() {
//   return (
//     <>
//         <SignedOut>
//           <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
//       {/* Hero Section */}
//       <main className="container mx-auto px-4 py-16">
//         <div className="max-w-6xl mx-auto">
//           {/* Hero Content */}
//           <div className="text-center mb-16">
//             <div className="inline-flex items-center justify-center p-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full mb-8">
//               <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
//               <span className="text-purple-300 text-sm font-medium">Powered by Advanced AI</span>
//             </div>
            
//             <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
//               Query
//               <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//                 _GPT
//               </span>
//               <span className="text-4xl">💯</span>
//             </h1>
            
//             <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
//               Your intelligent AI companion for instant answers, creative solutions, and deep insights. 
//               Ask anything, get everything.
//             </p>

//             {/* CTA Buttons */}
//             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
//               {/* <Button 
//                 size="lg" 
//                 className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
//               >
//                 Get Started
//                 <ArrowRight className="ml-2 w-5 h-5" />
//               </Button> */}
//               <SignUpButton mode="modal">
//                       <Button 
//                         className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white
//                         px-8 py-4 text-lg font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
//                       >
//                         <UserPlus className="w-4 h-4 mr-2" />
//                         Get Started
//                         <ArrowRight className="ml-2 w-5 h-5" />
//                       </Button>
//                     </SignUpButton>
              
//               <Button
//                 variant="outline" 
//                 size="lg"
//                 className="border-2 border-purple-500/50 text-white hover:bg-purple-500/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm transition-all duration-300"
//               >
//                 Watch Demo
//               </Button>
//             </div>

//             {/* Feature Preview */}
//             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl">
//               <div className="flex items-center justify-between mb-6">
//                 <div className="flex items-center space-x-3">
//                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//                   <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//                 </div>
//                 <div className="text-gray-400 text-sm">Query_GPT Interface</div>
//               </div>
              
//               <div className="space-y-4 text-left">
//                 <div className="flex justify-end">
//                   <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl px-6 py-3 max-w-xs">
//                     <p className="text-sm">What documents do I need to travel from Kenya to Ireland?</p>
//                   </div>
//                 </div>
                
//                 <div className="flex justify-start">
//                   <div className="bg-white/10 backdrop-blur-sm text-white rounded-2xl px-6 py-4 max-w-2xl border border-white/20">
//                     <div className="flex items-start space-x-3">
//                       <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
//                         <Brain className="w-3 h-3 text-white" />
//                       </div>
//                       <div>
//                         <p className="text-sm mb-2"><strong>For travel from Kenya to Ireland, you will need:</strong></p>
//                         <ul className="text-sm space-y-1 text-gray-300">
//                           <li>✓ Valid Kenyan passport (6+ months validity)</li>
//                           <li>✓ Irish visa (Category C short-stay)</li>
//                           <li>✓ Proof of accommodation</li>
//                           <li>✓ Return flight tickets</li>
//                         </ul>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Features Grid */}
//           <div className="grid md:grid-cols-3 gap-8 mb-16">
//             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
//               <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <Zap className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-xl font-bold text-white mb-4">Lightning Fast</h3>
//               <p className="text-gray-300">Get instant responses to your queries with our optimized AI engine.</p>
//             </div>

//             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
//               <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <Brain className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-xl font-bold text-white mb-4">Smart & Accurate</h3>
//               <p className="text-gray-300">Advanced AI that understands context and provides detailed, accurate answers.</p>
//             </div>

//             <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
//               <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <Shield className="w-8 h-8 text-white" />
//               </div>
//               <h3 className="text-xl font-bold text-white mb-4">Secure & Private</h3>
//               <p className="text-gray-300">Your conversations are encrypted and private. We respect your data.</p>
//             </div>
//           </div>

//           {/* Use Cases */}
//           <div className="text-center mb-16">
//             <h2 className="text-4xl font-bold text-white mb-4">Perfect For Every Need</h2>
//             <p className="text-gray-300 text-lg mb-12 max-w-2xl mx-auto">
//               From travel planning to coding help, Query_GPT adapts to your unique requirements
//             </p>

//             <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
//               {[
//                 { icon: Globe, title: "Travel Planning", desc: "Visa requirements, documentation, travel tips" },
//                 { icon: MessageCircle, title: "Technical Help", desc: "Coding tutorials, debugging, best practices" },
//                 { icon: Users, title: "Business Insights", desc: "Market research, strategy, analysis" },
//                 { icon: Sparkles, title: "Creative Writing", desc: "Content creation, brainstorming, editing" }
//               ].map((item, idx) => (
//                 <div key={idx} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
//                   <item.icon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
//                   <h4 className="text-white font-semibold mb-2">{item.title}</h4>
//                   <p className="text-gray-400 text-sm">{item.desc}</p>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-lg border border-white/10 rounded-3xl p-12 text-center mb-16">
//             <div className="grid md:grid-cols-3 gap-8">
//               <div>
//                 <div className="text-4xl font-bold text-white mb-2">1M+</div>
//                 <div className="text-gray-300">Queries Answered</div>
//               </div>
//               <div>
//                 <div className="text-4xl font-bold text-white mb-2">99.9%</div>
//                 <div className="text-gray-300">Uptime</div>
//               </div>
//               <div>
//                 <div className="text-4xl font-bold text-white mb-2">50K+</div>
//                 <div className="text-gray-300">Happy Users</div>
//               </div>
//             </div>
//           </div>

//           {/* Final CTA */}
//           <div className="text-center">
//             <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
//               Ready to Experience the Future?
//             </h2>
//             <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
//               Join thousands of users who trust Query_GPT for their daily AI assistance needs.
//             </p>
//             <Button 
//               size="lg" 
//               className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105"
//             >
//               Start Your Journey
//               <Sparkles className="ml-2 w-6 h-6" />
//             </Button>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="border-t border-white/10 py-8">
//         <div className="container mx-auto px-4 text-center">
//           <p className="text-gray-400">© 2024 Query_GPT. Powered by Advanced AI Technology.</p>
//         </div>
//       </footer>
//     </div>
//     </SignedOut>
//      <SignedIn>
//       <h1> hello  world</h1>
//      </SignedIn>
//     </>

//   );
// }