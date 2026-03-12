import MainLayout from '../components/layout/MainLayout';

const Leaderboard = () => {
  const leaderboardData = Array.from({ length: 10 }).map((_, i) => ({
    rank: i + 1,
    name: `Startup ${i + 1}`,
    founder: `Founder ${i + 1}`,
    score: Math.floor(Math.random() * 1000) + 500,
    votes: Math.floor(Math.random() * 500) + 100,
    category: ['SaaS', 'E-commerce', 'Fintech'][Math.floor(Math.random() * 3)],
  }));

  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
            <p className="text-gray-600">Top performing startups this month</p>
          </div>

          {/* Top 3 Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[2, 1, 3].map((rank, index) => (
              <div 
                key={rank}
                className={`bg-gradient-to-br ${
                  rank === 1 ? 'from-yellow-400 to-yellow-600' :
                  rank === 2 ? 'from-gray-300 to-gray-500' :
                  'from-orange-400 to-orange-600'
                } rounded-lg p-6 text-white ${rank === 1 ? 'md:order-1' : rank === 2 ? 'md:order-0' : 'md:order-2'}`}
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                  </div>
                  <div className="text-2xl font-bold mb-1">#{rank}</div>
                  <h3 className="font-bold text-xl mb-1">Startup {rank}</h3>
                  <p className="text-sm opacity-90">Founder Name</p>
                  <div className="mt-4 text-3xl font-bold">
                    {1000 - (rank - 1) * 100} pts
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Full Leaderboard */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Startup</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Votes</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leaderboardData.map((item) => (
                  <tr key={item.rank} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="font-bold text-lg">#{item.rank}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.founder}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.votes}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-purple-600">{item.score} pts</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;
