-- =====================================================================
-- Hoops Archive -- migration 0003e2 : cartes 2025-26-topps-chrome-sapphire (partie 2/2)
-- FICHIER GENERE AUTOMATIQUEMENT -- ne pas editer a la main.
-- Relancable sans risque (ON CONFLICT DO UPDATE).
-- =====================================================================

begin;

-- Cartes (36)
insert into public.cards (set_id, card_code, subset, player, team, player_id, team_id, season, rookie, variant, jersey_number) values
  ('2025-26-topps-chrome-sapphire', 'TCAR-BS', 'TCAR', 'Ben Saraf', 'Brooklyn Nets', 'ben-saraf', 'brooklyn-nets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CC', 'TCAR', 'Cedric Coward', 'Memphis Grizzlies', 'cedric-coward', 'memphis-grizzlies', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CF', 'TCAR', 'Cooper Flagg', 'Dallas Mavericks', 'cooper-flagg', 'dallas-mavericks', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CL', 'TCAR', 'Chaz Lanier', 'Detroit Pistons', 'chaz-lanier', 'detroit-pistons', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CMB', 'TCAR', 'Collin Murray-Boyles', 'Toronto Raptors', 'collin-murray-boyles', 'toronto-raptors', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DH', 'TCAR', 'Dylan Harper', 'San Antonio Spurs', 'dylan-harper', 'san-antonio-spurs', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DP', 'TCAR', 'Drake Powell', 'Brooklyn Nets', 'drake-powell', 'brooklyn-nets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DQ', 'TCAR', 'Derik Queen', 'New Orleans Pelicans', 'derik-queen', 'new-orleans-pelicans', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DW', 'TCAR', 'Danny Wolf', 'Brooklyn Nets', 'danny-wolf', 'brooklyn-nets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-ED', 'TCAR', 'Egor Dëmin', 'Brooklyn Nets', 'egor-demin', 'brooklyn-nets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JB', 'TCAR', 'Joan Beringer', 'Minnesota Timberwolves', 'joan-beringer', 'minnesota-timberwolves', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JBE', 'TCAR', 'Johni Broome', 'Philadelphia 76ers', 'johni-broome', 'philadelphia-76ers', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JR', 'TCAR', 'Jase Richardson', 'Orlando Magic', 'jase-richardson', 'orlando-magic', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KAJ', 'TCAR', 'Kasparas Jakučionis', 'Miami Heat', 'kasparas-jakucionis', 'miami-heat', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KB', 'TCAR', 'Koby Brea', 'Phoenix Suns', 'koby-brea', 'phoenix-suns', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KJ', 'TCAR', 'Kam Jones', 'Indiana Pacers', 'kam-jones', 'indiana-pacers', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KK', 'TCAR', 'Kon Knueppel', 'Charlotte Hornets', 'kon-knueppel', 'charlotte-hornets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KM', 'TCAR', 'Khaman Maluach', 'Phoenix Suns', 'khaman-maluach', 'phoenix-suns', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KS', 'TCAR', 'Kobe Sanders', 'Los Angeles Clippers', 'kobe-sanders', 'los-angeles-clippers', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-LM', 'TCAR', 'Liam McNeeley', 'Charlotte Hornets', 'liam-mcneeley', 'charlotte-hornets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-MP', 'TCAR', 'Micah Peavy', 'New Orleans Pelicans', 'micah-peavy', 'new-orleans-pelicans', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-MR', 'TCAR', 'Maxime Raynaud', 'Sacramento Kings', 'maxime-raynaud', 'sacramento-kings', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NC', 'TCAR', 'Nique Clifford', 'Sacramento Kings', 'nique-clifford', 'sacramento-kings', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NE', 'TCAR', 'Noa Essengue', 'Chicago Bulls', 'noa-essengue', 'chicago-bulls', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NP', 'TCAR', 'Noah Penda', 'Orlando Magic', 'noah-penda', 'orlando-magic', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NT', 'TCAR', 'Nolan Traore', 'Brooklyn Nets', 'nolan-traore', 'brooklyn-nets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-RF', 'TCAR', 'Rasheer Fleming', 'Phoenix Suns', 'rasheer-fleming', 'phoenix-suns', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-RK', 'TCAR', 'Ryan Kalkbrenner', 'Charlotte Hornets', 'ryan-kalkbrenner', 'charlotte-hornets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-SJ', 'TCAR', 'Sion James', 'Charlotte Hornets', 'sion-james', 'charlotte-hornets', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-TP', 'TCAR', 'Tyrese Proctor', 'Cleveland Cavaliers', 'tyrese-proctor', 'cleveland-cavaliers', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-TS', 'TCAR', 'Thomas Sorber', 'Oklahoma City Thunder', 'thomas-sorber', 'oklahoma-city-thunder', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WCJ', 'TCAR', 'Walter Clayton Jr.', 'Utah Jazz', 'walter-clayton-jr', 'utah-jazz', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WIR', 'TCAR', 'Will Richard', 'Golden State Warriors', 'will-richard', 'golden-state-warriors', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WR', 'TCAR', 'Will Riley', 'Washington Wizards', 'will-riley', 'washington-wizards', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-YH', 'TCAR', 'Yang Hansen', 'Portland Trail Blazers', 'yang-hansen', 'portland-trail-blazers', '2025-26', true, null, null),
  ('2025-26-topps-chrome-sapphire', 'TCAR-YKN', 'TCAR', 'Yanic Konan-Niederhäuser', 'Los Angeles Clippers', 'yanic-konan-niederhauser', 'los-angeles-clippers', '2025-26', true, null, null)
on conflict (set_id, card_code) do update set
  subset = excluded.subset, player = excluded.player, team = excluded.team,
  player_id = excluded.player_id, team_id = excluded.team_id, season = excluded.season,
  rookie = excluded.rookie, variant = excluded.variant, jersey_number = excluded.jersey_number;

-- Associations carte/joueur (36)
insert into public.card_players (set_id, card_code, slot, player, player_id, team, team_id, season) values
  ('2025-26-topps-chrome-sapphire', 'TCAR-BS', 1, 'Ben Saraf', 'ben-saraf', 'Brooklyn Nets', 'brooklyn-nets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CC', 1, 'Cedric Coward', 'cedric-coward', 'Memphis Grizzlies', 'memphis-grizzlies', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CF', 1, 'Cooper Flagg', 'cooper-flagg', 'Dallas Mavericks', 'dallas-mavericks', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CL', 1, 'Chaz Lanier', 'chaz-lanier', 'Detroit Pistons', 'detroit-pistons', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-CMB', 1, 'Collin Murray-Boyles', 'collin-murray-boyles', 'Toronto Raptors', 'toronto-raptors', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DH', 1, 'Dylan Harper', 'dylan-harper', 'San Antonio Spurs', 'san-antonio-spurs', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DP', 1, 'Drake Powell', 'drake-powell', 'Brooklyn Nets', 'brooklyn-nets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DQ', 1, 'Derik Queen', 'derik-queen', 'New Orleans Pelicans', 'new-orleans-pelicans', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-DW', 1, 'Danny Wolf', 'danny-wolf', 'Brooklyn Nets', 'brooklyn-nets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-ED', 1, 'Egor Dëmin', 'egor-demin', 'Brooklyn Nets', 'brooklyn-nets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JB', 1, 'Joan Beringer', 'joan-beringer', 'Minnesota Timberwolves', 'minnesota-timberwolves', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JBE', 1, 'Johni Broome', 'johni-broome', 'Philadelphia 76ers', 'philadelphia-76ers', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-JR', 1, 'Jase Richardson', 'jase-richardson', 'Orlando Magic', 'orlando-magic', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KAJ', 1, 'Kasparas Jakučionis', 'kasparas-jakucionis', 'Miami Heat', 'miami-heat', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KB', 1, 'Koby Brea', 'koby-brea', 'Phoenix Suns', 'phoenix-suns', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KJ', 1, 'Kam Jones', 'kam-jones', 'Indiana Pacers', 'indiana-pacers', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KK', 1, 'Kon Knueppel', 'kon-knueppel', 'Charlotte Hornets', 'charlotte-hornets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KM', 1, 'Khaman Maluach', 'khaman-maluach', 'Phoenix Suns', 'phoenix-suns', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-KS', 1, 'Kobe Sanders', 'kobe-sanders', 'Los Angeles Clippers', 'los-angeles-clippers', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-LM', 1, 'Liam McNeeley', 'liam-mcneeley', 'Charlotte Hornets', 'charlotte-hornets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-MP', 1, 'Micah Peavy', 'micah-peavy', 'New Orleans Pelicans', 'new-orleans-pelicans', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-MR', 1, 'Maxime Raynaud', 'maxime-raynaud', 'Sacramento Kings', 'sacramento-kings', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NC', 1, 'Nique Clifford', 'nique-clifford', 'Sacramento Kings', 'sacramento-kings', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NE', 1, 'Noa Essengue', 'noa-essengue', 'Chicago Bulls', 'chicago-bulls', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NP', 1, 'Noah Penda', 'noah-penda', 'Orlando Magic', 'orlando-magic', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-NT', 1, 'Nolan Traore', 'nolan-traore', 'Brooklyn Nets', 'brooklyn-nets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-RF', 1, 'Rasheer Fleming', 'rasheer-fleming', 'Phoenix Suns', 'phoenix-suns', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-RK', 1, 'Ryan Kalkbrenner', 'ryan-kalkbrenner', 'Charlotte Hornets', 'charlotte-hornets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-SJ', 1, 'Sion James', 'sion-james', 'Charlotte Hornets', 'charlotte-hornets', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-TP', 1, 'Tyrese Proctor', 'tyrese-proctor', 'Cleveland Cavaliers', 'cleveland-cavaliers', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-TS', 1, 'Thomas Sorber', 'thomas-sorber', 'Oklahoma City Thunder', 'oklahoma-city-thunder', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WCJ', 1, 'Walter Clayton Jr.', 'walter-clayton-jr', 'Utah Jazz', 'utah-jazz', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WIR', 1, 'Will Richard', 'will-richard', 'Golden State Warriors', 'golden-state-warriors', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-WR', 1, 'Will Riley', 'will-riley', 'Washington Wizards', 'washington-wizards', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-YH', 1, 'Yang Hansen', 'yang-hansen', 'Portland Trail Blazers', 'portland-trail-blazers', '2025-26'),
  ('2025-26-topps-chrome-sapphire', 'TCAR-YKN', 1, 'Yanic Konan-Niederhäuser', 'yanic-konan-niederhauser', 'Los Angeles Clippers', 'los-angeles-clippers', '2025-26')
on conflict (set_id, card_code, slot) do update set
  player = excluded.player, player_id = excluded.player_id, team = excluded.team,
  team_id = excluded.team_id, season = excluded.season;

commit;
