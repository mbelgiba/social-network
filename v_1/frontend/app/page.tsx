export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px', color: 'var(--color-yellow)' }}>
        Welcome to SocialNet
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '18px', textAlign: 'center', maxWidth: '600px' }}>
        Connect with friends, share your thoughts, and explore communities in a modern, dark-themed environment.
      </p>
    </div>
  )
}