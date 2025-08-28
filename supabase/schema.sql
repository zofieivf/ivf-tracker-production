-- IVF Tracker Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    location TEXT,
    date_of_birth DATE,
    ivf_reasons TEXT[] DEFAULT '{}',
    ivf_reason_other TEXT,
    genetic_reasons_details TEXT,
    living_children INTEGER DEFAULT 0,
    children_from_ivf TEXT,
    number_of_ivf_children INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- IVF Cycles table
CREATE TABLE public.ivf_cycles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    protocol TEXT,
    clinic TEXT,
    notes TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cycle Days table
CREATE TABLE public.cycle_days (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE CASCADE,
    cycle_day INTEGER NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    side_effects TEXT,
    mood TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cycle_id, cycle_day)
);

-- Medications table
CREATE TABLE public.medications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT,
    unit TEXT,
    timing TEXT,
    start_day INTEGER,
    end_day INTEGER,
    is_trigger BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Daily Medication Status table
CREATE TABLE public.daily_medication_statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE,
    cycle_day INTEGER NOT NULL,
    date DATE NOT NULL,
    taken BOOLEAN DEFAULT FALSE,
    skipped BOOLEAN DEFAULT FALSE,
    taken_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cycle_id, medication_id, cycle_day)
);

-- Clinic Visits table
CREATE TABLE public.clinic_visits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE CASCADE,
    cycle_day INTEGER NOT NULL,
    date DATE NOT NULL,
    visit_type TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Follicle Measurements table
CREATE TABLE public.follicle_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES public.clinic_visits(id) ON DELETE CASCADE,
    size DECIMAL(4,1) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Bloodwork Results table
CREATE TABLE public.bloodwork_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    visit_id UUID REFERENCES public.clinic_visits(id) ON DELETE CASCADE,
    estradiol DECIMAL(8,2),
    lh DECIMAL(6,2),
    fsh DECIMAL(6,2),
    progesterone DECIMAL(6,2),
    hcg DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cycle Outcomes table
CREATE TABLE public.cycle_outcomes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cycle_id UUID REFERENCES public.ivf_cycles(id) ON DELETE CASCADE,
    eggs_retrieved INTEGER,
    eggs_mature INTEGER,
    eggs_fertilized INTEGER,
    embryos_day3 INTEGER,
    embryos_day5 INTEGER,
    embryos_frozen INTEGER,
    embryos_transferred INTEGER,
    transfer_date DATE,
    transfer_type TEXT,
    pregnancy_test_date DATE,
    pregnancy_test_result BOOLEAN,
    beta_hcg_1 DECIMAL(8,2),
    beta_hcg_2 DECIMAL(8,2),
    clinical_pregnancy BOOLEAN,
    ongoing_pregnancy BOOLEAN,
    live_birth BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(cycle_id)
);

-- Procedures table
CREATE TABLE public.procedures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    procedure_date DATE NOT NULL,
    clinic TEXT,
    notes TEXT,
    outcome TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Natural Pregnancies table
CREATE TABLE public.natural_pregnancies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date_of_conception DATE NOT NULL,
    pregnancy_test_date DATE,
    due_date DATE,
    outcome TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ivf_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_medication_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follicle_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloodwork_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.natural_pregnancies ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cycles" ON public.ivf_cycles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycles" ON public.ivf_cycles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycles" ON public.ivf_cycles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycles" ON public.ivf_cycles
    FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can manage own cycle days" ON public.cycle_days
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.ivf_cycles 
        WHERE ivf_cycles.id = cycle_days.cycle_id 
        AND ivf_cycles.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage own medications" ON public.medications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own procedures" ON public.procedures
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pregnancies" ON public.natural_pregnancies
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_ivf_cycles_user_id ON public.ivf_cycles(user_id);
CREATE INDEX idx_cycle_days_cycle_id ON public.cycle_days(cycle_id);
CREATE INDEX idx_medications_cycle_id ON public.medications(cycle_id);
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_daily_medication_statuses_cycle_id ON public.daily_medication_statuses(cycle_id);
CREATE INDEX idx_clinic_visits_cycle_id ON public.clinic_visits(cycle_id);
CREATE INDEX idx_procedures_user_id ON public.procedures(user_id);
CREATE INDEX idx_natural_pregnancies_user_id ON public.natural_pregnancies(user_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ivf_cycles_updated_at BEFORE UPDATE ON public.ivf_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycle_days_updated_at BEFORE UPDATE ON public.cycle_days
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_medication_statuses_updated_at BEFORE UPDATE ON public.daily_medication_statuses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinic_visits_updated_at BEFORE UPDATE ON public.clinic_visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bloodwork_results_updated_at BEFORE UPDATE ON public.bloodwork_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cycle_outcomes_updated_at BEFORE UPDATE ON public.cycle_outcomes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON public.procedures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_natural_pregnancies_updated_at BEFORE UPDATE ON public.natural_pregnancies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();