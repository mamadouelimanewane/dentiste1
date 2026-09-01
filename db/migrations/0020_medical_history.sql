-- Antécédents médicaux du patient (module Arrivée). Le questionnaire
-- (problèmes cardiaques, coagulation, grossesse, traitements en cours...)
-- n'était conservé que dans l'état React : tout était perdu à la navigation
-- et le praticien ne voyait jamais ces informations, pourtant déterminantes
-- avant une anesthésie ou une prescription.
alter table patients add column medical_history jsonb;
