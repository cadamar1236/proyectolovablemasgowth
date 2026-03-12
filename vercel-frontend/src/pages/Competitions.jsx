import MainLayout from '../components/layout/MainLayout';

const Competitions = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏅 Competitions</h1>
            <p className="text-gray-600">Compete, win prizes, and grow your startup</p>
          </div>

          {/* Active Competitions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">🔥 Active Now</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Innovation Challenge {i + 1}</h3>
                      <p className="text-purple-100 mb-3">Build the next big thing</p>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                      <i className="fas fa-clock mr-1"></i>
                      {i + 3} days left
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm opacity-90">Prize Pool</div>
                      <div className="text-3xl font-bold">${(i + 1) * 10}K</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90">Participants</div>
                      <div className="text-2xl font-bold">{(i + 1) * 50}</div>
                    </div>
                  </div>
                  <button className="w-full py-3 bg-white text-purple-600 rounded-lg font-bold hover:bg-gray-100 transition">
                    Join Competition
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Competitions */}
          <div>
            <h2 className="text-2xl font-bold mb-4">📅 Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="font-bold text-xl mb-2">Upcoming Challenge {i + 1}</h3>
                  <p className="text-gray-600 mb-4">Starting in {(i + 1) * 7} days</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Prize: ${(i + 2) * 5}K</span>
                    <button className="text-purple-600 hover:text-purple-700 font-semibold">
                      Learn More →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Competitions;
