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
      background: 'radial-gradient(circle at 20% 20%, rgba(160, 14, 85, 0.35) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(197, 160, 94, 0.25) 0%, transparent 60%), radial-gradient(circle at 50% 50%, rgba(97, 11, 69, 0.4) 0%, transparent 80%), #15020F',
      fontFamily: "'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        .auth-card {
          background: rgba(45, 8, 36, 0.45);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(197, 160, 94, 0.3);
          width: 380px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 15px rgba(197, 160, 94, 0.05);
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
          border: 1px solid rgba(197, 160, 94, 0.2);
          background: rgba(31, 4, 23, 0.5);
          color: white;
          font-size: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-sizing: border-box;
        }
        .auth-input:focus {
          border-color: #C5A05E;
          box-shadow: 0 0 12px rgba(197, 160, 94, 0.3);
          background: rgba(31, 4, 23, 0.7);
        }
        .auth-btn {
          margin-top: 28px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #AA7C11 0%, #F3E5AB 50%, #AA7C11 100%);
          color: #1a0212;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.5px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(197, 160, 94, 0.3);
        }
        .auth-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(197, 160, 94, 0.45);
          filter: brightness(1.1);
        }
        .auth-btn:active {
          transform: translateY(0);
        }
        .back-link {
          margin-top: 20px;
          display: block;
          color: #C5A05E;
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #E6C280;
        }
      `}</style>
      
      <div className="auth-card">
        <div className="logo-circle">
          <img src={logoImg} alt="TAS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '4px', letterSpacing: '0.5px' }}>TAS Jewellers</h2>
        <p style={{ color: '#C5A05E', fontSize: '13px', marginBottom: '24px' }}>புதிய கணக்கை உருவாக்கவும்</p>
        
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
          
          {error && <p style={{ color: '#E0115F', fontSize: '13px', marginTop: '12px' }}>{error}</p>}
          
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
