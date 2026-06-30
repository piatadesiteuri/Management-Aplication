import { Outlet } from 'react-router-dom';

export const AdminLayout = () => {
  console.log('AdminLayout rendering...');
  
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7fafc' }}>
      <div style={{ 
        backgroundColor: '#2d3748', 
        color: 'white', 
        padding: '1rem',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        🏢 DSP Dolj - Admin Panel
      </div>
      <div style={{ paddingTop: '20px' }}>
        <Outlet />
      </div>
    </div>
  );
}; 