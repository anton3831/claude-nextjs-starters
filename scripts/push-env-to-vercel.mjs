/**
 * Vercel 환경 변수 등록 스크립트
 * 사용법: node scripts/push-env-to-vercel.mjs
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');

// .env.local 파싱
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  envVars[key] = value;
}

const targets = ['NOTION_API_KEY', 'NOTION_INVOICE_DB_ID', 'NOTION_ITEM_DB_ID', 'ADMIN_SECRET'];

for (const key of targets) {
  const value = envVars[key];
  if (!value) {
    console.log(`⚠️  ${key} — .env.local에 없음, 건너뜀`);
    continue;
  }

  for (const env of ['production', 'preview']) {
    try {
      // 이미 존재하면 rm 후 재등록
      try {
        execSync(`vercel env rm ${key} ${env} --yes`, { stdio: 'pipe' });
      } catch {}
      execSync(`vercel env add ${key} ${env} --yes`, {
        input: value,
        stdio: ['pipe', 'inherit', 'inherit'],
      });
      console.log(`✅ ${key} → ${env}`);
    } catch (err) {
      console.error(`❌ ${key} → ${env} 실패:`, err.message);
    }
  }
}

console.log('\n완료! Vercel 대시보드에서 확인하세요.');
