import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthParams = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'seeker' });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/dashboard');
      } else if (res.data.message === 'User created successfully') {
        setIsLogin(true); // Switch to login after successful signup
        alert('Signup successful! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-3 rounded-xl bg-white shadow-md">
      <h1 className="text-2xl font-bold text-center text-blue-600">Netsynq</h1>
      <h2 className="text-xl font-semibold text-center text-gray-700">
        {isLogin ? 'Login to your account' : 'Create an Account'}
      </h2>
      
      {error && <div className="p-3 text-sm text-red-500 bg-red-100 rounded">{error}</div>}

      <form onSubmit={handleAuth} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm text-gray-600">Full Name</label>
            <input 
              type="text" name="name" 
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" 
              onChange={handleChange} required 
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm text-gray-600">Email Address</label>
          <input 
            type="email" name="email" 
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" 
            onChange={handleChange} required 
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600">Password</label>
          <input 
            type="password" name="password" 
            className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600" 
            onChange={handleChange} required 
          />
        </div>

        {!isLogin && (
          <div>
             <label className="block text-sm text-gray-600">Role</label>
             <select name="role" onChange={handleChange} className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600">
                <option value="seeker">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
             </select>
          </div>
        )}

        <button className="w-full px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900 transition font-semibold">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <div className="flex items-center justify-center mt-4">
        <button onClick={handleToggle} className="text-sm text-blue-600 hover:underline">
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
};

export default AuthParams;