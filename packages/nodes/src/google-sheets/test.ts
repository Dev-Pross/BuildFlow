import { GoogleSheetsCredentials, GoogleSheetsService } from "./google-sheets.service";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('🔍 Debug Info:');
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Loaded ✓' : 'Missing ✗');
console.log('CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Loaded ✓' : 'Missing ✗');
console.log('REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);


const testCredentials: GoogleSheetsCredentials = {
    access_token: "ya29.a0ATi6K2tMD5v8dipZChm71fsgKuzkAsPrTuQ96iz6FSJaVVJNDE-qDDTrMTImcJiPm1E9Ev2A7LGhIrkRPX-sGSTmIkimr8T28r6V45GJK0RfpUkUFMRc8Aju4PGfUzbS3XGdwwZvjV2MiCyVYsyMawnOaBMYITAlViuLR8cpaTaQVITQQiHEYT6Z5lG9gHwvdZlvjpsaCgYKAeESARYSFQHGX2Mi4sCzLqC2VjxJ5OZIyxiSTg0206",
    refresh_token: "1//0g--4dA-1bwg1CgYIARAAGBASNwF-L9IrLJEWrYso9Qdozd9MNc6p4ViZ2RwnWWhqRyZgzVHeny2qoeiIirKAA3R07_ZTBHrn88Y",
    expiry_date: 1234567890000,
    token_type: "Bearer"
};

const service = new GoogleSheetsService(testCredentials);

const spreadsheetId = '1AeGLHz3Rfq5oW4y1-69FvE1tFbYM12xqYc7KdopRUak';
const range = "'Sheet1'!A1:G10";

console.log('🔄 Testing Google Sheets service...');

service.readRows({ spreadsheetId, range})
    .then(rows =>{
       console.log('✅ Success! Read', rows.length, 'rows');
        console.log('\nFirst few rows:');
        rows.forEach((row, i) => {
            console.log(`Row ${i + 1}:`, row);
        });
    }).catch(error => {
        console.error('❌ Error:', error.message);
    });