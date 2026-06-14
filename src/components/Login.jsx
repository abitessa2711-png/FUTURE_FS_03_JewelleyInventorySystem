import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import logoImg from './logo.jpg'

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
      // ── Demo Bypass for Testing & Client Delivery ──────────────────────────
      if (loginId.trim() === 'admin@tas.com' && password === 'tasadmin@123') {
        onLogin({
          id: 'admin-bypass-id',
          name: 'TAS Admin',
          email: 'admin@tas.com',
          role: 'admin',
          token: 'admin-bypass-token'
        })
        return
      }

      if (loginId.trim() === 'audit@tas.com' && password === 'audit123') {
        onLogin({
          id: 'audit-bypass-id',
          name: 'TAS Auditor',
          email: 'audit@tas.com',
          role: 'auditor',
          token: 'audit-bypass-token'
        })
        return
      }

      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: loginId.trim(),
        password: password
      })
      if (err) throw err

      const user = data.user
      onLogin({
        id: user.id,
        name: user.user_metadata?.name || user.email,
        email: user.email,
        role: user.user_metadata?.role || 'admin',
        token: data.session?.access_token
      })
    } catch (err) {
      console.error(err);
      setError(err.message || 'உள்நுழைவதில் பிழை அல்லது தவறான கடவுச்சொல்')
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
        .signup-link {
          margin-top: 20px;
          display: block;
          color: #94A3B8;
          text-decoration: none;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .signup-link:hover {
          color: #E21B79;
        }
      `}</style>

      <div className="auth-card">
        <div className="logo-circle">
          <img src={logoImg} alt="TAS Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: 'white', marginBottom: '4px', letterSpacing: '0.5px' }}>TAS Jewellers</h1>
        <p style={{ color: '#94A3B8', fontSize: '13px', marginBottom: '24px' }}>நகை கணக்கு முறைமை</p>

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
            {loading ? 'சரிபார்க்கிறது...' : 'உள்நுழைக'}
          </button>
        </form>

        <span className="signup-link" onClick={onShowSignup}>புதிய கணக்கை உருவாக்க வேண்டுமா?</span>
      </div>
    </div>
  )
}

export default Login
