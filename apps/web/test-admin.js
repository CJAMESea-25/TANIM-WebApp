import https from 'https';
import fs from 'fs';

const options = {
  hostname: 'hvvmzhaafpnhnhwlkhsz.supabase.co',
  port: 443,
  path: '/rest/v1/admin?select=username,password',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dm16aGFhZnBuaG5od2xraHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzAwNzUsImV4cCI6MjA4NDIwNjA3NX0.xWAuBH-9vRlsxDj1iCmR1wvDA-8XOkCzDxlkqB-QrIA',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2dm16aGFhZnBuaG5od2xraHN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzAwNzUsImV4cCI6MjA4NDIwNjA3NX0.xWAuBH-9vRlsxDj1iCmR1wvDA-8XOkCzDxlkqB-QrIA'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync('admin-output.json', JSON.stringify(JSON.parse(data), null, 2), 'utf8');
  });
});

req.end();
