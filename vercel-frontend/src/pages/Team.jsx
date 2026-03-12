import MainLayout from '../components/layout/MainLayout';

const Team = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Team</h1>
            <p className="text-gray-600">Manage your startup team members</p>
          </div>

          <button className="mb-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
            <i className="fas fa-plus mr-2"></i>
            Add Team Member
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4"></div>
                  <h3 className="font-bold text-xl mb-1">Team Member {i + 1}</h3>
                  <p className="text-gray-600 mb-4">{['CEO', 'CTO', 'Designer', 'Developer', 'Marketing'][i]}</p>
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <a href="#" className="text-gray-400 hover:text-purple-600"><i className="fab fa-linkedin"></i></a>
                    <a href="#" className="text-gray-400 hover:text-purple-600"><i className="fab fa-twitter"></i></a>
                    <a href="#" className="text-gray-400 hover:text-purple-600"><i className="fas fa-envelope"></i></a>
                  </div>
                  <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold">
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Team;
