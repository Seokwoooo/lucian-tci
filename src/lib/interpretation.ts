import { subscales } from '../data/scales';
import type { Insight, ScoreResult } from '../types';

/** Operational response-scale cutoffs, not population norms or clinical thresholds. */
export function interpretResults(result: ScoreResult): Insight[] {
  const byCode = new Map(result.subscales.map(scale => [scale.code, scale]));
  if (byCode.size !== subscales.length || result.subscales.length !== subscales.length) {
    throw new Error('30개 하위척도 점수가 모두 있어야 해석할 수 있습니다.');
  }
  return subscales.map(scale => {
    const score = byCode.get(scale.code);
    if (!score || score.domain !== scale.domain || !Number.isFinite(score.mean) || score.mean < 1 || score.mean > 5) {
      throw new Error(`해석할 하위척도 점수가 올바르지 않습니다: ${scale.code}`);
    }
    const direction = score.mean <= 2.5 ? 'low' : score.mean >= 3.5 ? 'high' : 'middle';
    const description = direction === 'middle'
      ? '응답 평균이 기술적 중간 구간에 있습니다. 중간 선택 또는 서로 다른 방향의 응답이 섞여 같은 평균이 나올 수 있으며, 개별 문항의 응답은 다를 수 있습니다.'
      : scale[direction];
    return {
      code: scale.code,
      title: scale.name,
      mean: score.mean,
      direction,
      text: `${scale.code} ${scale.name}: 이번 응답의 역채점 반영 평균은 ${score.mean.toFixed(2)}/5입니다. ${description}${scale.caution ? ` ${scale.caution}` : ''} 이 설명은 이번 응답에 한정되며 사람 간 순위를 뜻하지 않습니다.`,
    };
  });
}
