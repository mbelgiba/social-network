"use client";

import { useState } from 'react';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '', password: '', first_name: '', last_name: '', date_of_birth: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Registration failed. Email might be taken.');
      }

      setSuccess('Registration successful! You can now log in.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div className="card" style={{ width: '500px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Create Account</h2>
        {error && <div className="text-error">{error}</div>}
        {success && <div className="text-success">{success}</div>}
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input type="text" name="first_name" placeholder="First Name" className="input-field" onChange={handleChange} required />
            <input type="text" name="last_name" placeholder="Last Name" className="input-field" onChange={handleChange} required />
          </div>
          <input type="date" name="date_of_birth" className="input-field" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" className="input-field" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" className="input-field" onChange={handleChange} required />
          
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Sign Up</button>
        </form>
      </div>
    </div>
  );
}