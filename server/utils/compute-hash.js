const crypto = require('crypto');

const password = 'pwd';
const salt = '72e4eeb14def3b21';

crypto.scrypt(password, salt, 32, (err, hashedPassword) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  const hashHex = hashedPassword.toString('hex');
  console.log('Password:', password);
  console.log('Salt:', salt);
  console.log('Hash (hex):', hashHex);
});
