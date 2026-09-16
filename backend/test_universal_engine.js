const { extractCropFromQuery, extractProblemFromQuery, buildUniversalActionAdvice } = require('./utils/universalAgricultureEngine');

const testScenarios = [
  {
    id: 'TEST A',
    query: 'Maine paddy ki farming ki hai aur khet me pani bhar gaya hai, kya karu?',
    expectedCrop: 'paddy',
    expectedCategory: 'WATERLOGGING',
    forbiddenTerms: ['wheat', 'gehu', 'nutrient plan', 'nitrogen']
  },
  {
    id: 'TEST B',
    query: 'Tomato ke patte brown ho rahe hain, kaise thik kare?',
    expectedCrop: 'tomato',
    expectedCategory: 'BROWN_LEAVES',
    forbiddenTerms: ['waterlogging', 'maintain nutrient plan']
  },
  {
    id: 'TEST C',
    query: 'Wheat me keede lag gaye hain kya karu?',
    expectedCrop: 'wheat',
    expectedCategory: 'PEST_ATTACK',
    forbiddenTerms: ['pani bhar gaya', 'drainage']
  },
  {
    id: 'TEST D',
    query: 'Potato ki growth nahi ho rahi.',
    expectedCrop: 'potato',
    expectedCategory: 'POOR_GROWTH',
    forbiddenTerms: ['crop calendar']
  },
  {
    id: 'TEST E',
    query: 'Field me pani ki kami hai.',
    expectedCrop: null, // crop not in query, relies on context
    expectedCategory: 'DROUGHT_MOISTURE',
    forbiddenTerms: ['waterlogging']
  },
  {
    id: 'TEST F',
    query: 'My tomato crop looks healthy, what should I do?',
    expectedCrop: 'tomato',
    expectedCategory: 'HEALTHY_MAINTENANCE',
    forbiddenTerms: ['disease detected', 'urgent spray']
  }
];

console.log('=== RUNNING UNIVERSAL AGRICULTURAL REASONING TESTS ===\n');

let passed = 0;
let failed = 0;

for (const test of testScenarios) {
  const crop = extractCropFromQuery(test.query);
  const problem = extractProblemFromQuery(test.query);
  const advice = buildUniversalActionAdvice({ crop, problem, language: 'hi', queryText: test.query });

  console.log(`--- [${test.id}] ---`);
  console.log(`Query: "${test.query}"`);
  console.log(`Extracted Crop: ${crop ? crop.canonical + ' (' + crop.nameHi + ')' : 'None (from farm context)'}`);
  console.log(`Detected Problem Category: ${problem ? problem.category : 'None'}`);
  console.log(`Title: ${problem ? problem.titleHi : 'General'}`);
  console.log(`Priority: ${problem ? problem.severity : 'Normal'}`);
  console.log(`Immediate Step 1: ${problem ? problem.immediateStepsHi[0] : 'None'}`);

  let testOk = true;

  if (test.expectedCrop) {
    if (!crop || crop.id !== test.expectedCrop) {
      console.error(`❌ FAILED: Expected crop ${test.expectedCrop}, got ${crop?.id}`);
      testOk = false;
    }
  }

  if (test.expectedCategory) {
    if (!problem || problem.category !== test.expectedCategory) {
      console.error(`❌ FAILED: Expected category ${test.expectedCategory}, got ${problem?.category}`);
      testOk = false;
    }
  }

  const adviceLower = advice.toLowerCase();
  for (const term of test.forbiddenTerms) {
    if (adviceLower.includes(term.toLowerCase())) {
      console.error(`❌ FAILED: Found forbidden term "${term}" in output advice!`);
      testOk = false;
    }
  }

  if (testOk) {
    console.log(`✅ PASSED: ${test.id} verified.`);
    passed++;
  } else {
    failed++;
  }
  console.log('\n');
}

console.log(`Summary: ${passed} PASSED, ${failed} FAILED.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED PERFECTLY!');
  process.exit(0);
}
