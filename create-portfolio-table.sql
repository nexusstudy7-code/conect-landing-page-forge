-- Create portfolio table for storing portfolio items
CREATE TABLE IF NOT EXISTS public.portfolio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('video', 'image', 'project')),
    image_url TEXT,
    video_url TEXT,
    client_name TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- Create policies for portfolio table
-- Allow public read access (for displaying portfolio on website)
CREATE POLICY "Allow public read access to portfolio"
    ON public.portfolio
    FOR SELECT
    USING (true);

-- Allow authenticated users (admins) to insert
CREATE POLICY "Allow authenticated users to insert portfolio items"
    ON public.portfolio
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users (admins) to update
CREATE POLICY "Allow authenticated users to update portfolio items"
    ON public.portfolio
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users (admins) to delete
CREATE POLICY "Allow authenticated users to delete portfolio items"
    ON public.portfolio
    FOR DELETE
    TO authenticated
    USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON public.portfolio(category);
CREATE INDEX IF NOT EXISTS idx_portfolio_created_at ON public.portfolio(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_portfolio_updated_at
    BEFORE UPDATE ON public.portfolio
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions
GRANT SELECT ON public.portfolio TO anon;
GRANT ALL ON public.portfolio TO authenticated;
