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
  'Human Resources': [
    'HR Executive',
    'HR Generalist',
    'Senior HR Specialist',
    'HR Operations Lead',
    'Talent Acquisition Specialist',
    'Onboarding Specialist',
    'Employee Relations Officer'
  ],
  'HR & Personnel Admin': [
    'HR Executive',
    'HR Generalist',
    'Senior HR Specialist',
    'HR Operations Lead',
    'Talent Acquisition Specialist',
    'Onboarding Specialist',
    'Employee Relations Officer'
  ],
  'Operations & Facilities': [
    'Operations Executive',
    'Workplace & Hardware Specialist',
    'Facilities Coordinator',
    'Facilities Operations Lead',
    'Operations Coordinator',
    'Process Specialist',
    'Escalation Analyst'
  ],
  'Operations': [
    'Operations Executive',
    'Workplace & Hardware Specialist',
    'Facilities Coordinator',
    'Facilities Operations Lead',
    'Process Specialist',
    'Escalation Analyst',
    'Quality Control Analyst',
    'Operations Coordinator'
  ],
  'Sales & Marketing': [
    'Account Executive',
    'Digital Marketing Associate',
    'Marketing Specialist',
    'Sales Development Representative',
    'Growth Specialist',
    'Content & Brand Associate'
  ],
  'Customer Support': [
    'Customer Support Representative',
    'Customer Success Specialist',
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
    return DEPARTMENT_DESIGNATIONS['Human Resources'];
  }
  if (d.includes('sales') || d.includes('marketing') || d.includes('growth')) {
    return DEPARTMENT_DESIGNATIONS['Sales & Marketing'];
  }
  if (d.includes('support') || d.includes('customer') || d.includes('helpdesk')) {
    return DEPARTMENT_DESIGNATIONS['Customer Support'];
  }
  if (d.includes('operation') || d.includes('facilit')) {
    return DEPARTMENT_DESIGNATIONS['Operations & Facilities'];
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
