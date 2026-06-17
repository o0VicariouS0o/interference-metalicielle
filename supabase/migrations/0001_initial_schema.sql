-- ============================================================
-- IM_DB_SQL_V1.2 — Schéma initial Interférence Métalicielle
-- Cible : Supabase (PostgreSQL 15+)
--
-- Ajustements vs V1.1 :
--   §1 — emissions.audio_url devient nullable (CHECK conditionnel)
--   §2 — pays.country_code passe en CHAR(2) NOT NULL
--   §3 — observations_yem : commentaire sur granularité à confirmer
-- ============================================================

-- ------------------------------------------------------------
-- 1. Référentiels (IDs générés)
-- ------------------------------------------------------------

CREATE TABLE pays (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom           TEXT NOT NULL,
  country_code  CHAR(2) NOT NULL,
  CONSTRAINT pays_country_code_unique UNIQUE (country_code),
  CONSTRAINT pays_country_code_format CHECK (country_code ~ '^[A-Z]{2}$')
);
CREATE INDEX idx_pays_nom ON pays (nom);

CREATE TABLE types_emission (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  libelle  TEXT NOT NULL,
  CONSTRAINT types_emission_libelle_unique UNIQUE (libelle)
);

CREATE TABLE types_observation_yem (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  libelle  TEXT NOT NULL,
  CONSTRAINT types_observation_yem_libelle_unique UNIQUE (libelle)
);

CREATE TABLE tags (
  id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  libelle  TEXT NOT NULL,
  CONSTRAINT tags_libelle_unique UNIQUE (libelle)
);

-- ------------------------------------------------------------
-- 2. Artistes (ID Excel)
-- ------------------------------------------------------------

CREATE TABLE artistes (
  id            BIGINT PRIMARY KEY,
  nom           TEXT NOT NULL,
  pays_id       BIGINT NOT NULL REFERENCES pays(id) ON DELETE RESTRICT,
  ville_region  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_artistes_pays ON artistes (pays_id);
CREATE INDEX idx_artistes_nom  ON artistes (nom);

-- ------------------------------------------------------------
-- 3. Albums (ID Excel)
-- ------------------------------------------------------------

CREATE TABLE albums (
  id          BIGINT PRIMARY KEY,
  titre       TEXT NOT NULL,
  artiste_id  BIGINT NOT NULL REFERENCES artistes(id) ON DELETE RESTRICT,
  annee       SMALLINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT albums_artiste_titre_unique UNIQUE (artiste_id, titre),
  CONSTRAINT albums_annee_plausible CHECK (annee IS NULL OR (annee BETWEEN 1900 AND 2100))
);
CREATE INDEX idx_albums_artiste ON albums (artiste_id);

-- ------------------------------------------------------------
-- 4. Emissions (ID naturel IM-XXX)
-- audio_url nullable : certaines émissions peuvent ne pas avoir
-- d'URL Radio Pons disponible au moment de l'import. Le CHECK ne
-- s'applique que si la valeur est renseignée.
-- ------------------------------------------------------------

CREATE TABLE emissions (
  id                 TEXT PRIMARY KEY,
  numero             SMALLINT NOT NULL,
  titre              TEXT NOT NULL,
  date_diffusion     DATE NOT NULL,
  description        TEXT,
  type_id            BIGINT NOT NULL REFERENCES types_emission(id) ON DELETE RESTRICT,
  audio_url          TEXT,
  visuel_path        TEXT,
  playlist_pdf_path  TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT emissions_id_format        CHECK (id ~ '^IM-[0-9]{3}$'),
  CONSTRAINT emissions_numero_unique    UNIQUE (numero),
  CONSTRAINT emissions_numero_positive  CHECK (numero > 0),
  CONSTRAINT emissions_audio_url_http   CHECK (audio_url IS NULL OR audio_url ~* '^https?://')
);
CREATE INDEX idx_emissions_date    ON emissions (date_diffusion DESC);
CREATE INDEX idx_emissions_type    ON emissions (type_id);
CREATE INDEX idx_emissions_numero  ON emissions (numero);

-- ------------------------------------------------------------
-- 5. Morceaux (ID Excel)
-- ------------------------------------------------------------

CREATE TABLE morceaux (
  id           BIGINT PRIMARY KEY,
  emission_id  TEXT     NOT NULL REFERENCES emissions(id) ON DELETE CASCADE,
  position     SMALLINT NOT NULL,
  titre        TEXT     NOT NULL,
  artiste_id   BIGINT   NOT NULL REFERENCES artistes(id) ON DELETE RESTRICT,
  album_id     BIGINT            REFERENCES albums(id)   ON DELETE SET NULL,
  annee        SMALLINT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT morceaux_emission_position_unique UNIQUE (emission_id, position),
  CONSTRAINT morceaux_position_positive CHECK (position > 0),
  CONSTRAINT morceaux_annee_plausible   CHECK (annee IS NULL OR (annee BETWEEN 1900 AND 2100))
);
CREATE INDEX idx_morceaux_emission ON morceaux (emission_id);
CREATE INDEX idx_morceaux_artiste  ON morceaux (artiste_id);
CREATE INDEX idx_morceaux_album    ON morceaux (album_id);

-- ------------------------------------------------------------
-- 6. Morceaux ↔ Tags (jointure N:N)
-- ------------------------------------------------------------

CREATE TABLE morceaux_tags (
  morceau_id  BIGINT NOT NULL REFERENCES morceaux(id) ON DELETE CASCADE,
  tag_id      BIGINT NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
  PRIMARY KEY (morceau_id, tag_id)
);
CREATE INDEX idx_morceaux_tags_tag ON morceaux_tags (tag_id);

-- ------------------------------------------------------------
-- 7. Observations YEM (structure souple)
--
-- IMPORTANT — Granularité à confirmer lors du premier import réel.
-- L'analyse de sheet12 du fichier maître V4 suggère que les observations
-- sont attachées à des morceaux (morceau_id NOT NULL), avec possiblement
-- plusieurs observations par morceau et plusieurs par émission.
-- Tant que cette hypothèse n'est pas confirmée par les données importées :
--   - morceau_id reste NULLABLE (l'observation peut être attachée à
--     l'émission seule si la granularité réelle s'avère plus large) ;
--   - aucune contrainte UNIQUE n'est posée sur morceau_id ni sur
--     emission_id (plusieurs observations possibles par cible) ;
--   - emission_id reste NOT NULL : c'est l'ancrage minimal toujours connu.
-- Une migration ultérieure pourra resserrer ces contraintes après
-- confirmation par l'observation des données réelles.
-- ------------------------------------------------------------

CREATE TABLE observations_yem (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  emission_id       TEXT   NOT NULL REFERENCES emissions(id) ON DELETE CASCADE,
  morceau_id        BIGINT          REFERENCES morceaux(id)  ON DELETE CASCADE,
  type_id           BIGINT          REFERENCES types_observation_yem(id) ON DELETE SET NULL,
  texte             TEXT,
  position_morceau  SMALLINT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE observations_yem IS
  'Annotations YEM. Granularite reelle (par morceau ou par emission) a confirmer lors du premier import du fichier maitre. Aucune contrainte d''unicite posee en V1.2 : plusieurs observations possibles par morceau et par emission tant que la sheet12 du fichier maitre n''a pas ete validee comme source canonique.';

COMMENT ON COLUMN observations_yem.morceau_id IS
  'Nullable en V1.2 : si la granularite reelle s''avere etre l''emission, morceau_id peut rester NULL. A reevaluer apres premier import.';

COMMENT ON COLUMN observations_yem.emission_id IS
  'Toujours renseigne. Ancrage minimal d''une observation, qu''elle vise un morceau precis ou l''emission entiere.';

CREATE INDEX idx_observations_yem_emission ON observations_yem (emission_id);
CREATE INDEX idx_observations_yem_morceau  ON observations_yem (morceau_id);
CREATE INDEX idx_observations_yem_type     ON observations_yem (type_id);

-- ------------------------------------------------------------
-- 8. Trigger updated_at
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_artistes_updated_at
  BEFORE UPDATE ON artistes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_emissions_updated_at
  BEFORE UPDATE ON emissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_morceaux_updated_at
  BEFORE UPDATE ON morceaux
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_observations_yem_updated_at
  BEFORE UPDATE ON observations_yem
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ------------------------------------------------------------
-- 9. RLS — lecture publique uniquement (V1)
-- ------------------------------------------------------------

ALTER TABLE pays                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_emission        ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_observation_yem ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE artistes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums                ENABLE ROW LEVEL SECURITY;
ALTER TABLE emissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceaux              ENABLE ROW LEVEL SECURITY;
ALTER TABLE morceaux_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE observations_yem      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read" ON pays                  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON types_emission        FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON types_observation_yem FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON tags                  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON artistes              FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON albums                FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON emissions             FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON morceaux              FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON morceaux_tags         FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON observations_yem      FOR SELECT TO anon USING (true);

CREATE POLICY "auth_read" ON pays                  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON types_emission        FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON types_observation_yem FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON tags                  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON artistes              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON albums                FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON emissions             FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON morceaux              FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON morceaux_tags         FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_read" ON observations_yem      FOR SELECT TO authenticated USING (true);

-- Aucune politique d'ecriture publique. Les imports passent par le role service_role
-- (utilise exclusivement par le script de synchronisation cote serveur),
-- qui contourne la RLS par defaut.

-- ============================================================
-- Fin IM_DB_SQL_V1.2
-- ============================================================