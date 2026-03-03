import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_BASE = 'http://127.0.0.1:5000';

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      <span>{isDark ? '🌙' : '☀️'}</span>
      <span>{isDark ? 'Dark' : 'Light'} Mode</span>
    </button>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function Dashboard({ theme, onThemeToggle }) {
  const [analytics, setAnalytics] = useState({});
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [newStudent, setNewStudent] = useState({
    name: '', gender: '',
    math_score: 0, reading_score: 0, writing_score: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, studentsRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/`),
        axios.get(`${API_BASE}/students/`),
      ]);
      setAnalytics(analyticsRes.data || {});
      setStudents(studentsRes.data || []);
    } catch {
      setStatus({ type: 'error', message: 'Unable to connect to backend API. Please ensure backend is running.' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file before uploading.' });
      return;
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus({ type: 'error', message: 'Only CSV files are supported.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post(`${API_BASE}/upload-csv/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchData();
      setStatus({ type: 'success', message: response.data?.message || 'CSV uploaded successfully.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'CSV upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const scoreFields = ['math_score', 'reading_score', 'writing_score'];
    if (scoreFields.includes(name)) {
      setNewStudent({ ...newStudent, [name]: value === '' ? 0 : Number(value) });
      return;
    }
    setNewStudent({ ...newStudent, [name]: value });
  };

  const handleAddStudent = async () => {
    if (!newStudent.name.trim()) {
      setStatus({ type: 'error', message: 'Student name is required.' });
      return;
    }

    const payload = {
      name: newStudent.name.trim(),
      gender: newStudent.gender,
      math_score: Number(newStudent.math_score) || 0,
      reading_score: Number(newStudent.reading_score) || 0,
      writing_score: Number(newStudent.writing_score) || 0,
    };

    setIsAdding(true);
    setStatus({ type: '', message: '' });
    try {
      await axios.post(`${API_BASE}/students/`, payload);
      await fetchData();
      setStatus({ type: 'success', message: 'Student added successfully.' });
      setNewStudent({
        name: '',
        gender: '',
        math_score: 0,
        reading_score: 0,
        writing_score: 0,
      });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to add student.' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = (id) => {
    axios.delete(`${API_BASE}/students/${id}`).then(fetchData);
  };

  const handleClearAll = async () => {
    if (!students.length) {
      setStatus({ type: 'error', message: 'No student records to clear.' });
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete all student records? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    setIsClearing(true);
    setStatus({ type: '', message: '' });
    try {
      const response = await axios.delete(`${API_BASE}/students/`);
      await fetchData();
      setStatus({ type: 'success', message: response.data?.message || 'All student records cleared.' });
    } catch (error) {
      setStatus({ type: 'error', message: error.response?.data?.error || 'Failed to clear student records.' });
    } finally {
      setIsClearing(false);
    }
  };

  const subjectChartData = {
    labels: ['Math', 'Reading', 'Writing'],
    datasets: [{
      label: 'Class Average',
      data: [analytics.avg_math, analytics.avg_reading, analytics.avg_writing],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
      borderRadius: 8,
    }]
  };

  const gradeDistData = {
    labels: Object.keys(analytics.grade_distribution || {}),
    datasets: [{
      data: Object.values(analytics.grade_distribution || {}),
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Student Progress Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track class performance and manage student records.</p>
          </div>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </header>

        {status.message && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${status.type === 'error'
            ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300'
            : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300'
            }`}>
            {status.message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Total Students"
            value={analytics.total_students || 0}
            accent="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Overall Average"
            value={analytics.overall_avg?.toFixed(1) || '-'}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Pass Rate"
            value={`${analytics.pass_rate?.toFixed(1) || '-'}%`}
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Upload CSV</h2>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Import students data in Kaggle dataset format.</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Add New Student</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input name="name" value={newStudent.name} placeholder="Name" onChange={handleInputChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input name="gender" value={newStudent.gender} placeholder="Gender" onChange={handleInputChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input name="math_score" value={newStudent.math_score} type="number" placeholder="Math Score" onChange={handleInputChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input name="reading_score" value={newStudent.reading_score} type="number" placeholder="Reading Score" onChange={handleInputChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
              <input name="writing_score" value={newStudent.writing_score} type="number" placeholder="Writing Score" onChange={handleInputChange} className="rounded-xl border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 sm:col-span-2" />
            </div>
            <button
              onClick={handleAddStudent}
              disabled={isAdding}
              className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? 'Adding...' : 'Add Student'}
            </button>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Subject Averages</h2>
            <Bar data={subjectChartData} />
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Grade Distribution</h2>
            <Pie data={gradeDistData} />
          </section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Students List</h2>
            <button
              onClick={handleClearAll}
              disabled={isClearing || students.length === 0}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClearing ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">ID</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Name</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Average</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.id}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{s.name}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{((s.math_score + s.reading_score + s.writing_score) / 3).toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/student/${s.id}`} className="mr-3 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">View</Link>
                      <button onClick={() => handleDelete(s.id)} className="font-medium text-red-600 hover:text-red-700 dark:text-red-400">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StudentDetail({ theme, onThemeToggle }) {
  const { id } = useParams();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/students/${id}`).then(res => setStudent(res.data));
  }, [id]);

  if (!student) return <div>Loading...</div>;

  const scoresData = {
    labels: ['Math', 'Reading', 'Writing'],
    datasets: [{
      label: 'Scores',
      data: [student.math_score, student.reading_score, student.writing_score],
      backgroundColor: 'rgba(153, 102, 255, 0.6)'
    }]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{student.name}&apos;s Details</h1>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Bar data={scoresData} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <p><span className="font-semibold">Gender:</span> {student.gender}</p>
        </div>

        <Link to="/" className="inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">Back to Dashboard</Link>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard theme={theme} onThemeToggle={toggleTheme} />} />
        <Route path="/student/:id" element={<StudentDetail theme={theme} onThemeToggle={toggleTheme} />} />
      </Routes>
    </Router>
  );
}

export default App;