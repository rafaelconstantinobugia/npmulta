// Script to convert https://registry URLs to http://registry in package-lock.json
const fs = require('fs');
const path = require('path');

const packageLockPath = path.join(process.cwd(), 'package-lock.json');

try {
  // Read the package-lock.json file
  let content = fs.readFileSync(packageLockPath, 'utf8');
  
  // Replace all occurrences of https://registry with http://registry
  const updatedContent = content.replace(/https:\/\/registry/g, 'http://registry');
  
  // Write the updated content back to the file
  fs.writeFileSync(packageLockPath, updatedContent);
  
  console.log('✅ Successfully converted all registry URLs from HTTPS to HTTP');
  console.log(`Modified file: ${packageLockPath}`);
} catch (error) {
  console.error('❌ Error processing package-lock.json:', error.message);
}