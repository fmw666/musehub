#!/usr/bin/env node
// evolver-session-end.js
// Records evolution outcome at session end.
// Collects git diff stats, extracts signals, records via Hub API or local memory.
// Input: stdin JSON. Output: stdout JSON with followup_message.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
// 10 MB — prevents RangeError on large child process output (e.g. git log/diff
// on large repos). See GHSA reports / issue #451.
const MAX_EXEC_BUFFER = 10 * 1024 * 1024;

function loadUserEnvironmentDefaults() {
  const keys = [
    'EVOMAP_NODE_ID',
    'A2A_NODE_ID',
    'EVOMAP_NODE_SECRET',
    'A2A_NODE_SECRET',
    'A2A_HUB_URL',
    'EVOMAP_HUB_URL',
    'MEMORY_GRAPH_PATH',
    'EVOLVER_PACKAGE_ROOT',
    'EVOLVER_FULL_AUTO_ASSET_PUBLISH',
    'SKILL2GEP_AUTO_PUBLISH',
    'EVOLVER_AUTO_PUBLISH',
    'EVOLVER_DEFAULT_VISIBILITY',
    'EVOLVER_ATP_AUTOBUY',
    'ATP_AUTOBUY_DAILY_CAP_CREDITS',
    'ATP_AUTOBUY_PER_ORDER_CAP_CREDITS',
    'EVOLVER_VALIDATOR_ENABLED',
    'WORKER_MAX_LOAD',
  ];

  if (process.platform === 'win32') {
    try {
      const script = [
        '$keys = @(' + keys.map((key) => "'" + key + "'").join(',') + ');',
        '$out = @{};',
        'foreach ($key in $keys) {',
        '  $value = [Environment]::GetEnvironmentVariable($key, "User");',
        '  if ($value) { $out[$key] = $value }',
        '}',
        '$out | ConvertTo-Json -Compress',
      ].join(' ');
      const result = spawnSync('powershell', ['-NoProfile', '-Command', script], {
        encoding: 'utf8',
        timeout: 5000,
        shell: false,
      });
      if (result.status === 0 && result.stdout.trim()) {
        const values = JSON.parse(result.stdout);
        Object.entries(values).forEach(([key, value]) => {
          if (!process.env[key] && value) process.env[key] = String(value);
        });
      }
    } catch { /* best-effort */ }
  }

  process.env.A2A_NODE_ID = process.env.A2A_NODE_ID || process.env.EVOMAP_NODE_ID || '';
  process.env.EVOMAP_NODE_ID = process.env.EVOMAP_NODE_ID || process.env.A2A_NODE_ID || '';
  process.env.A2A_NODE_SECRET = process.env.A2A_NODE_SECRET || process.env.EVOMAP_NODE_SECRET || '';
  process.env.EVOMAP_NODE_SECRET = process.env.EVOMAP_NODE_SECRET || process.env.A2A_NODE_SECRET || '';
  process.env.A2A_HUB_URL = process.env.A2A_HUB_URL || process.env.EVOMAP_HUB_URL || 'https://evomap.ai';
  process.env.EVOMAP_HUB_URL = process.env.EVOMAP_HUB_URL || process.env.A2A_HUB_URL || 'https://evomap.ai';
  process.env.EVOLVER_FULL_AUTO_ASSET_PUBLISH = process.env.EVOLVER_FULL_AUTO_ASSET_PUBLISH || '1';
  process.env.SKILL2GEP_AUTO_PUBLISH = process.env.SKILL2GEP_AUTO_PUBLISH || 'true';
  process.env.EVOLVER_AUTO_PUBLISH = process.env.EVOLVER_AUTO_PUBLISH || 'true';
  process.env.EVOLVER_DEFAULT_VISIBILITY = process.env.EVOLVER_DEFAULT_VISIBILITY || 'private';
  process.env.EVOLVER_ATP_AUTOBUY = process.env.EVOLVER_ATP_AUTOBUY || 'off';
  process.env.ATP_AUTOBUY_DAILY_CAP_CREDITS = process.env.ATP_AUTOBUY_DAILY_CAP_CREDITS || '0';
  process.env.ATP_AUTOBUY_PER_ORDER_CAP_CREDITS = process.env.ATP_AUTOBUY_PER_ORDER_CAP_CREDITS || '0';
  process.env.EVOLVER_VALIDATOR_ENABLED = process.env.EVOLVER_VALIDATOR_ENABLED || '0';
  process.env.WORKER_MAX_LOAD = process.env.WORKER_MAX_LOAD || '1';

  if (!process.env.MEMORY_GRAPH_PATH) {
    const memoryPath = path.join(require('os').homedir(), '.evomap', 'memory', 'evolution', 'memory_graph.jsonl');
    try {
      fs.mkdirSync(path.dirname(memoryPath), { recursive: true });
      if (!fs.existsSync(memoryPath)) fs.writeFileSync(memoryPath, '', 'utf8');
      process.env.MEMORY_GRAPH_PATH = memoryPath;
    } catch { /* best-effort */ }
  }
}


function findEvolverRoot() {
  const candidates = [
    process.env.EVOLVER_ROOT,
    path.resolve(__dirname, '..', '..', '..'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(path.join(c, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(c, 'package.json'), 'utf8'));
        if (pkg.name === '@evomap/evolver' || pkg.name === 'evolver') return c;
      } catch { /* skip */ }
    }
  }
  const homeSkills = path.join(require('os').homedir(), 'skills', 'evolver');
  if (fs.existsSync(path.join(homeSkills, 'package.json'))) return homeSkills;
  return null;
}

function findMemoryGraph(evolverRoot) {
  if (process.env.MEMORY_GRAPH_PATH && fs.existsSync(process.env.MEMORY_GRAPH_PATH)) {
    return process.env.MEMORY_GRAPH_PATH;
  }
  const candidates = [
    evolverRoot && path.join(evolverRoot, 'memory', 'evolution', 'memory_graph.jsonl'),
    evolverRoot && path.join(evolverRoot, 'MEMORY', 'evolution', 'memory_graph.jsonl'),
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  if (evolverRoot) {
    const defaultPath = path.join(evolverRoot, 'memory', 'evolution', 'memory_graph.jsonl');
    fs.mkdirSync(path.dirname(defaultPath), { recursive: true });
    return defaultPath;
  }
  return null;
}

function findEvolverPackageRoot() {
  if (process.env.EVOLVER_PACKAGE_ROOT && fs.existsSync(process.env.EVOLVER_PACKAGE_ROOT)) {
    return process.env.EVOLVER_PACKAGE_ROOT;
  }
  try {
    const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const npmRoot = spawnSync(npmBin, ['root', '-g'], {
      encoding: 'utf8',
      timeout: 5000,
      shell: false,
    });
    const root = String(npmRoot.stdout || '').trim();
    const candidate = path.join(root, '@evomap', 'evolver');
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
  } catch { /* ignore */ }
  return null;
}

function findAutoPublishSkillPath() {
  const candidates = [
    process.env.EVOLVER_AUTO_SKILL_PATH,
    path.resolve(process.cwd(), '.cursor', 'skills', 'musehub-evolver-auto-publish'),
    path.resolve(process.cwd(), '.cursor', 'skills', 'musehub-agent-workflow'),
    path.join(require('os').homedir(), '.agents', 'skills', 'evomap-agent-economy'),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(path.join(candidate, 'SKILL.md'))) return candidate;
  }
  return null;
}

function getGitDiffStats() {
  try {
    const cwd = process.cwd();
    const runGit = (args) => {
      const result = spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        timeout: 5000,
        maxBuffer: MAX_EXEC_BUFFER,
        shell: false,
      });
      if (result.status !== 0 || result.error) return '';
      return String(result.stdout || '').trim();
    };
    const status = runGit(['status', '--short']);
    const trackedStat = runGit(['diff', '--stat', 'HEAD']) || runGit(['diff', '--cached', '--stat']) || runGit(['diff', '--stat']);
    const untracked = status.split(/\r?\n/).filter((line) => line.startsWith('?? '));
    const stat = trackedStat || (untracked.length > 0 ? `${untracked.length} files changed` : '');
    const diffContent = runGit(['diff', 'HEAD', '--no-color'])
      || runGit(['diff', '--cached', '--no-color'])
      || runGit(['diff', '--no-color'])
      || status;
    const filesChanged = (stat.match(/\d+ files? changed/) || [`${untracked.length} files changed`])[0];
    const insertions = (stat.match(/(\d+) insertions?/) || [null, '0'])[1];
    const deletions = (stat.match(/(\d+) deletions?/) || [null, '0'])[1];
    const fileCount = Number((filesChanged.match(/\d+/) || ['0'])[0]);
    const lineCount = Number(insertions || 0) + Number(deletions || 0);
    return {
      stat,
      summary: `${filesChanged}, +${insertions}/-${deletions}`,
      diffSnippet: diffContent.slice(0, 2000),
      hasChanges: stat.length > 0,
      fileCount,
      lineCount,
    };
  } catch {
    return { stat: '', summary: 'unknown', diffSnippet: '', hasChanges: false, fileCount: 0, lineCount: 0 };
  }
}

function detectSignals(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const signals = [];
  if (/error:|exception:|failed/i.test(lower)) signals.push('log_error');
  if (/timeout|slow|latency|bottleneck/i.test(lower)) signals.push('perf_bottleneck');
  if (/add|implement|feature|new function|new module/i.test(lower)) signals.push('user_feature_request');
  if (/improve|enhance|refactor|optimize/i.test(lower)) signals.push('user_improvement_suggestion');
  if (/not supported|unsupported|not implemented/i.test(lower)) signals.push('capability_gap');
  if (/deploy|ci|pipeline|build failed/i.test(lower)) signals.push('deployment_issue');
  if (/test fail|assertion|expect\(/i.test(lower)) signals.push('test_failure');
  return [...new Set(signals)];
}

function recordToHub(outcome) {
  const hubUrl = process.env.EVOMAP_HUB_URL || process.env.A2A_HUB_URL;
  const apiKey = process.env.EVOMAP_API_KEY || process.env.A2A_NODE_SECRET;
  const nodeId = process.env.EVOMAP_NODE_ID || process.env.A2A_NODE_ID;
  if (!hubUrl || !apiKey) return false;

  try {
    const payload = JSON.stringify({
      gene_id: outcome.geneId || 'ad_hoc',
      signals: outcome.signals,
      status: outcome.status,
      score: outcome.score,
      summary: outcome.summary,
      sender_id: nodeId || undefined,
    });
    // Argv-array form avoids shell interpretation of apiKey, payload, or the
    // hub URL. Values cannot break out through shell metacharacters.
    const res = spawnSync('curl', [
      '-s', '-m', '8', '-X', 'POST',
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${apiKey}`,
      '-d', payload,
      `${hubUrl.replace(/\/+$/, '')}/a2a/evolution/record`,
    ], {
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: MAX_EXEC_BUFFER,
      shell: false,
    });
    if (res.status !== 0 || res.error) return false;
    return true;
  } catch {
    return false;
  }
}

function recordToLocal(graphPath, outcome) {
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      gene_id: outcome.geneId || 'ad_hoc',
      signals: outcome.signals,
      outcome: {
        status: outcome.status,
        score: outcome.score,
        note: outcome.summary,
      },
      source: 'hook:session-end',
    };
    fs.appendFileSync(graphPath, JSON.stringify(entry) + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

async function autoPublishEvolutionAsset(outcome, diffInfo) {
  if (String(process.env.EVOLVER_FULL_AUTO_ASSET_PUBLISH || '').toLowerCase() !== '1'
    && String(process.env.EVOLVER_FULL_AUTO_ASSET_PUBLISH || '').toLowerCase() !== 'true') {
    return { requested: false, reason: 'disabled' };
  }

  const evolverPackageRoot = findEvolverPackageRoot();
  const skillPath = findAutoPublishSkillPath();
  if (!evolverPackageRoot || !skillPath) {
    return { requested: false, reason: 'missing_evolver_or_skill' };
  }

  const sanitize = require(path.join(evolverPackageRoot, 'src', 'gep', 'sanitize.js'));
  const publishPreview = [
    outcome.summary,
    diffInfo.stat,
    `blast_radius files=${Number(diffInfo.fileCount || 0)} lines=${Number(diffInfo.lineCount || 0)}`,
  ].join('\n');
  const leakCheck = sanitize.fullLeakCheck(publishPreview);
  if (leakCheck.found) {
    return { requested: false, reason: 'leak_check_failed', leakTypes: leakCheck.leaks.map((leak) => leak.type) };
  }

  const nodeCheck = spawnSync(process.execPath, ['--version'], {
    encoding: 'utf8',
    timeout: 5000,
    shell: false,
  });
  const skill2gep = require(path.join(evolverPackageRoot, 'src', 'gep', 'skill2gep.js'));
  process.env.SKILL2GEP_AUTO_PUBLISH = 'true';

  const result = skill2gep.runOnSkillInvocation({
    skillPath,
    skillName: path.basename(skillPath),
    platform: 'cursor',
    publish: true,
    execution: {
      status: outcome.status,
      score: outcome.score,
      started_at: new Date().toISOString(),
      trace: [{
        step: 'runtime-check',
        cmd: 'node --version',
        exit: Number.isInteger(nodeCheck.status) ? nodeCheck.status : 1,
        stdout_tail: String(nodeCheck.stdout || nodeCheck.stderr || '').trim().slice(-500),
      }],
      blast_radius: {
        files: Number(diffInfo.fileCount || 0),
        lines: Number(diffInfo.lineCount || 0),
      },
      trigger: outcome.signals,
      signals: outcome.signals,
      summary: outcome.summary,
      content_summary: `Sanitized Cursor session outcome: ${outcome.summary}`,
    },
  });

  if (!result || !result.ok) {
    return {
      requested: false,
      reason: result && result.reason ? result.reason : 'distillation_failed',
      geneId: result && result.gene ? result.gene : null,
      capsuleId: result && result.capsule ? result.capsule : null,
    };
  }

  let publish = null;
  if (result && result.publish_promise) {
    publish = await Promise.race([
      result.publish_promise,
      new Promise((resolve) => setTimeout(() => resolve({ ok: false, timeout: true }), 15000)),
    ]);
  }

  return {
    requested: true,
    ok: Boolean(result && result.ok),
    geneId: result && result.gene ? result.gene.id : null,
    capsuleId: result && result.capsule ? result.capsule.id : null,
    publishRequested: Boolean(result && result.publish_requested),
    publishOk: publish ? Boolean(publish.ok) : null,
    publishTimeout: publish ? Boolean(publish.timeout) : false,
    reason: result && result.reason ? result.reason : null,
  };
}

function main() {
  loadUserEnvironmentDefaults();

  let inputData = '';
  let handled = false;
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => { inputData += chunk; });
  process.stdin.on('end', async () => {
    if (handled) return;
    handled = true;
    try {
      const diffInfo = getGitDiffStats();

      if (!diffInfo.hasChanges) {
        process.stdout.write(JSON.stringify({}));
        return;
      }

      const signals = detectSignals(diffInfo.diffSnippet);
      if (signals.length === 0) signals.push('stable_success_plateau');

      const hasErrors = signals.includes('log_error') || signals.includes('test_failure');
      const status = hasErrors ? 'failed' : 'success';
      const score = hasErrors ? 0.3 : 0.8;

      const outcome = {
        geneId: 'ad_hoc',
        signals,
        status,
        score,
        summary: `Session end: ${diffInfo.summary}. Signals: [${signals.join(', ')}]`,
      };

      const evolverRoot = findEvolverRoot();
      const graphPath = findMemoryGraph(evolverRoot);

      const hubOk = recordToHub(outcome);
      const localOk = graphPath ? recordToLocal(graphPath, outcome) : false;
      const publishResult = await autoPublishEvolutionAsset(outcome, diffInfo);

      const target = hubOk ? 'Hub' : localOk ? 'local memory' : 'nowhere (no Hub or local path)';
      const publishMsg = publishResult.requested
        ? ` Auto asset publish requested: gene=${publishResult.geneId || 'none'}, capsule=${publishResult.capsuleId || 'none'}, publishOk=${publishResult.publishOk}.`
        : ` Auto asset publish skipped: ${publishResult.reason}.`;
      const msg = `[Evolution] Session outcome recorded to ${target}: ${outcome.summary}.${publishMsg}`;

      process.stdout.write(JSON.stringify({
        followup_message: msg,
        stopMessage: msg,
        additionalContext: msg,
      }));
    } catch (e) {
      process.stdout.write(JSON.stringify({}));
    }
  });

  setTimeout(() => {
    if (handled) return;
    handled = true;
    process.stdout.write(JSON.stringify({}));
    process.exit(0);
  }, 25000);
}

main();
