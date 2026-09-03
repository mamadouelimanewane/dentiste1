import 'server-only';

// Reformulation d'un plan de traitement en langage courant, français et wolof.
//
// Ce que ce module fait : prendre les actes et les montants **déjà décidés par
// le praticien et déjà enregistrés en base**, et les réécrire dans des mots
// que le patient comprend.
//
// Ce qu'il ne fait pas, et ne doit jamais faire : produire un diagnostic,
// proposer un soin, ou produire le moindre chiffre. Les montants sont calculés
// par l'application et insérés tels quels ; le modèle ne fait que rédiger
// autour. C'est la différence entre un outil de communication et un dispositif
// médical — le premier est utile, le second exige une certification que ce
// logiciel n'a pas.

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODELE = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

export function isExplicationConfigured() {
  return !!API_KEY;
}

export interface ActePlan {
  label: string;
  dent?: number | null;
  prix: number;
  quantite?: number;
}

export interface ResultatExplication {
  texteFr?: string;
  texteWo?: string;
  modele?: string;
  error?: string;
}

const fcfa = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} F CFA`;

const SYSTEME = `Tu rédiges, pour un cabinet dentaire au Sénégal, l'explication d'un plan de soins destinée au patient.

RÈGLES ABSOLUES
- Tu n'inventes AUCUN chiffre. Les montants te sont fournis : recopie-les exactement, sans les recalculer ni les arrondir.
- Tu n'ajoutes AUCUN soin qui ne figure pas dans la liste fournie.
- Tu ne poses AUCUN diagnostic et ne donnes AUCUN avis médical. Le praticien a déjà décidé ; tu expliques sa décision.
- Tu ne promets aucun résultat et n'évoques aucun délai de guérison.
- Si une information manque, tu ne la combles pas : tu n'en parles pas.

STYLE
- Tu t'adresses au patient en le vouvoyant, avec des mots simples, sans jargon.
- Tu traduis la position des dents en repères compréhensibles : « une molaire en haut à droite », « une dent de devant en bas ». Ne cite jamais les numéros FDI.
- Explique en une phrase courte pourquoi chaque soin est proposé, en termes concrets (« la dent est trop abîmée pour un simple plombage »).
- Ton neutre et rassurant, sans dramatiser ni minimiser. Pas de superlatifs commerciaux.
- Français : 150 mots maximum. Wolof : même contenu, en wolof tel qu'il se parle à Dakar (les termes techniques et les chiffres peuvent rester en français, comme dans l'usage courant).

SORTIE
Réponds uniquement par un objet JSON valide, sans texte autour :
{"fr": "...", "wo": "..."}`;

export async function genererExplication(params: {
  patientNom: string;
  actes: ActePlan[];
  total: number;
  partMutuelle?: number | null;
  nomMutuelle?: string | null;
}): Promise<ResultatExplication> {
  if (!API_KEY) {
    return { error: "L'assistant de rédaction n'est pas configuré (clé API absente)." };
  }
  if (!params.actes.length) {
    return { error: 'Aucun acte à expliquer.' };
  }

  // Les montants sont mis en forme ici, par l'application. Le modèle reçoit du
  // texte déjà calculé : il n'a aucune arithmétique à faire, donc aucune
  // occasion de se tromper.
  const lignes = params.actes
    .map((a) => {
      const q = a.quantite && a.quantite > 1 ? ` (x${a.quantite})` : '';
      const dent = a.dent ? ` — dent ${a.dent}` : '';
      return `- ${a.label}${dent}${q} : ${fcfa(a.prix * (a.quantite || 1))}`;
    })
    .join('\n');

  const reste =
    params.partMutuelle && params.partMutuelle > 0
      ? `\nPris en charge par ${params.nomMutuelle || 'la mutuelle'} : ${fcfa(params.partMutuelle)}` +
        `\nReste à la charge du patient : ${fcfa(params.total - params.partMutuelle)}`
      : '';

  const message = `Patient : ${params.patientNom}

Soins décidés par le praticien :
${lignes}

Total : ${fcfa(params.total)}${reste}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELE,
        max_tokens: 1200,
        system: SYSTEME,
        messages: [
          { role: 'user', content: message },
          // Amorce la réponse pour garantir un JSON exploitable.
          { role: 'assistant', content: '{' },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data?.error?.message || "L'assistant de rédaction n'a pas répondu." };
    }

    const brut = '{' + (data?.content?.[0]?.text || '');
    let parsed: { fr?: string; wo?: string };
    try {
      parsed = JSON.parse(brut);
    } catch {
      return { error: 'Réponse illisible de l\'assistant. Réessayez.' };
    }

    if (!parsed.fr?.trim()) {
      return { error: 'Aucun texte produit.' };
    }

    return { texteFr: parsed.fr.trim(), texteWo: parsed.wo?.trim(), modele: MODELE };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur réseau (assistant de rédaction)." };
  }
}
