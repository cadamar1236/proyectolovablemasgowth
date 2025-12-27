import { useEffect, useState } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Goal {
  id: number;
  description: string;
  target_value: number;
  current_value: number;
  deadline: string;
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
}

interface DashboardWithChatProps {
  userId: number;
  projectId?: number;
}

export default function DashboardWithChat({ userId, projectId }: DashboardWithChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState({
    completedGoals: 0,
    overdueGoals: 0,
    totalGoals: 0,
    overallCompletion: 0
  });
  const [chatExpanded, setChatExpanded] = useState(false);

  useEffect(() => {
    loadGoals();
    loadChatHistory();
  }, [userId, projectId]);

  const loadGoals = async () => {
    try {
      const response = await fetch(`/api/dashboard/goals?userId=${userId}${projectId ? `&projectId=${projectId}` : ''}`);
      const data = await response.json();
      setGoals(data.goals || []);
      calculateMetrics(data.goals || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      const response = await fetch(`/api/chat/history?userId=${userId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const calculateMetrics = (goalsList: Goal[]) => {
    const completed = goalsList.filter(g => g.status === 'completed').length;
    const overdue = goalsList.filter(g => 
      g.status !== 'completed' && new Date(g.deadline) < new Date()
    ).length;
    const total = goalsList.length;
    const completion = total > 0 ? Math.round((completed / total) * 100) : 0;

    setMetrics({
      completedGoals: completed,
      overdueGoals: overdue,
      totalGoals: total,
      overallCompletion: completion
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          projectId,
          message: inputMessage,
          context: {
            goals,
            metrics
          }
        })
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Reload goals if the agent made changes
      if (data.goalsUpdated) {
        await loadGoals();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, ocurrió un error. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ValidAI Studio
          </h1>
        </div>
        
        <nav className="mt-6 px-3">
          <a href="#" className="flex items-center px-4 py-3 text-gray-700 bg-primary/10 rounded-lg mb-2">
            <i className="fas fa-home mr-3"></i>
            Home (HQ)
          </a>
          <a href="#notifications" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-bell mr-3"></i>
            Notifications
            <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
          </a>
          <a href="#traction" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-chart-line mr-3"></i>
            Traction
          </a>
          <a href="#inbox" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-inbox mr-3"></i>
            Inbox
          </a>
          <a href="#leaderboard" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-trophy mr-3"></i>
            Leaderboard
          </a>
          <a href="#trending" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-fire mr-3"></i>
            Trending Products
          </a>
          <a href="#planner" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-calendar mr-3"></i>
            Planner
          </a>
          <a href="#crm" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-users mr-3"></i>
            CRM
          </a>
          <a href="#insights" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-chart-bar mr-3"></i>
            Insights
          </a>
        </nav>

        <div className="absolute bottom-0 w-64 p-3 border-t">
          <a href="#search" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-search mr-3"></i>
            Search
          </a>
          <a href="#settings" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg mb-2">
            <i className="fas fa-cog mr-3"></i>
            Settings
          </a>
          <a href="#help" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">
            <i className="fas fa-question-circle mr-3"></i>
            Help
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto transition-all duration-300 ${chatExpanded ? 'mr-96' : 'mr-20'}`}>
        <div className="p-8">
          {/* Header with Score */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
              <p className="text-gray-600 mt-1">Monitorea tu progreso y objetivos</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center min-w-[200px]">
              <div className="flex items-center justify-center mb-2">
                <i className="fas fa-trophy text-red-500 text-2xl mr-2"></i>
                <span className="text-gray-600 font-semibold">Score</span>
              </div>
              <div className="text-5xl font-bold text-red-500 mb-2">{metrics.overallCompletion}.0</div>
              <div className="flex items-center justify-center space-x-4 text-sm">
                <span className="flex items-center text-yellow-500">
                  <i className="fas fa-star mr-1"></i> {metrics.completedGoals}
                </span>
                <span className="flex items-center text-red-500">
                  <i className="fas fa-heart mr-1"></i> {metrics.overdueGoals}
                </span>
                <span className="flex items-center text-blue-500">
                  <i className="fas fa-check-circle mr-1"></i> {metrics.totalGoals}
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Goals Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <i className="fas fa-bullseye text-blue-500 text-xl mr-3"></i>
                <h3 className="text-xl font-bold text-gray-900">Goals Status</h3>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                      fill="none"
                    />
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      stroke="#10b981"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${(metrics.overallCompletion / 100) * 502.4} 502.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">{metrics.overallCompletion}%</div>
                      <div className="text-sm text-gray-600">Overall Completion</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metrics.completedGoals}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{goals.filter(g => g.status === 'in_progress').length}</div>
                  <div className="text-xs text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{metrics.overdueGoals}</div>
                  <div className="text-xs text-gray-600">Overdue</div>
                </div>
              </div>
            </div>

            {/* Goals Progress Over Time */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center mb-4">
                <i className="fas fa-chart-line text-purple-500 text-xl mr-3"></i>
                <h3 className="text-xl font-bold text-gray-900">Goals Progress Over Time</h3>
              </div>
              <div className="h-64 flex items-end justify-around space-x-2">
                {goals.slice(0, 7).map((goal, index) => {
                  const progress = (goal.current_value / goal.target_value) * 100;
                  return (
                    <div key={goal.id} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                          style={{ height: `${Math.min(progress, 100)}%`, marginTop: `${100 - Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600 mt-2">Day {index + 1}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Goals List */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <i className="fas fa-list text-orange-500 text-xl mr-3"></i>
                <h3 className="text-xl font-bold text-gray-900">Active Goals</h3>
              </div>
              <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition">
                <i className="fas fa-plus mr-2"></i>New Goal
              </button>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 5).map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`w-3 h-3 rounded-full mr-3 ${
                        goal.status === 'completed' ? 'bg-green-500' :
                        goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></span>
                      <h4 className="font-semibold text-gray-900">{goal.description}</h4>
                    </div>
                    <div className="ml-6">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <span className="mr-4">Target: {goal.target_value}</span>
                        <span>Current: {goal.current_value}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${Math.min((goal.current_value / goal.target_value) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-600">
                      {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className={`fixed right-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 ${chatExpanded ? 'w-96' : 'w-20'} shadow-2xl`}>
        {/* Chat Toggle */}
        <button
          onClick={() => setChatExpanded(!chatExpanded)}
          className="absolute -left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white p-3 rounded-l-lg hover:bg-gray-800 transition"
        >
          <i className={`fas ${chatExpanded ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>

        {chatExpanded ? (
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold">AI Assistant</h3>
                <button className="text-gray-400 hover:text-white">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <p className="text-xs text-gray-400">Gestiona tus objetivos y progreso</p>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-8">
                  <i className="fas fa-robot text-4xl mb-4"></i>
                  <p className="text-sm">¡Hola! Soy tu asistente de IA.</p>
                  <p className="text-xs mt-2">Puedo ayudarte a:</p>
                  <ul className="text-xs mt-2 space-y-1 text-left">
                    <li>• Crear y actualizar objetivos</li>
                    <li>• Registrar progreso</li>
                    <li>• Ver estadísticas</li>
                    <li>• Analizar tu rendimiento</li>
                  </ul>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-800 text-gray-100'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-end space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:bg-gray-600 text-white p-2 rounded-lg transition"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Enter para enviar</span>
                <span className="flex items-center">
                  <i className="fas fa-circle text-green-500 mr-1 text-[8px]"></i>
                  Online
                </span>
              </div>
            </div>

            {/* Past Chats */}
            <div className="border-t border-gray-700 p-4">
              <h4 className="text-sm font-semibold mb-2">Past Chats</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="hover:text-white cursor-pointer">New Chat <span className="float-right">6m</span></div>
                <div className="hover:text-white cursor-pointer">New Chat <span className="float-right">6m</span></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-6 space-y-6">
            <button className="text-white hover:text-primary transition">
              <i className="fas fa-plus text-xl"></i>
            </button>
            <button className="text-white hover:text-primary transition">
              <i className="fas fa-clock text-xl"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}