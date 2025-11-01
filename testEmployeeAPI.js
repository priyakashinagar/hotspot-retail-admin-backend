const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test token - replace with actual token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzU0MGZjOTU5NTYxNDBjYzQyYzc5YTEiLCJlbWFpbCI6ImFkbWluQGdtYWlsLmNvbSIsImlhdCI6MTczMzQ5NzI3NCwiZXhwIjoxNzM0MTA3Mjc0fQ.BM9pUX1p9Y0rJy6cFRECXVMKRLCbAm4nxsOKmN8B6';

const config = {
    headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    }
};

async function testEmployeeAPIs() {
    console.log('🧪 Testing Employee APIs...\n');

    try {
        // Test 1: GET all departments
        console.log('1️⃣ Testing GET /employees/dropdown/departments');
        const deptResponse = await axios.get(`${BASE_URL}/employees/dropdown/departments`, config);
        console.log('✅ Success:', deptResponse.status, deptResponse.data);
        console.log('');

        // Test 2: POST new department
        console.log('2️⃣ Testing POST /employees/dropdown/departments');
        try {
            const addDeptResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/departments`,
                { department: 'Test Department ' + Date.now() },
                config
            );
            console.log('✅ Success:', addDeptResponse.status, addDeptResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        // Test 3: GET all positions
        console.log('3️⃣ Testing GET /employees/dropdown/positions');
        const posResponse = await axios.get(`${BASE_URL}/employees/dropdown/positions`, config);
        console.log('✅ Success:', posResponse.status, posResponse.data);
        console.log('');

        // Test 4: POST new position
        console.log('4️⃣ Testing POST /employees/dropdown/positions');
        try {
            const addPosResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/positions`,
                { position: 'Test Position ' + Date.now() },
                config
            );
            console.log('✅ Success:', addPosResponse.status, addPosResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        // Test 5: GET all cities
        console.log('5️⃣ Testing GET /employees/dropdown/cities');
        const cityResponse = await axios.get(`${BASE_URL}/employees/dropdown/cities`, config);
        console.log('✅ Success:', cityResponse.status, cityResponse.data);
        console.log('');

        // Test 6: POST new city
        console.log('6️⃣ Testing POST /employees/dropdown/cities');
        try {
            const addCityResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/cities`,
                { city: 'Test City ' + Date.now() },
                config
            );
            console.log('✅ Success:', addCityResponse.status, addCityResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        // Test 7: GET all states
        console.log('7️⃣ Testing GET /employees/dropdown/states');
        const stateResponse = await axios.get(`${BASE_URL}/employees/dropdown/states`, config);
        console.log('✅ Success:', stateResponse.status, stateResponse.data);
        console.log('');

        // Test 8: POST new state
        console.log('8️⃣ Testing POST /employees/dropdown/states');
        try {
            const addStateResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/states`,
                { state: 'Test State ' + Date.now() },
                config
            );
            console.log('✅ Success:', addStateResponse.status, addStateResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        // Test 9: GET all qualifications
        console.log('9️⃣ Testing GET /employees/dropdown/qualifications');
        const qualResponse = await axios.get(`${BASE_URL}/employees/dropdown/qualifications`, config);
        console.log('✅ Success:', qualResponse.status, qualResponse.data);
        console.log('');

        // Test 10: POST new qualification
        console.log('🔟 Testing POST /employees/dropdown/qualifications');
        try {
            const addQualResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/qualifications`,
                { qualification: 'Test Qualification ' + Date.now() },
                config
            );
            console.log('✅ Success:', addQualResponse.status, addQualResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        // Test 11: GET all skills
        console.log('1️⃣1️⃣ Testing GET /employees/dropdown/skills');
        const skillResponse = await axios.get(`${BASE_URL}/employees/dropdown/skills`, config);
        console.log('✅ Success:', skillResponse.status, skillResponse.data);
        console.log('');

        // Test 12: POST new skill
        console.log('1️⃣2️⃣ Testing POST /employees/dropdown/skills');
        try {
            const addSkillResponse = await axios.post(
                `${BASE_URL}/employees/dropdown/skills`,
                { skill: 'Test Skill ' + Date.now() },
                config
            );
            console.log('✅ Success:', addSkillResponse.status, addSkillResponse.data);
        } catch (error) {
            console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
        }
        console.log('');

        console.log('✅ All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.status, error.response.data);
        }
    }
}

testEmployeeAPIs();
