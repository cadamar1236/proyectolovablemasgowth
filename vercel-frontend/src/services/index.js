import api from './api';

export const authService = {
  // Login
  async login(email, password) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  // Register
  async register(userData) {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // OAuth Google
  googleAuth() {
    window.location.href = `${api.defaults.baseURL}/api/auth/google`;
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  // Logout
  async logout() {
    await api.post('/api/auth/logout');
    localStorage.removeItem('authToken');
  },
};

export const dashboardService = {
  // Get dashboard data
  async getDashboardData() {
    const response = await api.get('/api/dashboard');
    return response.data;
  },

  // Get goals
  async getGoals() {
    const response = await api.get('/api/dashboard/goals');
    return response.data;
  },

  // Create goal
  async createGoal(goalData) {
    const response = await api.post('/api/dashboard/goals', goalData);
    return response.data;
  },

  // Update goal
  async updateGoal(goalId, goalData) {
    const response = await api.put(`/api/dashboard/goals/${goalId}`, goalData);
    return response.data;
  },

  // Delete goal
  async deleteGoal(goalId) {
    const response = await api.delete(`/api/dashboard/goals/${goalId}`);
    return response.data;
  },
};

export const marketplaceService = {
  // Get all projects
  async getProjects() {
    const response = await api.get('/api/marketplace/projects');
    return response.data;
  },

  // Get project by ID
  async getProject(id) {
    const response = await api.get(`/api/marketplace/projects/${id}`);
    return response.data;
  },

  // Vote for project
  async voteProject(projectId) {
    const response = await api.post(`/api/marketplace/projects/${projectId}/vote`);
    return response.data;
  },
};

export const competitionsService = {
  // Get all competitions
  async getCompetitions() {
    const response = await api.get('/api/competitions');
    return response.data;
  },

  // Get competition by ID
  async getCompetition(id) {
    const response = await api.get(`/api/competitions/${id}`);
    return response.data;
  },

  // Submit to competition
  async submitToCompetition(competitionId, data) {
    const response = await api.post(`/api/competitions/${competitionId}/submit`, data);
    return response.data;
  },
};

export const eventsService = {
  // Get all events
  async getEvents() {
    const response = await api.get('/api/events');
    return response.data;
  },

  // RSVP to event
  async rsvpEvent(eventId) {
    const response = await api.post(`/api/events/${eventId}/rsvp`);
    return response.data;
  },
};

export const chatService = {
  // Get messages
  async getMessages() {
    const response = await api.get('/api/chat/messages');
    return response.data;
  },

  // Send message
  async sendMessage(message) {
    const response = await api.post('/api/chat/messages', { message });
    return response.data;
  },
};

export const notificationsService = {
  // Get notifications
  async getNotifications() {
    const response = await api.get('/api/notifications');
    return response.data;
  },

  // Mark as read
  async markAsRead(notificationId) {
    const response = await api.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },
};
