// In-memory storage for dropdown values
// In production, this should be moved to a database collection

const dropdownData = {
    departments: [
        'Sales',
        'Marketing', 
        'IT',
        'HR',
        'Finance',
        'Operations',
        'Customer Service'
    ],
    positions: [
        'Manager',
        'Senior Developer',
        'Junior Developer',
        'Sales Executive',
        'HR Executive',
        'Accountant',
        'Team Lead',
        'Intern'
    ],
    cities: [
        'Mumbai',
        'Delhi',
        'Bangalore',
        'Hyderabad',
        'Chennai',
        'Kolkata',
        'Pune',
        'Ahmedabad'
    ],
    states: [
        'Maharashtra',
        'Delhi',
        'Karnataka',
        'Telangana',
        'Tamil Nadu',
        'West Bengal',
        'Gujarat',
        'Rajasthan',
        'Uttar Pradesh',
        'Madhya Pradesh'
    ],
    qualifications: [
        'High School',
        '12th Pass',
        'Diploma',
        'Bachelor\'s Degree',
        'Master\'s Degree',
        'PhD',
        'MBA',
        'B.Tech',
        'M.Tech',
        'BCA',
        'MCA'
    ],
    skills: [
        'JavaScript',
        'React',
        'Node.js',
        'Python',
        'Java',
        'Communication',
        'Leadership',
        'Project Management',
        'Sales',
        'Marketing',
        'Data Analysis',
        'Customer Service'
    ]
};

module.exports = dropdownData;
