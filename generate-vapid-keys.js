const crypto = require('crypto');

// Generate VAPID keys
const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1'
});

// Export keys in the correct format
const publicKeyDer = publicKey.export({ type: 'spki', format: 'der' });
const privateKeyDer = privateKey.export({ type: 'sec1', format: 'der' });

// Extract the raw key bytes (last 65 bytes for public, last 32 for private)
const publicKeyBytes = publicKeyDer.slice(-65);
const privateKeyBytes = privateKeyDer.slice(-32);

// Convert to URL-safe base64
function toUrlBase64(buffer) {
    return buffer
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const publicKeyBase64 = toUrlBase64(publicKeyBytes);
const privateKeyBase64 = toUrlBase64(privateKeyBytes);

console.log('=== VAPID KEYS GENERATED ===\n');
console.log('PUBLIC_KEY (use in frontend):');
console.log(publicKeyBase64);
console.log('\nPRIVATE_KEY (use in Supabase secret):');
console.log(privateKeyBase64);
console.log('\n============================');
