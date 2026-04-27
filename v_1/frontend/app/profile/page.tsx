"use client";

import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  is_public: boolean;
  created_at: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/profile', {
        credentials: 'include' // Исправлено на include
      });

      if (!res.ok) throw new Error('Unauthorized');

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      window.location.href = '/login'; // Если не авторизован - выкидываем на логин
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const togglePrivacy = async () => {
    try {
      await fetch('http://localhost:8080/api/profile/privacy', {
        method: 'POST',
        credentials: 'include' // Исправлено на include
      });
      // Обновляем данные после переключения
      fetchProfile();
    } catch (err) {
      console.error("Error toggling privacy");
    }
  };

  if (!profile) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div className="card" style={{ width: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>My Profile</h2>
          <span style={{ 
            backgroundColor: profile.is_public ? 'var(--color-yellow)' : 'var(--bg-accent)',
            color: profile.is_public ? 'var(--bg-primary)' : 'var(--text-secondary)',
            padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold'
          }}>
            {profile.is_public ? 'Public' : 'Private'}
          </span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Name:</span>
            <div style={{ fontSize: '18px' }}>{profile.first_name} {profile.last_name}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
            <div style={{ fontSize: '18px' }}>{profile.email}</div>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Date of Birth:</span>
            <div style={{ fontSize: '18px' }}>{profile.date_of_birth}</div>
          </div>
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '20px 0' }} />

        <button onClick={togglePrivacy} className="btn-primary" style={{ backgroundColor: 'var(--bg-accent)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          Make profile {profile.is_public ? 'Private' : 'Public'}
        </button>
      </div>
    </div>
  );
}