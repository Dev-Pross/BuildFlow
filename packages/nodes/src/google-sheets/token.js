const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// PASTE THE CODE FROM BROWSER URL HERE
const code = '4/0Ab32j90OIYwIR9QJczUuZlJkgjyRdodzLDEQv4C4v6Nvkep9dEGsLL2Xi-m63qTIW_y2VQ';

oauth2Client.getToken(code, (err, tokens) => {
    if (err) {
        console.error('❌ Error getting tokens:', err.message);
        return;
    }
    
    console.log('✅ Got tokens!');
    console.log('\naccess_token:', tokens.access_token);
    console.log('\nrefresh_token:', tokens.refresh_token);
    console.log('\nexpiry_date:', tokens.expiry_date);
});