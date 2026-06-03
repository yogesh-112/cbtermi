-- Add language support to help_faqs
alter table help_faqs add column if not exists language text not null default 'en';
create index if not exists help_faqs_language_idx on help_faqs(language);

-- Update existing FAQs to be English
update help_faqs set language = 'en' where language is null or language = '';

-- Add language support to notification_templates table
alter table notification_templates add column if not exists language text not null default 'en';
create index if not exists notification_templates_language_idx on notification_templates(language);
update notification_templates set language = 'en' where language is null or language = '';
