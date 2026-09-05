import { describe, it, expect } from 'vitest';
import { versGsm7, segmentsSms } from '@/lib/integrations/sms';
import { lienEnvoi } from '@/lib/integrations/envoi-manuel';

// Le SMS est le canal de repli du cabinet, et l'envoi manuel le seul canal
// réellement opérationnel aujourd'hui. Ce qui suit protège deux choses : qu'un
// message ne bascule pas en UCS-2 pour un tiret cadratin — divisant sa
// capacité par deux — et qu'un lien remis à l'assistante porte bien le texte
// entier.

describe('versGsm7', () => {
  it('laisse intact un message déjà compatible', () => {
    const m = 'Bonjour Issakha Mbaye, rappel de votre rendez-vous mardi a 10h00.';
    expect(versGsm7(m)).toBe(m);
  });

  it('remplace la ponctuation typographique par son équivalent', () => {
    expect(versGsm7('un — deux')).toBe('un - deux');
    expect(versGsm7('l’heure')).toBe("l'heure");
    expect(versGsm7('« oui »')).toBe('" oui "');
    expect(versGsm7('etc…')).toBe('etc...');
  });

  it('conserve le sens du numéro de dossier', () => {
    // Sans équivalence, « N°SN-10063-X » devenait « NSN-10063-X » : le numéro
    // changeait de forme sans que rien ne le signale.
    expect(versGsm7('N°SN-10063-X')).toBe('NoSN-10063-X');
  });

  it('garde les accents que le GSM-7 connaît', () => {
    // é, à, è, ù figurent dans la table GSM-7 : les déaccentuer serait
    // dégrader le message sans rien gagner.
    expect(versGsm7('éàèù')).toBe('éàèù');
  });

  it('déaccentue seulement ce que le GSM-7 ignore', () => {
    // ô, ê, î et le ç minuscule n'y sont pas — la table ne contient que Ç.
    // Sans cette transposition, tout le message basculerait en UCS-2 et sa
    // capacité tomberait de 160 à 70 caractères.
    expect(versGsm7('contrôle prêt à être fixé')).toBe('controle pret à etre fixé');
    expect(versGsm7('ça')).toBe('ca');
  });

  it('retire les emoji sans laisser de double espace', () => {
    expect(versGsm7('Bonjour 🦷 Fatou')).toBe('Bonjour Fatou');
  });
});

describe('segmentsSms', () => {
  it('tient sur un seul segment jusqu’à 160 caractères', () => {
    expect(segmentsSms('a'.repeat(160))).toBe(1);
    expect(segmentsSms('a'.repeat(161))).toBe(2);
  });

  it('compte double les caractères de l’extension GSM-7', () => {
    // « € » et « [ » occupent deux unités : un message de 90 crochets déborde
    // du segment simple alors qu'il fait moins de 160 caractères.
    expect(segmentsSms('['.repeat(90))).toBeGreaterThan(1);
  });

  it('découpe les messages longs en segments concaténés de 153', () => {
    // Un SMS concaténé perd 7 caractères par segment pour son en-tête.
    expect(segmentsSms('a'.repeat(300))).toBe(2);
    expect(segmentsSms('a'.repeat(306))).toBe(2);
    expect(segmentsSms('a'.repeat(307))).toBe(3);
  });

  it('mesure un rappel de rendez-vous réel sur un seul segment', () => {
    const rappel = versGsm7(
      'Bonjour Issakha Mbaye, rappel de votre rendez-vous Controle le mardi 10 a 10h00 au Cabinet Dentaire du Cap Vert.'
    );
    expect(segmentsSms(rappel)).toBe(1);
  });
});

describe('lienEnvoi', () => {
  it('construit un lien WhatsApp sans le plus du numéro', () => {
    const lien = lienEnvoi('whatsapp', '+221778438786', 'Bonjour');
    expect(lien.startsWith('https://wa.me/221778438786?text=')).toBe(true);
  });

  it('construit un lien SMS avec le numéro tel quel', () => {
    expect(lienEnvoi('sms', '+221778438786', 'Bonjour')).toContain('sms:+221778438786');
  });

  it('encode le texte pour qu’il arrive entier', () => {
    // Une esperluette ou un dièse non encodés tronqueraient le message à
    // l'ouverture de l'application de messagerie.
    const lien = lienEnvoi('whatsapp', '+221778438786', 'Devis & soins #16');
    expect(lien).not.toContain(' & ');
    expect(lien).toContain(encodeURIComponent('Devis & soins #16'));
  });
});
