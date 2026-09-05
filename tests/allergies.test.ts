import { describe, it, expect } from 'vitest';
import { rappelsAllergie } from '@/lib/allergies';

// Le rappel affiché à la prescription. Il a existé pendant un temps sans être
// affiché nulle part — calculé, puis jeté. Ces tests fixent ce qu'il doit
// signaler, et surtout ce qu'il ne doit PAS signaler.

describe('rappelsAllergie', () => {
  it('rapproche une pénicilline notée d’une amoxicilline prescrite', () => {
    const r = rappelsAllergie('PÉNICILLINE', [{ name: 'Amoxicilline' }]);
    expect(r).toHaveLength(1);
    expect(r[0].famille).toBe('pénicillines');
    expect(r[0].medicament).toBe('Amoxicilline');
    expect(r[0].allergieNotee).toBe('PÉNICILLINE');
  });

  it('ignore les accents et la casse du champ saisi à la main', () => {
    expect(rappelsAllergie('penicilline', [{ name: 'AUGMENTIN' }])).toHaveLength(1);
    expect(rappelsAllergie('Bêta-lactamine', [{ name: 'Clamoxyl 1g' }])).toHaveLength(1);
  });

  it('ne signale rien quand le médicament est d’une autre famille', () => {
    expect(rappelsAllergie('PÉNICILLINE', [{ name: 'Paracétamol' }])).toEqual([]);
  });

  it('ne signale rien quand l’allergie notée sort des familles couvertes', () => {
    // Le module ne couvre que quelques familles courantes, et l'écran le dit :
    // son silence ne vaut pas autorisation.
    expect(rappelsAllergie('Latex', [{ name: 'Amoxicilline' }])).toEqual([]);
  });

  it('ne signale rien quand le dossier ne note aucune allergie', () => {
    expect(rappelsAllergie('', [{ name: 'Amoxicilline' }])).toEqual([]);
    expect(rappelsAllergie(null, [{ name: 'Amoxicilline' }])).toEqual([]);
    expect(rappelsAllergie(undefined, [{ name: 'Ibuprofène' }])).toEqual([]);
  });

  it('couvre les autres familles déclarées', () => {
    expect(rappelsAllergie('AINS', [{ name: 'Ibuprofène 400mg' }])[0].famille).toBe(
      'anti-inflammatoires non stéroïdiens'
    );
    expect(rappelsAllergie('Macrolide', [{ name: 'Azithromycine' }])[0].famille).toBe('macrolides');
    expect(rappelsAllergie('Sulfamides', [{ name: 'Bactrim' }])[0].famille).toBe('sulfamides');
    expect(rappelsAllergie('Iode', [{ name: 'Bétadine' }])[0].famille).toBe('dérivés iodés');
    expect(rappelsAllergie('Xylocaïne', [{ name: 'Septanest' }])[0].famille).toBe(
      'anesthésiques locaux'
    );
  });

  it('signale chaque médicament concerné d’une ordonnance, une seule fois', () => {
    const r = rappelsAllergie('pénicilline', [
      { name: 'Amoxicilline' },
      { name: 'Paracétamol' },
      { name: 'Augmentin' },
    ]);
    expect(r.map((x) => x.medicament)).toEqual(['Amoxicilline', 'Augmentin']);
  });

  it('ignore une ligne de médicament vide', () => {
    expect(rappelsAllergie('pénicilline', [{ name: '' }])).toEqual([]);
  });
});
