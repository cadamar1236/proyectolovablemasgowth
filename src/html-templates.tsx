// HTML templates for the application
// These are JSX elements for Hono

export function getNotFoundPage() {
  return (
    <html>
      <head><title>Proyecto no encontrado</title></head>
      <body>
        <h1>Proyecto no encontrado</h1>
        <a href="/">Volver al inicio</a>
      </body>
    </html>
  );
}

const voteScript = (projectId: string, authToken: string) => `
  let selectedRating = 0;
  const projectId = '${projectId}';
  const authToken = '${authToken}';

  function generateVoteButtons() {
    const container = document.getElementById('vote-buttons');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const button = document.createElement('button');
      button.onclick = () => selectRating(i);
      button.className = 'text-3xl transition-colors ' + (
        selectedRating >= i ? 'text-yellow-400' : 'text-gray-300'
      );
      button.innerHTML = '<i class="fas fa-star"></i>';
      container.appendChild(button);
    }
  }

  function selectRating(rating) {
    selectedRating = rating;
    generateVoteButtons();
    document.getElementById('submit-btn').disabled = false;
  }

  async function submitVote() {
    if (selectedRating === 0) {
      alert('Por favor selecciona una calificación');
      return;
    }
    try {
      const response = await fetch(\`/api/projects/\${projectId}/vote\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${authToken}\`
        },
        body: JSON.stringify({ rating: selectedRating })
      });
      if (response.ok) {
        alert('¡Gracias por tu voto! Has contribuido a validar este proyecto.');
        window.location.href = '/leaderboard';
      } else {
        const error = await response.json();
        alert('Error: ' + (error.error || 'No se pudo registrar el voto'));
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error al votar. Inténtalo de nuevo.');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    generateVoteButtons();
  });
`;

export function getVotePage(project: any, projectId: string, authToken: string) {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Votar Proyecto - {project.title}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    primary: '#6366f1',
                    secondary: '#8b5cf6',
                  }
                }
              }
            }
          `
        }} />
      </head>
      <body className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <i className="fas fa-vote-yea text-4xl text-primary mb-4"></i>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Votar Proyecto</h1>
              <p className="text-gray-600">Como validador, tu opinión es importante</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h2>
              <p className="text-gray-600 mb-4">{project.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <i className="fas fa-user mr-2"></i>
                <span>Creado por {project.creator_name}</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 mb-6">¿Cuántas estrellas le das a este proyecto?</p>

              <div className="flex justify-center space-x-2 mb-8" id="vote-buttons">
                {/* Vote buttons will be inserted here */}
              </div>

              <button onclick="submitVote()" id="submit-btn"
                      className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                <i className="fas fa-paper-plane mr-2"></i>Enviar Voto
              </button>
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: voteScript(projectId, authToken) }} />
      </body>
    </html>
  );
}