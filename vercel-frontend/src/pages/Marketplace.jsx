import MainLayout from '../components/layout/MainLayout';

const Marketplace = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏪 Marketplace</h1>
            <p className="text-gray-600">Discover and support innovative startups</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search startups..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              <option>All Categories</option>
              <option>SaaS</option>
              <option>E-commerce</option>
              <option>Fintech</option>
              <option>Healthcare</option>
            </select>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer">
                <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400"></div>
                <div className="p-6">
                  <h3 className="font-bold text-xl mb-2">Startup Project {i + 1}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Revolutionary platform changing the way we work and collaborate
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      <i className="fas fa-users mr-1"></i>
                      {Math.floor(Math.random() * 1000)} users
                    </span>
                    <span className="text-sm font-semibold text-purple-600">
                      Stage: MVP
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-2 text-red-500 hover:text-red-600">
                      <i className="fas fa-heart"></i>
                      <span>{Math.floor(Math.random() * 500)}</span>
                    </button>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketplace;
