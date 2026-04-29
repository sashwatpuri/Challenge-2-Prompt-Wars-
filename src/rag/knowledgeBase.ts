export type KnowledgeChunk = {
  id: string;
  topic: string;
  keywords: string[];
  content: string;
  source: string;
};

export const knowledgeBase: KnowledgeChunk[] = [
  // Eligibility
  {
    id: 'eligibility_1',
    topic: 'eligibility',
    keywords: ['age', '18', 'eligibility', 'can i vote', 'who can vote', 'citizenship', 'citizen'],
    content: 'To be eligible to vote in India, you must be an Indian citizen and be at least 18 years of age on the qualifying date (usually January 1st of the year of revision of electoral roll). You must also be ordinarily resident of the polling area.',
    source: 'Election Commission of India'
  },
  {
    id: 'eligibility_nri',
    topic: 'eligibility',
    keywords: ['nri', 'abroad', 'overseas', 'non-resident', 'can nri vote'],
    content: 'Non-Resident Indians (NRIs) who hold an Indian passport and have not acquired citizenship of any other country are eligible to vote. They must register as an overseas voter using Form 6A and must be physically present at their designated polling station in India to cast their vote.',
    source: 'Election Commission of India'
  },
  // Registration
  {
    id: 'register_form6',
    topic: 'registration',
    keywords: ['register', 'apply', 'form 6', 'new voter', 'enroll', 'nvsp'],
    content: 'To register as a new voter, you need to fill out Form 6. You can do this online through the National Voters Service Portal (NVSP), the Voter Portal, or the Voter Helpline App. You will need proof of age and proof of address.',
    source: 'Election Commission of India'
  },
  {
    id: 'register_helpline',
    topic: 'registration',
    keywords: ['helpline', '1950', 'app', 'vha', 'call'],
    content: 'For voting-related queries or assistance with registration, citizens can call the toll-free Voter Helpline number 1950. Alternatively, the Voter Helpline App (VHA) provides mobile access to registration forms and electoral roll search.',
    source: 'Election Commission of India'
  },
  // Voter ID (EPIC)
  {
    id: 'epic_download',
    topic: 'voter_id',
    keywords: ['download', 'e-epic', 'digital', 'pdf', 'lost', 'copy'],
    content: 'The e-EPIC is a secure PDF version of the Voter ID card. Registered voters can download their e-EPIC from the Voter Portal or NVSP website. It is equally valid as a physical Voter ID card for identification at the polling booth.',
    source: 'Election Commission of India'
  },
  {
    id: 'epic_correction',
    topic: 'voter_id',
    keywords: ['correct', 'mistake', 'change name', 'address change', 'form 8', 'update'],
    content: 'If there are mistakes in your Voter ID or if you have shifted your residence within the same constituency, you must submit Form 8. This form is used for corrections of entries, shifting of residence, and replacement of EPIC.',
    source: 'Election Commission of India'
  },
  // Missing Name
  {
    id: 'missing_name',
    topic: 'voter_list',
    keywords: ['missing', 'not in list', 'deleted', 'name not found', 'check name'],
    content: 'Having a Voter ID is not enough; your name must be on the electoral roll (voter list) to cast a vote. If your name is missing, you cannot vote. Always verify your name on the electoral roll online before election day.',
    source: 'Election Commission of India'
  },
  // Polling Booth Documents
  {
    id: 'booth_documents',
    topic: 'polling_day',
    keywords: ['documents', 'id proof', 'no voter id', 'accepted id', 'aadhar', 'pan', 'passport', 'alternatives'],
    content: 'If you do not have your physical Voter ID (EPIC), you can still vote if your name is on the electoral roll. The ECI accepts 12 alternative photo identity documents, including Aadhaar card, PAN card, Driving License, Indian Passport, and MGNREGA job card.',
    source: 'Election Commission of India'
  },
  // EVM & VVPAT
  {
    id: 'evm_basics',
    topic: 'evm',
    keywords: ['evm', 'machine', 'electronic voting', 'how evm works', 'control unit', 'ballot unit'],
    content: 'An Electronic Voting Machine (EVM) consists of two units: a Control Unit and a Balloting Unit. The Control Unit is kept with the Presiding Officer, while the Balloting Unit is kept inside the voting compartment for the voter to press the button next to their chosen candidate.',
    source: 'Election Commission of India'
  },
  {
    id: 'evm_tamper',
    topic: 'evm',
    keywords: ['tamper', 'hack', 'secure', 'safe', 'internet', 'wifi', 'bluetooth'],
    content: 'EVMs are standalone machines and are not connected to the internet, Wi-Fi, or Bluetooth, making them immune to remote hacking. They use One-Time Programmable chips, meaning the software cannot be rewritten or modified after manufacturing.',
    source: 'Election Commission of India'
  },
  {
    id: 'evm_vvpat',
    topic: 'evm',
    keywords: ['vvpat', 'slip', 'paper trail', 'verify', '7 seconds', 'glass'],
    content: 'VVPAT (Voter Verifiable Paper Audit Trail) is an independent verification system attached to the EVM. When a vote is cast, a paper slip showing the candidate\'s name and symbol is printed and visible through a glass window for 7 seconds before dropping into a sealed drop box.',
    source: 'Election Commission of India'
  },
  {
    id: 'evm_secrecy',
    topic: 'evm',
    keywords: ['secrecy', 'secret', 'who i voted for', 'anonymous', 'privacy', 'ballot'],
    content: 'Voting in India is completely secret. The EVM records votes sequentially, but it does not record any voter identification details alongside the vote. There is no way to link a specific vote back to the voter who cast it.',
    source: 'Election Commission of India'
  },
  {
    id: 'evm_myths',
    topic: 'evm',
    keywords: ['myth', 'fake', 'rumor', 'battery', 'button press'],
    content: 'A common myth is that pressing any button registers a vote for a specific party. This is false. Pre-election mock polls are conducted in the presence of political party representatives to verify that every button correctly registers votes for its respective candidate.',
    source: 'Election Commission of India'
  },
  {
    id: 'evm_models',
    topic: 'evm',
    keywords: ['m2', 'm3', 'models', 'manufacture'],
    content: 'Current elections use M3 generation EVMs, which have advanced security features like mutual authentication between units. If any unauthorized unit is connected, the EVM immediately shuts down.',
    source: 'Election Commission of India'
  },
  // Election Phases & Process
  {
    id: 'phases_mcc',
    topic: 'election_phases',
    keywords: ['mcc', 'model code of conduct', 'rules', 'campaign rules', 'announcement'],
    content: 'The Model Code of Conduct (MCC) comes into effect immediately when election dates are announced. It provides guidelines for political parties and candidates regarding speeches, polling day conduct, and prohibits the ruling party from using state machinery for campaigning.',
    source: 'Election Commission of India'
  },
  {
    id: 'phases_nomination',
    topic: 'election_phases',
    keywords: ['nomination', 'candidate', 'deposit', 'affidavit', 'criminal record'],
    content: 'During the nomination phase, candidates file their papers to contest. They must submit an affidavit detailing their assets, liabilities, educational qualifications, and any pending criminal cases. This information is made public for voters to see.',
    source: 'Election Commission of India'
  },
  {
    id: 'phases_campaigning',
    topic: 'election_phases',
    keywords: ['campaign', 'rally', 'silence period', '48 hours', 'stop campaigning'],
    content: 'Campaigning must strictly end 48 hours before the end of polling in that constituency. This "silence period" gives voters a peaceful environment to reflect and decide without the influence of public meetings or rallies.',
    source: 'Election Commission of India'
  },
  // Postal Ballot
  {
    id: 'postal_ballot',
    topic: 'voting_methods',
    keywords: ['postal ballot', 'absentee', 'post', 'service voter', 'army', '80 years', 'disability'],
    content: 'Postal ballots are available for specific groups: service voters (armed forces), election duty staff, preventive detainees, senior citizens above 85 years, and persons with disabilities (PwD). They receive ballot papers to cast their vote without visiting the booth.',
    source: 'Election Commission of India'
  },
  // Polling Day
  {
    id: 'polling_day_process',
    topic: 'polling_day',
    keywords: ['booth process', 'step by step', 'ink', 'finger', 'officer', 'inside booth'],
    content: 'At the polling booth: First, your identity is verified against the voter list. Second, your left forefinger is marked with indelible ink, and you sign the register. Finally, you enter the voting compartment and press the EVM button for your candidate.',
    source: 'Election Commission of India'
  },
  {
    id: 'polling_day_rules',
    topic: 'polling_day',
    keywords: ['phone', 'camera', 'inside', 'take picture', 'selfie'],
    content: 'Mobile phones, cameras, and any recording devices are strictly prohibited inside the voting compartment to maintain the secrecy of the ballot. You cannot take a selfie with the EVM.',
    source: 'Election Commission of India'
  },
  // Lok Sabha vs Vidhan Sabha
  {
    id: 'election_types_ls_vs',
    topic: 'election_types',
    keywords: ['lok sabha', 'vidhan sabha', 'mp', 'mla', 'difference', 'state', 'national'],
    content: 'Lok Sabha elections are held to elect Members of Parliament (MPs) at the national level, which determines the Prime Minister and central government. Vidhan Sabha elections elect Members of Legislative Assembly (MLAs) to form the state government and choose the Chief Minister.',
    source: 'Election Commission of India'
  },
  {
    id: 'nota',
    topic: 'voting_options',
    keywords: ['nota', 'none of the above', 'reject', 'don\'t like anyone'],
    content: 'NOTA (None of the Above) is an option on the EVM. If a voter does not find any candidate suitable, they can press the NOTA button. However, NOTA does not impact the election outcome; the candidate with the most votes still wins, even if NOTA gets higher votes.',
    source: 'Election Commission of India'
  }
];
