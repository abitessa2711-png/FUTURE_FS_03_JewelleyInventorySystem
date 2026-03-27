import React, { useState } from 'react';
import axios from 'axios';

const Signup = ({ onBack, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const resp = await axios.post('/api/auth/signup', { ...formData, role: 'admin' });
      const data = resp.data;
      alert('பதிவு வெற்றிகரமாக முடிந்தது! இப்போது உள்நுழையவும்.');
      onSignupSuccess();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'சர்வர் இணைப்பு தோல்வியடைந்தது');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0F172A',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <style>{`
        .auth-card {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          width: 380px;
          padding: 32px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          color: white;
          text-align: center;
        }
        .auth-input {
          width: 100%;
          padding: 12px;
          margin-top: 16px;
          border-radius: 10px;
          border: 1px solid #334155;
          background: #1E293B;
          color: white;
          font-size: 14px;
        }
        .auth-btn {
          margin-top: 24px;
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #2563EB;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: 0.3s;
        }
        .auth-btn:hover { background: #1D4ED8; transform: translateY(-1px); }
        .back-link {
          margin-top: 16px;
          display: block;
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
        }
        .back-link:hover { color: white; }
      `}</style>
      
      <div className="auth-card">
        <h2 style={{ color: '#60A5FA', marginBottom: '8px' }}>TAS Jewellers</h2>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>புதிய கணக்கை உருவாக்கவும்</p>
        
        <form onSubmit={handleSubmit}>
          <input 
            type="text" className="auth-input" placeholder="பெயர்" 
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required 
          />
          <input 
            type="text" className="auth-input" placeholder="மொபைல் எண்" 
            value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} required 
          />
          <input 
            type="email" className="auth-input" placeholder="மின்னஞ்சல்" 
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required 
          />
          <input 
            type="password" className="auth-input" placeholder="கடவுச்சொல்" 
            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required 
          />
          
          {error && <p style={{ color: '#F87171', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'காத்திருக்கவும்...' : 'பதிவு செய்க'}
          </button>
        </form>
        
        <span className="back-link" onClick={onBack}>ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்</span>
      </div>
    </div>
  );
};

export default Signup;
