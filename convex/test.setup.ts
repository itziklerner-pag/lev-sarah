/// <reference types="vite/client" />

// Export all Convex modules for convex-test
export const modules = import.meta.glob("./**/!(*.*.*)*.*s");
