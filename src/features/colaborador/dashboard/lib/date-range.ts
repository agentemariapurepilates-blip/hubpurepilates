// Port direto de "Dashboard Ads - Unidades"/src/lib/date-range.ts.

import { format, subDays, parseISO, isAfter, differenceInDays } from 'date-fns';

export type Preset = 'ontem' | '7d' | '30d' | '90d' | '180d';

export type RangeInput =
  | { preset: Preset; today?: Date }
  | { from: string; to: string; today?: Date };

export type Range = {
  from: string;
  to: string;
  preset?: Preset;
  mode: 'absolute_day' | 'rolling' | 'custom';
};

const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

export function resolveRange(input: RangeInput): Range {
  const today = input.today ?? new Date();
  const yesterday = subDays(today, 1);

  if ('preset' in input) {
    if (input.preset === 'ontem') {
      const d = fmt(yesterday);
      return { from: d, to: d, preset: 'ontem', mode: 'absolute_day' };
    }
    const days = { '7d': 7, '30d': 30, '90d': 90, '180d': 180 }[input.preset];
    return {
      from: fmt(subDays(yesterday, days - 1)),
      to: fmt(yesterday),
      preset: input.preset,
      mode: 'rolling',
    };
  }

  let from = parseISO(input.from);
  let to = parseISO(input.to);
  if (isAfter(to, yesterday)) to = yesterday;
  if (differenceInDays(to, from) > 180) from = subDays(to, 180);
  return { from: fmt(from), to: fmt(to), mode: 'custom' };
}
