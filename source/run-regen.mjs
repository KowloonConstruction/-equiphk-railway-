/**
 * Standalone script to regenerate all equipment descriptions via the tRPC API
 * Run with: node run-regen.mjs
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const BASE_URL = 'http://localhost:3000';

async function callRegenerateDescriptions() {
  console.log('Starting description regeneration via API...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/trpc/admin.regenerateDescriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const text = await response.text();
    console.log('Response status:', response.status);
    console.log('Response:', text.substring(0, 500));
  } catch (error) {
    console.error('Error calling API:', error.message);
  }
}

callRegenerateDescriptions();
