export const AdminDashboard = () => {
  console.log('AdminDashboard rendering...');
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f7fafc', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2d3748', fontSize: '2rem', marginBottom: '1rem' }}>
        🎉 Dashboard Administrator - Test
      </h1>
      <p style={{ color: '#4a5568', fontSize: '1.2rem', marginBottom: '1rem' }}>
        Componenta se încarcă cu succes!
      </p>
      <p style={{ color: '#718096' }}>
        Dacă vedeți acest mesaj, înseamnă că rutele și componentele funcționează.
      </p>
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
        <h2 style={{ color: '#2d3748', marginBottom: '1rem' }}>Informații de debug:</h2>
        <ul style={{ color: '#4a5568' }}>
          <li>✅ React funcționează</li>
          <li>✅ Rutele funcționează</li>
          <li>✅ AdminLayout funcționează</li>
          <li>✅ AdminDashboard se încarcă</li>
        </ul>
      </div>
    </div>
  );
}; 