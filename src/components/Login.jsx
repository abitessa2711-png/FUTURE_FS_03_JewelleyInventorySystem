import React, { useState } from 'react'
import axios from 'axios'
import { Gem } from 'lucide-react'

const Login = ({ onLogin, onShowSignup }) => {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const resp = await axios.post('/api/auth/login', { loginId, password })
      const data = resp.data

      const userData = data.data.user
      onLogin({ ...userData, role: userData.role?.toLowerCase(), token: data.data.token })
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'சர்வர் இணைப்பு தோல்வியடைந்தது')
    } finally {
      setLoading(false)
    }
  }

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
          width: 350px;
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
        .auth-btn:hover { background: #1D4ED8; }
        .signup-link {
          margin-top: 16px;
          display: block;
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
        }
        .signup-link:hover { color: white; }
      `}</style>

      <div className="auth-card">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#fff', border: '3px solid #D4AF37', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Gem size={40} color="#D4AF37" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#60A5FA', marginBottom: '4px' }}>TAS Jewellers</h1>
        <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>நகை கணக்கு முறைமை</p>

        <form onSubmit={handleLogin}>
          <input 
            type="text" className="auth-input" placeholder="மின்னஞ்சல் அல்லது செல்பேசி எண்" 
            value={loginId} onChange={e => setLoginId(e.target.value)} required 
          />
          <input 
            type="password" className="auth-input" placeholder="கடவுச்சொல்" 
            value={password} onChange={e => setPassword(e.target.value)} required 
          />
          
          {error && <p style={{ color: '#F87171', fontSize: '13px', marginTop: '12px' }}>{error}</p>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'சலவை செய்கிறது...' : 'உள்நுழைக'}
          </button>
        </form>

        <span className="signup-link" onClick={onShowSignup}>புதிய கணக்கை உருவாக்க வேண்டுமா?</span>
      </div>
    </div>
  )
}

export default Login
