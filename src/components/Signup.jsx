import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import logoImg from './logo.jpg';

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
      const { data, error: err } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            name: formData.name.trim(),
            phone_number: formData.phoneNumber.trim(),
            role: 'admin'
          }
        }
      });
      if (err) throw err;
      alert('பதிவு வெற்றிகரமாக முடிந்தது! இப்போது உள்நுழையவும்.');
      onSignupSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || 'கணக்கை உருவாக்குவதில் பிழை');
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
      background: 'radial-gradient(circle at 20% 30%, rgba(226, 27, 121, 0.12), transparent 45%), radial-gradient(circle at 80% 70%, rgba(79, 30, 130, 0.15), transparent 45%), #0A0F1D',
      fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .auth-card {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          width: 380px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          color: white;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        .logo-circle {
          width: 95px;
          height: 95px;
          margin: 0 auto 24px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.35));
          border-radius: 50%;
          overflow: hidden;
        }
        .auth-input {
          width: 100%;
          padding: 14px 16px;
          margin-top: 18px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(15, 23, 42, 0.5);
          color: white;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #E21B79;
          box-shadow: 0 0 12px rgba(226, 27, 121, 0.25);
          background: rgba(15, 23, 42, 0.7);
        }
        .auth-btn {
          margin-top: 28px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #E21B79 0%, #4F1E82 100%);
          color: white;
          font-weight: 600;
          font-size: 15px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(226, 27, 121, 0.3);
        }
        .auth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(226, 27, 121, 0.45);
          filter: brightness(1.1);
        }
        .auth-btn:active {
          transform: translateY(0);
        }
        .back-link {
          margin-top: 20px;
          display: block;
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #E21B79;
        }
      `}</style>
      
      <div className="auth-card">
        <div className="logo-circle">
          <img src={logoImg} alt="TAS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px', letterSpacing: '0.5px' }}>TAS Jewellers</h2>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>புதிய கணக்கை உருவாக்கவும்</p>
        
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
            {loading ? 'பதிவு செய்கிறது...' : 'பதிவு செய்க'}
          </button>
        </form>
        
        <span className="back-link" onClick={onBack}>ஏற்கனவே கணக்கு உள்ளதா? உள்நுழையவும்</span>
      </div>
    </div>
  );
};

export default Signup;
