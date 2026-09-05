import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Tests unitaires des fonctions pures du cabinet.
//
// Ce projet n'en avait aucun : la seule validation était la compilation, puis
// une vérification manuelle en production, écran par écran. C'est ainsi qu'un
// prix du catalogue a pu contredire sa propre cotation pendant des mois, et
// qu'un rappel d'allergie a pu être calculé sans jamais être affiché.
//
// On ne teste ici que ce qui ne touche ni la base ni le réseau : le calcul des
// prix, le rapprochement d'allergie, les validations de saisie et le découpage
// des SMS. C'est peu, mais c'est exactement ce qui doit rester vrai sans qu'on
// ait à rouvrir l'application pour s'en assurer.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // `server-only` n'a pas d'entrée exécutable en environnement Node : il
      // sert uniquement de garde à la compilation Next. On le neutralise.
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
