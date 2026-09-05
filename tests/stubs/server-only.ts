// Remplaçant de `server-only` pour les tests.
//
// Le paquet réel n'expose aucun code exécutable : il sert de garde à la
// compilation Next, en faisant échouer tout import depuis un composant client.
// En environnement de test, il n'y a rien à garder.
export {};
