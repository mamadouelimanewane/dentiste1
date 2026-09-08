# Messagerie : où en sont les quatre opérateurs, et quoi faire

Ce document ne relève pas du code. Il décrit ce qui bloque l'envoi automatique
des messages aux patients, ce que fait l'application en attendant, et les
démarches à mener — dans l'ordre où elles ont le plus de chances d'aboutir.

---

## 1. Ce qui est établi, et vérifié

| Opérateur | État réel | Ce que ça veut dire |
|---|---|---|
| **Meta — WhatsApp Cloud API** | L'API **accepte** l'appel (HTTP 200, un identifiant de message est rendu), puis le webhook renvoie l'échec quelques secondes plus tard. Cause : l'entreprise est `not_verified`. | **Rien ne part.** C'est le pire des cas : l'API répond « accepté ». Une application naïve afficherait « envoyé » à l'assistante. La nôtre attend le webhook avant d'affirmer quoi que ce soit. |
| **Orange Sénégal — SMS API** | Compte développeur créé, application déclarée, demande de mise en production **« pending approval »** depuis. | La clé fonctionne en bac à sable, pas vers de vrais numéros. Le passage en production est une décision commerciale de Sonatel, pas un déblocage automatique. |
| **Twilio** | Vérification d'identité (KYC) **refusée**. | Compte inutilisable. |
| **Africa's Talking** | Inscription **refusée**. | Compte inexistant. |

Le point commun des quatre : aucun n'est un problème technique. Le code d'envoi
est écrit, testé et prêt pour six fournisseurs
(`src/lib/integrations/sms.ts`, `whatsapp.ts`). Ce qui manque est
**administratif** : le cabinet n'a pas encore, aux yeux de ces sociétés,
d'existence documentaire vérifiable.

## 2. Ce que fait l'application en attendant

Un rappel qu'aucun canal automatique n'a pu porter n'est ni perdu ni compté
comme envoyé : il tombe dans la **file d'envoi manuel** (statut `a_envoyer`,
`src/lib/integrations/envoi-manuel.ts`). L'assistante ouvre la file, clique, le
téléphone du cabinet s'ouvre sur la conversation WhatsApp ou le SMS du patient,
message déjà rédigé. Elle confirme l'envoi, l'historique du patient l'enregistre.

Pour le volume d'un cabinet en démarrage — quelques dizaines de rappels par
semaine — c'est tenable : environ deux minutes pour une dizaine de rappels.
**Le pilote peut donc démarrer sans aucun de ces quatre opérateurs.** Les
démarches ci-dessous ne sont pas bloquantes ; elles font gagner du temps à
l'assistante, plus tard.

## 3. Meta / WhatsApp — la seule voie est la vérification d'entreprise

Il n'y a pas de contournement : tant que l'entreprise est `not_verified`, les
messages sortants vers des numéros autres que les numéros de test sont rejetés.

**Où :** business.facebook.com → Paramètres de l'entreprise → **Centre de
sécurité** → *Commencer la vérification*.

**Pièces à réunir :**
1. Un document légal au nom **exact** du cabinet : extrait **RCCM**, ou
   **NINEA** / quitus fiscal.
2. Un justificatif d'adresse ou de téléphone au **même nom** : facture Senelec
   ou Sonatel de moins de six mois, ou relevé bancaire d'entreprise.

**La cause de refus numéro un** n'est pas le document, c'est l'écart : le nom,
l'adresse et le numéro saisis dans Meta doivent être identiques, caractère pour
caractère, à ceux du document. « Cabinet Dentaire du Cap Vert » et « CABINET
DENTAIRE CAP VERT » sont deux entreprises différentes pour ce contrôle.
Vérifier ce point avant de soumettre fait gagner des semaines.

**Ce qui aide :** un nom de domaine propre au cabinet et une adresse e-mail à ce
domaine (aujourd'hui l'application est sur un sous-domaine `vercel.app`, ce qui
n'est pas un signal d'entreprise). Meta demande parfois une confirmation par
appel ou SMS sur un numéro figurant dans un annuaire public.

**Délai :** de quelques jours à trois semaines. Un refus se corrige et se
re-soumet ; commencer par l'écart de dénomination.

**Après la vérification, il restera deux choses** — autant les savoir
maintenant :
- les rappels de rendez-vous doivent passer par un **modèle de message**
  (« template ») soumis à Meta en catégorie *utility* et approuvé. Un texte
  libre n'est pas autorisé hors fenêtre de 24 h ;
- le patient doit avoir **donné son accord** pour être contacté sur WhatsApp.
  Cet accord se recueille à l'accueil et se trace dans le dossier.

**En attendant :** l'application **WhatsApp Business** (gratuite, sur le
téléphone du cabinet) fait le travail à la main. C'est exactement ce que la file
d'envoi manuel alimente.

## 4. Orange Sénégal — relancer, et par deux portes à la fois

C'est la piste la plus prometteuse, pour une raison décisive : **les forfaits
Orange se paient en Airtime ou en Orange Money**, sans carte bancaire
internationale ni vérification d'identité étrangère. C'est précisément ce qui a
bloqué les trois autres. C'est aussi pourquoi Orange est placé en tête de la
chaîne d'envoi dans le code.

Un dossier « pending approval » sur le portail développeur **ne se débloque pas
tout seul**. Deux démarches, menées en parallèle :

1. **Sur le portail** (developer.orange.com) : relancer la demande existante par
   un ticket au support, en rappelant la référence de l'application et la date
   de dépôt.
2. **Par le commercial** : se présenter en agence **Orange Business** avec le
   compte entreprise du cabinet et demander un contrat **« SMS Pro » / envoi en
   nombre**. C'est la même chose vue du côté commercial, et cette porte-là
   avance en général plus vite.

**À préparer avant d'y aller :**
- RCCM et NINEA du cabinet ;
- le **nom d'expéditeur** souhaité — 11 caractères maximum, sans espace :
  `CAPVERT` par exemple. Il doit être déclaré et validé, sinon les messages
  partent d'un numéro court anonyme ;
- une **estimation de volume** mensuel : nombre de rendez-vous par mois × 2
  (un rappel la veille, une confirmation) ;
- un **exemple de message type**, tel qu'il sera envoyé. On le demande presque
  toujours.

## 5. Twilio et Africa's Talking — ne pas insister maintenant

Les deux refus sont des refus d'**identité**, pas de solvabilité ni de
technique. Ils tiennent au même manque : pas de pièces d'entreprise fournies,
pas d'e-mail au domaine du cabinet, pas de moyen de paiement international au
nom de l'entreprise. Twilio exige en outre, pour le Sénégal, un dossier
réglementaire (« bundle ») avec adresse locale et pièce d'identité du
représentant légal.

**Conséquence pratique :** ces deux dossiers se re-soumettent **après**
l'obtention des vraies pièces, jamais avant. Re-soumettre en l'état consomme la
tentative et durcit le refus — certains refus répétés ferment définitivement la
possibilité d'ouvrir un compte avec la même identité.

⚠️ Et une évidence qui mérite d'être écrite : les valeurs `DÉMO-NINEA` et
`DÉMO-RCCM` actuellement saisies dans Configuration servent **uniquement** à
composer des documents de démonstration. Elles ne doivent jamais figurer dans un
dossier soumis à un opérateur.

## 6. Si Orange traîne : deux solutions de repli réalistes

**a) Un agrégateur déjà câblé dans l'application.** Termii, Plivo et Vonage
couvrent le Sénégal et sont **déjà implémentés** : il n'y a que des variables
d'environnement à renseigner, aucune ligne de code à écrire. C'est le chemin le
plus court — à condition de disposer d'une carte bancaire d'entreprise, ce qui
est justement le point dur. Termii, basé en Afrique de l'Ouest, est le moins
exigeant des trois sur ce plan.

**b) Un boîtier GSM au cabinet.** Un modem SMS avec une puce Orange ou Free du
cabinet, posé à l'accueil : aucun dossier, aucune vérification, le cabinet
envoie depuis sa propre ligne. En contrepartie, un matériel à acheter, un débit
limité (quelques SMS par minute) et un développement à prévoir — une route
d'envoi vers le boîtier, de l'ordre d'une journée. C'est une pratique courante
dans les cabinets de la place.

## 7. Ordre recommandé

1. **Orange** — relance portail *et* agence. Meilleur rapport effort/résultat,
   et le seul qui ne réclame pas de carte bancaire.
2. **Meta** — lancer la vérification d'entreprise en parallèle : elle est longue,
   et elle sert au-delà de WhatsApp.
3. **Termii ou Plivo** — seulement si une carte bancaire d'entreprise est
   disponible et qu'Orange n'a pas abouti sous un mois.
4. **Twilio / Africa's Talking** — plus tard, dossier complet en main.

Rien de tout cela ne conditionne l'ouverture. La file d'envoi manuel tient le
volume d'un cabinet qui démarre, et elle dit la vérité sur chaque message :
envoyé, à envoyer, ou échoué.
