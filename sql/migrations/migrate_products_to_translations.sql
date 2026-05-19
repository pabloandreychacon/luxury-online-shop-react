-- Migration: copy existing Products.Name/Description into ProductTranslations as 'en'
-- Run this once in a safe environment. Adjust language if your default is different.

INSERT INTO public."ProductTranslations" ("ProductId","Language","Name","Description")
SELECT "Id", 'en', "Name", "Description" FROM "Products"
WHERE "Name" IS NOT NULL OR "Description" IS NOT NULL
ON CONFLICT ("ProductId","Language") DO NOTHING;
