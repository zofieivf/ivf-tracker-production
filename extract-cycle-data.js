// IVF Tracker Cycle Data Extraction Script
// Run this in your browser console on the IVF tracker app page

console.log('🔍 Extracting your IVF cycle data...\n');

// Get the data from localStorage
const storageData = localStorage.getItem('ivf-tracker-storage');

if (!storageData) {
  console.error('❌ No IVF tracker data found in localStorage');
  console.log('Make sure you\'re on the IVF tracker app page and have cycles saved');
} else {
  try {
    const parsed = JSON.parse(storageData);
    const cycles = parsed.state?.cycles || [];
    
    console.log(`✅ Found ${cycles.length} cycles in your data\n`);
    
    if (cycles.length === 0) {
      console.log('No cycles found in storage');
    } else {
      // Check for separate medication storage
      console.log('💊 Checking for medication data structures...');
      console.log('State keys:', Object.keys(parsed.state));
      if (parsed.state.medications) {
        console.log('Found medications array:', parsed.state.medications.length, 'entries');
      }
      
      // Display cycle summary
      console.log('📊 Your Cycles Summary:');
      console.log('=====================');
      
      cycles.forEach((cycle, index) => {
        console.log(`\n${index + 1}. ${cycle.name || `Cycle ${cycle.id}`}`);
        console.log(`   Type: ${cycle.cycleType} (${cycle.cycleGoal})`);
        console.log(`   Start: ${new Date(cycle.startDate).toLocaleDateString()}`);
        console.log(`   Status: ${cycle.status}`);
        console.log(`   Days tracked: ${cycle.days?.length || 0}`);
        
        if (cycle.outcome) {
          if (cycle.cycleGoal === 'retrieval') {
            console.log(`   Outcome: ${cycle.outcome.eggsRetrieved || 0} eggs → ${cycle.outcome.matureEggs || 0} mature → ${cycle.outcome.blastocysts || 0} blasts → ${cycle.outcome.euploidBlastocysts || 0} euploids`);
          } else if (cycle.cycleGoal === 'transfer') {
            const success = cycle.outcome.transferStatus === 'successful' || cycle.outcome.liveBirth === 'yes' ? '✅ Success' : '❌ Failed';
            console.log(`   Outcome: ${success} (Beta: ${cycle.outcome.betaHcg1 || 'N/A'})`);
          }
        }
      });
      
      console.log('\n\n📋 Full Detailed Data (copy this):');
      console.log('==================================');
      console.log('export const YOUR_DETAILED_CYCLES = ');
      console.log(JSON.stringify(cycles, null, 2));
      console.log(';\n');
      
      // Sample daily data analysis
      console.log('\n🔬 Daily Tracking Analysis:');
      console.log('===========================');
      
      cycles.forEach((cycle, cycleIndex) => {
        if (cycle.days && cycle.days.length > 0) {
          console.log(`\n${cycle.name || `Cycle ${cycleIndex + 1}`} - Sample Daily Data:`);
          
          // Show first few days with detailed info
          cycle.days.slice(0, 3).forEach(day => {
            console.log(`\n  Day ${day.cycleDay} (${new Date(day.date).toLocaleDateString()}):`);
            
            if (day.medications && day.medications.length > 0) {
              console.log(`    Medications: ${day.medications.map(m => `${m.name} ${m.dosage}${m.unit} ${m.timing}`).join(', ')}`);
            }
            
            if (day.clinicVisit) {
              console.log(`    Clinic: ${day.clinicVisit.type}${day.clinicVisit.notes ? ` - ${day.clinicVisit.notes}` : ''}`);
            }
            
            if (day.bloodwork && day.bloodwork.length > 0) {
              console.log(`    Bloodwork: ${day.bloodwork.map(b => `${b.test}: ${b.value} ${b.unit}`).join(', ')}`);
            }
            
            if (day.follicles && day.follicles.length > 0) {
              console.log(`    Follicles: ${day.follicles.length} measured (${day.follicles.map(f => f.size).join('mm, ')}mm)`);
            }
            
            if (day.notes) {
              console.log(`    Notes: ${day.notes}`);
            }
          });
          
          if (cycle.days.length > 3) {
            console.log(`    ... and ${cycle.days.length - 3} more days with tracking data`);
          }
        }
      });
      
      console.log('\n\n🎯 Next Steps:');
      console.log('==============');
      console.log('1. Copy the "YOUR_DETAILED_CYCLES" data above');
      console.log('2. Send it to Claude so he can analyze your protocol details');
      console.log('3. Claude will update the comparison logic to extract:');
      console.log('   - Stim duration from medication days');
      console.log('   - Trigger type and timing from clinic visits');
      console.log('   - Total medication doses');
      console.log('   - Protocol-specific details from notes');
      
      // Also save to a global variable for easy copying
      window.yourCycleData = cycles;
      console.log('\n💾 Data also saved to window.yourCycleData for easy access');
    }
    
  } catch (error) {
    console.error('❌ Error parsing localStorage data:', error);
  }
}