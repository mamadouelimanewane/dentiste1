# Restaurer une sauvegarde

Procédure à suivre si la base est perdue, corrompue, ou si une suppression
accidentelle doit être annulée. Elle a été **répétée en conditions réelles le
8 septembre 2026** (voir « Répétition » plus bas).

---

## Ce dont vous avez besoin

1. **Le fichier de sauvegarde.** Administration → Sauvegardes → *Télécharger*.
   Le fichier obtenu est un JSON en clair.
   *Variante* : le fichier chiffré tel qu'il est stocké (`.sauvegarde`). Il faut
   alors `SAUVEGARDE_SECRET` — ou, s'il n'a jamais été posé, `SESSION_SECRET` —
   dans l'environnement.
2. **Une base de destination** et son URL de connexion.
3. Le dépôt du projet et `node` installés.

## Les quatre étapes

```bash
# 1. Créer la base (une fois), depuis la console de l'hébergeur ou en SQL :
#    create database cabinet_restaure;

# 2. Y créer le schéma
DATABASE_URL="<url cible>" node scripts/migrate.mjs

# 3. Simuler — n'écrit rien, montre table par table ce qui serait restauré
node scripts/restauration.mjs sauvegarde.json --cible "<url cible>"

# 4. Restaurer
node scripts/restauration.mjs sauvegarde.json --cible "<url cible>" --confirmer --vider
```

`--vider` est **nécessaire** : les migrations sèment déjà les rôles et les
paramètres du cabinet, donc une base fraîchement migrée n'est jamais vide. Sans
cette option, le script refuse d'écrire par-dessus des données existantes —
c'est voulu : mélanger une sauvegarde à des données vivantes produirait un état
que personne ne saurait décrire.

Tout se fait dans **une seule transaction** : si quoi que ce soit échoue, rien
n'est écrit. À la fin, le script recompte les lignes réellement présentes en base
et refuse de conclure si un écart apparaît.

## Ce que le script fait, et pourquoi

- **Il déduit l'ordre d'insertion du schéma réel** de la base cible, pas d'une
  liste écrite à la main qui vieillirait mal : une table qui en référence une
  autre est insérée après elle.
- **Il traite à part les renvois d'une table vers elle-même** (par exemple
  « ce message est le repli de celui-là »). Ces colonnes sont posées à `NULL`
  à l'insertion, puis renseignées une fois toutes les lignes présentes, dans la
  même transaction.
- **Il remet les compteurs de séquence à niveau** après coup, sans quoi la
  première écriture suivant la restauration entrerait en collision.
- **Il ignore, en le signalant, ce que la cible ne connaît pas** : une table
  présente dans une vieille sauvegarde mais absente du schéma actuel.

## Ce qu'il ne fait pas

- **Il ne restaure pas les fichiers** (clichés, documents, notes vocales). Ceux-ci
  vivent dans le magasin de fichiers, pas dans la base ; la sauvegarde ne contient
  que leurs références. Un magasin perdu ne se reconstruit pas depuis ce fichier.
- **Il ne bascule pas l'application** sur la base restaurée : il faut ensuite
  pointer `DATABASE_URL` vers elle et redéployer.

## Répétition du 8 septembre 2026

Faite sur une base de test créée pour l'occasion puis supprimée, à partir d'une
sauvegarde réelle de production.

| | |
|---|---|
| Schéma créé | 35 migrations, sans erreur |
| Données restaurées | 148 lignes, 13 tables non vides |
| Renvois internes rétablis | 7 |
| Durée de la restauration | 42 s |
| Contrôle | empreinte SHA-256 de chaque table comparée à la sauvegarde |
| Résultat | **13 tables sur 13 identiques**, 0 écart |

La répétition a révélé deux choses, corrigées depuis :

1. Une base fraîchement migrée n'est pas vide — d'où `--vider` dans la procédure.
2. Les renvois d'une table vers elle-même (`patient_messages.fallback_of`)
   faisaient échouer l'insertion. C'est précisément le genre de défaut qu'on ne
   découvre qu'en essayant, et jamais au bon moment.
