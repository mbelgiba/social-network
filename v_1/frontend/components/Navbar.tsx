"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Проверяем, активна ли сессия при загрузке страницы
    fetch('http://localhost:8080/api/check-auth', {
      credentials: 'include' // Исправлено на include
    })
    .then(res => {
      if (res.ok) setIsAuthenticated(true);
    })
    .catch(() => setIsAuthenticated(false));
  }, []);

  const handleLogout = async () => {
    await fetch('http://localhost:8080/api/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <nav style={{
      backgroundColor: 'var(--bg-accent)',
      borderBottom: '1px solid var(--border-color)',
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--color-yellow)' }}>
        <Link href="/">SocialNet</Link>
      </div>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <Link href="/profile" style={{ color: 'var(--text-primary)' }}>Profile</Link>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', color: 'var(--color-yellow)', cursor: 'pointer', fontSize: '16px'
            }}>Log Out</button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: 'var(--text-primary)' }}>Log In</Link>
            <Link href="/register" style={{ color: 'var(--color-yellow)' }}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  )
}