// Debug script to examine the medication schedule structure
// Run this in browser console

console.log('🔍 Examining medication schedule structure...\n');

const store = JSON.parse(localStorage.getItem('ivf-tracker-storage') || '{}');
const transfer2Id = 'b5e381e5-be0b-41b0-96da-5176cb0c9e76';

const schedule = store.state.medicationSchedules.find(sched => sched.cycleId === transfer2Id);

if (schedule) {
  console.log('📋 Full medication schedule:', schedule);
  console.log('\n💊 Medications in schedule:');
  console.log('===========================');
  
  schedule.medications.forEach((med, index) => {
    console.log(`${index + 1}. ${med.name}`);
    console.log(`   Dosage: ${med.dosage}${med.unit || ''}`);
    console.log(`   Days: ${med.startDay} - ${med.endDay}`);
    console.log(`   Times: ${med.times ? med.times.join(', ') : 'N/A'}`);
    console.log(`   Full med object:`, med);
    console.log('');
  });
}