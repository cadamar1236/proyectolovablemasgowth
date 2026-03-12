import MainLayout from '../components/layout/MainLayout';

const Events = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📅 Events</h1>
            <p className="text-gray-600">Network, learn, and grow with the community</p>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-48 h-48 md:h-auto bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Startup Networking Event {i + 1}</h3>
                      <p className="text-gray-600">Connect with founders, investors, and mentors</p>
                    </div>
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold mt-2 md:mt-0 self-start">
                      {i < 2 ? 'This Week' : 'Next Month'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-calendar text-purple-600"></i>
                      <span>Mar {15 + i}, 2026</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-clock text-purple-600"></i>
                      <span>6:00 PM - 9:00 PM</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-600">
                      <i className="fas fa-map-marker-alt text-purple-600"></i>
                      <span>{i % 2 === 0 ? 'Online' : 'San Francisco, CA'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <i className="fas fa-users mr-1"></i>
                      {Math.floor(Math.random() * 200) + 50} attending
                    </div>
                    <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                      RSVP
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

export default Events;
