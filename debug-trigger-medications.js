// Debug script to check trigger medication data flow
// Run this in browser console on your IVF tracker app

console.log('🔍 Debugging trigger medication data...\n');

// Get the store state
const store = JSON.parse(localStorage.getItem('ivf-tracker-storage') || '{}');
const cycles = store.state?.cycles || [];

console.log(`Found ${cycles.length} cycles in storage`);

// List all cycles
console.log('\n📋 Available cycles:');
cycles.forEach((cycle, index) => {
  console.log(`${index + 1}. "${cycle.name}" (ID: ${cycle.id}) - ${cycle.cycleGoal}`);
});

// Find IUI1 or similar cycle
const targetCycle = cycles.find(cycle => 
  cycle.name && (
    cycle.name.toLowerCase().includes('iui') || 
    cycle.name.toLowerCase().includes('insemination')
  )
) || cycles[0]; // Fallback to first cycle

if (!targetCycle) {
  console.log('❌ No cycles found');
} else {
  console.log(`\n🎯 Analyzing cycle: "${targetCycle.name}" (ID: ${targetCycle.id})`);
  
  // Check medication schedule
  const medicationSchedule = store.state.medicationSchedules?.find(sched => 
    sched.cycleId === targetCycle.id
  );
  
  if (medicationSchedule) {
    console.log(`\n💊 Medication Schedule (${medicationSchedule.medications.length} medications):`);
    medicationSchedule.medications.forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.name} (Days ${med.startDay}-${med.endDay})`);
      console.log(`     - Dosage: ${med.dosage}`);
      console.log(`     - Trigger: ${med.trigger || false}`);
      console.log(`     - Refrigerated: ${med.refrigerated || false}`);
      console.log('');
    });
    
    // Check if any medications are marked as triggers
    const triggerMeds = medicationSchedule.medications.filter(med => med.trigger);
    if (triggerMeds.length > 0) {
      console.log(`🟡 Found ${triggerMeds.length} trigger medication(s):`);
      triggerMeds.forEach(med => {
        console.log(`  - ${med.name} on days ${med.startDay}-${med.endDay}`);
      });
    } else {
      console.log('⚠️ No medications marked as triggers in schedule');
    }
  } else {
    console.log('⚠️ No medication schedule found for this cycle');
  }
  
  // Check day-specific medications
  const daySpecificStatuses = store.state.dailyMedicationStatuses?.filter(status =>
    status.cycleId === targetCycle.id && 
    status.daySpecificMedications && 
    status.daySpecificMedications.length > 0
  );
  
  if (daySpecificStatuses && daySpecificStatuses.length > 0) {
    console.log(`\n📅 Day-specific medications found on ${daySpecificStatuses.length} days:`);
    daySpecificStatuses.forEach(status => {
      console.log(`  Day ${status.cycleDay}:`);
      status.daySpecificMedications.forEach(med => {
        console.log(`    - ${med.name} ${med.dosage} (Trigger: ${med.trigger || false})`);
      });
    });
  }
  
  // Check direct cycle day medications
  const daysWithMeds = targetCycle.days?.filter(day => 
    day.medications && day.medications.length > 0
  ) || [];
  
  if (daysWithMeds.length > 0) {
    console.log(`\n🗓️ Direct cycle day medications found on ${daysWithMeds.length} days:`);
    daysWithMeds.forEach(day => {
      console.log(`  Day ${day.cycleDay}:`);
      day.medications.forEach(med => {
        console.log(`    - ${med.name} ${med.dosage}${med.unit} (Trigger: ${med.trigger || false})`);
      });
    });
  }
  
  console.log('\n🔧 Debugging Steps:');
  console.log('1. If no trigger medications found, add them via Medication Schedule');
  console.log('2. Check if trigger checkbox was used when adding medications');
  console.log('3. Verify the enhanced cycle data function is working');
  console.log('4. Check that UI components are receiving trigger field correctly');
}