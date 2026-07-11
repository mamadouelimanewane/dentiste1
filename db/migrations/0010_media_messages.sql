-- Support des messages audio (notes vocales) en plus du texte, dans les
-- deux sens : patient -> cabinet (portail) et cabinet -> patient (WhatsApp).

alter table patient_messages add column media_url text;
alter table patient_messages add column media_type text;
