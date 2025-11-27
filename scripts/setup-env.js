const fs = require('fs');
const path = require('path');

const envExampleContent = `# ============================================
# Database Configuration
# ============================================
# PostgreSQL connection settings
# Update DB_PASSWORD with your actual PostgreSQL password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dental_tutor
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# ============================================
# JWT Authentication Configuration
# ============================================
# Secret key for signing JWT tokens
# IMPORTANT: Use a strong, random string in production
# Generate one with: openssl rand -base64 32
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=7d

# ============================================
# OpenAI API Configuration
# ============================================
# Your OpenAI API key for the chatbot feature
# Get your API key from: https://platform.openai.com/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# ============================================
# Application Configuration
# ============================================
# Public URL of your application
# For local development, use: http://localhost:3000
# For production, use your actual domain
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# Node Environment
# ============================================
# Automatically set by Next.js, but you can override if needed
# Options: development, production, test
# NODE_ENV=development
`;

const envLocalContent = `# ============================================
# Database Configuration
# ============================================
# IMPORTANT: Update DB_PASSWORD with your actual PostgreSQL password
# If you don't know your PostgreSQL password:
# 1. Connect: psql -U postgres
# 2. Reset: ALTER USER postgres PASSWORD 'newpassword';
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dental_tutor
DB_USER=postgres
DB_PASSWORD=postgres

# ============================================
# JWT Authentication Configuration
# ============================================
# IMPORTANT: Change this to a secure random string in production
# Generate one with: openssl rand -base64 32
JWT_SECRET=dev_jwt_secret_key_change_in_production_12345
JWT_EXPIRES_IN=7d

# ============================================
# OpenAI API Configuration
# ============================================
# Your OpenAI API key for the chatbot feature
# Get your API key from: https://platform.openai.com/api-keys
# Leave empty if you don't need chatbot functionality yet
OPENAI_API_KEY=

# ============================================
# Application Configuration
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;

const rootDir = path.join(__dirname, '..');

// Create .env.example
const envExamplePath = path.join(rootDir, '.env.example');
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExampleContent);
  console.log('✓ Created .env.example');
} else {
  console.log('⚠ .env.example already exists, skipping...');
}

// Create .env.local (only if it doesn't exist)
const envLocalPath = path.join(rootDir, '.env.local');
if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, envLocalContent);
  console.log('✓ Created .env.local');
  console.log('');
  console.log('⚠ IMPORTANT: Please update DB_PASSWORD in .env.local with your actual PostgreSQL password!');
} else {
  console.log('⚠ .env.local already exists, skipping to avoid overwriting...');
}

console.log('');
console.log('Environment files setup complete!');
console.log('Next steps:');
console.log('1. Edit .env.local and update DB_PASSWORD with your PostgreSQL password');
console.log('2. (Optional) Add OPENAI_API_KEY if you want chatbot functionality');
console.log('3. Restart your Next.js dev server after making changes');

