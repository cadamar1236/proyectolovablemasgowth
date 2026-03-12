import MainLayout from '../components/layout/MainLayout';

const Profile = () => {
  return (
    <MainLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Profile</h1>
            <p className="text-gray-600">Manage your account settings</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4"></div>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-semibold">
                Change Photo
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="John Doe" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" rows="4" placeholder="Tell us about yourself..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option>Founder</option>
                  <option>Validator</option>
                  <option>Investor</option>
                </select>
              </div>

              <button type="submit" className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
