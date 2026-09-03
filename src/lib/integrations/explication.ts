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

// ─── Wolof suspendu ──────────────────────────────────────────────────────
// La traduction wolof a été retirée après essais : le modèle inversait la
// gauche et la droite d'une dent à l'autre, écrivait « setal sama bopp »
// (« nettoyer ma tête ») au lieu des dents du patient, et confondait « bëñ »
// (dent) avec « bët » (œil). Un praticien ne lisant pas le wolof ne pouvait
// pas relire ce texte : l'avertissement habituel « relisez avant d'envoyer »
// n'y suffisait pas.
//
// La colonne `texte_wo` est conservée en base pour une réactivation
// ultérieure, une fois des formulations validées par un locuteur.
//
// Deux fournisseurs possibles. Le cabinet utilise celui dont la clé est
// posée ; si les deux le sont, AI_PROVIDER tranche. Cette bascule évite de
// dépendre d'un seul prestataire — l'un peut exiger une vérification
// d'identité, tomber en panne ou changer ses tarifs.
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODELE = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODELE = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// DeepSeek expose une API compatible OpenAI : même endpoint, même corps de
// requête, même format de réponse. Seuls l'URL de base et le modèle changent.
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODELE = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

type Fournisseur = 'anthropic' | 'openai' | 'deepseek';

function fournisseurRetenu(): Fournisseur | null {
  const demande = process.env.AI_PROVIDER as Fournisseur | undefined;
  if (demande === 'deepseek' && DEEPSEEK_KEY) return 'deepseek';
  if (demande === 'openai' && OPENAI_KEY) return 'openai';
  if (demande === 'anthropic' && ANTHROPIC_KEY) return 'anthropic';
  if (ANTHROPIC_KEY) return 'anthropic';
  if (OPENAI_KEY) return 'openai';
  if (DEEPSEEK_KEY) return 'deepseek';
  return null;
}

export function isExplicationConfigured() {
  return fournisseurRetenu() !== null;
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
- Tu t'adresses au patient en le vouvoyant, avec des mots simples, sans jargon. Tu ne le nommes jamais : son nom ne t'est pas communiqué, et tu n'en inventes pas.
- Tu traduis la position des dents en repères compréhensibles : « une molaire en haut à droite », « une dent de devant en bas ». Ne cite jamais les numéros FDI.
- N'explique PAS pourquoi un soin est proposé si la raison ne t'est pas donnée : nommer une carie, une fracture ou une infection que le praticien n'a pas écrite reviendrait à poser un diagnostic. Décris seulement ce qui sera fait, en termes concrets (« la dent sera recouverte d'une couronne »).
- Ton neutre et rassurant, sans dramatiser ni minimiser. Pas de superlatifs commerciaux.
- 150 mots maximum.

SORTIE
Réponds uniquement par un objet JSON valide, sans texte autour :
{"fr": "..."}`;

export async function genererExplication(params: {
  actes: ActePlan[];
  total: number;
  partMutuelle?: number | null;
  nomMutuelle?: string | null;
}): Promise<ResultatExplication> {
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

  // Le nom du patient n'est pas transmis au fournisseur.
  //
  // Le modèle n'en a aucun besoin pour rédiger : le texte s'adresse au
  // patient en le vouvoyant, sans jamais le nommer. En le retirant, ce qui
  // sort du cabinet n'est plus qu'une liste d'actes et de montants — sans
  // identité, donc sans donnée de santé rattachable à une personne. Cela vaut
  // quel que soit le fournisseur, et d'autant plus lorsqu'il est établi hors
  // du Sénégal.
  const message = `Soins décidés par le praticien :
${lignes}

Total : ${fcfa(params.total)}${reste}`;

  const fournisseur = fournisseurRetenu();
  if (!fournisseur) {
    return { error: "L'assistant de rédaction n'est pas configuré (aucune clé API)." };
  }

  try {
    const appel: {
      url: string;
      headers: Record<string, string>;
      corps: Record<string, unknown>;
      modele: string;
    } =
      fournisseur === 'anthropic'
        ? {
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
              'x-api-key': ANTHROPIC_KEY!,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            corps: {
              model: ANTHROPIC_MODELE,
              max_tokens: 1200,
              system: SYSTEME,
              messages: [
                { role: 'user', content: message },
                // Amorce la réponse pour garantir un JSON exploitable.
                { role: 'assistant', content: '{' },
              ],
            },
            modele: ANTHROPIC_MODELE,
          }
        : {
            url:
              fournisseur === 'deepseek'
                ? 'https://api.deepseek.com/chat/completions'
                : 'https://api.openai.com/v1/chat/completions',
            headers: {
              Authorization: `Bearer ${(fournisseur === 'deepseek' ? DEEPSEEK_KEY : OPENAI_KEY)!}`,
              'content-type': 'application/json',
            },
            corps: {
              model: fournisseur === 'deepseek' ? DEEPSEEK_MODELE : OPENAI_MODELE,
              max_tokens: 1200,
              // Garantit un objet JSON en sortie, sans avoir à amorcer la
              // réponse comme chez Anthropic.
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: SYSTEME },
                { role: 'user', content: message },
              ],
            },
            modele: fournisseur === 'deepseek' ? DEEPSEEK_MODELE : OPENAI_MODELE,
          };

    const res = await fetch(appel.url, {
      method: 'POST',
      headers: appel.headers,
      body: JSON.stringify(appel.corps),
    });

    const data = await res.json();
    if (!res.ok) {
      // Les messages des deux API sont en anglais et techniques. Un praticien
      // en consultation a besoin de savoir quoi faire, pas de lire
      // « Your credit balance is too low ».
      const brutErr = String(data?.error?.message || '');
      const type = String(data?.error?.type || data?.error?.code || '');

      if (/credit balance|insufficient_quota|billing/i.test(brutErr + type)) {
        return {
          error:
            fournisseur === 'anthropic'
              ? 'Crédit épuisé sur le compte de rédaction. Rechargez-le sur console.anthropic.com (Plans & Billing).'
              : fournisseur === 'deepseek'
              ? 'Crédit épuisé sur le compte de rédaction. Rechargez-le sur platform.deepseek.com.'
              : 'Crédit épuisé sur le compte de rédaction. Rechargez-le sur platform.openai.com (Billing).',
        };
      }
      if (res.status === 401 || /authentication|invalid_api_key/i.test(type)) {
        return { error: 'Clé de rédaction refusée. Vérifiez la clé API configurée.' };
      }
      if (res.status === 429 || /rate_limit/i.test(type)) {
        return { error: 'Trop de demandes simultanées. Réessayez dans quelques secondes.' };
      }
      if (res.status >= 500) {
        return { error: 'Service de rédaction momentanément indisponible. Réessayez.' };
      }
      return { error: brutErr || "L'assistant de rédaction n'a pas répondu." };
    }

    // Anthropic renvoie content[0].text (amorcé par '{'), OpenAI renvoie
    // choices[0].message.content déjà complet.
    const brut =
      fournisseur === 'anthropic'
        ? '{' + (data?.content?.[0]?.text || '')
        : data?.choices?.[0]?.message?.content || '';

    let parsed: { fr?: string; wo?: string };
    try {
      parsed = JSON.parse(brut);
    } catch {
      return { error: "Réponse illisible de l'assistant. Réessayez." };
    }

    if (!parsed.fr?.trim()) {
      return { error: 'Aucun texte produit.' };
    }

    return { texteFr: parsed.fr.trim(), texteWo: parsed.wo?.trim(), modele: appel.modele };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erreur réseau (assistant de rédaction)." };
  }
}
