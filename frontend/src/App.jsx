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

function Dashboard() {
  const [analytics, setAnalytics] = useState({});
  const [students, setStudents] = useState([]);
  const [file, setFile] = useState(null);
  const [newStudent, setNewStudent] = useState({
    name: '', gender: '', race_ethnicity: '', parental_education: '', lunch: '', test_preparation: '',
    math_score: 0, reading_score: 0, writing_score: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    axios.get(`${API_BASE}/analytics/`).then(res => setAnalytics(res.data));
    axios.get(`${API_BASE}/students/`).then(res => setStudents(res.data));
  };

  const handleUpload = () => {
    const formData = new FormData();
    formData.append('file', file);
    axios.post(`${API_BASE}/upload-csv/`, formData).then(fetchData);
  };

  const handleInputChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAddStudent = () => {
    axios.post(`${API_BASE}/students/`, newStudent).then(fetchData);
  };

  const handleDelete = (id) => {
    axios.delete(`${API_BASE}/students/${id}`).then(fetchData);
  };

  const subjectChartData = {
    labels: ['Math', 'Reading', 'Writing'],
    datasets: [{
      label: 'Class Average',
      data: [analytics.avg_math, analytics.avg_reading, analytics.avg_writing],
      backgroundColor: 'rgba(75, 192, 192, 0.6)'
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Student Progress Dashboard</h1>

      {/* Upload CSV */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Upload CSV (Kaggle Format)</h2>
        <input type="file" onChange={e => setFile(e.target.files[0])} className="mb-2" />
        <button onClick={handleUpload} className="bg-blue-500 text-white p-2 rounded">Upload</button>
      </div>

      {/* Add Student Form */}
      <div className="mb-8">
        <h2 className="text-xl mb-2">Add New Student</h2>
        <input name="name" placeholder="Name" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="gender" placeholder="Gender" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="race_ethnicity" placeholder="Race/Ethnicity" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="parental_education" placeholder="Parental Education" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="lunch" placeholder="Lunch" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="test_preparation" placeholder="Test Prep" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="math_score" type="number" placeholder="Math Score" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="reading_score" type="number" placeholder="Reading Score" onChange={handleInputChange} className="border p-1 mr-2" />
        <input name="writing_score" type="number" placeholder="Writing Score" onChange={handleInputChange} className="border p-1 mr-2" />
        <button onClick={handleAddStudent} className="bg-green-500 text-white p-2 rounded">Add</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">Total Students: {analytics.total_students || 0}</div>
        <div className="bg-green-100 p-4 rounded">Overall Avg: {analytics.overall_avg?.toFixed(1) || '-'}</div>
        <div className="bg-yellow-100 p-4 rounded">Pass Rate: {analytics.pass_rate?.toFixed(1) || '-'}%</div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-xl mb-2">Subject Averages</h2>
          <Bar data={subjectChartData} />
        </div>
        <div>
          <h2 className="text-xl mb-2">Grade Distribution</h2>
          <Pie data={gradeDistData} />
        </div>
      </div>

      {/* Students Table */}
      <h2 className="text-xl mb-4">Students List</h2>
      <table className="w-full border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Average</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id}>
              <td className="border p-2">{s.id}</td>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">{((s.math_score + s.reading_score + s.writing_score) / 3).toFixed(1)}</td>
              <td className="border p-2">
                <Link to={`/student/${s.id}`} className="text-blue-500 mr-2">View</Link>
                <button onClick={() => handleDelete(s.id)} className="text-red-500 mr-2">Delete</button>
                {/* Edit can be added similarly with a form */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentDetail() {
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{student.name}'s Details</h1>
      <Bar data={scoresData} />
      <p>Gender: {student.gender}</p>
      {/* Add more fields */}
      <Link to="/" className="text-blue-500 mt-4 block">Back to Dashboard</Link>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/student/:id" element={<StudentDetail />} />
      </Routes>
    </Router>
  );
}

export default App;