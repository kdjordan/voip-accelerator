-- Migration: Seed Enhanced LERG Table with Initial Data
-- Description: Populates enhanced_lerg table with known NPAs including missing ones like 438
-- Author: VoIP Accelerator Team
-- Date: 2025-06-28
-- Note: This migration depends on 20250628161522_create_enhanced_lerg_table.sql

BEGIN;

-- First, let's migrate any existing LERG data if the table exists
-- This preserves any data already in the system
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lerg') THEN
        INSERT INTO public.enhanced_lerg (
            npa, 
            country_code, 
            country_name,
            state_province_code, 
            state_province_name,
            region,
            category,
            source,
            confidence_score
        )
        SELECT DISTINCT
            l.npa,
            l.country,
            CASE l.country
                WHEN 'US' THEN 'United States'
                WHEN 'CA' THEN 'Canada'
                WHEN 'BS' THEN 'Bahamas'
                WHEN 'BB' THEN 'Barbados'
                WHEN 'JM' THEN 'Jamaica'
                WHEN 'TT' THEN 'Trinidad and Tobago'
                WHEN 'DO' THEN 'Dominican Republic'
                WHEN 'PR' THEN 'Puerto Rico'
                WHEN 'VI' THEN 'U.S. Virgin Islands'
                WHEN 'GU' THEN 'Guam'
                WHEN 'AS' THEN 'American Samoa'
                WHEN 'MP' THEN 'Northern Mariana Islands'
                ELSE l.country
            END as country_name,
            l.state,
            l.state as state_province_name, -- Will be updated below
            'Unknown' as region, -- Will be updated below
            CASE 
                WHEN l.country = 'US' THEN 'us-domestic'
                WHEN l.country = 'CA' THEN 'canadian'
                WHEN l.country IN ('AS', 'GU', 'MP') THEN 'pacific'
                ELSE 'caribbean'
            END as category,
            'lerg' as source,
            0.90 as confidence_score -- Lower confidence since names are missing
        FROM public.lerg l
        ON CONFLICT (npa) DO NOTHING;
        
        RAISE NOTICE 'Migrated existing LERG data';
    END IF;
END $$;

-- Now insert comprehensive seed data with full geographic context
-- This includes the missing NPAs like 438 and provides complete names

-- US Domestic NPAs with full state names
INSERT INTO public.enhanced_lerg (npa, country_code, country_name, state_province_code, state_province_name, region, category, source, confidence_score) VALUES
-- Northeast Region
('201', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('202', 'US', 'United States', 'DC', 'District of Columbia', 'Northeast', 'us-domestic', 'seed', 1.00),
('203', 'US', 'United States', 'CT', 'Connecticut', 'Northeast', 'us-domestic', 'seed', 1.00),
('207', 'US', 'United States', 'ME', 'Maine', 'Northeast', 'us-domestic', 'seed', 1.00),
('212', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('215', 'US', 'United States', 'PA', 'Pennsylvania', 'Northeast', 'us-domestic', 'seed', 1.00),
('267', 'US', 'United States', 'PA', 'Pennsylvania', 'Northeast', 'us-domestic', 'seed', 1.00),
('301', 'US', 'United States', 'MD', 'Maryland', 'Northeast', 'us-domestic', 'seed', 1.00),
('302', 'US', 'United States', 'DE', 'Delaware', 'Northeast', 'us-domestic', 'seed', 1.00),
('315', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('347', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('401', 'US', 'United States', 'RI', 'Rhode Island', 'Northeast', 'us-domestic', 'seed', 1.00),
('413', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('508', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('516', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('518', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('603', 'US', 'United States', 'NH', 'New Hampshire', 'Northeast', 'us-domestic', 'seed', 1.00),
('607', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('609', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('610', 'US', 'United States', 'PA', 'Pennsylvania', 'Northeast', 'us-domestic', 'seed', 1.00),
('617', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('631', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('646', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('716', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('717', 'US', 'United States', 'PA', 'Pennsylvania', 'Northeast', 'us-domestic', 'seed', 1.00),
('718', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('732', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('774', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('781', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('802', 'US', 'United States', 'VT', 'Vermont', 'Northeast', 'us-domestic', 'seed', 1.00),
('845', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('848', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('856', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('857', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),
('860', 'US', 'United States', 'CT', 'Connecticut', 'Northeast', 'us-domestic', 'seed', 1.00),
('862', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('908', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('914', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('917', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('929', 'US', 'United States', 'NY', 'New York', 'Northeast', 'us-domestic', 'seed', 1.00),
('959', 'US', 'United States', 'CT', 'Connecticut', 'Northeast', 'us-domestic', 'seed', 1.00),
('973', 'US', 'United States', 'NJ', 'New Jersey', 'Northeast', 'us-domestic', 'seed', 1.00),
('978', 'US', 'United States', 'MA', 'Massachusetts', 'Northeast', 'us-domestic', 'seed', 1.00),

-- South Region
('205', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('210', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('214', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('225', 'US', 'United States', 'LA', 'Louisiana', 'South', 'us-domestic', 'seed', 1.00),
('228', 'US', 'United States', 'MS', 'Mississippi', 'South', 'us-domestic', 'seed', 1.00),
('229', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('239', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('240', 'US', 'United States', 'MD', 'Maryland', 'South', 'us-domestic', 'seed', 1.00),
('251', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('252', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('254', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('256', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('270', 'US', 'United States', 'KY', 'Kentucky', 'South', 'us-domestic', 'seed', 1.00),
('276', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('281', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('305', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('318', 'US', 'United States', 'LA', 'Louisiana', 'South', 'us-domestic', 'seed', 1.00),
('321', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('325', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('334', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('336', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('337', 'US', 'United States', 'LA', 'Louisiana', 'South', 'us-domestic', 'seed', 1.00),
('346', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('352', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('361', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('386', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('404', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('405', 'US', 'United States', 'OK', 'Oklahoma', 'South', 'us-domestic', 'seed', 1.00),
('407', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('409', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('423', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('430', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('434', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('469', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('470', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('478', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('479', 'US', 'United States', 'AR', 'Arkansas', 'South', 'us-domestic', 'seed', 1.00),
('501', 'US', 'United States', 'AR', 'Arkansas', 'South', 'us-domestic', 'seed', 1.00),
('502', 'US', 'United States', 'KY', 'Kentucky', 'South', 'us-domestic', 'seed', 1.00),
('504', 'US', 'United States', 'LA', 'Louisiana', 'South', 'us-domestic', 'seed', 1.00),
('512', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('539', 'US', 'United States', 'OK', 'Oklahoma', 'South', 'us-domestic', 'seed', 1.00),
('540', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('561', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('571', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('601', 'US', 'United States', 'MS', 'Mississippi', 'South', 'us-domestic', 'seed', 1.00),
('615', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('629', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('659', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('662', 'US', 'United States', 'MS', 'Mississippi', 'South', 'us-domestic', 'seed', 1.00),
('678', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('681', 'US', 'United States', 'WV', 'West Virginia', 'South', 'us-domestic', 'seed', 1.00),
('682', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('703', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('704', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('706', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('713', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('726', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('727', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('737', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('743', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('754', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('757', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('762', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('769', 'US', 'United States', 'MS', 'Mississippi', 'South', 'us-domestic', 'seed', 1.00),
('770', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('772', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('786', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('803', 'US', 'United States', 'SC', 'South Carolina', 'South', 'us-domestic', 'seed', 1.00),
('804', 'US', 'United States', 'VA', 'Virginia', 'South', 'us-domestic', 'seed', 1.00),
('806', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('813', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('817', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('828', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('830', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('832', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('843', 'US', 'United States', 'SC', 'South Carolina', 'South', 'us-domestic', 'seed', 1.00),
('850', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('854', 'US', 'United States', 'SC', 'South Carolina', 'South', 'us-domestic', 'seed', 1.00),
('859', 'US', 'United States', 'KY', 'Kentucky', 'South', 'us-domestic', 'seed', 1.00),
('863', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('864', 'US', 'United States', 'SC', 'South Carolina', 'South', 'us-domestic', 'seed', 1.00),
('865', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('870', 'US', 'United States', 'AR', 'Arkansas', 'South', 'us-domestic', 'seed', 1.00),
('901', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('903', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('904', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('910', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('912', 'US', 'United States', 'GA', 'Georgia', 'South', 'us-domestic', 'seed', 1.00),
('915', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('918', 'US', 'United States', 'OK', 'Oklahoma', 'South', 'us-domestic', 'seed', 1.00),
('919', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('931', 'US', 'United States', 'TN', 'Tennessee', 'South', 'us-domestic', 'seed', 1.00),
('936', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('938', 'US', 'United States', 'AL', 'Alabama', 'South', 'us-domestic', 'seed', 1.00),
('940', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('941', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('945', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('954', 'US', 'United States', 'FL', 'Florida', 'South', 'us-domestic', 'seed', 1.00),
('956', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('972', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('979', 'US', 'United States', 'TX', 'Texas', 'South', 'us-domestic', 'seed', 1.00),
('980', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('984', 'US', 'United States', 'NC', 'North Carolina', 'South', 'us-domestic', 'seed', 1.00),
('985', 'US', 'United States', 'LA', 'Louisiana', 'South', 'us-domestic', 'seed', 1.00),

-- Midwest Region
('216', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('217', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('218', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('219', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('220', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('224', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('234', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('248', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('260', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('262', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('269', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('309', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('312', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('313', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('314', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('316', 'US', 'United States', 'KS', 'Kansas', 'Midwest', 'us-domestic', 'seed', 1.00),
('317', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('319', 'US', 'United States', 'IA', 'Iowa', 'Midwest', 'us-domestic', 'seed', 1.00),
('320', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('330', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('331', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('380', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('402', 'US', 'United States', 'NE', 'Nebraska', 'Midwest', 'us-domestic', 'seed', 1.00),
('414', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('417', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('419', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('440', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('463', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('507', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('513', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('515', 'US', 'United States', 'IA', 'Iowa', 'Midwest', 'us-domestic', 'seed', 1.00),
('517', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('534', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('563', 'US', 'United States', 'IA', 'Iowa', 'Midwest', 'us-domestic', 'seed', 1.00),
('567', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('573', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('574', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('586', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('605', 'US', 'United States', 'SD', 'South Dakota', 'Midwest', 'us-domestic', 'seed', 1.00),
('608', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('612', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('614', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('616', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('618', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('620', 'US', 'United States', 'KS', 'Kansas', 'Midwest', 'us-domestic', 'seed', 1.00),
('630', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('636', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('641', 'US', 'United States', 'IA', 'Iowa', 'Midwest', 'us-domestic', 'seed', 1.00),
('651', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('660', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('701', 'US', 'United States', 'ND', 'North Dakota', 'Midwest', 'us-domestic', 'seed', 1.00),
('708', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('712', 'US', 'United States', 'IA', 'Iowa', 'Midwest', 'us-domestic', 'seed', 1.00),
('715', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('734', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('740', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('763', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('765', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('773', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('779', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('785', 'US', 'United States', 'KS', 'Kansas', 'Midwest', 'us-domestic', 'seed', 1.00),
('810', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('812', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('815', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('816', 'US', 'United States', 'MO', 'Missouri', 'Midwest', 'us-domestic', 'seed', 1.00),
('847', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('872', 'US', 'United States', 'IL', 'Illinois', 'Midwest', 'us-domestic', 'seed', 1.00),
('906', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('913', 'US', 'United States', 'KS', 'Kansas', 'Midwest', 'us-domestic', 'seed', 1.00),
('920', 'US', 'United States', 'WI', 'Wisconsin', 'Midwest', 'us-domestic', 'seed', 1.00),
('930', 'US', 'United States', 'IN', 'Indiana', 'Midwest', 'us-domestic', 'seed', 1.00),
('937', 'US', 'United States', 'OH', 'Ohio', 'Midwest', 'us-domestic', 'seed', 1.00),
('947', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),
('952', 'US', 'United States', 'MN', 'Minnesota', 'Midwest', 'us-domestic', 'seed', 1.00),
('989', 'US', 'United States', 'MI', 'Michigan', 'Midwest', 'us-domestic', 'seed', 1.00),

-- West Region
('206', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('208', 'US', 'United States', 'ID', 'Idaho', 'West', 'us-domestic', 'seed', 1.00),
('209', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('213', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('253', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('303', 'US', 'United States', 'CO', 'Colorado', 'West', 'us-domestic', 'seed', 1.00),
('307', 'US', 'United States', 'WY', 'Wyoming', 'West', 'us-domestic', 'seed', 1.00),
('310', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('323', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('341', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('360', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('385', 'US', 'United States', 'UT', 'Utah', 'West', 'us-domestic', 'seed', 1.00),
('406', 'US', 'United States', 'MT', 'Montana', 'West', 'us-domestic', 'seed', 1.00),
('408', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('415', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('424', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('425', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('435', 'US', 'United States', 'UT', 'Utah', 'West', 'us-domestic', 'seed', 1.00),
('442', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('458', 'US', 'United States', 'OR', 'Oregon', 'West', 'us-domestic', 'seed', 1.00),
('480', 'US', 'United States', 'AZ', 'Arizona', 'West', 'us-domestic', 'seed', 1.00),
('503', 'US', 'United States', 'OR', 'Oregon', 'West', 'us-domestic', 'seed', 1.00),
('505', 'US', 'United States', 'NM', 'New Mexico', 'West', 'us-domestic', 'seed', 1.00),
('509', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('510', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('520', 'US', 'United States', 'AZ', 'Arizona', 'West', 'us-domestic', 'seed', 1.00),
('530', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('541', 'US', 'United States', 'OR', 'Oregon', 'West', 'us-domestic', 'seed', 1.00),
('559', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('562', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('564', 'US', 'United States', 'WA', 'Washington', 'West', 'us-domestic', 'seed', 1.00),
('575', 'US', 'United States', 'NM', 'New Mexico', 'West', 'us-domestic', 'seed', 1.00),
('602', 'US', 'United States', 'AZ', 'Arizona', 'West', 'us-domestic', 'seed', 1.00),
('619', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('623', 'US', 'United States', 'AZ', 'Arizona', 'West', 'us-domestic', 'seed', 1.00),
('626', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('628', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('650', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('657', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('661', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('669', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('702', 'US', 'United States', 'NV', 'Nevada', 'West', 'us-domestic', 'seed', 1.00),
('707', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('714', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('719', 'US', 'United States', 'CO', 'Colorado', 'West', 'us-domestic', 'seed', 1.00),
('720', 'US', 'United States', 'CO', 'Colorado', 'West', 'us-domestic', 'seed', 1.00),
('725', 'US', 'United States', 'NV', 'Nevada', 'West', 'us-domestic', 'seed', 1.00),
('747', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('760', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('775', 'US', 'United States', 'NV', 'Nevada', 'West', 'us-domestic', 'seed', 1.00),
('801', 'US', 'United States', 'UT', 'Utah', 'West', 'us-domestic', 'seed', 1.00),
('805', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('808', 'US', 'United States', 'HI', 'Hawaii', 'West', 'us-domestic', 'seed', 1.00),
('818', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('820', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('831', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('840', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('858', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('907', 'US', 'United States', 'AK', 'Alaska', 'West', 'us-domestic', 'seed', 1.00),
('909', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('916', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('925', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('928', 'US', 'United States', 'AZ', 'Arizona', 'West', 'us-domestic', 'seed', 1.00),
('949', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('951', 'US', 'United States', 'CA', 'California', 'West', 'us-domestic', 'seed', 1.00),
('970', 'US', 'United States', 'CO', 'Colorado', 'West', 'us-domestic', 'seed', 1.00),
('971', 'US', 'United States', 'OR', 'Oregon', 'West', 'us-domestic', 'seed', 1.00),
('983', 'US', 'United States', 'CO', 'Colorado', 'West', 'us-domestic', 'seed', 1.00),
('986', 'US', 'United States', 'ID', 'Idaho', 'West', 'us-domestic', 'seed', 1.00),

-- Canadian NPAs with full province names (INCLUDING 438!)
('204', 'CA', 'Canada', 'MB', 'Manitoba', 'Prairie', 'canadian', 'seed', 1.00),
('226', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('236', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian', 'seed', 1.00),
('249', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('250', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian', 'seed', 1.00),
('289', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('306', 'CA', 'Canada', 'SK', 'Saskatchewan', 'Prairie', 'canadian', 'seed', 1.00),
('343', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('365', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('367', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('368', 'CA', 'Canada', 'AB', 'Alberta', 'Western', 'canadian', 'seed', 1.00),
('382', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('387', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('403', 'CA', 'Canada', 'AB', 'Alberta', 'Western', 'canadian', 'seed', 1.00),
('416', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('418', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('428', 'CA', 'Canada', 'NB', 'New Brunswick', 'Atlantic', 'canadian', 'seed', 1.00),
('431', 'CA', 'Canada', 'MB', 'Manitoba', 'Prairie', 'canadian', 'seed', 1.00),
('437', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('438', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00), -- THE MISSING NPA!
('450', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('468', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('474', 'CA', 'Canada', 'SK', 'Saskatchewan', 'Prairie', 'canadian', 'seed', 1.00),
('506', 'CA', 'Canada', 'NB', 'New Brunswick', 'Atlantic', 'canadian', 'seed', 1.00),
('514', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('519', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('548', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('579', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('581', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('584', 'CA', 'Canada', 'MB', 'Manitoba', 'Prairie', 'canadian', 'seed', 1.00),
('587', 'CA', 'Canada', 'AB', 'Alberta', 'Western', 'canadian', 'seed', 1.00),
('604', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian', 'seed', 1.00),
('613', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('639', 'CA', 'Canada', 'SK', 'Saskatchewan', 'Prairie', 'canadian', 'seed', 1.00),
('647', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('672', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian', 'seed', 1.00),
('683', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('705', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('709', 'CA', 'Canada', 'NL', 'Newfoundland and Labrador', 'Atlantic', 'canadian', 'seed', 1.00),
('742', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('753', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('778', 'CA', 'Canada', 'BC', 'British Columbia', 'Western', 'canadian', 'seed', 1.00),
('780', 'CA', 'Canada', 'AB', 'Alberta', 'Western', 'canadian', 'seed', 1.00),
('782', 'CA', 'Canada', 'NS', 'Nova Scotia', 'Atlantic', 'canadian', 'seed', 1.00),
('807', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('819', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('825', 'CA', 'Canada', 'AB', 'Alberta', 'Western', 'canadian', 'seed', 1.00),
('867', 'CA', 'Canada', 'NT', 'Northwest Territories', 'Northern', 'canadian', 'seed', 1.00),
('873', 'CA', 'Canada', 'QC', 'Quebec', 'Central', 'canadian', 'seed', 1.00),
('879', 'CA', 'Canada', 'NL', 'Newfoundland and Labrador', 'Atlantic', 'canadian', 'seed', 1.00),
('902', 'CA', 'Canada', 'NS', 'Nova Scotia', 'Atlantic', 'canadian', 'seed', 1.00),
('905', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),
('942', 'CA', 'Canada', 'ON', 'Ontario', 'Central', 'canadian', 'seed', 1.00),

-- Caribbean NPAs with full country names
('242', 'BS', 'Bahamas', 'BS', 'Bahamas', 'Caribbean', 'caribbean', 'seed', 1.00),
('246', 'BB', 'Barbados', 'BB', 'Barbados', 'Caribbean', 'caribbean', 'seed', 1.00),
('264', 'AI', 'Anguilla', 'AI', 'Anguilla', 'Caribbean', 'caribbean', 'seed', 1.00),
('268', 'AG', 'Antigua and Barbuda', 'AG', 'Antigua and Barbuda', 'Caribbean', 'caribbean', 'seed', 1.00),
('284', 'VG', 'British Virgin Islands', 'VG', 'British Virgin Islands', 'Caribbean', 'caribbean', 'seed', 1.00),
('340', 'VI', 'U.S. Virgin Islands', 'VI', 'U.S. Virgin Islands', 'Caribbean', 'caribbean', 'seed', 1.00),
('345', 'KY', 'Cayman Islands', 'KY', 'Cayman Islands', 'Caribbean', 'caribbean', 'seed', 1.00),
('441', 'BM', 'Bermuda', 'BM', 'Bermuda', 'Caribbean', 'caribbean', 'seed', 1.00),
('473', 'GD', 'Grenada', 'GD', 'Grenada', 'Caribbean', 'caribbean', 'seed', 1.00),
('649', 'TC', 'Turks and Caicos Islands', 'TC', 'Turks and Caicos Islands', 'Caribbean', 'caribbean', 'seed', 1.00),
('658', 'JM', 'Jamaica', 'JM', 'Jamaica', 'Caribbean', 'caribbean', 'seed', 1.00),
('664', 'MS', 'Montserrat', 'MS', 'Montserrat', 'Caribbean', 'caribbean', 'seed', 1.00),
('721', 'SX', 'Sint Maarten', 'SX', 'Sint Maarten', 'Caribbean', 'caribbean', 'seed', 1.00),
('758', 'LC', 'Saint Lucia', 'LC', 'Saint Lucia', 'Caribbean', 'caribbean', 'seed', 1.00),
('767', 'DM', 'Dominica', 'DM', 'Dominica', 'Caribbean', 'caribbean', 'seed', 1.00),
('784', 'VC', 'Saint Vincent and the Grenadines', 'VC', 'Saint Vincent and the Grenadines', 'Caribbean', 'caribbean', 'seed', 1.00),
('787', 'PR', 'Puerto Rico', 'PR', 'Puerto Rico', 'Caribbean', 'caribbean', 'seed', 1.00),
('809', 'DO', 'Dominican Republic', 'DO', 'Dominican Republic', 'Caribbean', 'caribbean', 'seed', 1.00),
('829', 'DO', 'Dominican Republic', 'DO', 'Dominican Republic', 'Caribbean', 'caribbean', 'seed', 1.00),
('849', 'DO', 'Dominican Republic', 'DO', 'Dominican Republic', 'Caribbean', 'caribbean', 'seed', 1.00),
('868', 'TT', 'Trinidad and Tobago', 'TT', 'Trinidad and Tobago', 'Caribbean', 'caribbean', 'seed', 1.00),
('869', 'KN', 'Saint Kitts and Nevis', 'KN', 'Saint Kitts and Nevis', 'Caribbean', 'caribbean', 'seed', 1.00),
('876', 'JM', 'Jamaica', 'JM', 'Jamaica', 'Caribbean', 'caribbean', 'seed', 1.00),
('939', 'PR', 'Puerto Rico', 'PR', 'Puerto Rico', 'Caribbean', 'caribbean', 'seed', 1.00),

-- Pacific NPAs with full territory names
('670', 'MP', 'Northern Mariana Islands', 'MP', 'Northern Mariana Islands', 'Pacific', 'pacific', 'seed', 1.00),
('671', 'GU', 'Guam', 'GU', 'Guam', 'Pacific', 'pacific', 'seed', 1.00),
('684', 'AS', 'American Samoa', 'AS', 'American Samoa', 'Pacific', 'pacific', 'seed', 1.00)
ON CONFLICT (npa) DO UPDATE SET
  country_name = EXCLUDED.country_name,
  state_province_name = EXCLUDED.state_province_name,
  region = EXCLUDED.region,
  category = EXCLUDED.category,
  confidence_score = GREATEST(enhanced_lerg.confidence_score, EXCLUDED.confidence_score),
  updated_at = CURRENT_TIMESTAMP
WHERE enhanced_lerg.confidence_score < EXCLUDED.confidence_score;

-- Update any records that were migrated from the old LERG table
-- This fills in the missing names and regions
UPDATE public.enhanced_lerg el
SET 
  state_province_name = CASE
    -- US States
    WHEN el.country_code = 'US' AND el.state_province_code = 'AL' THEN 'Alabama'
    WHEN el.country_code = 'US' AND el.state_province_code = 'AK' THEN 'Alaska'
    WHEN el.country_code = 'US' AND el.state_province_code = 'AZ' THEN 'Arizona'
    WHEN el.country_code = 'US' AND el.state_province_code = 'AR' THEN 'Arkansas'
    WHEN el.country_code = 'US' AND el.state_province_code = 'CA' THEN 'California'
    WHEN el.country_code = 'US' AND el.state_province_code = 'CO' THEN 'Colorado'
    WHEN el.country_code = 'US' AND el.state_province_code = 'CT' THEN 'Connecticut'
    WHEN el.country_code = 'US' AND el.state_province_code = 'DE' THEN 'Delaware'
    WHEN el.country_code = 'US' AND el.state_province_code = 'DC' THEN 'District of Columbia'
    WHEN el.country_code = 'US' AND el.state_province_code = 'FL' THEN 'Florida'
    WHEN el.country_code = 'US' AND el.state_province_code = 'GA' THEN 'Georgia'
    WHEN el.country_code = 'US' AND el.state_province_code = 'HI' THEN 'Hawaii'
    WHEN el.country_code = 'US' AND el.state_province_code = 'ID' THEN 'Idaho'
    WHEN el.country_code = 'US' AND el.state_province_code = 'IL' THEN 'Illinois'
    WHEN el.country_code = 'US' AND el.state_province_code = 'IN' THEN 'Indiana'
    WHEN el.country_code = 'US' AND el.state_province_code = 'IA' THEN 'Iowa'
    WHEN el.country_code = 'US' AND el.state_province_code = 'KS' THEN 'Kansas'
    WHEN el.country_code = 'US' AND el.state_province_code = 'KY' THEN 'Kentucky'
    WHEN el.country_code = 'US' AND el.state_province_code = 'LA' THEN 'Louisiana'
    WHEN el.country_code = 'US' AND el.state_province_code = 'ME' THEN 'Maine'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MD' THEN 'Maryland'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MA' THEN 'Massachusetts'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MI' THEN 'Michigan'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MN' THEN 'Minnesota'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MS' THEN 'Mississippi'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MO' THEN 'Missouri'
    WHEN el.country_code = 'US' AND el.state_province_code = 'MT' THEN 'Montana'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NE' THEN 'Nebraska'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NV' THEN 'Nevada'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NH' THEN 'New Hampshire'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NJ' THEN 'New Jersey'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NM' THEN 'New Mexico'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NY' THEN 'New York'
    WHEN el.country_code = 'US' AND el.state_province_code = 'NC' THEN 'North Carolina'
    WHEN el.country_code = 'US' AND el.state_province_code = 'ND' THEN 'North Dakota'
    WHEN el.country_code = 'US' AND el.state_province_code = 'OH' THEN 'Ohio'
    WHEN el.country_code = 'US' AND el.state_province_code = 'OK' THEN 'Oklahoma'
    WHEN el.country_code = 'US' AND el.state_province_code = 'OR' THEN 'Oregon'
    WHEN el.country_code = 'US' AND el.state_province_code = 'PA' THEN 'Pennsylvania'
    WHEN el.country_code = 'US' AND el.state_province_code = 'RI' THEN 'Rhode Island'
    WHEN el.country_code = 'US' AND el.state_province_code = 'SC' THEN 'South Carolina'
    WHEN el.country_code = 'US' AND el.state_province_code = 'SD' THEN 'South Dakota'
    WHEN el.country_code = 'US' AND el.state_province_code = 'TN' THEN 'Tennessee'
    WHEN el.country_code = 'US' AND el.state_province_code = 'TX' THEN 'Texas'
    WHEN el.country_code = 'US' AND el.state_province_code = 'UT' THEN 'Utah'
    WHEN el.country_code = 'US' AND el.state_province_code = 'VT' THEN 'Vermont'
    WHEN el.country_code = 'US' AND el.state_province_code = 'VA' THEN 'Virginia'
    WHEN el.country_code = 'US' AND el.state_province_code = 'WA' THEN 'Washington'
    WHEN el.country_code = 'US' AND el.state_province_code = 'WV' THEN 'West Virginia'
    WHEN el.country_code = 'US' AND el.state_province_code = 'WI' THEN 'Wisconsin'
    WHEN el.country_code = 'US' AND el.state_province_code = 'WY' THEN 'Wyoming'
    -- Canadian Provinces
    WHEN el.country_code = 'CA' AND el.state_province_code = 'AB' THEN 'Alberta'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'BC' THEN 'British Columbia'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'MB' THEN 'Manitoba'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'NB' THEN 'New Brunswick'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'NL' THEN 'Newfoundland and Labrador'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'NS' THEN 'Nova Scotia'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'NT' THEN 'Northwest Territories'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'NU' THEN 'Nunavut'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'ON' THEN 'Ontario'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'PE' THEN 'Prince Edward Island'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'QC' THEN 'Quebec'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'SK' THEN 'Saskatchewan'
    WHEN el.country_code = 'CA' AND el.state_province_code = 'YT' THEN 'Yukon'
    ELSE el.state_province_name
  END,
  region = CASE
    -- US Regions
    WHEN el.country_code = 'US' AND el.state_province_code IN ('ME', 'NH', 'VT', 'MA', 'CT', 'RI', 'NY', 'NJ', 'PA', 'MD', 'DE', 'DC') THEN 'Northeast'
    WHEN el.country_code = 'US' AND el.state_province_code IN ('AL', 'AR', 'FL', 'GA', 'KY', 'LA', 'MS', 'NC', 'OK', 'SC', 'TN', 'TX', 'VA', 'WV') THEN 'South'
    WHEN el.country_code = 'US' AND el.state_province_code IN ('IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI') THEN 'Midwest'
    WHEN el.country_code = 'US' AND el.state_province_code IN ('AK', 'AZ', 'CA', 'CO', 'HI', 'ID', 'MT', 'NV', 'NM', 'OR', 'UT', 'WA', 'WY') THEN 'West'
    -- Canadian Regions
    WHEN el.country_code = 'CA' AND el.state_province_code IN ('AB', 'BC') THEN 'Western'
    WHEN el.country_code = 'CA' AND el.state_province_code IN ('MB', 'SK') THEN 'Prairie'
    WHEN el.country_code = 'CA' AND el.state_province_code IN ('ON', 'QC') THEN 'Central'
    WHEN el.country_code = 'CA' AND el.state_province_code IN ('NB', 'NL', 'NS', 'PE') THEN 'Atlantic'
    WHEN el.country_code = 'CA' AND el.state_province_code IN ('NT', 'NU', 'YT') THEN 'Northern'
    -- Caribbean
    WHEN el.category = 'caribbean' THEN 'Caribbean'
    -- Pacific
    WHEN el.category = 'pacific' THEN 'Pacific'
    ELSE el.region
  END,
  confidence_score = CASE
    WHEN el.source = 'lerg' AND el.confidence_score < 1.00 THEN 1.00
    ELSE el.confidence_score
  END
WHERE el.state_province_name = el.state_province_code 
   OR el.region = 'Unknown' 
   OR el.region IS NULL;

COMMIT;

-- Verification queries
DO $$
DECLARE
  npa_438_exists BOOLEAN;
  npa_450_exists BOOLEAN;
  total_count INTEGER;
  us_count INTEGER;
  ca_count INTEGER;
  caribbean_count INTEGER;
  pacific_count INTEGER;
BEGIN
  -- Check that 438 and 450 exist and are correctly categorized
  SELECT EXISTS(
    SELECT 1 FROM public.enhanced_lerg 
    WHERE npa = '438' 
      AND country_code = 'CA' 
      AND state_province_code = 'QC'
      AND state_province_name = 'Quebec'
      AND category = 'canadian'
  ) INTO npa_438_exists;
  
  SELECT EXISTS(
    SELECT 1 FROM public.enhanced_lerg 
    WHERE npa = '450' 
      AND country_code = 'CA' 
      AND state_province_code = 'QC'
      AND state_province_name = 'Quebec'
      AND category = 'canadian'
  ) INTO npa_450_exists;
  
  -- Get counts by category
  SELECT COUNT(*) INTO total_count FROM public.enhanced_lerg WHERE is_active = true;
  SELECT COUNT(*) INTO us_count FROM public.enhanced_lerg WHERE category = 'us-domestic' AND is_active = true;
  SELECT COUNT(*) INTO ca_count FROM public.enhanced_lerg WHERE category = 'canadian' AND is_active = true;
  SELECT COUNT(*) INTO caribbean_count FROM public.enhanced_lerg WHERE category = 'caribbean' AND is_active = true;
  SELECT COUNT(*) INTO pacific_count FROM public.enhanced_lerg WHERE category = 'pacific' AND is_active = true;
  
  -- Report results
  RAISE NOTICE 'Enhanced LERG Migration Complete!';
  RAISE NOTICE '================================';
  RAISE NOTICE 'NPA 438 (Quebec, Canada): %', CASE WHEN npa_438_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'NPA 450 (Quebec, Canada): %', CASE WHEN npa_450_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '--------------------------------';
  RAISE NOTICE 'Total NPAs: %', total_count;
  RAISE NOTICE 'US Domestic: %', us_count;
  RAISE NOTICE 'Canadian: %', ca_count;
  RAISE NOTICE 'Caribbean: %', caribbean_count;
  RAISE NOTICE 'Pacific: %', pacific_count;
  RAISE NOTICE '================================';
  
  IF NOT npa_438_exists OR NOT npa_450_exists THEN
    RAISE WARNING 'Critical NPAs are missing! Check the migration.';
  END IF;
END $$;