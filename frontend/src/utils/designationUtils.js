export const DEPARTMENT_DESIGNATIONS = {
  'IT & Software': [
    'Software Engineer',
    'Senior Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'System Administrator',
    'Network Specialist',
    'DevOps Engineer',
    'QA / Test Analyst',
    'IT Support Specialist'
  ],
  'Finance & Accounting': [
    'Accountant',
    'Senior Accountant',
    'Accounts Officer',
    'Payroll Specialist',
    'Financial Analyst',
    'Billing Specialist',
    'Audit Executive'
  ],
  'HR & Personnel Admin': [
    'HR Executive',
    'HR Generalist',
    'Talent Acquisition Specialist',
    'Onboarding Specialist',
    'Employee Relations Officer'
  ],
  'Operations': [
    'Operations Executive',
    'Process Specialist',
    'Escalation Analyst',
    'Quality Control Analyst',
    'Operations Coordinator'
  ],
  'Customer Support': [
    'Customer Support Representative',
    'Senior Support Executive',
    'Technical Support Associate',
    'Helpdesk Specialist',
    'Client Success Executive'
  ]
};

export const getDesignationsForDepartment = (deptName) => {
  if (!deptName) {
    return [
      'Operations Executive',
      'Software Engineer',
      'Accountant',
      'HR Executive',
      'Support Representative'
    ];
  }
  
  const d = String(deptName).toLowerCase();

  if (d.includes('it') || d.includes('software') || d.includes('tech')) {
    return DEPARTMENT_DESIGNATIONS['IT & Software'];
  }
  if (d.includes('finance') || d.includes('account') || d.includes('billing')) {
    return DEPARTMENT_DESIGNATIONS['Finance & Accounting'];
  }
  if (d.includes('hr') || d.includes('personnel') || d.includes('human')) {
    return DEPARTMENT_DESIGNATIONS['HR & Personnel Admin'];
  }
  if (d.includes('support') || d.includes('customer') || d.includes('helpdesk')) {
    return DEPARTMENT_DESIGNATIONS['Customer Support'];
  }
  if (d.includes('operation')) {
    return DEPARTMENT_DESIGNATIONS['Operations'];
  }
  
  return [
    'Operations Executive',
    'Software Engineer',
    'Accountant',
    'HR Executive',
    'Support Representative',
    'Process Analyst'
  ];
};
