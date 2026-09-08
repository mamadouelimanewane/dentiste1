# Procès-verbal de recette — mise en service conditionnelle

**Objet** : Élite ERP — Cabinet Dentaire du Cap Vert (dentiste1.vercel.app)
**Version constatée** : 8b6a7ea · **Date** : 8 septembre 2026
**Périmètre** : 24 modules, 78 routes, 35 migrations, 57 tests au build

> Ce document est un procès-verbal de recette établi par le concepteur de
> l'application. Il atteste de vérifications faites sur l'environnement de
> production et décrit lesquelles. Il ne constitue ni une certification délivrée
> par un organisme accrédité, ni un audit de sécurité indépendant, ni un agrément
> réglementaire.

## 1. Méthode

Constats obtenus **sur l'application en production**, en exécutant les opérations
réelles et en relisant ce que la base a enregistré — non par lecture du code, et
non sur un environnement de test. S'y ajoutent 57 tests automatiques exécutés à
chaque construction ; la construction échoue si l'un d'eux échoue.

## 2. Constats

| Fait | Constaté |
|---|---|
| Le parcours patient fonctionne de bout en bout | rendez-vous → accueil → soins → ordonnance → devis → facture → paiement → prochain RV → écriture comptable → archive, exécutés d'affilée en production, chaque étape relue en base |
| Les prix découlent d'une règle unique | cotation × valeur de la lettre-clé D (1 200 F) ; les 59 prix figés contradictoires supprimés ; vérifié par tests |
| La comptabilité suit l'encaissement | écritures SYSCOA/OHADA au paiement ; espèces refusées tant qu'une prise en charge est en cours, sauf annulation tracée |
| Les habilitations sont relues à chaque requête | un rôle modifié produit son effet immédiatement ; l'imagerie est séparée de la facturation |
| Les documents ne portent que ce qui est saisi | aucune mention inventée ; mention de démonstration tant que le mode est actif, vérifiée par 7 tests sur les trois documents, contrôles négatifs compris |
| Les fichiers de santé ne sont plus servis par une URL publique | cinq routes authentifiées ; lecture authentifiée conforme, refus sans session (307 / 401), suppression effective du fichier |
| La base est sauvegardée chaque nuit | 2h30, chiffrée AES-256-GCM, 30 jours de rétention ; cycle exercé en production (26 tables, 140 lignes, restitution déchiffrée valide) |
| Aucun message n'est déclaré envoyé sans l'être | trois états seulement ; ce qu'aucun canal ne porte tombe dans la file d'envoi manuel |
| Les actions sensibles laissent une trace | journal d'audit alimenté, 38 entrées |
| La base est vierge d'activité fictive | 0 acte, 0 facture, 0 devis, 0 ordonnance, 0 fichier ; restent 2 dossiers de test réels, 8 comptes, 5 rôles, catalogue et stock |

## 3. Réserves

Aucune ne relève du code. R1 à R6 se lèvent le jour de l'ouverture ; R7 est un
point de suivi non bloquant.

| # | Réserve | Levée | Vérification |
|---|---|---|---|
| R1 | Identité légale : NINEA/RCCM/Ordre en valeurs de démonstration | saisir les vrais numéros, décocher le mode démonstration | une facture d'essai sans mention de démonstration |
| R2 | Mots de passe : six comptes partagent le même | `scripts/rotation-mots-de-passe.mjs`, remise en main propre | chacun se connecte une première fois devant vous |
| R3 | Secrets applicatifs ayant circulé | régénérer chaque clé ; poser `SAUVEGARDE_SECRET` | une sauvegarde se télécharge et s'ouvre après le changement |
| R4 | Tâche de sauvegarde jamais exécutée | attendre la première nuit | un fichier daté figure dans Administration → Sauvegardes |
| R5 | Formalités sur les données de santé (CDP, loi 2008-12) — **signalé, pas tranché** | faire confirmer et accomplir par un conseil juridique | récépissé ou avis écrit |
| R6 | Consentement des patients pour la messagerie | recueillir à l'accueil, tracer au dossier | les dossiers de la première semaine portent la mention |
| R7 | Procédure de restauration ni écrite ni exercée | écrire le script et l'exercer sur une base de test | base reconstituée, durée connue |

## 4. Hors périmètre

- **Aucun usage réel** par le personnel à ce jour.
- **Aucun audit de sécurité indépendant**, aucun test d'intrusion.
- **Aucun test de charge.**
- **L'envoi automatique des messages n'est ouvert chez aucun opérateur** — dossiers
  administratifs suivis à part (voir `docs/messagerie-operateurs.md`).
- **La conformité réglementaire n'est pas attestée** (voir R5).

## 5. Conclusion

**Apte à la mise en service, sous réserve de la levée des points R1 à R6.**

Les six réserves bloquantes ne demandent aucune modification du logiciel : elles
relèvent de la saisie, des accès et des formalités. R7 est à traiter dans les
premières semaines.

Recommandation d'exploitation : conserver le carnet papier en parallèle la
première semaine, et regarder l'écran Sauvegardes chaque lundi.

Ce procès-verbal vaut pour la version 8b6a7ea et cet environnement. Toute
modification ultérieure sort de son périmètre.
