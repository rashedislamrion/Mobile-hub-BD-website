#!/usr/bin/env node

/**
 * scripts/check-env.mjs
 * Validates that all required environment variables defined in an example file
 * are present, non-empty, and configured (not placeholder text) in a target env file.
 *
 * Usage:
 *   node scripts/check-env.mjs <target-env-path> <example-env-path>
 *
 * Rules:
 *   - Prints ONLY variable names (never values or secrets).
 *   - Exits with code 1 if any required variable is missing or empty.
 *   - Exits with code 0 if all required variables are properly populated.
 */

import fs from 'fs';
import path from 'path';

function parseEnvFile(content) {
  const vars = new Map(); // name -> { isRequired, lineNo, defaultVal }
  const lines = content.split(/\r?\n/);
  
  let currentIsOptional = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('#')) {
      const lower = trimmed.toLowerCase();
      if (lower.includes('[optional]') || lower.includes('(optional)') || lower.includes('optional:')) {
        currentIsOptional = true;
      } else if (lower.includes('[required]') || lower.includes('(required)') || lower.includes('required:')) {
        currentIsOptional = false;
      }
      continue;
    }

    // Match KEY=VALUE
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();

      // strip quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      vars.set(key, {
        isRequired: !currentIsOptional,
        value: val,
      });
    }
  }

  return vars;
}

function parseActualEnv(content) {
  const actual = new Map();
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();

      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      actual.set(key, val);
    }
  }

  return actual;
}

function isPlaceholder(val) {
  if (!val) return true;
  const v = val.trim();
  if (!v) return true;
  if (/^<.*>$/.test(v)) return true;
  if (/^REPLACE_WITH_/i.test(v)) return true;
  if (/^YOUR_/i.test(v)) return true;
  if (/^CHANGE_ME/i.test(v)) return true;
  return false;
}

function main() {
  const targetPath = process.argv[2];
  const examplePath = process.argv[3];

  if (!targetPath || !examplePath) {
    console.error('Usage: node scripts/check-env.mjs <target-env-path> <example-env-path>');
    process.exit(2);
  }

  const resolvedTarget = path.resolve(process.cwd(), targetPath);
  const resolvedExample = path.resolve(process.cwd(), examplePath);

  if (!fs.existsSync(resolvedExample)) {
    console.error(`[ERROR] Example env file not found: ${resolvedExample}`);
    process.exit(2);
  }

  if (!fs.existsSync(resolvedTarget)) {
    console.error(`[ERROR] Target env file not found: ${resolvedTarget}`);
    process.exit(1);
  }

  const exampleContent = fs.readFileSync(resolvedExample, 'utf-8');
  const targetContent = fs.readFileSync(resolvedTarget, 'utf-8');

  const exampleSpecs = parseEnvFile(exampleContent);
  const actualValues = parseActualEnv(targetContent);

  const missingOrEmpty = [];

  for (const [key, spec] of exampleSpecs.entries()) {
    if (!spec.isRequired) {
      continue;
    }

    if (!actualValues.has(key)) {
      missingOrEmpty.push(key);
      continue;
    }

    const val = actualValues.get(key);
    if (isPlaceholder(val)) {
      missingOrEmpty.push(key);
    } else if (
      key === 'PUBLIC_API_URL' &&
      (resolvedTarget.includes('production') || resolvedTarget.includes('prod')) &&
      (val.includes('localhost') || val.includes('127.0.0.1'))
    ) {
      missingOrEmpty.push(`${key} (must not be localhost in production)`);
    }
  }

  if (missingOrEmpty.length > 0) {
    console.error(`\n✖ [ENV VALIDATION FAILED] The following ${missingOrEmpty.length} required variable(s) are missing, empty, or unconfigured placeholders in ${path.basename(resolvedTarget)}:`);
    for (const name of missingOrEmpty) {
      console.error(`   - ${name}`);
    }
    console.error('\nPlease populate these variables before starting the service.\n');
    process.exit(1);
  }

  console.log(`✓ [ENV VALIDATION PASSED] All required environment variables in ${path.basename(resolvedTarget)} are populated.`);
  process.exit(0);
}

main();
