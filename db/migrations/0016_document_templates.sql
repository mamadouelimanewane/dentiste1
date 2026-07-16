-- Modèles & Contrats (Super Admin). Modèles de documents réutilisables avec
-- placeholders ({{patient.name}}, {{clinic.name}}, {{date}}...), remplis et
-- exportés en PDF pour un patient donné.

create table document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Autre',
  body text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into document_templates (name, category, body) values
(
  'Consentement éclairé — Acte chirurgical',
  'Consentement',
  E'Je soussigné(e) {{patient.name}}, né(e) le {{patient.birthDate}}, dossier n°{{patient.dossier}}, reconnais avoir été informé(e) par le praticien de {{clinic.name}} de la nature de l''acte proposé, de ses bénéfices attendus, des risques et complications possibles, ainsi que des alternatives thérapeutiques.\n\nJ''ai pu poser toutes les questions nécessaires et j''ai obtenu des réponses claires et compréhensibles.\n\nJe donne mon consentement libre et éclairé à la réalisation de cet acte.\n\nFait à Dakar, le {{date}}.\n\nSignature du patient : _____________________\n\nSignature du praticien : _____________________'
),
(
  'Attestation de soins',
  'Attestation',
  E'{{clinic.name}}\n{{clinic.address}}\nTél : {{clinic.phone}}\n\nJe soussigné, praticien à {{clinic.name}}, atteste avoir reçu en consultation et/ou soins le patient {{patient.name}} (dossier n°{{patient.dossier}}), en date du {{date}}.\n\nCette attestation est délivrée à la demande de l''intéressé(e) pour servir et valoir ce que de droit (assurance, employeur, mutuelle).\n\nFait à Dakar, le {{date}}.\n\nCachet et signature du praticien.'
),
(
  'Contrat de financement — Échéancier de paiement',
  'Contrat',
  E'Entre {{clinic.name}}, d''une part,\net {{patient.name}} (dossier n°{{patient.dossier}}, tél. {{patient.phone}}), d''autre part,\n\nIl est convenu ce qui suit :\n\nLe patient s''engage à régler le montant des soins dispensés selon l''échéancier défini avec le service comptable du cabinet, aux dates convenues. Tout retard de paiement pourra faire l''objet d''un rappel.\n\nLe cabinet s''engage à poursuivre la prise en charge du patient dans le respect du plan de traitement établi.\n\nFait à Dakar, le {{date}}, en deux exemplaires.\n\nSignature du patient : _____________________\n\nSignature du cabinet : _____________________'
);
