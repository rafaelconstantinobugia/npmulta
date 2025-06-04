// This script fixes the npm registry protocol issue
import fs from 'fs';

console.log('🔧 Fixing npm registry protocol issues...');

// 1. Delete convert-registry.js if it exists
if (fs.existsSync('./convert-registry.js')) {
  console.log('🗑️  Removing convert-registry.js...');
  fs.unlinkSync('./convert-registry.js');
}

// 2. Delete package-lock.json to remove http references
if (fs.existsSync('./package-lock.json')) {
  console.log('🗑️  Removing package-lock.json...');
  fs.unlinkSync('./package-lock.json');
}

console.log('✅ Cleanup completed!');
console.log('📋 Next steps:');
console.log('1. Run: npm config set registry https://registry.npmjs.org/');
console.log('2. Run: npm cache clean --force');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');