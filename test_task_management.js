const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test data
const testTask = {
  title: 'Test Task Management',
  description: 'Acesta este un task de test pentru verificarea funcționalității sistemului de task management',
  assigned_to: 4, // Utilizator cu ID 4 (Gheorghe Vasilescu)
  priority: 'HIGH',
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 zile de acum
  estimated_hours: 8
};

async function testTaskManagement() {
  try {
    console.log('🧪 TESTING TASK MANAGEMENT SYSTEM');
    console.log('=====================================\n');

    // 1. Test autentificare
    console.log('1. Testare autentificare...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@dspdolj.ro',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    
    console.log('✅ Autentificare reușită\n');

    // 2. Test creare task
    console.log('2. Testare creare task...');
    const createResponse = await axios.post(`${API_BASE}/tasks`, testTask, config);
    const taskId = createResponse.data.id;
    console.log(`✅ Task creat cu ID: ${taskId}`);
    console.log(`   Titlu: ${createResponse.data.title}`);
    console.log(`   Status: ${createResponse.data.status}`);
    console.log(`   Prioritate: ${createResponse.data.priority}\n`);

    // 3. Test obținere task după ID
    console.log('3. Testare obținere task după ID...');
    const getTaskResponse = await axios.get(`${API_BASE}/tasks/${taskId}`, config);
    console.log(`✅ Task obținut: ${getTaskResponse.data.title}`);
    console.log(`   Asignat la: ${getTaskResponse.data.assigned_to_user?.first_name} ${getTaskResponse.data.assigned_to_user?.last_name}\n`);

    // 4. Test obținere toate task-urile
    console.log('4. Testare obținere toate task-urile...');
    const getAllTasksResponse = await axios.get(`${API_BASE}/tasks`, config);
    console.log(`✅ Găsite ${getAllTasksResponse.data.tasks.length} task-uri din ${getAllTasksResponse.data.total} total\n`);

    // 5. Test obținere task-urile mele
    console.log('5. Testare obținere task-urile mele...');
    const getMyTasksResponse = await axios.get(`${API_BASE}/tasks/my-tasks`, config);
    console.log(`✅ Găsite ${getMyTasksResponse.data.tasks.length} task-uri pentru utilizatorul curent\n`);

    // 6. Test obținere task-urile create de mine
    console.log('6. Testare obținere task-urile create de mine...');
    const getCreatedByMeResponse = await axios.get(`${API_BASE}/tasks/created-by-me`, config);
    console.log(`✅ Găsite ${getCreatedByMeResponse.data.tasks.length} task-uri create de utilizatorul curent\n`);

    // 7. Test adăugare comentariu
    console.log('7. Testare adăugare comentariu...');
    const commentResponse = await axios.post(`${API_BASE}/tasks/${taskId}/comments`, {
      comment: 'Acesta este un comentariu de test pentru task-ul creat'
    }, config);
    console.log(`✅ Comentariu adăugat cu ID: ${commentResponse.data.id}\n`);

    // 8. Test obținere comentarii
    console.log('8. Testare obținere comentarii...');
    const getCommentsResponse = await axios.get(`${API_BASE}/tasks/${taskId}/comments`, config);
    console.log(`✅ Găsite ${getCommentsResponse.data.length} comentarii pentru task\n`);

    // 9. Test obținere istoric
    console.log('9. Testare obținere istoric...');
    const getHistoryResponse = await axios.get(`${API_BASE}/tasks/${taskId}/history`, config);
    console.log(`✅ Găsite ${getHistoryResponse.data.length} înregistrări în istoric\n`);

    // 10. Test actualizare status - Începe task
    console.log('10. Testare actualizare status - Începe task...');
    const startTaskResponse = await axios.post(`${API_BASE}/tasks/${taskId}/start`, {}, config);
    console.log(`✅ Task început. Status nou: ${startTaskResponse.data.status}\n`);

    // 11. Test actualizare status - Completează task
    console.log('11. Testare actualizare status - Completează task...');
    const completeTaskResponse = await axios.post(`${API_BASE}/tasks/${taskId}/complete`, {
      actual_hours: 6
    }, config);
    console.log(`✅ Task completat. Status nou: ${completeTaskResponse.data.status}`);
    console.log(`   Ore efectuate: ${completeTaskResponse.data.actual_hours}\n`);

    // 12. Test obținere statistici
    console.log('12. Testare obținere statistici...');
    const getStatsResponse = await axios.get(`${API_BASE}/tasks/stats`, config);
    console.log(`✅ Statistici obținute:`);
    console.log(`   Total task-uri: ${getStatsResponse.data.total}`);
    console.log(`   În așteptare: ${getStatsResponse.data.pending}`);
    console.log(`   În progres: ${getStatsResponse.data.in_progress}`);
    console.log(`   Completate: ${getStatsResponse.data.completed}`);
    console.log(`   Întârziate: ${getStatsResponse.data.overdue}\n`);

    // 13. Test filtrare task-uri
    console.log('13. Testare filtrare task-uri...');
    const filterResponse = await axios.get(`${API_BASE}/tasks?status=COMPLETED&priority=HIGH`, config);
    console.log(`✅ Filtrare reușită: ${filterResponse.data.tasks.length} task-uri găsite\n`);

    // 14. Test ștergere task
    console.log('14. Testare ștergere task...');
    await axios.delete(`${API_BASE}/tasks/${taskId}`, config);
    console.log(`✅ Task șters cu succes\n`);

    console.log('🎉 TOATE TESTELE AU TRECUT CU SUCCES!');
    console.log('=====================================');
    console.log('Sistemul de Task Management funcționează corect!');

  } catch (error) {
    console.error('❌ EROARE LA TESTARE:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('URL:', error.config?.url);
  }
}

// Rulează testele
testTaskManagement(); 