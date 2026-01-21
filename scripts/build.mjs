#!/usr/bin/env node

/**
 * Build script that handles both production and preview deployments
 *
 * Vercel environment variables:
 * - VERCEL_ENV: 'production' | 'preview' | 'development'
 * - VERCEL_GIT_COMMIT_REF: branch name
 * - CONVEX_DEPLOY_KEY: Deploy key from Convex dashboard
 *
 * For preview deployments to work with isolated Convex backends:
 * - Create a "Preview" deploy key in Convex dashboard
 * - Set CONVEX_DEPLOY_KEY in Vercel to the preview key
 *
 * If no preview key is available, previews will use the production Convex backend.
 */

import { execSync } from 'child_process';

const isVercel = process.env.VERCEL === '1';
const vercelEnv = process.env.VERCEL_ENV;
const branch = process.env.VERCEL_GIT_COMMIT_REF;
const hasDeployKey = !!process.env.CONVEX_DEPLOY_KEY;
const hasConvexUrl = !!process.env.NEXT_PUBLIC_CONVEX_URL;

console.log(`Build environment: ${isVercel ? 'Vercel' : 'Local'}`);
console.log(`Vercel env: ${vercelEnv || 'N/A'}`);
console.log(`Branch: ${branch || 'N/A'}`);
console.log(`Has CONVEX_DEPLOY_KEY: ${hasDeployKey}`);
console.log(`Has NEXT_PUBLIC_CONVEX_URL: ${hasConvexUrl}`);

let buildCommand;

if (isVercel) {
  if (vercelEnv === 'production' || hasDeployKey) {
    // Production or preview deployment with deploy key
    // Run convex deploy first to generate types, then next build
    console.log('Running Convex deploy first to generate types...');
    try {
      execSync('npx convex deploy --yes', { stdio: 'inherit', env: process.env });
      console.log('Convex deploy completed, now running Next.js build...');
      buildCommand = 'npx next build';
    } catch (error) {
      console.error('Convex deploy failed:', error.message);
      process.exit(1);
    }
  } else if (hasConvexUrl) {
    // Preview without deploy key but with URL - just build Next.js
    console.log('Running preview build (Next.js only, using existing Convex URL)...');
    buildCommand = "npx next build";
  } else {
    console.error('ERROR: No CONVEX_DEPLOY_KEY or NEXT_PUBLIC_CONVEX_URL set!');
    console.error('Please set one of these in Vercel environment variables.');
    process.exit(1);
  }
} else {
  // Local build - run convex deploy first, then next build
  console.log('Running local build...');
  try {
    execSync('npx convex deploy --yes', { stdio: 'inherit', env: process.env });
    console.log('Convex deploy completed, now running Next.js build...');
    buildCommand = 'npx next build';
  } catch (error) {
    console.error('Convex deploy failed:', error.message);
    process.exit(1);
  }
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
