-- ============================================
-- RITUALS FEATURE TABLES
-- ============================================

-- Enum for ritual categories
CREATE TYPE ritual_category AS ENUM ('morning', 'midday', 'evening', 'selfcare');

-- Enum for tracking types
CREATE TYPE tracking_type AS ENUM ('checkbox', 'duration', 'streak');

-- ============================================
-- RITUALS TABLE (Master list of rituals)
-- ============================================
CREATE TABLE IF NOT EXISTS public.rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ritual details
  name TEXT NOT NULL,
  name_fr TEXT NOT NULL,
  description TEXT,
  description_fr TEXT,
  benefit TEXT,  -- what to expect / why this helps
  benefit_fr TEXT,
  category ritual_category NOT NULL,
  icon TEXT,  -- lucide icon name
  duration_suggestion INTEGER,  -- suggested minutes (optional)

  -- Ownership
  is_predefined BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.members(id) ON DELETE CASCADE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS rituals_category_idx ON public.rituals(category);
CREATE INDEX IF NOT EXISTS rituals_predefined_idx ON public.rituals(is_predefined);
CREATE INDEX IF NOT EXISTS rituals_created_by_idx ON public.rituals(created_by);

-- Enable RLS
ALTER TABLE public.rituals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can see predefined rituals, members can see their own custom rituals
CREATE POLICY "Anyone can view predefined rituals"
  ON public.rituals FOR SELECT
  USING (is_predefined = true);

CREATE POLICY "Members can view own custom rituals"
  ON public.rituals FOR SELECT
  USING (
    created_by IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own custom rituals"
  ON public.rituals FOR INSERT
  WITH CHECK (
    is_predefined = false AND
    created_by IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own custom rituals"
  ON public.rituals FOR UPDATE
  USING (
    is_predefined = false AND
    created_by IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own custom rituals"
  ON public.rituals FOR DELETE
  USING (
    is_predefined = false AND
    created_by IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- MEMBER RITUALS TABLE (Which rituals each member has enabled)
-- ============================================
CREATE TABLE IF NOT EXISTS public.member_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,

  -- Preferences
  tracking_type tracking_type DEFAULT 'checkbox',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  planned_time TIME,  -- When user plans to do this ritual

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One entry per member per ritual
  UNIQUE(member_id, ritual_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS member_rituals_member_id_idx ON public.member_rituals(member_id);
CREATE INDEX IF NOT EXISTS member_rituals_ritual_id_idx ON public.member_rituals(ritual_id);
CREATE INDEX IF NOT EXISTS member_rituals_active_idx ON public.member_rituals(is_active);

-- Enable RLS
ALTER TABLE public.member_rituals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own ritual selections
CREATE POLICY "Members can view own ritual selections"
  ON public.member_rituals FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own ritual selections"
  ON public.member_rituals FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own ritual selections"
  ON public.member_rituals FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own ritual selections"
  ON public.member_rituals FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- RITUAL COMPLETIONS TABLE (Daily completion tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ritual_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  ritual_id UUID NOT NULL REFERENCES public.rituals(id) ON DELETE CASCADE,

  -- Completion data
  completion_date DATE NOT NULL,
  completed BOOLEAN DEFAULT true,
  duration_minutes INTEGER,  -- optional, for duration tracking
  notes TEXT,  -- optional reflection

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One completion per member per ritual per day
  UNIQUE(member_id, ritual_id, completion_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS ritual_completions_member_id_idx ON public.ritual_completions(member_id);
CREATE INDEX IF NOT EXISTS ritual_completions_ritual_id_idx ON public.ritual_completions(ritual_id);
CREATE INDEX IF NOT EXISTS ritual_completions_date_idx ON public.ritual_completions(completion_date);
CREATE INDEX IF NOT EXISTS ritual_completions_member_date_idx ON public.ritual_completions(member_id, completion_date);

-- Enable RLS
ALTER TABLE public.ritual_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Members can manage their own completions
CREATE POLICY "Members can view own ritual completions"
  ON public.ritual_completions FOR SELECT
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can insert own ritual completions"
  ON public.ritual_completions FOR INSERT
  WITH CHECK (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update own ritual completions"
  ON public.ritual_completions FOR UPDATE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can delete own ritual completions"
  ON public.ritual_completions FOR DELETE
  USING (
    member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_rituals_updated_at
  BEFORE UPDATE ON public.rituals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_member_rituals_updated_at
  BEFORE UPDATE ON public.member_rituals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ritual_completions_updated_at
  BEFORE UPDATE ON public.ritual_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED PREDEFINED RITUALS
-- ============================================

-- Morning Rituals
INSERT INTO public.rituals (name, name_fr, description, description_fr, benefit, benefit_fr, category, icon, duration_suggestion, is_predefined) VALUES
('Window Moment', 'Moment Fenêtre', '2 min gazing out the window, noticing the world', '2 min à regarder par la fenêtre, observer le monde', 'Grounds you in the present and gently wakes your mind', 'Vous ancre dans le présent et éveille doucement votre esprit', 'morning', 'eye', 2, true),
('First Sip Ritual', 'Rituel Première Gorgée', 'Mindfully prepare & savor your first drink', 'Préparez et savourez votre première boisson en pleine conscience', 'Turns routine into a moment of calm awareness', 'Transforme la routine en un moment de calme conscience', 'morning', 'coffee', 5, true),
('Intention Seed', 'Graine d''Intention', 'Plant one small intention for your day', 'Plantez une petite intention pour votre journée', 'Gives your day direction without pressure', 'Donne une direction à votre journée sans pression', 'morning', 'sprout', 2, true),
('Body Wake-Up', 'Réveil du Corps', 'Quick stretch from head to toes', 'Étirement rapide de la tête aux pieds', 'Gets blood flowing and releases overnight tension', 'Fait circuler le sang et libère les tensions de la nuit', 'morning', 'stretch-horizontal', 5, true),
('Sunrise Breath', 'Souffle du Lever', '3 deep breaths facing natural light', '3 respirations profondes face à la lumière naturelle', 'Oxygenates your brain and signals a fresh start', 'Oxygène votre cerveau et signale un nouveau départ', 'morning', 'sun', 2, true);

-- Midday Rituals
INSERT INTO public.rituals (name, name_fr, description, description_fr, benefit, benefit_fr, category, icon, duration_suggestion, is_predefined) VALUES
('Micro-Adventure', 'Micro-Aventure', '5 min walk somewhere slightly different', '5 min de marche vers un endroit un peu différent', 'Breaks mental patterns and sparks creativity', 'Brise les schémas mentaux et stimule la créativité', 'midday', 'map-pin', 5, true),
('Desk Dance', 'Danse au Bureau', 'One song, just move however feels good', 'Une chanson, bougez comme vous le sentez', 'Releases stuck energy and boosts your mood', 'Libère l''énergie bloquée et améliore votre humeur', 'midday', 'music', 4, true),
('Sky Check', 'Regard au Ciel', 'Step outside, look up for 60 seconds', 'Sortez et regardez le ciel pendant 60 secondes', 'Expands your perspective and calms busy thoughts', 'Élargit votre perspective et calme les pensées agitées', 'midday', 'cloud', 1, true),
('Fresh Start', 'Nouveau Départ', 'Close all tabs, clear your space', 'Fermez tous les onglets, rangez votre espace', 'Reduces mental clutter and renews focus', 'Réduit l''encombrement mental et renouvelle la concentration', 'midday', 'refresh-cw', 3, true),
('Gratitude Ping', 'Ping de Gratitude', 'Send one appreciative message to someone', 'Envoyez un message de gratitude à quelqu''un', 'Strengthens connections and lifts both spirits', 'Renforce les liens et élève les deux esprits', 'midday', 'heart', 2, true);

-- Evening Rituals
INSERT INTO public.rituals (name, name_fr, description, description_fr, benefit, benefit_fr, category, icon, duration_suggestion, is_predefined) VALUES
('Day Download', 'Téléchargement du Jour', '3 bullet points about today', '3 points sur votre journée', 'Processes experiences so they don''t keep you awake', 'Traite les expériences pour qu''elles ne vous empêchent pas de dormir', 'evening', 'list', 5, true),
('Tomorrow''s Gift', 'Cadeau de Demain', 'Set up one thing to ease tomorrow', 'Préparez une chose pour faciliter demain', 'Reduces morning stress and shows self-care', 'Réduit le stress matinal et montre l''auto-soin', 'evening', 'gift', 5, true),
('Screen Sunset', 'Coucher d''Écran', '1 hour of no screens before bed', '1 heure sans écran avant de dormir', 'Helps your brain wind down for better sleep', 'Aide votre cerveau à se détendre pour un meilleur sommeil', 'evening', 'moon', 60, true),
('Body Thank You', 'Merci au Corps', 'Acknowledge something your body did today', 'Remerciez votre corps pour ce qu''il a fait aujourd''hui', 'Builds body appreciation and eases physical tension', 'Développe l''appréciation du corps et soulage les tensions', 'evening', 'hand', 2, true),
('Night Sky', 'Ciel Nocturne', '5 min outside or by window at dusk', '5 min dehors ou près de la fenêtre au crépuscule', 'Connects you to nature and signals day''s end', 'Vous connecte à la nature et signale la fin de la journée', 'evening', 'stars', 5, true);

-- Self-Care Rituals
INSERT INTO public.rituals (name, name_fr, description, description_fr, benefit, benefit_fr, category, icon, duration_suggestion, is_predefined) VALUES
('Solo Date', 'Rendez-vous Solo', 'Plan one thing just for you', 'Planifiez une chose juste pour vous', 'Reminds you that your needs matter too', 'Rappelle que vos besoins comptent aussi', 'selfcare', 'calendar-heart', 5, true),
('Comfort Check', 'Bilan Confort', 'What''s bringing you comfort today?', 'Qu''est-ce qui vous apporte du confort aujourd''hui?', 'Helps you notice and protect what feels good', 'Vous aide à remarquer et protéger ce qui fait du bien', 'selfcare', 'sofa', 3, true),
('Future Note', 'Note du Futur', 'Write a message to yourself in 1 week', 'Écrivez un message à vous-même pour dans 1 semaine', 'Creates a kind surprise from past-you', 'Crée une gentille surprise de votre vous du passé', 'selfcare', 'mail', 5, true),
('Joy Audit', 'Audit de Joie', 'What made you smile today?', 'Qu''est-ce qui vous a fait sourire aujourd''hui?', 'Trains your brain to notice the good', 'Entraîne votre cerveau à remarquer le positif', 'selfcare', 'smile', 3, true),
('Boundary Win', 'Victoire de Limite', 'One thing you protected today', 'Une chose que vous avez protégée aujourd''hui', 'Celebrates self-respect and builds confidence', 'Célèbre le respect de soi et renforce la confiance', 'selfcare', 'shield', 2, true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.rituals IS 'Master list of predefined and custom rituals';
COMMENT ON TABLE public.member_rituals IS 'Member-specific ritual selections and preferences';
COMMENT ON TABLE public.ritual_completions IS 'Daily ritual completion tracking';
