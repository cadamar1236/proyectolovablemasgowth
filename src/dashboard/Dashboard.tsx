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

const Dashboard = () => {
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
  const chartRef = useRef<HTMLDivElement>(null);

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
      await Promise.all([fetchGoals(), fetchWeeklyUpdates(), fetchAchievements()]);
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

  // Función para exportar reporte PDF para inversores
  const exportInvestorReport = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Título
    pdf.setFontSize(20);
    pdf.text('Reporte de Progreso - Emprendedor', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Fecha del reporte
    pdf.setFontSize(12);
    pdf.text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 20, yPosition);
    yPosition += 15;

    // Estadísticas generales
    const totalGoals = goals.length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalUpdates = weeklyUpdates.length;
    const totalAchievements = achievements.length;

    pdf.setFontSize(14);
    pdf.text('Estadísticas Generales:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(12);
    pdf.text(`Total de metas: ${totalGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Metas completadas: ${completedGoals}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Actualizaciones semanales: ${totalUpdates}`, 30, yPosition);
    yPosition += 8;
    pdf.text(`Logros registrados: ${totalAchievements}`, 30, yPosition);
    yPosition += 20;

    // Lista de metas
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Metas Actuales:', 20, yPosition);
    yPosition += 10;
    pdf.setFontSize(10);
    goals.forEach((goal, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      const status = goal.status === 'completed' ? '✓ Completada' : '○ Activa';
      pdf.text(`${index + 1}. ${goal.description} - ${status}`, 25, yPosition);
      yPosition += 8;
    });
    yPosition += 10;

    // Capturar gráfico si existe
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
        pdf.text('Gráfico de Progreso:', 20, yPosition);
        yPosition += 10;
        pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 15;
      } catch (error) {
        console.error('Error capturando gráfico:', error);
      }
    }

    // Logros
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }
    pdf.setFontSize(14);
    pdf.text('Logros Destacados:', 20, yPosition);
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

    // Pie de página
    pdf.setFontSize(8);
    pdf.text('Reporte generado automáticamente por el sistema de seguimiento de metas', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Descargar PDF
    pdf.save(`reporte-progreso-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Función para exportar datos a JSON
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

    const exportFileDefaultName = `datos-progreso-${new Date().toISOString().split('T')[0]}.json`;

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
    return <div>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Registro de Logros y Metas para Emprendedores</h1>

      {/* Agregar Metas */}
      <section>
        <h2>Agregar Metas</h2>
        <input
          type="text"
          value={newGoal}
          onChange={(e) => setNewGoal((e.target as any).value)}
          placeholder="Describe tu meta..."
        />
        <button onClick={addGoal}>Agregar Meta</button>
      </section>

      {/* Lista de Metas */}
      <section>
        <h2>Mis Metas</h2>
        <ul>
          {goals.map(goal => (
            <li key={goal.id}>
              {goal.description} - {goal.status === 'active' ? 'Activa' : 'Completada'}
              {goal.status === 'active' && (
                <button onClick={() => markGoalCompleted(goal.id)}>Marcar Completada</button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Actualización Semanal */}
      <section>
        <h2>Actualización Semanal</h2>
        <input
          type="text"
          value={currentWeek}
          onChange={(e) => setCurrentWeek((e.target as any).value)}
          placeholder="Semana (ej: Semana 1 - Oct 2025)"
        />
        <h3>Marcar cumplimiento de metas:</h3>
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
        <button onClick={submitWeeklyUpdate}>Enviar Actualización</button>
      </section>

      {/* Historial de Actualizaciones Semanales */}
      <section>
        <h2>Historial de Actualizaciones Semanales</h2>
        {weeklyUpdates.map((update, index) => (
          <div key={index} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
            <h3>{update.week}</h3>
            <ul>
              {Object.entries(update.goalStatuses).map(([goalId, completed]) => {
                const goal = goals.find(g => g.id === parseInt(goalId));
                return (
                  <li key={goalId}>
                    {goal?.description}: {completed ? 'Cumplida' : 'No cumplida'}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </section>

      {/* Gráfico de Progreso */}
      <section ref={chartRef}>
        <h2>Progreso de Metas</h2>
        {weeklyUpdates.length > 0 && goals.length > 0 ? (
          <div style={{ height: '400px' }}>
            {(LineChart as any)({ data: prepareChartData() })}
          </div>
        ) : (
          <p>No hay datos suficientes para mostrar el gráfico. Agrega metas y actualizaciones semanales.</p>
        )}
      </section>

      {/* Exportación de Datos para Inversores */}
      <section style={{ marginTop: '30px', padding: '20px', border: '2px solid #007bff', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
        <h2 style={{ color: '#007bff' }}>📊 Exportar Reporte para Inversores</h2>
        <p>Genera reportes profesionales para compartir tu progreso con potenciales inversores.</p>
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
            📄 Generar PDF Profesional
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
            📊 Exportar Datos JSON
          </button>
        </div>
        <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          <p><strong>PDF Profesional incluye:</strong> Estadísticas, metas, gráfico de progreso, y logros destacados</p>
          <p><strong>JSON incluye:</strong> Todos los datos crudos para análisis avanzado</p>
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
    </div>
  );
};

export default Dashboard;