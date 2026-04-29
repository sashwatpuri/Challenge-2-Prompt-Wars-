export const TIMELINE_PHASES = [
  { id: 'registration', title: 'Registration Deadline', description: 'Last day to register to vote.' },
  { id: 'nomination', title: 'Nomination', description: 'Candidates file their nominations.' },
  { id: 'campaign', title: 'Campaign Period', description: 'Candidates campaign for votes.' },
  { id: 'voting', title: 'Voting Day', description: 'Cast your vote at the polling booth.' },
  { id: 'results', title: 'Results', description: 'Votes are counted and results declared.' },
];

export const CURRENT_TIMELINE_PHASE = 'registration'; // Hardcoded as "Voter Registration Open" basically

export const DUMMY_CANDIDATES = [
  { id: '1', name: 'Aarav Sharma', party: 'Progressive Alliance', symbol: '🌻' },
  { id: '2', name: 'Priya Patel', party: 'United People\'s Party', symbol: '🚲' },
  { id: '3', name: 'Ravi Kumar', party: 'National Development Front', symbol: '🦁' },
  { id: '4', name: 'NOTA', party: 'None of the Above', symbol: '❌' },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", 
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", 
  "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];
