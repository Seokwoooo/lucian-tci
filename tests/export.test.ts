import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildSummaryText, downloadPdf, downloadPng, renderShareImage, type ExportSelection } from '../src/lib/export';
import { domains, subscales } from '../src/data/scales';
import type { Insight, ScoreResult } from '../src/types';

const result: ScoreResult = {
  answered: 289,
  domains: [
    { code: 'NS', mean: 4.25, subscales: ['NS1', 'NS2', 'NS3', 'NS4'] },
    { code: 'HA', mean: 1.75, subscales: ['HA1'] },
    { code: 'ST', mean: 4.9, subscales: ['ST4', 'ST5'] },
  ],
  subscales: [
    { code: 'NS1', domain: 'NS', count: 10, sum: 40, mean: 4 },
    { code: 'NS2', domain: 'NS', count: 10, sum: 11, mean: 1.1 },
    { code: 'NS3', domain: 'NS', count: 10, sum: 31, mean: 3.1 },
    { code: 'NS4', domain: 'NS', count: 10, sum: 45, mean: 4.5 },
    { code: 'HA1', domain: 'HA', count: 10, sum: 10, mean: 1 },
    { code: 'ST4', domain: 'ST', count: 9, sum: 45, mean: 5 },
    { code: 'ST5', domain: 'ST', count: 8, sum: 40, mean: 5 },
  ],
};
const insights: Insight[] = [
  { code: 'NS1', title: '새로움 단서', text: 'NS1 선택된 단서', mean: 4, direction: 'high' },
  { code: 'NS2', title: '신중함 단서', text: 'NS2 가장 뚜렷한 단서', mean: 1.1, direction: 'low' },
  { code: 'NS3', title: '중간 응답 단서', text: 'NS3 문항별 응답이 다를 수 있습니다.', mean: 3.1, direction: 'middle' },
  { code: 'NS4', title: '정돈 단서', text: 'NS4 두 번째 단서', mean: 4.5, direction: 'high' },
  { code: 'HA1', title: '선택하지 않은 걱정', text: 'HA_PRIVATE_INSIGHT', mean: 1, direction: 'low' },
  { code: 'ST4', title: '선택하지 않은 정치', text: 'POLITICAL_PRIVATE_INSIGHT', mean: 5, direction: 'high' },
  { code: 'ST5', title: '선택하지 않은 성 고정관념', text: 'GENDER_PRIVATE_INSIGHT', mean: 5, direction: 'high' },
  { code: 'unknown', title: '알 수 없는 단서', text: 'UNKNOWN_PRIVATE_INSIGHT', mean: 5, direction: 'high' },
];
const selected: ExportSelection = { includeSummary: true, domains: ['NS'], includeSubscales: false };

function canvasRecorder() {
  const painted: Array<{ text: string; x: number; y: number; size: number }> = [];
  const ctx = {
    font: '', fillStyle: '', textBaseline: 'top', textAlign: 'left',
    measureText(text: string) { return { width: Array.from(text).length * (parseFloat(this.font.split(' ')[1]) || 28) * 0.9 }; },
    fillText(text: string, x: number, y: number) { painted.push({ text, x, y, size: parseFloat(this.font.split(' ')[1]) || 28 }); },
    fillRect() {}, beginPath() {}, ellipse() {}, fill() {}, roundRect() {}, arc() {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  vi.stubGlobal('document', {
    fonts: { load: () => Promise.resolve([{}]) },
    createElement: () => canvas,
  });
  return { painted, canvas };
}

afterEach(() => vi.unstubAllGlobals());

describe('explicitly selected local export payload', () => {
  it('includes only the selected domain score and its three most salient insights', () => {
    const text = buildSummaryText(result, insights, selected);
    expect(text).toContain('NS');
    expect(text).toContain('4.25');
    expect(text).toContain('NS2 가장 뚜렷한 단서');
    expect(text).toContain('NS4 두 번째 단서');
    expect(text).toContain('NS1 선택된 단서');
    expect(text.indexOf('NS2 가장 뚜렷한 단서')).toBeLessThan(text.indexOf('NS4 두 번째 단서'));
    expect(text).not.toContain('NS3 문항별');
    for (const secret of ['HA_PRIVATE', 'POLITICAL_PRIVATE', 'GENDER_PRIVATE', 'UNKNOWN_PRIVATE', '1.75', '4.90', '289']) {
      expect(text).not.toContain(secret);
    }
  });

  it('excludes every insight when summary consent is off', () => {
    const text = buildSummaryText(result, insights, { ...selected, includeSummary: false });
    expect(text).toContain('4.25');
    for (const insight of insights) expect(text).not.toContain(insight.text);
  });

  it('allows honest middle responses in the selected summary', () => {
    const text = buildSummaryText(result, [insights[2]], selected);
    expect(text).toContain('NS3 문항별 응답이 다를 수 있습니다.');
    expect(text).not.toMatch(/균형|정상 범위|평균적인 사람/);
  });

  it('requires explicit ST selection before including a political interpretation', () => {
    const text = buildSummaryText(result, insights, { ...selected, domains: ['ST'] });
    expect(text).toContain('POLITICAL_PRIVATE_INSIGHT');
    expect(text).toContain('GENDER_PRIVATE_INSIGHT');
    expect(text).not.toContain('NS2 가장');
    expect(text).not.toContain('4.25');
  });

  it('keeps detailed subscale scores out of text even when PDF detail is requested', () => {
    const text = buildSummaryText(result, [], { ...selected, includeSubscales: true });
    expect(text).not.toMatch(/NS1|NS2|ST4|ST5|합계|문항 수/);
    expect(text).toContain('1–5');
    expect(text).toContain('비공식');
    expect(text).toContain('백분위가 아닙니다');
    expect(text).toContain('https://lucianlabs.dev/tci/');
  });

  it('refuses an empty selection for every export path', async () => {
    const empty: ExportSelection = { includeSummary: true, domains: [], includeSubscales: true };
    expect(() => buildSummaryText(result, insights, empty)).toThrow(/영역/);
    await expect(renderShareImage(result, insights, empty)).rejects.toThrow(/영역/);
    await expect(downloadPng(result, insights, empty)).rejects.toThrow(/영역/);
    await expect(downloadPdf(result, insights, empty)).rejects.toThrow(/영역/);
  });

  it('deduplicates selected domains without changing caller data', () => {
    const before = JSON.stringify({ result, insights, selected });
    const text = buildSummaryText(result, insights, { ...selected, domains: ['NS', 'NS'] });
    expect(text.match(/4\.25/g)).toHaveLength(1);
    expect(JSON.stringify({ result, insights, selected })).toBe(before);
  });

  it('removes query and fragment data from the ordinary site link', () => {
    const text = buildSummaryText(result, [], selected, 'https://example.com/tci/?score=PRIVATE#answers=SECRET');
    expect(text).toContain('https://example.com/tci/');
    expect(text).not.toMatch(/PRIVATE|SECRET|\?score|#answers/);
    expect(() => buildSummaryText(result, [], selected, 'javascript:alert(1)')).toThrow(/주소/);
  });

  it('refuses absent, invalid, or unknown selected scores', () => {
    expect(() => buildSummaryText(result, [], { ...selected, domains: ['C'] })).toThrow(/점수/);
    expect(() => buildSummaryText(result, [], { ...selected, domains: ['unknown'] as never })).toThrow(/영역/);
    expect(() => buildSummaryText({ ...result, domains: [{ code: 'NS', mean: NaN, subscales: [] }] }, [], selected)).toThrow(/점수/);
  });

  it('reports font loading failure before producing a canvas with missing Korean glyphs', async () => {
    vi.stubGlobal('document', { fonts: { load: () => Promise.reject(new Error('font unavailable')) } });
    await expect(renderShareImage(result, insights, selected)).rejects.toThrow(/글꼴/);
  });

  it('refuses a browser without the declared local font faces', async () => {
    vi.stubGlobal('document', { fonts: { load: () => Promise.resolve([]) } });
    await expect(renderShareImage(result, insights, selected)).rejects.toThrow(/글꼴/);
  });

  it('loads both actual font weights with the selected Korean text before canvas creation', async () => {
    const requests: Array<{ font: string; text: string }> = [];
    vi.stubGlobal('document', {
      fonts: { load: (font: string, text: string) => {
        requests.push({ font, text });
        return Promise.resolve([{}]);
      } },
      createElement: () => ({ getContext: () => null }),
    });
    await expect(renderShareImage(result, insights, selected)).rejects.toThrow(/이미지 내보내기/);
    expect(requests.map(request => request.font)).toEqual(['400 28px "Noto Sans KR"', '600 28px "Noto Sans KR"']);
    for (const request of requests) {
      expect(request.text).toContain('NS2 가장 뚜렷한 단서');
      expect(request.text).not.toContain('POLITICAL_PRIVATE_INSIGHT');
    }
  });

  it('validates only selected subscale details when PDF detail consent is enabled', async () => {
    vi.stubGlobal('document', { fonts: { load: () => Promise.reject(new Error('font unavailable')) } });
    // The fixture deliberately omits most of the other 26 subscales.
    await expect(downloadPdf(result, insights, { ...selected, includeSubscales: true })).rejects.toThrow(/글꼴/);
    const missing = { ...result, subscales: result.subscales.filter(score => score.code !== 'NS2') };
    await expect(downloadPdf(missing, insights, { ...selected, includeSubscales: true })).rejects.toThrow(/NS2.*점수/);
    // Missing detailed data must not block exports when it was not requested.
    await expect(downloadPdf(missing, insights, selected)).rejects.toThrow(/글꼴/);
  });
});

describe('compact sharing canvas', () => {
  it('keeps all seven selected domain averages within a fixed 4:5 card', async () => {
    const { painted } = canvasRecorder();
    const complete: ScoreResult = {
      answered: 289,
      domains: domains.map(domain => ({ code: domain.code, mean: 3, subscales: [] })),
      subscales: [],
    };
    const canvas = await renderShareImage(complete, [], { ...selected, domains: domains.map(domain => domain.code) });
    expect([canvas.width, canvas.height]).toEqual([1080, 1350]);
    const text = painted.map(line => line.text).join('');
    expect(text).toContain('내 마음의 결');
    for (const name of ['자극추구', '위험회피', '사회적 민감성', '인내력', '자율성', '연대감', '자기초월']) expect(text).toContain(name);
    expect(painted.filter(line => line.text === '3.00')).toHaveLength(7);
    expect(painted.every(line => line.y >= 0 && line.y + line.size < 1350)).toBe(true);
  });

  it('shows only one salient selected subscale using its actual response direction and evidence', async () => {
    const { painted } = canvasRecorder();
    await renderShareImage(result, insights, selected);
    const text = painted.map(line => line.text).join('');
    expect(text).toContain('NS2 · 평균 1.10 / 5');
    expect(text.replace(/\s/g, '')).toContain('행동 전에 생각하고 가능성과 세부사항을 검토하는 쪽에 가까운 응답입니다.'.replace(/\s/g, ''));
    expect(text).not.toMatch(/NS1 · 평균|NS4 · 평균|ST4|ST5|HA_PRIVATE|POLITICAL_PRIVATE|GENDER_PRIVATE/);
  });

  it('keeps every metadata caution and honest middle description inside the seven-domain card', async () => {
    const complete: ScoreResult = {
      answered: 289,
      domains: domains.map(domain => ({ code: domain.code, mean: 3, subscales: [] })),
      subscales: [],
    };
    for (const scale of subscales) {
      const { painted } = canvasRecorder();
      await renderShareImage(complete, [{ code: scale.code, title: scale.name, text: '', mean: 3, direction: 'middle' }], { ...selected, domains: domains.map(domain => domain.code) });
      const text = painted.map(line => line.text).join('');
      expect(text, scale.code).toContain(`${scale.code} · 평균 3.00 / 5`);
      expect(text.replace(/\s/g, ''), scale.code).toContain('개별문항의응답은다를수있습니다.');
      if (scale.caution) expect(text.replace(/\s/g, ''), scale.code).toContain(scale.caution.replace(/\s/g, ''));
      expect(painted.every(line => line.y >= 0 && line.y + line.size < 1350), scale.code).toBe(true);
    }
  });

  it('omits the interpretation when summary consent is off while keeping disclosure and site', async () => {
    const { painted } = canvasRecorder();
    await renderShareImage(result, insights, { ...selected, includeSummary: false });
    const text = painted.map(line => line.text).join('');
    expect(text).not.toMatch(/NS[1-4] · 평균|숙고 없는 행동|POLITICAL_PRIVATE/);
    expect(text).toContain('비공식');
    expect(text).toContain('규준');
    expect(text).toContain('https://lucianlabs.dev/tci/');
  });
});
