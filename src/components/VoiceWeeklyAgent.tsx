/**
 * Voice Weekly Agent - Interactive voice-based weekly check-in
 * Uses Web Speech API (SpeechSynthesis + SpeechRecognition)
 */

import { h } from 'hono/jsx';
import { useEffect, useState } from 'hono/jsx';

interface VoiceWeeklyAgentProps {
  onClose: () => void;
  userId: number;
}

// Weekly questions template
const WEEKLY_QUESTIONS = [
  {
    id: 'progress',
    question: "Hi! Let's do your weekly check-in. First question: What progress did you make this week?",
    category: 'progress'
  },
  {
    id: 'metrics',
    question: "Great! Now tell me about your key metrics. What are your numbers this week?",
    category: 'metrics'
  },
  {
    id: 'blockers',
    question: "Are there any blockers or challenges you're facing right now?",
    category: 'blockers'
  },
  {
    id: 'next_week',
    question: "What are your main goals for next week?",
    category: 'next_week'
  },
  {
    id: 'help',
    question: "Is there anything specific I can help you with?",
    category: 'help'
  }
];

export function VoiceWeeklyAgent({ onClose, userId }: VoiceWeeklyAgentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState('');

  // Check browser support
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'speechSynthesis' in window && 
                     ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    setIsSupported(supported);

    if (!supported) {
      setError('Your browser does not support Web Speech API. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Start with first question
    speakQuestion(0);
  }, []);

  // Text-to-Speech: Make the agent speak
  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0; // Normal speed
      utterance.pitch = 1.0; // Normal pitch
      utterance.volume = 1.0; // Full volume

      setIsSpeaking(true);

      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  };

  // Speak current question
  const speakQuestion = async (index: number) => {
    if (index >= WEEKLY_QUESTIONS.length) {
      // All questions answered - complete the session
      await speak("That's all for this week! Your responses have been recorded. Keep up the great work!");
      setIsCompleted(true);
      await saveResponses();
      return;
    }

    const question = WEEKLY_QUESTIONS[index];
    await speak(question.question);
    
    // After speaking, start listening for answer
    setTimeout(() => {
      startListening();
    }, 500);
  };

  // Speech-to-Text: Listen to user's answer
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition not available');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false; // Stop after one result
    recognition.interimResults = false; // Only final results
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setTranscript('');

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      
      // Save response
      const currentQuestion = WEEKLY_QUESTIONS[currentQuestionIndex];
      setResponses(prev => ({
        ...prev,
        [currentQuestion.id]: transcript
      }));

      // Acknowledge and move to next question
      setTimeout(async () => {
        await speak("Got it. Moving to the next question.");
        setCurrentQuestionIndex(prev => prev + 1);
      }, 500);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError('Could not understand. Please try again or type your answer.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error('Error starting recognition:', e);
      setIsListening(false);
      setError('Error starting voice recognition');
    }
  };

  // Move to next question when index changes
  useEffect(() => {
    if (currentQuestionIndex > 0 && currentQuestionIndex < WEEKLY_QUESTIONS.length) {
      speakQuestion(currentQuestionIndex);
    } else if (currentQuestionIndex >= WEEKLY_QUESTIONS.length && !isCompleted) {
      speakQuestion(currentQuestionIndex);
    }
  }, [currentQuestionIndex]);

  // Save all responses to database
  const saveResponses = async () => {
    try {
      const response = await fetch('/api/chat-agent/voice-weekly-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('authToken')
        },
        body: JSON.stringify({
          userId,
          responses,
          week: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save responses');
      }

      console.log('[VOICE-AGENT] Weekly check-in saved successfully');
    } catch (e) {
      console.error('[VOICE-AGENT] Error saving responses:', e);
      setError('Failed to save your responses. Please try again.');
    }
  };

  // Manual text input fallback
  const handleTextInput = (e: any) => {
    e.preventDefault();
    const input = e.target.elements.answer.value.trim();
    
    if (!input) return;

    const currentQuestion = WEEKLY_QUESTIONS[currentQuestionIndex];
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: input
    }));

    setTranscript(input);
    e.target.reset();

    // Move to next question
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
    }, 500);
  };

  // Skip question
  const skipQuestion = () => {
    const currentQuestion = WEEKLY_QUESTIONS[currentQuestionIndex];
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: '(skipped)'
    }));

    setCurrentQuestionIndex(prev => prev + 1);
  };

  // Stop/restart listening
  const toggleListening = () => {
    if (isListening) {
      window.speechSynthesis.cancel();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
        <div class="bg-white rounded-2xl max-w-md mx-4 p-6">
          <div class="text-center">
            <div class="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 class="text-xl font-bold mb-2">Browser Not Supported</h3>
            <p class="text-gray-600 mb-4">
              Your browser doesn't support Web Speech API. Please use Chrome, Edge, or Safari for the voice agent.
            </p>
            <button onclick={onClose} class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
        <div class="bg-white rounded-2xl max-w-md mx-4 p-6">
          <div class="text-center">
            <div class="text-green-500 text-6xl mb-4">✓</div>
            <h3 class="text-2xl font-bold mb-2">Check-in Complete!</h3>
            <p class="text-gray-600 mb-6">
              Your weekly check-in has been recorded. See you next week!
            </p>
            
            {/* Summary of responses */}
            <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h4 class="font-semibold mb-3 text-sm text-gray-700">Your Responses:</h4>
              <div class="space-y-2">
                {WEEKLY_QUESTIONS.map((q, i) => (
                  <div key={q.id} class="text-sm">
                    <span class="text-purple-600 font-medium">{i + 1}. {q.category}:</span>
                    <p class="text-gray-700 ml-3">{responses[q.id] || '(no response)'}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onclick={onClose} class="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = WEEKLY_QUESTIONS[currentQuestionIndex];
  const progress = ((currentQuestionIndex / WEEKLY_QUESTIONS.length) * 100).toFixed(0);

  return (
    <div class="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center">
      <div class="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div class="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-2xl font-bold text-white mb-1">🎙️ Voice Weekly Check-in</h3>
              <p class="text-purple-100 text-sm">Question {currentQuestionIndex + 1} of {WEEKLY_QUESTIONS.length}</p>
            </div>
            <button onclick={onClose} class="text-white/70 hover:text-white transition-colors">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Progress bar */}
          <div class="w-full bg-white/20 rounded-full h-2">
            <div class="bg-white rounded-full h-2 transition-all duration-500" style={`width: ${progress}%`}></div>
          </div>
        </div>

        {/* Content */}
        <div class="p-6">
          {error && (
            <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p class="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Current Question */}
          <div class="mb-6">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas fa-robot text-purple-600 text-xl"></i>
              </div>
              <div class="flex-1">
                <div class="bg-gray-50 rounded-2xl rounded-tl-none p-4">
                  <p class="text-gray-800 font-medium">{currentQuestion.question}</p>
                </div>
              </div>
            </div>

            {/* Voice Status */}
            <div class="flex items-center justify-center gap-4 mb-6">
              {isSpeaking && (
                <div class="flex items-center gap-2 text-purple-600">
                  <div class="animate-pulse">🔊</div>
                  <span class="text-sm font-medium">Agent speaking...</span>
                </div>
              )}
              
              {isListening && (
                <div class="flex items-center gap-2 text-green-600">
                  <div class="animate-pulse">🎤</div>
                  <span class="text-sm font-medium">Listening...</span>
                </div>
              )}

              {!isSpeaking && !isListening && (
                <button 
                  onclick={toggleListening}
                  class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:shadow-lg transition-all font-semibold"
                >
                  <i class="fas fa-microphone"></i>
                  <span>Start Speaking</span>
                </button>
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div class="flex items-start gap-4 mb-4">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i class="fas fa-user text-blue-600"></i>
                </div>
                <div class="flex-1">
                  <div class="bg-blue-50 rounded-2xl rounded-tl-none p-4">
                    <p class="text-gray-800">{transcript}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manual Text Input (Fallback) */}
          <div class="border-t border-gray-200 pt-4">
            <p class="text-sm text-gray-600 mb-3">Or type your answer:</p>
            <form onsubmit={handleTextInput} class="flex gap-2">
              <input 
                type="text"
                name="answer"
                placeholder="Type your answer here..."
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button 
                type="submit"
                class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Send
              </button>
            </form>

            <div class="flex justify-between mt-4">
              <button 
                onclick={skipQuestion}
                class="text-sm text-gray-500 hover:text-gray-700"
              >
                Skip question →
              </button>

              {isListening && (
                <button 
                  onclick={toggleListening}
                  class="text-sm text-red-500 hover:text-red-700"
                >
                  Stop listening
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
