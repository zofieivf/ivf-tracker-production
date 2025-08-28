// Script to extract cycles from localStorage for test data
// Run this in your browser console on the IVF tracker app

console.log('=== Extracting your cycles for test data ===');

// Get data from localStorage
const storageKey = 'ivf-tracker-storage';
const data = localStorage.getItem(storageKey);

if (!data) {
  console.error('No data found in localStorage with key:', storageKey);
} else {
  try {
    const parsed = JSON.parse(data);
    const cycles = parsed.state?.cycles || [];
    
    console.log(`Found ${cycles.length} cycles:`);
    cycles.forEach((cycle, index) => {
      console.log(`\n--- Cycle ${index + 1} ---`);
      console.log('ID:', cycle.id);
      console.log('Name:', cycle.name);
      console.log('Type:', cycle.cycleType);
      console.log('Goal:', cycle.cycleGoal);
      console.log('Status:', cycle.status);
      console.log('Start Date:', cycle.startDate);
      console.log('Days:', cycle.days?.length || 0);
      console.log('Has Outcome:', !!cycle.outcome);
      
      if (cycle.outcome) {
        console.log('Outcome Summary:');
        console.log('  - Eggs Retrieved:', cycle.outcome.eggsRetrieved);
        console.log('  - Mature Eggs:', cycle.outcome.matureEggs);
        console.log('  - Blastocysts:', cycle.outcome.blastocysts);
        console.log('  - Euploids:', cycle.outcome.euploidBlastocysts);
      }
    });
    
    console.log('\n=== Full JSON Data ===');
    console.log('Copy this for the test data:');
    console.log(JSON.stringify(cycles, null, 2));
    
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }
}