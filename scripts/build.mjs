#!/usr/bin/env node

/**
 * Build script that handles both production and preview deployments
 *
 * Vercel environment variables:
 * - VERCEL_ENV: 'production' | 'preview' | 'development'
 * - VERCEL_GIT_COMMIT_REF: branch name
 */

import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const vercelEnv = process.env.VERCEL_ENV;
const branch = process.env.VERCEL_GIT_COMMIT_REF;

console.log(`Build environment: ${isVercel ? 'Vercel' : 'Local'}`);
console.log(`Vercel env: ${vercelEnv || 'N/A'}`);
console.log(`Branch: ${branch || 'N/A'}`);

let buildCommand;

if (isVercel) {
  if (vercelEnv === 'production') {
    // Production deployment - deploy to main Convex deployment
    console.log('Running production build...');
    buildCommand = "npx convex deploy --yes --cmd 'next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL";
  } else {
    // Preview deployment - create/use preview Convex deployment
    console.log('Running preview build...');
    buildCommand = "npx convex deploy --yes --preview --cmd 'next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL";
  }
} else {
  // Local build - use production deploy (assumes local dev has credentials)
  console.log('Running local build...');
  buildCommand = "npx convex deploy --yes --cmd 'next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL";
}

console.log(`Executing: ${buildCommand}`);

try {
  execSync(buildCommand, {
    stdio: 'inherit',
    env: process.env
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
