'use client';

import { useState } from 'react';

type Props = {
  challengeType?: 'RANKING' | 'COMPLETION';
  completionMode?: 'CORRECT' | 'EXACT' | null;
  completionTarget?: number | null;
};

export function ChallengeTypeFields({ challengeType = 'RANKING', completionMode = 'CORRECT', completionTarget = null }: Props) {
  const [type, setType] = useState<'RANKING' | 'COMPLETION'>(challengeType);

  return (
    <>
      <select
        name="challengeType"
        className="rounded border p-2"
        defaultValue={challengeType}
        onChange={(event) => setType(event.target.value as 'RANKING' | 'COMPLETION')}
      >
        <option value={'RANKING'}>Ranking</option>
        <option value={'COMPLETION'}>Completion</option>
      </select>

      {type === 'COMPLETION' && (
        <>
          <select name="completionMode" className="rounded border p-2" defaultValue={completionMode ?? 'CORRECT'}>
            <option value={'CORRECT'}>Completion sur bon résultat</option>
            <option value={'EXACT'}>Completion sur score exact</option>
          </select>
          <input name="completionTarget" defaultValue={completionTarget ?? ''} type="number" min={1} className="rounded border p-2" placeholder="Objectif (X matchs)" />
        </>
      )}
    </>
  );
}
