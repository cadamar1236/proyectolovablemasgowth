import React, { ChangeEvent, FormEvent, useEffect, useState, useRef } from 'react';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from 'chart.js';
import { Line as LineChart } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

interface Goal {
  id: number;
  description: string;
  status: 'active' | 'completed';
}

interface WeeklyUpdate {
  week: string;
  goalStatuses: { [goalId: number]: boolean };
}

interface Achievement {
  id: number;
  date: string;
  description: string;
}

interface WhatsAppCode {
  code: string;
  expires_in: string;
}

interface LinkedInProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  industry: string;
  profileUrl: string;
  photoUrl?: string;
  connections?: number;
  compatibilityScore: number;
  matchReasons: string[];
  selected?: boolean;
}

interface DBGoal {
  id: number;
  user_id: number;
  description: string;
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

interface DBWeeklyUpdate {
  id: number;
  user_id: number;
  week: string;
  goal_statuses: string; // JSON string
  created_at: string;
}

interface DBAchievement {
  id: number;
  user_id: number;
  date: string;
  description: string;
  created_at: string;
}

interface AstarPendingMessage {
  sent_message_id: number;
  sent_at: string;
  subject: string;
  response_prompt: string;
  category: string;
}

const Dashboard = () => {
  console.log("Dashboard component loaded");
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState<WeeklyUpdate[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [currentWeek, setCurrentWeek] = useState('');
  const [goalStatuses, setGoalStatuses] = useState<{ [goalId: number]: boolean }>({});
  const [newAchievement, setNewAchievement] = useState('');
  const [loading, setLoading] = useState(true);
  const [internalData, setInternalData] = useState<any>({ dashboards: [], totalNonAdminUsers: 0 });
  const [loggedInUsers, setLoggedInUsers] = useState<number>(0);
  const [whatsappCode, setWhatsappCode] = useState<WhatsAppCode | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // ASTAR Messages state
  const [astarPendingMessages, setAstarPendingMessages] = useState<AstarPendingMessage[]>([]);
  const [showAstarNotification, setShowAstarNotification] = useState(false);
  const [astarResponse, setAstarResponse] = useState('');
  const [respondingToMessage, setRespondingToMessage] = useState<number | null>(null);
  
  // LinkedIn Connector state
  const [linkedinProfiles, setLinkedinProfiles] = useState<LinkedInProfile[]>([]);
  const [linkedinSearchType, setLinkedinSearchType] = useState<'investor' | 'talent' | 'customer' | 'partner'>('investor');
  const [linkedinQuery, setLinkedinQuery] = useState('');
  const [linkedinSearching, setLinkedinSearching] = useState(false);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [showMessageGenerator, setShowMessageGenerator] = useState(false);

  // API functions
  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/dashboard/goals');
      const data = await response.json() as { goals: DBGoal[] };
      setGoals(data.goals.map(g => ({ id: g.id, description: g.description, status: g.status })));
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchWeeklyUpdates = async () => {
    try {
      const response = await fetch('/api/dashboard/weekly-updates');
      const data = await response.json() as { weeklyUpdates: DBWeeklyUpdate[] };
      setWeeklyUpdates(data.weeklyUpdates.map(w => ({
        week: w.week,
        goalStatuses: JSON.parse(w.goal_statuses)
      })));
    } catch (error) {
      console.error('Error fetching weekly updates:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch('/api/dashboard/achievements');
      const data = await response.json() as { achievements: DBAchievement[] };
      setAchievements(data.achievements.map(a => ({ id: a.id, date: a.date, description: a.description })));
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchAstarPendingMessages = async () => {
    try {
      const response = await fetch('/api/astar-messages/pending');
      if (response.ok) {
        const data = await response.json() as { pending: AstarPendingMessage[] };
        setAstarPendingMessages(data.pending);
        setShowAstarNotification(data.pending.length > 0);
      }
    } catch (error) {
      console.error('Error fetching ASTAR pending messages:', error);
    }
  };

  const submitAstarResponse = async (messageId: number) => {
    if (!astarResponse.trim()) return;
    
    try {
      setRespondingToMessage(messageId);
      const response = await fetch('/api/astar-messages/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent_message_id: messageId,
          response_text: astarResponse
        })
      });

      if (response.ok) {
        setAstarResponse('');
        await fetchAstarPendingMessages();
        await fetchGoals(); // Recargar goals por si se creó uno nuevo
        alert('¡Respuesta enviada! 🎉');
      } else {
        alert('Error al enviar respuesta');
      }
    } catch (error) {
      console.error('Error submitting ASTAR response:', error);
      alert('Error al enviar respuesta');
    } finally {
      setRespondingToMessage(null);
    }
  };

  const generateWhatsAppCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await fetch('/api/auth/generate-whatsapp-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappCode(data);
      } else {
        alert('Error al generar el código. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error generating WhatsApp code:', error);
      alert('Error al generar el código. Verifica tu conexión.');
    } finally {
      setGeneratingCode(false);
    }
  };

  const addGoalAPI = async (description: string) => {
    try {
      const response = await fetch('/api/dashboard/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      if (response.ok) {
        await fetchGoals();
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateGoalStatusAPI = async (goalId: number, status: string) => {
    try {
      await fetch(`/api/dashboard/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const addWeeklyUpdateAPI = async (week: string, goalStatuses: { [goalId: number]: boolean }) => {
    try {
      const response = await fetch('/api/dashboard/weekly-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week, goalStatuses }),
      });
      if (response.ok) {
        await fetchWeeklyUpdates();
      }
    } catch (error) {
      console.error('Error adding weekly update:', error);
    }
  };

  const addAchievementAPI = async (date: string, description: string) => {
    try {
      const response = await fetch('/api/dashboard/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, description }),
      });
      if (response.ok) {
        await fetchAchievements();
      }
    } catch (error) {
      console.error('Error adding achievement:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchGoals(), fetchWeeklyUpdates(), fetchAchievements(), fetchAstarPendingMessages()]);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const fetchInternalData = async () => {
      try {
        const response = await fetch('/api/admin/internal-dashboard');
        if (response.ok) {
          const data = await response.json();
          setInternalData(data);
        } else {
          console.error('Failed to fetch internal dashboard data');
        }
      } catch (error) {
        console.error('Error fetching internal dashboard data:', error);
      }
    };

    fetchInternalData();
  }, []);

  useEffect(() => {
    const fetchLoggedInUsers = async () => {
      try {
        const response = await fetch('/api/admin/logged-in-users');
        if (response.ok) {
          const data = await response.json();
          setLoggedInUsers(data.count);
        } else {
          console.error('Failed to fetch logged-in users count');
        }
      } catch (error) {
        console.error('Error fetching logged-in users count:', error);
      }
    };

    fetchLoggedInUsers();
  }, []);

  const addGoal = async () => {
    if (newGoal.trim()) {
      await addGoalAPI(newGoal);
      setNewGoal('');
    }
  };

  const markGoalCompleted = async (goalId: number) => {
    await updateGoalStatusAPI(goalId, 'completed');
  };

  const submitWeeklyUpdate = async () => {
    if (currentWeek.trim()) {
      await addWeeklyUpdateAPI(currentWeek, goalStatuses);
      setCurrentWeek('');
      setGoalStatuses({});
    }
  };

  const addAchievement = async () => {
    if (newAchievement.trim()) {
      await addAchievementAPI(new Date().toISOString().split('T')[0], newAchievement);
      setNewAchievement('');
    }
  };

  const handleGoalStatusChange = (goalId: number, completed: boolean) => {
    setGoalStatuses({ ...goalStatuses, [goalId]: completed });
  };

  // Function to export PDF report for investors
  const exportInvestorReport = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text('Progress Report - Founder', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Report date
    pdf.setFontSize(12);
    pdf.text(`Report date: ${new Date().toLocaleDateString('en-US')}`, 20, yPosition);
    yPosition += 15;

    // General statistics
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalUpdates = weeklyUpdates.length;
    const totalAchievements = achievements.length;

    pdf.setFontSize(14);
    pdf.text('General Statistics:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text(`Total goals: ${totalGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Completed goals: ${completedGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Weekly updates: ${totalUpdates}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Achievements recorded: ${totalAchievements}`, 30, yPosition);
    yPosition += 20;

    // Goals list
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Current Goals:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    goals.forEach((goal, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      const status = goal.status === 'completed' ? '✓ Completed' : '○ Active';
      pdf.text(`${index + 1}. ${goal.description} - ${status}`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Capture chart if exists
    if (chartRef.current && weeklyUpdates.length > 0 && goals.length > 0) {
      try {
        const canvas = await html2canvas(chartRef.current);
        const imgData = (canvas as any).toDataURL('image/png');
        const imgWidth = 180;
        const imgHeight = ((canvas as any).height * imgWidth) / (canvas as any).width;

        if (yPosition + imgHeight > pageHeight) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text('Progress Chart:', 20, yPosition);
        yPosition += 10;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      } catch (error) {
        console.error('Error capturing chart:', error);
      }
    }

    // Achievements
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Key Achievements:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    achievements.slice(0, 10).forEach((achievement, index) => {
      if (yPosition > pageHeight - 15) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`${achievement.date}: ${achievement.description}`, 25, yPosition);
      yPosition += 8;
    });

    // Footer
    pdf.setFontSize(8);
    pdf.text('Report generated automatically by the goals tracking system', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Download PDF
    pdf.save(`progress-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Function to export data to JSON
  const exportDataToJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      goals,
      weeklyUpdates,
      achievements,
      statistics: {
        totalGoals: goals.length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalUpdates: weeklyUpdates.length,
        totalAchievements: achievements.length,
      }
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `progress-data-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = (globalThis as any).document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };
  // Prepare chart data
  const prepareChartData = () => {
    const weeks = weeklyUpdates.map(u => u.week).reverse();
    const goalCompletionData = goals.map(goal => {
      const data = weeks.map(week => {
        const update = weeklyUpdates.find(u => u.week === week);
        return update?.goalStatuses[goal.id] ? 1 : 0;
      });
      return {
        label: goal.description.length > 20 ? goal.description.substring(0, 20) + '...' : goal.description,
        data,
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        fill: false,
      };
    });

    return {
      labels: weeks,
      datasets: goalCompletionData,
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Goals & Achievements Tracker for Founders</h1>

      {/* ASTAR Pending Messages Notification */}
      {showAstarNotification && astarPendingMessages.length > 0 && (
        <section style={{
          backgroundColor: '#1e293b',
          border: '2px solid #8b5cf6',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>🌟</span>
              ASTAR te pregunta...
              <span style={{
                backgroundColor: '#8b5cf6',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {astarPendingMessages.length} mensaje{astarPendingMessages.length > 1 ? 's' : ''}
              </span>
            </h2>
            <button
              onClick={() => setShowAstarNotification(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {astarPendingMessages.map((msg) => (
            <div key={msg.sent_message_id} style={{
              backgroundColor: '#0f172a',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '16px',
              borderLeft: '4px solid #8b5cf6'
            }}>
              <div style={{ color: '#e2e8f0', marginBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                  {msg.subject}
                </div>
                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px' }}>
                  {new Date(msg.sent_at).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
                <div style={{ fontSize: '16px', color: '#cbd5e1', marginBottom: '16px' }}>
                  {msg.response_prompt}
                </div>
              </div>

              <textarea
                value={respondingToMessage === msg.sent_message_id ? astarResponse : ''}
                onChange={(e) => {
                  setRespondingToMessage(msg.sent_message_id);
                  setAstarResponse((e.target as any).value);
                }}
                placeholder="Escribe tu respuesta aquí..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginBottom: '12px'
                }}
              />

              <button
                onClick={() => submitAstarResponse(msg.sent_message_id)}
                disabled={!astarResponse.trim() || respondingToMessage !== msg.sent_message_id}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  opacity: (!astarResponse.trim() || respondingToMessage !== msg.sent_message_id) ? 0.5 : 1
                }}
              >
                📤 Enviar Respuesta
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Add Goals */}
      <section>
        <h2>Add Goals</h2>
        <input
          type="text"
          value={newGoal}
          onChange={(e) => setNewGoal((e.target as any).value)}
          placeholder="Describe your goal..."
        />
        <button onClick={addGoal}>Add Goal</button>
      </section>

      {/* Goals List */}
      <section>
        <h2>My Goals</h2>
        <ul>
          {goals.map(goal => (
            <li key={goal.id}>
              {goal.description} - {goal.status === 'active' ? 'Active' : 'Completed'}
              {goal.status === 'active' && (
                <button onClick={() => markGoalCompleted(goal.id)}>Mark Complete</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Weekly Update */}
      <section>
        <h2>Weekly Update</h2>
        <input
          type="text"
          value={currentWeek}
          onChange={(e) => setCurrentWeek((e.target as any).value)}
          placeholder="Week (e.g: Week 1 - Oct 2025)"
        />
        <h3>Mark goal completion:</h3>
        {goals.filter(g => g.status === 'active').map(goal => (
          <div key={goal.id}>
            <label>
              <input
                type="checkbox"
                checked={goalStatuses[goal.id] || false}
                onChange={(e) => handleGoalStatusChange(goal.id, (e.target as any).checked)}
              />
              {goal.description}
            </label>
          </div>
        ))}
        <button onClick={submitWeeklyUpdate}>Submit Update</button>
      </section>

      {/* Weekly Updates History */}
      <section>
        <h2>Weekly Updates History</h2>
        {weeklyUpdates.map((update, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>{update.week}</h3>
            <ul>
              {Object.entries(update.goalStatuses).map(([goalId, completed]) => {
                const goal = goals.find(g => g.id === parseInt(goalId));
                return (
                  <li key={goalId}>
                    {goal?.description}: {completed ? 'Completed' : 'Not completed'}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Progress Chart */}
      <section ref={chartRef}>
        <h2>Goals Progress</h2>
        {weeklyUpdates.length > 0 && goals.length > 0 ? (
          <div style={{ height: '400px' }}>
            {(LineChart as any)({ data: prepareChartData() })}
          </div>
        ) : (
          <p>Not enough data to show chart. Add goals and weekly updates.</p>
        )}
      </section>

      {/* Export Data for Investors */}
      <section style={{ marginTop: '30px', padding: '20px', border: '2px solid #007bff', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ color: '#007bff' }}>📊 Export Report for Investors</h2>
        <p>Generate professional reports to share your progress with potential investors.</p>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <button
            onClick={exportInvestorReport}
            style={{
              padding: '12px 24px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📄 Generate Professional PDF
          </button>
          <button
            onClick={exportDataToJSON}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            📊 Export JSON Data
          </button>
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <p><strong>Professional PDF includes:</strong> Statistics, goals, progress chart, and key achievements</p>
          <p><strong>JSON includes:</strong> All raw data for advanced analysis</p>
        </div>
      </section>

      {/* WhatsApp Integration */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">📱 Integración WhatsApp</h2>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <p className="text-gray-700 mb-4">
            Conecta tu WhatsApp para recibir actualizaciones de goals.
          </p>
          
          <button
            onClick={() => {
              console.log("WhatsApp button clicked");
              generateWhatsAppCode();
            }}
            disabled={generatingCode}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
          >
            {generatingCode ? '🔄 Generando...' : '📱 Generar Código WhatsApp'}
          </button>
          
          {whatsappCode && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-800">Código: {whatsappCode.code}</p>
              <p className="text-sm text-green-600">Válido por: {whatsappCode.expires_in}</p>
            </div>
          )}
        </div>
      </section>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">💬 Comandos Disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="bg-blue-50 p-3 rounded">
                  <code className="font-mono text-blue-800">"mis goals"</code>
                  <p className="text-blue-600 mt-1">Ver tus goals activos</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <code className="font-mono text-blue-800">"nuevo goal [descripción]"</code>
                  <p className="text-blue-600 mt-1">Crear un nuevo goal</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <code className="font-mono text-blue-800">"leaderboard"</code>
                  <p className="text-blue-600 mt-1">Ver ranking de la comunidad</p>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <code className="font-mono text-blue-800">"ayuda"</code>
                  <p className="text-blue-600 mt-1">Ver todos los comandos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Dashboard Data */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Internal Dashboard Data</h2>
        <p className="text-lg mb-4">Total Non-Admin Users: {internalData.totalNonAdminUsers}</p>
        {internalData.dashboards && internalData.dashboards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internalData.dashboards.map((dashboard: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md border">
                <h3 className="text-xl font-semibold mb-2">{dashboard.email}</h3>
                <p className="text-sm text-gray-600 mb-4">Role: {dashboard.role}</p>
                {dashboard.metrics && dashboard.metrics.length > 0 ? (
                  <ul className="space-y-2">
                    {dashboard.metrics.map((metric: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span className="font-medium">{metric.name}:</span>
                        <span>{metric.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No metrics available</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No dashboard data available.</p>
        )}
      </section>

      {/* Logged-In Users */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Logged-In Users</h2>
        <p className="text-lg">Number of users currently logged in: {loggedInUsers}</p>
      </section>

      {/* LinkedIn Connector Terminal */}
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">🔗 LinkedIn Connector</h2>
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
          {/* Terminal Header */}
          <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-gray-400 text-sm ml-4">linkedin-connector-terminal</span>
          </div>

          {/* Terminal Content */}
          <div className="p-6 text-gray-100 font-mono text-sm">
            {/* Search Controls */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span className="text-green-400 mr-2">$</span>
                <span className="text-gray-400 mr-2">search --type</span>
                <select
                  value={linkedinSearchType}
                  onChange={(e) => setLinkedinSearchType(e.target.value as any)}
                  className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-700 mr-2"
                >
                  <option value="investor">investor</option>
                  <option value="talent">talent</option>
                  <option value="customer">customer</option>
                  <option value="partner">partner</option>
                </select>
                <span className="text-gray-400 mr-2">--query</span>
                <input
                  type="text"
                  value={linkedinQuery}
                  onChange={(e) => setLinkedinQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLinkedInProfiles()}
                  placeholder='"venture capital" OR "AI startup"'
                  className="bg-gray-800 text-gray-100 px-3 py-1 rounded border border-gray-700 flex-1"
                />
                <button
                  onClick={searchLinkedInProfiles}
                  disabled={linkedinSearching}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-1 rounded"
                >
                  {linkedinSearching ? '⏳' : '🔍 Search'}
                </button>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                <span className="text-yellow-400">💡 Tips:</span> Use keywords like "seed investor", "full stack engineer", "CTO SaaS", etc.
              </div>
            </div>

            {/* Results */}
            {linkedinProfiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-gray-400">
                    <span className="text-green-400">✓</span> Found {linkedinProfiles.length} profiles | 
                    <span className="text-blue-400"> {selectedProfiles.size} selected</span>
                  </div>
                  {selectedProfiles.size > 0 && (
                    <div className="space-x-2">
                      <button
                        onClick={generateConnectionMessages}
                        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs"
                      >
                        📧 Generate Messages
                      </button>
                      <button
                        onClick={saveSelectedConnections}
                        className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
                      >
                        💾 Save to Campaign
                      </button>
                    </div>
                  )}
                </div>

                {/* Profiles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {linkedinProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`bg-gray-800 border rounded p-4 cursor-pointer transition-all ${
                        selectedProfiles.has(profile.id)
                          ? 'border-blue-500 bg-gray-750'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => toggleProfileSelection(profile.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedProfiles.has(profile.id)}
                          onChange={() => toggleProfileSelection(profile.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-semibold">{profile.name}</h3>
                            <span className={`text-xs px-2 py-1 rounded ${
                              profile.compatibilityScore >= 90 ? 'bg-green-600' :
                              profile.compatibilityScore >= 75 ? 'bg-blue-600' :
                              'bg-yellow-600'
                            }`}>
                              {profile.compatibilityScore}% match
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mb-2">{profile.headline}</p>
                          <div className="flex items-center text-xs text-gray-500 space-x-3">
                            <span>📍 {profile.location}</span>
                            <span>🏢 {profile.industry}</span>
                            {profile.connections && <span>🤝 {profile.connections}+</span>}
                          </div>
                          <div className="mt-2 text-xs">
                            {profile.matchReasons.slice(0, 2).map((reason, idx) => (
                              <div key={idx} className="text-green-400">
                                ✓ {reason}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {linkedinProfiles.length === 0 && !linkedinSearching && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <p>No searches yet. Start by typing a query and clicking Search.</p>
                <div className="mt-4 text-xs">
                  <p className="mb-2">Example queries:</p>
                  <div className="space-y-1 text-left max-w-md mx-auto">
                    <div className="bg-gray-800 px-3 py-2 rounded">investor: "seed stage venture capital AI"</div>
                    <div className="bg-gray-800 px-3 py-2 rounded">talent: "senior react developer"</div>
                    <div className="bg-gray-800 px-3 py-2 rounded">customer: "CTO fintech company"</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;c o n s o l e . l o g ( " D a s h b o a r d   l o a d e d " ) ; 
 
 