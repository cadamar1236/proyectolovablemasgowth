-- Migration 0033: Venture Capitals database
-- Comprehensive VC directory queried by Astro to recommend investors

CREATE TABLE IF NOT EXISTS venture_capitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT,                        -- primary country HQ
  geography TEXT,                      -- comma-separated: Spain,LatAm,USA,Europe,Global
  stage TEXT,                          -- comma-separated: pre-seed,seed,series-a,series-b,growth
  sectors TEXT,                        -- comma-separated: AI,SaaS,Fintech,Health,EdTech,B2B,B2C,Marketplace,DeepTech,Consumer,Other
  min_ticket_usd INTEGER DEFAULT 0,    -- minimum ticket in USD
  max_ticket_usd INTEGER DEFAULT 0,    -- maximum ticket in USD
  typical_equity_pct REAL DEFAULT 0,   -- typical equity taken (%)
  website TEXT,
  contact_email TEXT,
  linkedin TEXT,
  description TEXT,                    -- one-line pitch of what they look for
  portfolio_examples TEXT,             -- comma-separated notable portfolio companies
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vc_stage ON venture_capitals(stage);
CREATE INDEX IF NOT EXISTS idx_vc_geography ON venture_capitals(geography);
CREATE INDEX IF NOT EXISTS idx_vc_sectors ON venture_capitals(sectors);

-- ============================================================
-- ACCELERATORS & PRE-SEED
-- ============================================================
INSERT INTO venture_capitals (name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples) VALUES
('Y Combinator', 'USA', 'USA,Global', 'pre-seed,seed', 'AI,SaaS,Fintech,Health,EdTech,B2B,B2C,Marketplace,DeepTech,Consumer,Other', 125000, 500000, 7, 'https://ycombinator.com', 'El mejor acelerador del mundo. $500K por 7%. Aplica si tienes un MVP mínimo y tracción temprana.', 'Airbnb,Stripe,Dropbox,Coinbase,DoorDash,Instacart'),
('Techstars', 'USA', 'USA,Global,Europe,LatAm', 'pre-seed,seed', 'AI,SaaS,Fintech,Health,B2B,Consumer,Other', 20000, 120000, 6, 'https://techstars.com', '$120K por 6% equity. Red global de mentores, corporates y alumni. Múltiples programas por sector.', 'SendGrid,DigitalOcean,ClassPass,PillPack'),
('Antler', 'Singapore', 'Global,Europe,USA,LatAm', 'pre-seed', 'AI,SaaS,Fintech,Health,B2B,Consumer,Other', 100000, 250000, 10, 'https://antler.co', 'Co-building desde cero. Ideal para founders en etapa muy temprana o buscando co-founder. Sin MVP requerido.', 'Priceblocs,Passionfroot,Doxa'),
('Entrepreneur First', 'UK', 'Europe,Global,USA', 'pre-seed', 'AI,DeepTech,SaaS,B2B', 80000, 250000, 10, 'https://joinef.com', 'El mejor programa de cofounding del mundo. Reclutan talento individual y forman equipos. Muy selectivo.', 'Tractable,Magic Pony,Omnipresent'),
('HF0', 'USA', 'USA', 'pre-seed,seed', 'AI,SaaS,B2B,Consumer', 500000, 500000, 5, 'https://hf0.com', '$500K por 5%. Residencia intensiva de 6 semanas en San Francisco. Muy pequeño y selectivo.', 'N/A'),
('Seedcamp', 'UK', 'Europe,Global', 'pre-seed,seed', 'SaaS,B2B,AI,Fintech,Marketplace', 200000, 2000000, 7, 'https://seedcamp.com', 'El acelerador líder en Europa. €200K–€2M. Especialistas en B2B SaaS europeo y global desde early.', 'Revolut,Wise,UiPath,Phoebe,Loom'),
('500 Global', 'USA', 'USA,Global,LatAm,Asia', 'pre-seed,seed', 'AI,SaaS,Fintech,Consumer,Marketplace,B2B', 150000, 500000, 6, 'https://500.co', 'Fondo diversificado global. Batch programs por geografía. Fuerte en LatAm (500 Latam).', 'Credit Karma,Grab,Twilio,Canva'),
('Plug and Play', 'USA', 'USA,Global,Europe', 'pre-seed,seed', 'AI,SaaS,Fintech,Health,B2B,DeepTech', 25000, 250000, 5, 'https://plugandplaytechcenter.com', 'Acelerador corporativo global con programas sectoriales. Fuerte en corporate connections.', 'PayPal,Dropbox,Honey,N26'),
('MassChallenge', 'USA', 'USA,Europe,LatAm', 'pre-seed,seed', 'Health,AI,SaaS,B2B,Consumer,Other', 0, 100000, 0, 'https://masschallenge.org', 'Non-equity accelerator. Premios en efectivo y recursos. Ideal para startups con impacto.', 'N/A'),
('Starta Ventures', 'USA', 'USA,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,DeepTech', 50000, 500000, 7, 'https://starta.vc', 'Acelerador para startups de Europa del Este y CIS con ambición global. NYC-based.', 'N/A'),
('Wayra', 'Spain', 'Spain,LatAm,Europe', 'pre-seed,seed', 'AI,SaaS,Fintech,Health,B2B,Consumer', 50000, 200000, 7, 'https://wayra.com', 'Acelerador corporativo de Telefónica. Fuerte acceso a clientes corporativos en España y LatAm.', 'N/A'),
('IESE BAN', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,Fintech,Health', 50000, 500000, 10, 'https://iese.edu', 'Red de business angels vinculada a IESE Business School. Tickets entre €50K y €500K.', 'N/A'),
('Big Sur Ventures', 'Spain', 'Spain,LatAm', 'pre-seed,seed', 'AI,SaaS,B2B,Fintech,Consumer', 100000, 1000000, 10, 'https://bigsurventures.com', 'Fondo de VC enfocado en startups españolas con ambición global. Muy activo en Madrid.', 'N/A'),
('Lanzadera', 'Spain', 'Spain', 'pre-seed,seed', 'AI,SaaS,B2B,Consumer,Other', 0, 300000, 0, 'https://lanzadera.es', 'Aceleradora de Juan Roig (Mercadona). Sin equity en programa. Subvenciones y recursos en Valencia.', 'N/A'),
('Ufounders', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,Fintech', 25000, 200000, 8, 'https://ufounders.com', 'Aceleradora española con foco en early stage. Networking fuerte en ecosistema tech español.', 'N/A'),
('Demium', 'Spain', 'Spain,Europe', 'pre-seed', 'AI,SaaS,B2B,Consumer,Other', 50000, 150000, 10, 'https://demium.com', 'Programa de ideación y co-founding. Reclutar talento individual y construir equipos desde cero.', 'N/A'),
('Seedrocket', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,Consumer,Marketplace', 25000, 100000, 7, 'https://seedrocket.com', 'Aceleradora de business angels españoles. Muy bien conectada con ecosistema inversor en España.', 'N/A'),
('BIND 4.0', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,B2B,DeepTech,Health', 0, 0, 0, 'https://bind40.com', 'Acelerador industrial del País Vasco para startups B2B con producto físico o deeptech industrial.', 'N/A'),
('Conector', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,Consumer', 20000, 100000, 5, 'https://conector.com', 'Programa de mentoring de Barcelona. Fuerte en ecosistema startup catalán.', 'N/A');

-- ============================================================
-- SEED VCs
-- ============================================================
INSERT INTO venture_capitals (name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples) VALUES
('Point Nine Capital', 'Germany', 'Europe,Global', 'seed,series-a', 'SaaS,B2B,Marketplace', 500000, 3000000, 10, 'https://pointninecap.com', 'Referentes mundiales en B2B SaaS. Aman los SaaS con NRR >100% y fuerte retención. No hacen consumer.', 'Zendesk,Delivery Hero,Loom,Algolia,Typeform,Contentful'),
('Notion Capital', 'UK', 'Europe', 'seed,series-a', 'SaaS,B2B,Fintech', 1000000, 5000000, 10, 'https://notioncapital.com', 'B2B SaaS europeo especialistas. Buscan startups con ARR €500K+ y net dollar retention >110%.', 'GoCardless,Paddle,Tessian'),
('Balderton Capital', 'UK', 'Europe,Global', 'seed,series-a,series-b', 'SaaS,AI,Fintech,Consumer,Marketplace,B2B', 1000000, 15000000, 15, 'https://balderton.com', 'Top tier europeo. Seed a Series B. Buscan compañías con potencial para dominar mercados globales.', 'Revolut,Betfair,MySQL,The Hut Group,Darktrace'),
('Creandum', 'Sweden', 'Europe,Global', 'seed,series-a', 'SaaS,B2B,Consumer,Fintech,AI', 1000000, 8000000, 12, 'https://creandum.com', 'Top fondo nórdico. Generalmente primero en investir. Muy buenos en B2C consumer europeo.', 'Spotify,iZettle,Kry,Kognity,Depop'),
('Index Ventures', 'UK', 'Europe,USA,Global', 'seed,series-a,series-b', 'SaaS,AI,Fintech,Consumer,B2B,Marketplace', 1000000, 15000000, 12, 'https://indexventures.com', 'Top-tier europeo-americano. Muy selectivo, buscan categorías de mercado enormes y equipos excepcionales.', 'Figma,Slack,Robinhood,Discord,Revolut,Dropbox'),
('Kaszek Ventures', 'Argentina', 'LatAm', 'seed,series-a,series-b', 'SaaS,Fintech,Health,Marketplace,Consumer,B2B', 500000, 20000000, 15, 'https://kaszek.com', 'El VC más importante de LatAm. Fundado por ex-founders de MercadoLibre. Cubren toda la región.', 'Nubank,QuintoAndar,Gympass,NotCo,Bitso'),
('ALLVP', 'Mexico', 'LatAm', 'seed,series-a', 'SaaS,Fintech,Marketplace,B2B,Consumer,Health', 500000, 5000000, 15, 'https://allvp.vc', 'El fondo más activo en México. Fuerte en startups con modelo de negocio probado expandiendo región.', 'Clip,Konfío,Yummy,Yalochat'),
('Nazca Ventures', 'Spain', 'Spain,LatAm,Europe', 'seed,series-a', 'SaaS,B2B,Fintech,AI,Marketplace', 200000, 3000000, 12, 'https://nazca.vc', 'Puente entre España y LatAm. Perfectos para startups con doble tracción en ambas regiones.', 'N/A'),
('Samaipata', 'Spain', 'Spain,Europe,LatAm', 'seed,series-a', 'Marketplace,SaaS,Consumer,B2B', 500000, 5000000, 15, 'https://samaipata.vc', 'Foco en marketplaces y plataformas. Muy activos en España y LatAm. Buenos operadores.', 'BeSoccer,VidaCaixa digital,Cuidum'),
('Bankinter Innovation Foundation', 'Spain', 'Spain,Europe', 'seed,series-a', 'Fintech,AI,SaaS,B2B', 200000, 2000000, 10, 'https://bankinterinnovation.com', 'Fondo corporativo de Bankinter. Fuerte en Fintech y startups B2B con clientes financieros.', 'N/A'),
('K Fund', 'Spain', 'Spain,Europe', 'seed,series-a', 'SaaS,B2B,Consumer,AI,Marketplace', 200000, 3000000, 15, 'https://kfund.vc', 'Uno de los fondos más activos en España. Fundado por Carto co-founder. Fuerte en SaaS y marketplaces.', 'Veridas,Bdeo,Cobee,Phorest'),
('Bonsai Venture Capital', 'Spain', 'Spain,Europe,LatAm', 'seed,series-a', 'AI,SaaS,B2B,Fintech,Consumer', 200000, 2000000, 12, 'https://bonsaivc.com', 'Fondo español con perspectiva global. Activos en early stage con follow-on capacity.', 'N/A'),
('Conexo Ventures', 'Spain', 'Spain,LatAm', 'seed,series-a', 'SaaS,B2B,Marketplace,Consumer', 200000, 1500000, 12, 'https://conexoventures.com', 'Fondo hispano-americano bridging Spain and LatAm ecosystems. Foco en marketplace y SaaS.', 'N/A'),
('All Iron Ventures', 'Spain', 'Spain,Europe', 'seed,series-a', 'SaaS,B2B,AI,Consumer,Fintech', 250000, 2000000, 12, 'https://allironventures.com', 'Fondo vasco de referencia. Foco en startups de base tecnológica con mercado global.', 'Aplazame,Coverfy,Jobandtalent'),
('Nekko Capital', 'Spain', 'Spain,Europe,LatAm', 'seed,series-a', 'AI,SaaS,B2B,Consumer,Marketplace', 200000, 2000000, 12, 'https://nekkocapital.com', 'Fondo de VC con perspectiva global desde España. Equipo con experiencia operativa.', 'N/A'),
('JME Venture Capital', 'Spain', 'Spain,Europe', 'seed,series-a', 'SaaS,B2B,AI,Consumer', 200000, 1500000, 12, 'https://jme.vc', 'Fondo español fundado por el equipo de milanuncios. Fuertes operadores con experiencia en marketplace.', 'Amenitiz,Ritmo,Tyms'),
('Athos Capital', 'Spain', 'Spain,Europe', 'pre-seed,seed', 'AI,SaaS,B2B,DeepTech', 100000, 1000000, 10, 'https://athoscapital.vc', 'Fondo de early-stage español con foco en tecnología profunda y B2B.', 'N/A'),
('Monashees', 'Brazil', 'LatAm', 'seed,series-a,series-b', 'Fintech,Consumer,Marketplace,SaaS,Health,B2B', 500000, 10000000, 15, 'https://monashees.com.br', 'Referentes en Brasil y LatAm. Fuerte en consumer, fintech y marketplaces. Fundado 2005.', 'Loggi,Wildlife Studios,Guia Bolso,Nuvemshop'),
('Canary', 'Brazil', 'LatAm', 'pre-seed,seed', 'SaaS,Fintech,Consumer,B2B,Marketplace', 100000, 1000000, 10, 'https://canary.vc', 'Referentes en seed stage en Brasil y LatAm. Muy prolíficos. Buenos accesibles para primeros rounds.', 'N/A'),
('Ignia Partners', 'Mexico', 'LatAm', 'seed,series-a', 'Fintech,Health,Consumer,B2B,Marketplace', 500000, 5000000, 15, 'https://ignia.com', 'Impact investing en México y LatAm. Buscan retorno + impacto social. Base en Monterrey.', 'N/A'),
('Magma Partners', 'Chile', 'LatAm,USA', 'pre-seed,seed', 'SaaS,B2B,Fintech,Consumer', 50000, 500000, 10, 'https://magmapartners.com', 'Seed VC con base en Chile y USA. Fuerte para startups LatAm con ambición global.', 'N/A'),
('Emles', 'Mexico', 'LatAm', 'seed,series-a', 'Fintech,SaaS,B2B,Marketplace', 500000, 5000000, 12, 'https://emles.com', 'Fondo de inversión en México y LatAm. Especialistas en fintech y SaaS.', 'N/A'),
('Valor Capital', 'USA', 'USA,LatAm', 'seed,series-a,series-b', 'Fintech,SaaS,Consumer,B2B,Marketplace', 1000000, 15000000, 12, 'https://valorcapitalgroup.com', 'Bridge fund USA-Brazil. Fuerte en empresas brasileñas con ambición global.', 'Gympass,99,Wildlife,RecargaPay'),
('Softbank Latin America Fund', 'Japan', 'LatAm', 'series-a,series-b,growth', 'Fintech,Consumer,Marketplace,SaaS,Health', 5000000, 100000000, 15, 'https://latinamerica.softbank.com', 'El fondo más grande de LatAm. $8B. Buscan categorías enormes y empresas con potencial de liderazgo regional.', 'Rappi,Loggi,QuintoAndar,Loft'),
('Lightrock', 'UK', 'Global,Europe,LatAm', 'series-a,series-b', 'Health,Fintech,Consumer,B2B,AI', 5000000, 50000000, 12, 'https://lightrock.com', 'Impact-focused growth fund. Buscan startups con impacto medible a escala.', 'N/A');

-- ============================================================
-- SERIES A / GROWTH
-- ============================================================
INSERT INTO venture_capitals (name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples) VALUES
('Sequoia Capital', 'USA', 'USA,Global,Europe', 'seed,series-a,series-b,growth', 'AI,SaaS,Fintech,Consumer,B2B,DeepTech,Marketplace,Health', 1000000, 100000000, 15, 'https://sequoiacap.com', 'El mejor fondo del mundo. Muy selectivo. Buscan founders con visión de cambiar industrias enteras.', 'Apple,Google,Oracle,Airbnb,Stripe,WhatsApp,YouTube'),
('Andreessen Horowitz (a16z)', 'USA', 'USA,Global', 'seed,series-a,series-b,growth', 'AI,SaaS,Fintech,Consumer,B2B,DeepTech,Crypto', 500000, 500000000, 15, 'https://a16z.com', 'El fondo más influyente en Silicon Valley. Fuerte en AI, crypto y consumer. Enorme red de portfolio.', 'Facebook,GitHub,Lyft,Coinbase,Roblox,Clubhouse'),
('Accel Partners', 'USA', 'USA,Europe,Global', 'seed,series-a,series-b', 'SaaS,AI,B2B,Consumer,Fintech,Marketplace', 2000000, 50000000, 15, 'https://accel.com', 'Especialistas en B2B Enterprise y SaaS. Muy fuertes en Europa (London office). Excelentes para scale-ups.', 'Facebook,Spotify,Slack,Dropbox,Atlassian,CrowdStrike'),
('General Catalyst', 'USA', 'USA,Europe,Global', 'seed,series-a,series-b,growth', 'AI,Health,Consumer,SaaS,B2B,Fintech', 500000, 100000000, 15, 'https://generalcatalyst.com', 'Top-tier generalista con fuerte tesis en Health AI y Consumer. Muy activos en Europa últimamente.', 'Stripe,Airbnb,Snap,Warby Parker,Oscar Health,Livongo'),
('Founders Fund', 'USA', 'USA,Global', 'seed,series-a,series-b,growth', 'DeepTech,AI,Fintech,Defense,Consumer,B2B', 500000, 100000000, 10, 'https://foundersfund.com', 'Fondo de Peter Thiel. Aman las moonshots y apuestas contrarian. Sin interés en consensus bets.', 'SpaceX,Palantir,Stripe,Lyft,Airbnb,Facebook'),
('Bessemer Venture Partners', 'USA', 'USA,Global,Europe', 'seed,series-a,series-b', 'SaaS,AI,Fintech,Consumer,Health,B2B', 1000000, 50000000, 12, 'https://bvp.com', 'Conocidos por su antiportfolio (rechazaron Apple, Google, Facebook). Fuerte en cloud SaaS con ARR.', 'LinkedIn,Shopify,Twilio,Yelp,Wix,PagerDuty'),
('Lightspeed Venture Partners', 'USA', 'USA,Global,Europe,India', 'seed,series-a,series-b', 'AI,SaaS,Consumer,Fintech,B2B,Marketplace', 1000000, 50000000, 15, 'https://lsvp.com', 'Top-tier multistage. Fuerte en consumer y enterprise. Muy activos en India y Europa.', 'Snapchat,TaskUs,AppDynamics,MuleSoft,Nutanix,Mulesoft'),
('Benchmark', 'USA', 'USA', 'seed,series-a,series-b', 'Consumer,Marketplace,B2B,SaaS', 3000000, 30000000, 20, 'https://benchmark.com', 'Fondo pequeño y muy selecto. Aman consumer-facing y marketplaces. No hacen growth.', 'Uber,Twitter,Instagram,WeWork,Stitch Fix,Discord'),
('Tiger Global Management', 'USA', 'USA,Global', 'series-a,series-b,growth', 'SaaS,Fintech,Consumer,Marketplace,B2B', 10000000, 500000000, 10, 'https://tigerglobal.com', 'Growth fund con velocidad de decisión muy rápida. Muy activos globalmente. Valoraciones agresivas.', 'Facebook,JD.com,Spotify,Stripe,Checkout.com'),
('Coatue Management', 'USA', 'USA,Global', 'series-a,series-b,growth', 'AI,SaaS,Consumer,B2B,Fintech,DeepTech', 10000000, 500000000, 10, 'https://coatue.com', 'Hedge fund + VC híbrido. Muy activo en tech late-stage y growth rounds.', 'TikTok,Snowflake,Meituan,Stripe'),
('Khosla Ventures', 'USA', 'USA,Global', 'seed,series-a,series-b', 'DeepTech,AI,Health,Energy,Consumer,SaaS', 500000, 50000000, 12, 'https://khoslaventures.com', 'Vinod Khosla. Aman las apuestas radicalmente diferentes. Fuerte en deeptech, health tech y AI.', 'Square,DoorDash,OpenAI,Affirm,Impossible Foods'),
('GV (Google Ventures)', 'USA', 'USA,Europe,Global', 'seed,series-a,series-b', 'AI,Health,SaaS,Consumer,B2B,DeepTech', 1000000, 50000000, 12, 'https://gv.com', 'Fondo corporativo de Google/Alphabet. Acceso único a tecnología y distribución de Google.', 'Uber,Flatiron Health,Slack,DocuSign,Nest,One Medical'),
('Microsoft M12', 'USA', 'USA,Global', 'series-a,series-b', 'AI,SaaS,B2B,DeepTech', 2000000, 30000000, 10, 'https://m12.vc', 'Fondo corporativo de Microsoft. Fuerte en B2B SaaS y AI con potencial de integración con Azure.', 'N/A'),
('Salesforce Ventures', 'USA', 'USA,Global', 'series-a,series-b,growth', 'SaaS,AI,B2B,CRM', 2000000, 50000000, 10, 'https://salesforceventures.com', 'Fondo corporativo de Salesforce. Invierten en startups SaaS complementarias al ecosistema Salesforce.', 'Quip,Mulesoft,Tableau,Docusign'),
('HubSpot Ventures', 'USA', 'USA,Global', 'seed,series-a', 'SaaS,B2B,MarTech,AI', 500000, 5000000, 10, 'https://hubspot.com/ventures', 'Fondo estratégico de HubSpot. Buscan startups que complementen el ecosistema de marketing/ventas.', 'N/A'),
('Intel Capital', 'USA', 'USA,Global', 'seed,series-a,series-b', 'AI,DeepTech,SaaS,B2B', 1000000, 30000000, 10, 'https://intelcapital.com', 'Fondo corporativo de Intel. Fuerte en silicon tech, AI chips y deeptech.', 'N/A');

-- ============================================================
-- EUROPEAN VCs
-- ============================================================
INSERT INTO venture_capitals (name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples) VALUES
('Atomico', 'UK', 'Europe,Global', 'series-a,series-b,growth', 'AI,SaaS,Consumer,Fintech,B2B,Marketplace,Health,DeepTech', 5000000, 100000000, 15, 'https://atomico.com', 'Fondo de Niklas Zennstrom (Skype). Top tier europeo. Fuerte en scale-ups europeas con potencial global.', 'Supercell,Klarna,Graphcore,eDreams,Pipedrive'),
('EQT Ventures', 'Sweden', 'Europe,Global', 'series-a,series-b,growth', 'SaaS,AI,Consumer,B2B,Fintech,Health', 5000000, 100000000, 15, 'https://eqtventures.com', 'Fondo europeo tier-1. Usan AI (Motherbrain) para scouting. Fuerte en Nordic + Europa del norte.', 'Klarna,Waymo,Peakon,FiveTran'),
('Northzone', 'UK', 'Europe,Global', 'seed,series-a,series-b', 'SaaS,Consumer,Fintech,B2B,AI,Marketplace', 1000000, 20000000, 15, 'https://northzone.com', 'Top tier europeo. Invertieron en Spotify en etapa muy temprana. Fuerte en Nordics y UK.', 'Spotify,Klarna,Kahoot,Volta,iZettle'),
('Lakestar', 'Germany', 'Europe,Global', 'series-a,series-b', 'SaaS,Consumer,Fintech,B2B,Marketplace', 2000000, 30000000, 15, 'https://lakestar.com', 'Inversor europeo con track record sólido. Fuerte en marketplace y fintech. Muy técnicos.', 'Skype,Airbnb,Spotify,Facebook,Revolut,Glossybox'),
('HV Capital', 'Germany', 'Europe', 'seed,series-a,series-b', 'Consumer,Marketplace,SaaS,B2B,Fintech', 1000000, 20000000, 15, 'https://hvcapital.com', 'Uno de los fondos más activos en DACH (Alemania, Austria, Suiza). Fuerte en e-commerce y marketplaces.', 'Zalando,Delivery Hero,Flixbus,Trade Republic'),
('Earlybird Venture Capital', 'Germany', 'Europe,Global', 'seed,series-a,series-b', 'AI,SaaS,DeepTech,B2B,Consumer,Fintech', 500000, 15000000, 15, 'https://earlybird.com', 'Generalist europeo con fuerte presencia en DACH y Europa del Este. Good partner for deeptech.', 'UiPath,Twitter,Smava,SumUp'),
('Project A Ventures', 'Germany', 'Europe', 'seed,series-a', 'SaaS,Consumer,Marketplace,B2B,Fintech', 1000000, 10000000, 15, 'https://project-a.com', 'Operational VC alemán. Además de capital aportan equipo operativo especializado.', 'N/A'),
('Hightech Gründerfonds (HTGF)', 'Germany', 'Europe', 'pre-seed,seed', 'DeepTech,AI,Health,B2B,SaaS', 200000, 1000000, 15, 'https://htgf.de', 'Fondo gubernamental alemán para startups deep tech. Sin dilución excesiva, muy accesibles.', 'N/A'),
('Speedinvest', 'Austria', 'Europe,Global', 'seed,series-a', 'Fintech,SaaS,B2B,Health,AI,Consumer', 500000, 5000000, 10, 'https://speedinvest.com', 'Pan-europeo activo. Especialistas sectoriales (Fintech, Health, Deep Tech). Muy buenos operators.', 'Bitpanda,GoStudent,Adverity'),
('Partech Partners', 'France', 'Europe,Africa,USA,Global', 'seed,series-a,series-b', 'SaaS,AI,Consumer,Fintech,B2B,Marketplace', 500000, 50000000, 15, 'https://partechpartners.com', 'Fondo francés con alcance global. Muy activos en Africa tech y startups francófonas.', 'Algolia,DailMotion,Bpifrance,Lenda'),
('Idinvest Partners', 'France', 'Europe', 'seed,series-a,series-b', 'SaaS,Consumer,B2B,Fintech,Health', 1000000, 20000000, 12, 'https://idinvest.com', 'Fondo francés activo. Fuerte en B2B SaaS y consumer europeo.', 'N/A'),
('Kima Ventures', 'France', 'Europe,Global', 'pre-seed,seed', 'AI,SaaS,B2B,Consumer,Fintech,Marketplace', 15000, 200000, 7, 'https://kimaventures.com', 'El fondo más prolífico del mundo (2+ deals/semana). Tickets pequeños, muy rápidos en decidir.', 'N/A'),
('Otium Capital', 'France', 'Europe', 'seed,series-a', 'Consumer,Marketplace,SaaS,B2B', 500000, 5000000, 12, 'https://otiumcapital.com', 'Fondo familiar francés. Largo horizonte de inversión. Fuerte en marketplaces y consumer.', 'N/A'),
('Cherry Ventures', 'Germany', 'Europe', 'pre-seed,seed', 'SaaS,B2B,Consumer,Marketplace,Fintech,AI', 250000, 2000000, 10, 'https://cherry.vc', 'Seed stage especialistas europeos. Fundado por team de Zalando. Muy operacionales.', 'N/A'),
('Fly Ventures', 'Germany', 'Europe', 'pre-seed,seed', 'AI,B2B,SaaS,DeepTech', 250000, 1500000, 10, 'https://fly.vc', 'Fondo seed deep tech y AI europeo. Muy técnicos, buscan productos difíciles de construir.', 'N/A'),
('LocalGlobe', 'UK', 'Europe,Global', 'seed,series-a', 'SaaS,AI,Consumer,B2B,Fintech,Marketplace', 500000, 5000000, 10, 'https://localglobe.vc', 'Fondo seed de referencia en UK. Fuerte track record en primeras rondas de grandes compañías europeas.', 'Improbable,Transit,Cleo,Robinhood UK,Transferwise'),
('Octopus Ventures', 'UK', 'Europe', 'seed,series-a,series-b', 'Health,AI,Consumer,SaaS,Fintech,B2B', 1000000, 20000000, 15, 'https://octopusventures.com', 'Gran fondo UK generalista. Muy activo en health tech y climate.', 'Elvie,Motorway,Depop,Bought By Many'),
('Draper Esprit (now Molten Ventures)', 'UK', 'Europe,Global', 'seed,series-a,series-b', 'SaaS,AI,Consumer,B2B,Fintech,DeepTech', 2000000, 30000000, 15, 'https://moltenventures.com', 'Fondo europeo cotizado. Fuerte en B2B SaaS y deeptech. Ahora operan como Molten Ventures.', 'Graphcore,Trustpilot,Cazoo'),
('Hoxton Ventures', 'UK', 'Europe,USA', 'seed,series-a', 'SaaS,Consumer,B2B,Fintech,Marketplace', 500000, 5000000, 10, 'https://hoxtonventures.com', 'Pequeño fondo UK-USA con grandes retornos. Muy selectivo. Buscan negocios con poder de pricing.', 'Babylon Health,Darktrace,Deliveroo'),
('firstminute capital', 'UK', 'Europe,Global', 'seed,series-a', 'AI,SaaS,Consumer,B2B,Fintech', 500000, 5000000, 10, 'https://firstminute.capital', 'Fondo fundado por Brent Hoberman. Gran red de co-inversores. Fuerte en consumer y marketplace.', 'N/A'),
('DN Capital', 'UK', 'Europe,USA,Global', 'seed,series-a,series-b', 'SaaS,Marketplace,Fintech,Consumer,B2B', 1000000, 15000000, 15, 'https://dncapital.com', 'Pan-europeo con base en London y Berlin. Fuerte en marketplace y B2C scaling.', 'Auto1,Shazam,Remitly,Purplebricks'),
('Tenity', 'Switzerland', 'Europe,Asia', 'pre-seed,seed', 'Fintech,SaaS,B2B,AI', 100000, 500000, 5, 'https://tenity.com', 'Fondo e incubadora de SIX Group (bolsa suiza). Fuerte en fintech y startups reguladas.', 'N/A'),
('btov Partners', 'Switzerland', 'Europe,Global', 'seed,series-a', 'AI,SaaS,DeepTech,B2B,Consumer', 500000, 5000000, 12, 'https://btov.vc', 'Fondo europeo generalista. Fuerte en DACH y mercados de habla alemana con alcance global.', 'N/A');

-- ============================================================
-- SPECIALIST / SECTOR VCs
-- ============================================================
INSERT INTO venture_capitals (name, country, geography, stage, sectors, min_ticket_usd, max_ticket_usd, typical_equity_pct, website, description, portfolio_examples) VALUES
('OpenView', 'USA', 'USA,Global', 'series-a,series-b', 'SaaS,B2B', 5000000, 30000000, 12, 'https://openviewpartners.com', 'Product-led growth (PLG) specialists. Buscan SaaS con modelo bottom-up y alta eficiencia de go-to-market.', 'Calendly,Datadog,Expensify,Docusign'),
('FirstMark Capital', 'USA', 'USA', 'seed,series-a', 'SaaS,B2B,AI,Consumer,Marketplace', 1000000, 15000000, 12, 'https://firstmarkcap.com', 'Early stage en NYC. Fuerte en marketplaces y plataformas. Acceso al ecosistema tech de Nueva York.', 'Pinterest,Airbnb,Shopify,DraftKings,Discord'),
('Greylock Partners', 'USA', 'USA,Global', 'seed,series-a,series-b', 'AI,SaaS,B2B,Consumer,Fintech', 2000000, 30000000, 15, 'https://greylock.com', 'Top-tier con fuerte enfoque en enterprise y social. Muy técnicos. Buscan network effects fuertes.', 'LinkedIn,Airbnb,Facebook,Palo Alto Networks,Roblox,Workday'),
('Union Square Ventures', 'USA', 'USA,Global', 'seed,series-a,series-b', 'Consumer,Marketplace,B2B,Crypto,SaaS', 1000000, 15000000, 15, 'https://usv.com', 'Conocidos por tesis de redes. Buscan plataformas que conectan muchos usuarios o recursos con valor.', 'Twitter,Tumblr,Foursquare,MongoDB,Coinbase,Stripe'),
('Insight Partners', 'USA', 'USA,Global,Europe', 'series-a,series-b,growth', 'SaaS,B2B,Consumer,Fintech,AI', 5000000, 500000000, 15, 'https://insightpartners.com', 'Gran fondo multistage. Muy activos en SaaS scale-up (€5M ARR+). Aportan mucho playbook operacional.', 'Twitter,Shopify,HubSpot,N26,Glossier,JFrog'),
('Vista Equity Partners', 'USA', 'USA,Global', 'growth', 'SaaS,B2B,Enterprise', 100000000, 5000000000, 20, 'https://vistaequitypartners.com', 'PE-VC híbrido. Compran enterprise SaaS maduros y optimizan operaciones. No early stage.', 'Marketo,Ping Identity,Solera'),
('Ribbit Capital', 'USA', 'USA,Global,LatAm', 'seed,series-a,series-b', 'Fintech', 1000000, 50000000, 15, 'https://ribbitcap.com', 'El fondo de fintech más respetado del mundo. Invierten solo en fintech. Globales.', 'Nubank,Brex,Robinhood,Revolut,Credit Karma'),
('Portag3 Ventures', 'Canada', 'USA,Global', 'seed,series-a', 'Fintech', 1000000, 10000000, 12, 'https://portag3.com', 'Fintech specialists. Globales. Muy buenos en insurance tech y wealth management.', 'N/A'),
('a16z crypto', 'USA', 'USA,Global', 'seed,series-a,series-b,growth', 'Crypto,Fintech,AI,B2B', 500000, 500000000, 10, 'https://a16zcrypto.com', 'El mayor y más respetado fondo de crypto. Sub-fondo de a16z. $4.5B+ bajo gestión.', 'Coinbase,OpenSea,Compound,Uniswap,Sky Mavis'),
('Andreessen Horowitz Bio Fund', 'USA', 'USA,Global', 'seed,series-a,series-b', 'Health,DeepTech,AI', 2000000, 100000000, 15, 'https://bio.a16z.com', 'Sub-fondo de a16z para bio + health. Buscan fundadores con PhD o experiencia clínica.', 'N/A'),
('GE Ventures', 'USA', 'USA,Global', 'seed,series-a', 'Health,DeepTech,AI,B2B', 1000000, 10000000, 10, 'https://geventures.com', 'Fondo estratégico de GE. Fuerte en industrial tech, healthcare y energy.', 'N/A'),
('Obvious Ventures', 'USA', 'USA,Global', 'seed,series-a', 'Health,Consumer,AI,DeepTech,Fintech', 1000000, 15000000, 15, 'https://obviousventures.com', 'World positive investing. Co-fundado por Evan Williams (Twitter). Buscan impacto + retorno.', 'Medium,Beyond Meat,Ginger'),
('Collaborative Fund', 'USA', 'USA,Global', 'seed,series-a', 'Consumer,Health,Marketplace,B2B', 500000, 5000000, 12, 'https://collaborativefund.com', 'Impact-focused. Buscan startups que beneficien a empleados, comunidades y planeta.', 'Kickstarter,Lyft,Codecademy,Coursera'),
('Slow Ventures', 'USA', 'USA,Global', 'seed,series-a', 'Consumer,SaaS,Marketplace,B2B', 250000, 3000000, 10, 'https://slow.co', 'Fondo de Sam Lessin (ex-Facebook). Filosófico y a largo plazo. Aman negocios de nicho con alta lealtad.', 'N/A'),
('Human Capital', 'USA', 'USA,Global', 'seed,series-a', 'AI,B2B,SaaS,Consumer', 500000, 5000000, 10, 'https://humancapital.com', 'Fondo con enfoque en fundadores y equipos excepcionales más que en mercados específicos.', 'N/A');
