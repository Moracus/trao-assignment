import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKit } from '../modules/pipeline/buildkits.js';

test('buildKit still returns a valid partial kit when company retrieval fails', async () => {
  const result = await buildKit({
    companyUrl: 'http://127.0.0.1:1',
    jobDescription: 'Senior backend engineer\n\nWe build APIs and scale systems. Must know Node.js and PostgreSQL. Bonus: mentoring.',
    daysAvailable: 5,
  });

  assert.equal(typeof result.source.company_url, 'string');
  assert.equal(typeof result.company_brief.summary, 'string');
  assert.equal(typeof result.company_brief.what_they_do, 'string');
  assert.ok(Array.isArray(result.role.requirements));
  assert.ok(Array.isArray(result.questions));
  assert.ok(Array.isArray(result.flashcards));
  assert.ok(Array.isArray(result.schedule.days));
  assert.equal(result.schedule.days_available, 5);
});
