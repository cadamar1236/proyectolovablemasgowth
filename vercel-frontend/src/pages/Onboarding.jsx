import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';

const Onboarding = () => {
  const [step, setStep] = useState(1);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🎉 Welcome to ASTAR*</h1>
            <p className="text-gray-600">Let's set up your profile</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-16 h-1 ${step > s ? 'bg-purple-600' : 'bg-gray-200'}`}></div>}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Tell us about yourself</h2>
                <input type="text" placeholder="Your name" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Company name" className="w-full px-4 py-3 border border-gray-300 rounded-lg" />
                <textarea placeholder="What are you building?" className="w-full px-4 py-3 border border-gray-300 rounded-lg" rows="4"></textarea>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">What are your goals?</h2>
                {['Get feedback on my MVP', 'Find co-founders', 'Raise funding', 'Build community'].map((goal) => (
                  <label key={goal} className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold">{goal}</span>
                  </label>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="text-center space-y-6">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-4">You're all set!</h2>
                <p className="text-gray-600 mb-6">
                  Welcome to the ASTAR* community. Let's start building something amazing!
                </p>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold">
                  Back
                </button>
              )}
              <button onClick={() => step < 3 ? setStep(step + 1) : null} className="ml-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold">
                {step < 3 ? 'Next' : 'Get Started'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Onboarding;
