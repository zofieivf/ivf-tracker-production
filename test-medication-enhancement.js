// Test script to verify medication data enhancement
// Run this in browser console on your IVF tracker app

console.log('🧪 Testing medication data enhancement...\n');

// Get the store state
const store = JSON.parse(localStorage.getItem('ivf-tracker-storage') || '{}');
const cycles = store.state?.cycles || [];

console.log(`Found ${cycles.length} cycles in storage`);

// Find Transfer 2 cycle
const transfer2 = cycles.find(cycle => 
  cycle.name && cycle.name.toLowerCase().includes('transfer') && cycle.name.includes('2')
);

if (!transfer2) {
  console.error('❌ Could not find Transfer 2 cycle');
  console.log('Available cycles:', cycles.map(c => ({ name: c.name, id: c.id })));
} else {
  console.log(`✅ Found Transfer 2: "${transfer2.name}" (ID: ${transfer2.id})`);
  
  // Check what medication data exists in different storage areas
  console.log('\n🔍 Medication Storage Analysis:');
  console.log('================================');
  
  // Check medications array
  if (store.state.medications) {
    const cycleMeds = store.state.medications.filter(med => med.cycleId === transfer2.id);
    console.log(`Medications array: ${cycleMeds.length} entries for this cycle`);
    if (cycleMeds.length > 0) {
      console.log('Sample medication:', cycleMeds[0]);
    }
  }
  
  // Check medicationSchedules
  if (store.state.medicationSchedules) {
    const schedules = store.state.medicationSchedules.filter(sched => sched.cycleId === transfer2.id);
    console.log(`Medication schedules: ${schedules.length} entries for this cycle`);
    if (schedules.length > 0) {
      console.log('Sample schedule:', schedules[0]);
    }
  }
  
  // Check dailyMedicationStatuses
  if (store.state.dailyMedicationStatuses) {
    const statuses = store.state.dailyMedicationStatuses.filter(stat => stat.cycleId === transfer2.id);
    console.log(`Daily medication statuses: ${statuses.length} entries for this cycle`);
    if (statuses.length > 0) {
      console.log('Sample status:', statuses[0]);
    }
  }
  
  // Check direct cycle day medications
  const daysWithDirectMeds = transfer2.days?.filter(day => day.medications && day.medications.length > 0) || [];
  console.log(`Days with direct medications: ${daysWithDirectMeds.length}`);
  
  console.log('\n📊 Transfer 2 Daily Analysis:');
  console.log('============================');
  
  if (transfer2.days) {
    transfer2.days.slice(15, 25).forEach(day => { // Check days 16-25 where Medrol and Prometrium should be
      console.log(`Day ${day.cycleDay}: ${day.medications ? day.medications.length : 0} direct meds`);
    });
  }
  
  console.log('\n💡 Next Steps:');
  console.log('==============');
  console.log('1. The getCycleWithMedications function should consolidate all medication sources');
  console.log('2. Enhanced cycle data should show medications on days 17-20 (Medrol) and 20-22 (Prometrium)');
  console.log('3. Strategy Analysis should display the medication timeline');
}