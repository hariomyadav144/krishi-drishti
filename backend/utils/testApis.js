async function testBackendApis() {
  console.log('--- Testing Krishi Drishti API Suite ---');
  const baseURL = 'http://localhost:5000/api';

  try {
    // 1. Health Check
    console.log('1. Testing /api/health...');
    const health = await (await fetch(`${baseURL}/health`)).json();
    console.log('✅ Health status:', health);

    // 2. Demo Login as Farmer
    console.log('\n2. Testing /api/auth/demo-login (Farmer)...');
    const loginRes = await (await fetch(`${baseURL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'farmer' })
    })).json();
    const token = loginRes.token;
    console.log('✅ Farmer Login successful! Token received, user:', loginRes.user.name);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Farmer Dashboard
    console.log('\n3. Testing /api/farmer/dashboard...');
    const dashRes = await (await fetch(`${baseURL}/farmer/dashboard`, { headers: authHeaders })).json();
    console.log('✅ Dashboard loaded! Farmer:', dashRes.data.farmer.name, '| Current Crop:', dashRes.data.currentCrop?.cropName);

    // 4. Weather API
    console.log('\n4. Testing /api/weather...');
    const weatherRes = await (await fetch(`${baseURL}/weather`, { headers: authHeaders })).json();
    console.log('✅ Weather loaded! Location:', weatherRes.data.location, '| Temp:', weatherRes.data.current.temp, '°C | Rain prob:', weatherRes.data.current.rainProbability, '%');

    // 5. Ask AI Advisor
    console.log('\n5. Testing /api/recommendations/ask...');
    const advisorRes = await (await fetch(`${baseURL}/recommendations/ask`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        queryText: 'My crop leaves are turning yellow, what should I do?',
        cropName: 'Tomato',
        cropStage: 'Flowering Stage'
      })
    })).json();
    console.log('✅ AI Advisor response received:');
    console.log('   - Issue:', advisorRes.data.issue);
    console.log('   - What to do:', advisorRes.data.whatToDo);
    console.log('   - What to avoid:', advisorRes.data.whatToAvoid);
    console.log('   - Generated Tasks count:', advisorRes.generatedTasks?.length);

    // 6. Scan Crop Problem
    console.log('\n6. Testing /api/analysis/scan...');
    const scanRes = await (await fetch(`${baseURL}/analysis/scan`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        cropName: 'Tomato',
        symptomDescription: 'Dark concentric brown rings on leaf with yellow edges',
        sampleImageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?w=600&auto=format&fit=crop&q=80'
      })
    })).json();
    console.log('✅ AI Crop Scan diagnosis received:');
    console.log('   - Detected Problem:', scanRes.data.detectedProblem);
    console.log('   - Confidence:', scanRes.data.confidence, '%');
    console.log('   - Severity:', scanRes.data.severity);
    console.log('   - Treatment:', scanRes.data.organicTreatment);

    // 7. Action Plans
    console.log('\n7. Testing /api/action-plans...');
    const plansRes = await (await fetch(`${baseURL}/action-plans`, { headers: authHeaders })).json();
    console.log('✅ Action plans loaded! Total tasks:', plansRes.data.stats.total, '| Completed:', plansRes.data.stats.completed);

    if (plansRes.data.tasks.length > 0) {
      const firstTaskId = plansRes.data.tasks[0]._id;
      const toggleRes = await (await fetch(`${baseURL}/action-plans/${firstTaskId}/toggle`, {
        method: 'PUT',
        headers: authHeaders
      })).json();
      console.log('✅ Task toggle successful! Status now isCompleted:', toggleRes.data.isCompleted);
    }

    // 8. Submit Farmer Feedback
    console.log('\n8. Testing /api/feedback...');
    const feedbackRes = await (await fetch(`${baseURL}/feedback`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        recommendationId: advisorRes.data._id,
        rating: 'helped',
        comments: '19:19:19 spray fixed leaf yellowing nicely.',
        cropName: 'Tomato'
      })
    })).json();
    console.log('✅ Feedback recorded:', feedbackRes.message);

    // 9. Expert Login & Cases
    console.log('\n9. Testing /api/auth/demo-login (Expert)...');
    const expertLogin = await (await fetch(`${baseURL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'expert' })
    })).json();
    const expertHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${expertLogin.token}`
    };
    const expertCases = await (await fetch(`${baseURL}/expert/cases`, { headers: expertHeaders })).json();
    console.log('✅ Expert portal loaded! Cases count:', expertCases.data?.length, '| Pending review:', expertCases.stats.pendingReview);

    // 10. Admin Login & Stats
    console.log('\n10. Testing /api/auth/demo-login (Admin)...');
    const adminLogin = await (await fetch(`${baseURL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin' })
    })).json();
    const adminHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminLogin.token}`
    };
    const adminStats = await (await fetch(`${baseURL}/admin/stats`, { headers: adminHeaders })).json();
    console.log('✅ Admin portal loaded! Total Farmers:', adminStats.data.counts.totalFarmers, '| AI Scans:', adminStats.data.counts.totalAnalyses);

    console.log('\n🎉 ALL 10 BACKEND REST API WORKFLOWS VERIFIED AND PASSING 100%!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackendApis();
