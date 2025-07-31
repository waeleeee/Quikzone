const axios = require('axios');

const testExpediteurPayments = async () => {
  try {
    console.log('🧪 Testing expediteur payments API endpoint...\n');
    
    // Test with a known expediteur email
    const email = 'wael_expediteur@quickzone.tn';
    const url = `http://localhost:5000/api/payments/expediteur/${encodeURIComponent(email)}`;
    
    console.log(`📡 Testing URL: ${url}`);
    console.log(`📧 Email: ${email}\n`);
    
    const response = await axios.get(url);
    
    console.log('✅ Expediteur payments API endpoint working');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data.payments && response.data.data.payments.length > 0) {
      console.log(`\n💰 Found ${response.data.data.payments.length} payments for this expediteur`);
      response.data.data.payments.forEach((payment, index) => {
        console.log(`${index + 1}. ${payment.reference || payment.id} - ${payment.amount}€ - ${payment.status}`);
      });
    } else {
      console.log('\n⚠️  No payments found for this expediteur');
    }
    
  } catch (error) {
    console.error('❌ Expediteur payments API endpoint failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testExpediteurPayments(); 