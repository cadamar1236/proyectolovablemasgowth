/**
 * Events Page - Display and manage ASTAR* events
 */

import { createLayoutWithSidebars } from './layout-with-sidebars';

export interface EventsPageProps {
  userName: string;
  userAvatar?: string;
  userRole?: string;
}

export function getEventsPage(props: EventsPageProps): string {
  const { userName, userAvatar, userRole } = props;

  const content = `
    <div class="p-4 md:p-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">📅 Events</h1>
        <p class="text-gray-600">Join live pitch events, workshops, and networking sessions</p>
      </div>

      ${userRole === 'admin' ? `
      <!-- Admin Actions -->
      <div class="mb-6 flex justify-end">
        <button onclick="openCreateEventModal()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg">
          <i class="fas fa-plus"></i>
          Create Event
        </button>
      </div>
      ` : ''}

      <!-- Featured Events -->
      <div id="featured-events" class="mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">⭐ Featured Events</h2>
        <div id="featured-events-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Loading -->
          <div class="col-span-full text-center py-8 text-gray-500">
            <i class="fas fa-spinner fa-spin text-3xl mb-2"></i>
            <p>Loading events...</p>
          </div>
        </div>
      </div>

      <!-- All Events -->
      <div id="all-events">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">🗓️ Upcoming Events</h2>
        <div id="all-events-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Events will be loaded here -->
        </div>
      </div>
    </div>

    <!-- Event Details Modal -->
    <div id="event-details-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div id="event-details-content">
          <!-- Event details will be loaded here -->
        </div>
      </div>
    </div>

    <!-- Create/Edit Event Modal (Admin only) -->
    ${userRole === 'admin' ? `
    <div id="create-event-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-900">Create New Event</h2>
            <button onclick="closeCreateEventModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>

          <form id="create-event-form" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Event Title*</label>
              <input type="text" name="title" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description*</label>
              <textarea name="description" required rows="4" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Event Type*</label>
                <select name="event_type" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                  <option value="pitch">Pitch Event</option>
                  <option value="workshop">Workshop</option>
                  <option value="networking">Networking</option>
                  <option value="webinar">Webinar</option>
                  <option value="competition">Competition</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Event Date*</label>
                <input type="date" name="event_date" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Time</label>
                <input type="time" name="event_time" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                <input type="number" name="duration_minutes" value="60" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input type="text" name="location" placeholder="Online, Madrid, etc." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Meeting Link</label>
              <input type="url" name="meeting_link" placeholder="https://zoom.us/..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Registration Link</label>
              <input type="url" name="registration_link" placeholder="https://..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Max Participants</label>
              <input type="number" name="max_participants" placeholder="Leave empty for unlimited" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Banner Image URL</label>
              <input type="url" name="banner_image_url" placeholder="https://..." class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Host Name</label>
                <input type="text" name="host_name" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Host Avatar URL</label>
                <input type="url" name="host_avatar" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
              <input type="text" name="tags" placeholder="early-stage, fundraising, AI" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" name="is_featured" id="is_featured" class="w-4 h-4 text-purple-600">
              <label for="is_featured" class="text-sm font-semibold text-gray-700">Featured Event</label>
            </div>

            <div class="flex gap-4 pt-4">
              <button type="button" onclick="closeCreateEventModal()" class="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" class="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
                Create Event
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    ` : ''}

    <script>
      // Load events on page load
      document.addEventListener('DOMContentLoaded', () => {
        loadEvents();
      });

      async function loadEvents() {
        try {
          const response = await axios.get('/api/events', {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            const events = response.data.events;
            const featured = events.filter(e => e.is_featured && e.status === 'upcoming');
            const upcoming = events.filter(e => !e.is_featured && e.status === 'upcoming');

            renderEvents(featured, 'featured-events-grid');
            renderEvents(upcoming, 'all-events-grid');
          }
        } catch (error) {
          console.error('Error loading events:', error);
          document.getElementById('featured-events-grid').innerHTML = '<p class="col-span-full text-center text-red-500">Failed to load events</p>';
        }
      }

      function renderEvents(events, containerId) {
        const container = document.getElementById(containerId);
        
        if (events.length === 0) {
          container.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">No events available</p>';
          return;
        }

        const isAdmin = ${userRole === 'admin' ? 'true' : 'false'};

        container.innerHTML = events.map(event => \`
          <div class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div onclick="showEventDetails(\${event.id})" class="cursor-pointer">
            \${event.banner_image_url ? \`
              <img src="\${event.banner_image_url}" alt="\${event.title}" class="w-full h-48 object-cover">
            \` : \`
              <div class="w-full h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-6xl">
                📅
              </div>
            \`}
            <div class="p-6">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-xl font-bold text-gray-900">\${event.title}</h3>
                \${event.is_featured ? '<span class="text-yellow-500 text-xl">⭐</span>' : ''}
              </div>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">\${event.description}</p>
              
              <div class="space-y-2 text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <i class="fas fa-calendar text-purple-500"></i>
                  <span>\${new Date(event.event_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                \${event.event_time ? \`
                  <div class="flex items-center gap-2">
                    <i class="fas fa-clock text-purple-500"></i>
                    <span>\${event.event_time}</span>
                  </div>
                \` : ''}
                <div class="flex items-center gap-2">
                  <i class="fas fa-map-marker-alt text-purple-500"></i>
                  <span>\${event.location || 'Online'}</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="fas fa-users text-purple-500"></i>
                  <span>\${event.registered_count || 0}\${event.max_participants ? ' / ' + event.max_participants : ''} registered</span>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-gray-200">
                <span class="inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                  \${event.event_type}
                </span>
              </div>
            </div>
            </div>
            \${isAdmin ? \`
              <div class="px-6 pb-4 flex gap-2">
                <button onclick="event.stopPropagation(); deleteEvent(\${event.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">
                  <i class="fas fa-trash mr-2"></i>Delete
                </button>
              </div>
            \` : ''}
          </div>
        \`).join('');
      }

      async function showEventDetails(eventId) {
        try {
          const response = await axios.get(\`/api/events/\${eventId}\`, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            const event = response.data.event;
            const modal = document.getElementById('event-details-modal');
            const content = document.getElementById('event-details-content');

            const isRegistered = event.registrations.some(r => r.user_id === parseInt(localStorage.getItem('userId')));
            const isAdmin = ${userRole === 'admin' ? 'true' : 'false'};

            content.innerHTML = \`
              <div>
                \${event.banner_image_url ? \`
                  <img src="\${event.banner_image_url}" alt="\${event.title}" class="w-full h-64 object-cover">
                \` : \`
                  <div class="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-8xl">
                    📅
                  </div>
                \`}
                <div class="p-8">
                  <h2 class="text-3xl font-bold text-gray-900 mb-4">\${event.title}</h2>
                  <p class="text-gray-700 mb-6">\${event.description}</p>

                  <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="flex items-center gap-3 text-gray-700">
                      <i class="fas fa-calendar text-purple-500 text-xl"></i>
                      <div>
                        <p class="text-sm text-gray-500">Date</p>
                        <p class="font-semibold">\${new Date(event.event_date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    \${event.event_time ? \`
                      <div class="flex items-center gap-3 text-gray-700">
                        <i class="fas fa-clock text-purple-500 text-xl"></i>
                        <div>
                          <p class="text-sm text-gray-500">Time</p>
                          <p class="font-semibold">\${event.event_time}</p>
                        </div>
                      </div>
                    \` : ''}
                    <div class="flex items-center gap-3 text-gray-700">
                      <i class="fas fa-map-marker-alt text-purple-500 text-xl"></i>
                      <div>
                        <p class="text-sm text-gray-500">Location</p>
                        <p class="font-semibold">\${event.location || 'Online'}</p>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 text-gray-700">
                      <i class="fas fa-users text-purple-500 text-xl"></i>
                      <div>
                        <p class="text-sm text-gray-500">Participants</p>
                        <p class="font-semibold">\${event.registered_count || 0}\${event.max_participants ? ' / ' + event.max_participants : ''}</p>
                      </div>
                    </div>
                  </div>

                  <div class="flex gap-4 mb-6">
                    \${!isRegistered ? \`
                      <button onclick="registerForEvent(\${event.id})" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
                        Register Now
                      </button>
                    \` : \`
                      <button onclick="unregisterFromEvent(\${event.id})" class="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
                        Unregister
                      </button>
                    \`}
                    \${event.meeting_link ? \`
                      <a href="\${event.meeting_link}" target="_blank" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        Join Meeting
                      </a>
                    \` : ''}
                    \${event.registration_link ? \`
                      <a href="\${event.registration_link}" target="_blank" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold text-center">
                        External Registration
                      </a>
                    \` : ''}
                  </div>

                  \${isAdmin ? \`
                    <button onclick="deleteEventFromModal(\${event.id})" class="w-full mb-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">
                      <i class="fas fa-trash mr-2"></i>Delete Event
                    </button>
                  \` : ''}

                  <button onclick="closeEventDetails()" class="w-full px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50">
                    Close
                  </button>
                </div>
              </div>
            \`;

            modal.classList.remove('hidden');
          }
        } catch (error) {
          console.error('Error loading event details:', error);
          alert('Failed to load event details');
        }
      }

      function closeEventDetails() {
        document.getElementById('event-details-modal').classList.add('hidden');
      }

      async function registerForEvent(eventId) {
        try {
          const response = await axios.post(\`/api/events/\${eventId}/register\`, {}, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            alert('Successfully registered for event!');
            closeEventDetails();
            loadEvents();
          }
        } catch (error) {
          console.error('Error registering for event:', error);
          alert(error.response?.data?.error || 'Failed to register for event');
        }
      }

      async function unregisterFromEvent(eventId) {
        if (!confirm('Are you sure you want to unregister from this event?')) {
          return;
        }

        try {
          const response = await axios.delete(\`/api/events/\${eventId}/register\`, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            alert('Successfully unregistered from event');
            closeEventDetails();
            loadEvents();
          }
        } catch (error) {
          console.error('Error unregistering from event:', error);
          alert('Failed to unregister from event');
        }
      }

      ${userRole === 'admin' ? `
      async function deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          return;
        }

        try {
          const response = await axios.delete(\`/api/events/\${eventId}\`, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            alert('Event deleted successfully');
            loadEvents();
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          alert('Failed to delete event');
        }
      }

      async function deleteEventFromModal(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
          return;
        }

        try {
          const response = await axios.delete(\`/api/events/\${eventId}\`, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            alert('Event deleted successfully');
            closeEventDetails();
            loadEvents();
          }
        } catch (error) {
          console.error('Error deleting event:', error);
          alert('Failed to delete event');
        }
      }

      function openCreateEventModal() {
        document.getElementById('create-event-modal').classList.remove('hidden');
      }

      function closeCreateEventModal() {
        document.getElementById('create-event-modal').classList.add('hidden');
        document.getElementById('create-event-form').reset();
      }

      document.getElementById('create-event-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        // Convert tags to array
        if (data.tags) {
          data.tags = data.tags.split(',').map(t => t.trim());
        }

        // Convert checkbox to boolean
        data.is_featured = formData.get('is_featured') === 'on';

        try {
          const response = await axios.post('/api/events', data, {
            headers: {
              'Authorization': 'Bearer ' + document.cookie.match(/authToken=([^;]+)/)?.[1]
            }
          });

          if (response.data.success) {
            alert('Event created successfully!');
            closeCreateEventModal();
            loadEvents();
          }
        } catch (error) {
          console.error('Error creating event:', error);
          alert('Failed to create event');
        }
      });
      ` : ''}
    </script>
  `;

  return createLayoutWithSidebars({
    content,
    currentPage: 'competitions', // Using competitions for now, we can create a new page type later
    userName,
    userAvatar,
    pageTitle: 'Events - ASTAR*',
    userRole
  });
}
