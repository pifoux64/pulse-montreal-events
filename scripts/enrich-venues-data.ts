/**
 * Script pour enrichir les données des venues avec de vraies informations
 * Recherche et met à jour les venues existantes avec :
 * - Descriptions enrichies
 * - Capacités réelles
 * - Images
 * - Tags et types d'événements
 * - Informations supplémentaires
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Base de données d'informations réelles sur les salles de Montréal
const venueEnrichmentData: Record<string, {
  description?: string;
  capacity?: number;
  imageUrl?: string;
  types?: string[];
  tags?: string[];
  phone?: string;
  website?: string;
  neighborhood?: string;
}> = {
  // Place des Arts
  'place-des-arts': {
    description: 'La Place des Arts est le plus important complexe culturel et centre des arts de la scène au Canada. Située au cœur du Quartier des spectacles, elle accueille chaque année près de 1 000 représentations et héberge des organismes prestigieux comme l\'Orchestre symphonique de Montréal, l\'Opéra de Montréal, les Grands Ballets canadiens et la Compagnie Jean-Duceppe. Le complexe dispose de six salles totalisant 8 000 sièges, avec des capacités variant de 122 à 3 000 personnes.',
    capacity: 8000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['centre_culturel', 'salle'],
    tags: ['musique classique', 'théâtre', 'danse', 'opéra', 'festivals', 'spectacles'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  'place-des-arts-1': {
    description: 'La Place des Arts est le plus important complexe culturel et centre des arts de la scène au Canada. Située au cœur du Quartier des spectacles, elle accueille chaque année près de 1 000 représentations et héberge des organismes prestigieux comme l\'Orchestre symphonique de Montréal, l\'Opéra de Montréal, les Grands Ballets canadiens et la Compagnie Jean-Duceppe. Le complexe dispose de six salles totalisant 8 000 sièges, avec des capacités variant de 122 à 3 000 personnes.',
    capacity: 8000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['centre_culturel', 'salle'],
    tags: ['musique classique', 'théâtre', 'danse', 'opéra', 'festivals', 'spectacles'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  'salle-wilfrid-pelletier-place-des-arts': {
    description: 'La Salle Wilfrid-Pelletier est la plus grande salle de la Place des Arts, avec une capacité de 2 982 places. Elle accueille les grandes productions de l\'Orchestre symphonique de Montréal, de l\'Opéra de Montréal, des Grands Ballets canadiens et de nombreux spectacles de renommée internationale.',
    capacity: 2982,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['salle', 'centre_culturel'],
    tags: ['musique classique', 'opéra', 'ballet', 'spectacles', 'orchestre'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  'salle-wilfrid-pelletier-pn': {
    description: 'La Salle Wilfrid-Pelletier est la plus grande salle de la Place des Arts, avec une capacité de 2 982 places. Elle accueille les grandes productions de l\'Orchestre symphonique de Montréal, de l\'Opéra de Montréal, des Grands Ballets canadiens et de nombreux spectacles de renommée internationale.',
    capacity: 2982,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['salle', 'centre_culturel'],
    tags: ['musique classique', 'opéra', 'ballet', 'spectacles', 'orchestre'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  'wilfrid-pelletier': {
    description: 'La Salle Wilfrid-Pelletier est la plus grande salle de la Place des Arts, avec une capacité de 2 982 places. Elle accueille les grandes productions de l\'Orchestre symphonique de Montréal, de l\'Opéra de Montréal, des Grands Ballets canadiens et de nombreux spectacles de renommée internationale.',
    capacity: 2982,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['salle', 'centre_culturel'],
    tags: ['musique classique', 'opéra', 'ballet', 'spectacles', 'orchestre'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  'place-des-arts-montreal': {
    description: 'La Place des Arts est le plus important complexe culturel et centre des arts de la scène au Canada. Située au cœur du Quartier des spectacles, elle accueille chaque année près de 1 000 représentations et héberge des organismes prestigieux comme l\'Orchestre symphonique de Montréal, l\'Opéra de Montréal, les Grands Ballets canadiens et la Compagnie Jean-Duceppe. Le complexe dispose de six salles totalisant 8 000 sièges, avec des capacités variant de 122 à 3 000 personnes.',
    capacity: 8000,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Place_des_Arts_de_Montr%C3%A9al.jpg/1200px-Place_des_Arts_de_Montr%C3%A9al.jpg',
    types: ['centre_culturel', 'salle'],
    tags: ['musique classique', 'théâtre', 'danse', 'opéra', 'festivals', 'spectacles'],
    phone: '514-842-2112',
    website: 'https://www.placedesarts.com',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Centre Bell
  'centre-bell': {
    description: 'Le Centre Bell est la plus grande salle de la Ligue nationale de hockey avec une capacité de 21 105 places. Situé au centre-ville de Montréal, il accueille les matchs des Canadiens de Montréal ainsi que des centaines de spectacles musicaux, événements de divertissement et événements corporatifs. La salle dispose de 135 suites de luxe et 2 674 sièges de club, et peut être configurée de différentes façons selon le type d\'événement.',
    capacity: 21105,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Centre_Bell%2C_Montreal%2C_Quebec_%2829773568150%29.jpg',
    types: ['arène', 'salle'],
    tags: ['hockey', 'concerts', 'spectacles', 'événements corporatifs', 'sport'],
    phone: '514-989-2841',
    website: 'https://www.centrebell.ca',
    neighborhood: 'Centre-ville',
  },
  'centre-bell-1': {
    description: 'Le Centre Bell est la plus grande salle de la Ligue nationale de hockey avec une capacité de 21 105 places. Situé au centre-ville de Montréal, il accueille les matchs des Canadiens de Montréal ainsi que des centaines de spectacles musicaux, événements de divertissement et événements corporatifs. La salle dispose de 135 suites de luxe et 2 674 sièges de club, et peut être configurée de différentes façons selon le type d\'événement.',
    capacity: 21105,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Centre_Bell%2C_Montreal%2C_Quebec_%2829773568150%29.jpg',
    types: ['arène', 'salle'],
    tags: ['hockey', 'concerts', 'spectacles', 'événements corporatifs', 'sport'],
    phone: '514-989-2841',
    website: 'https://www.centrebell.ca',
    neighborhood: 'Centre-ville',
  },
  
  // MTELUS
  'mtelus': {
    description: 'Le MTELUS est une salle de spectacles mythique à Montréal, située au cœur du Quartier des spectacles. Cette salle historique a été rénovée en 2017 tout en préservant son caractère architectural d\'époque. Elle accueille régulièrement des spectacles musicaux de tous genres, du rock à la musique populaire, dans une ambiance intime et chaleureuse.',
    capacity: 2300,
    types: ['salle', 'club'],
    tags: ['concerts', 'rock', 'musique populaire', 'spectacles', 'musique live'],
    website: 'https://www.mtelus.com',
    neighborhood: 'Quartier des spectacles',
  },
  
  // MEM - Centre des mémoires montréalaises
  'mem': {
    description: 'Le MEM (Centre des mémoires montréalaises) est situé au cœur du Quartier des spectacles, près de la station de métro Saint-Laurent. Il offre plusieurs espaces à la location : le Cabaret (110 personnes), le Belvédère (60 personnes avec vue sur la rue Sainte-Catherine), et des ateliers multifonctionnels (35 personnes chacun).',
    capacity: 110,
    types: ['centre_culturel', 'salle'],
    tags: ['événements', 'spectacles', 'location de salles', 'culture'],
    phone: '514-622-6387',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Le Gesù
  'gesu': {
    description: 'Le Gesù – Centre de créativité est un centre historique au cœur du centre-ville de Montréal. Il dispose de plusieurs espaces : l\'Amphithéâtre (425 places avec acoustique remarquable), la Salle d\'Auteuil (83 places), le Hall (425 personnes debout), l\'Espace Custeau (100 places en configuration cabaret), et l\'Église du Gesù (448 places, espace patrimonial unique).',
    capacity: 448,
    types: ['théâtre', 'centre_culturel'],
    tags: ['théâtre', 'spectacles', 'patrimoine', 'culture', 'arts vivants'],
    website: 'https://www.legesu.com',
    neighborhood: 'Centre-ville',
  },
  
  // Palais des congrès
  'palais-des-congres': {
    description: 'Le Palais des congrès de Montréal est un centre de congrès de renommée mondiale situé au centre-ville, dans le quartier international. Depuis 1983, il offre 113 salles de réunion, une superficie totale de 47 265 m², et la plus grande salle d\'exposition sans colonne au Canada (32 798 m²). Le complexe dispose de 3 salles de bal, 4 terrasses, et est relié à 4 000 chambres d\'hôtel.',
    capacity: 19952,
    types: ['centre_congres', 'salle'],
    tags: ['congrès', 'événements corporatifs', 'expositions', 'réunions'],
    phone: '514-871-8122',
    website: 'https://www.congresmtl.com',
    neighborhood: 'Quartier international',
  },
  
  // L'Olympia
  'olympia': {
    description: 'L\'Olympia de Montréal est une salle de spectacle iconique construite en 1925, située au 1004 rue Sainte-Catherine Est. Cette salle historique du patrimoine culturel montréalais peut accueillir jusqu\'à 2 438 places en configuration avec sièges, ou 2 600 personnes debout. Elle dispose d\'un système de son exceptionnel et combine l\'élégance de son histoire cinématographique avec des installations modernes. Un lounge peut accueillir jusqu\'à 350 personnes.',
    capacity: 2438,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'spectacles', 'humour', 'danse', 'cirque', 'variété', 'événements corporatifs'],
    website: 'https://www.olympiamontreal.com',
    neighborhood: 'Quartier des spectacles',
  },
  'l-olympia': {
    description: 'L\'Olympia de Montréal est une salle de spectacle iconique construite en 1925, située au 1004 rue Sainte-Catherine Est. Cette salle historique du patrimoine culturel montréalais peut accueillir jusqu\'à 2 438 places en configuration avec sièges, ou 2 600 personnes debout. Elle dispose d\'un système de son exceptionnel et combine l\'élégance de son histoire cinématographique avec des installations modernes. Un lounge peut accueillir jusqu\'à 350 personnes.',
    capacity: 2438,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'spectacles', 'humour', 'danse', 'cirque', 'variété', 'événements corporatifs'],
    website: 'https://www.olympiamontreal.com',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Théâtre Corona / Beanfield
  'theatre-corona': {
    description: 'Le Théâtre Corona (maintenant Théâtre Beanfield) est un lieu historique construit en 1912, situé au 2490 rue Notre-Dame Ouest. Ancien cinéma de films muets et lieu de spectacles de vaudeville, il a été rénové en 1997 par L\'Institut des Arts de la Scène. La salle peut accueillir jusqu\'à 753 personnes avec le balcon ouvert, ou 353 places en formule cabaret. Elle conserve son charme historique avec ses boiseries apparentes, son éclairage chaleureux et son excellente acoustique.',
    capacity: 753,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'spectacles', 'humour', 'rock', 'indie', 'pop', 'hip-hop', 'conférences'],
    neighborhood: 'Sud-Ouest',
  },
  'theatre-beanfield': {
    description: 'Le Théâtre Corona (maintenant Théâtre Beanfield) est un lieu historique construit en 1912, situé au 2490 rue Notre-Dame Ouest. Ancien cinéma de films muets et lieu de spectacles de vaudeville, il a été rénové en 1997 par L\'Institut des Arts de la Scène. La salle peut accueillir jusqu\'à 753 personnes avec le balcon ouvert, ou 353 places en formule cabaret. Elle conserve son charme historique avec ses boiseries apparentes, son éclairage chaleureux et son excellente acoustique.',
    capacity: 753,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'spectacles', 'humour', 'rock', 'indie', 'pop', 'hip-hop', 'conférences'],
    neighborhood: 'Sud-Ouest',
  },
  
  // Club Soda
  'club-soda': {
    description: 'Le Club Soda est une salle de spectacle professionnelle historique située au 1225 boulevard Saint-Laurent. Construit en 1908, ce bâtiment patrimonial (anciennement Crystal Palace) a été rénové et ouvert en 2000. La salle peut accueillir 950 personnes debout ou 450 personnes assises, avec plusieurs configurations possibles. Elle présente régulièrement des spectacles de différents genres musicaux (rock, rap, métal, pop, country) et des événements humoristiques.',
    capacity: 950,
    types: ['club', 'salle'],
    tags: ['concerts', 'rock', 'rap', 'métal', 'pop', 'country', 'humour', 'spectacles'],
    website: 'https://www.clubsoda.ca',
    neighborhood: 'Quartier des spectacles',
  },
  
  // SAT - Société des arts technologiques
  'societe-des-arts-technologiques': {
    description: 'La SAT (Société des arts technologiques) est un organisme à but non lucratif fondé en 1996, dédié au développement de la culture numérique. C\'est un laboratoire créatif hybride et transdisciplinaire reconnu internationalement pour son rôle précurseur dans les technologies immersives, la téléprésence et les réalités mixtes. La SAT occupe un espace de 44 000 pieds carrés et peut accueillir de 20 à 1 000 personnes selon l\'événement. Elle dispose notamment de la Satosphère, un dôme immersif de 18 mètres de diamètre équipé de 8 projecteurs vidéo et 157 haut-parleurs.',
    capacity: 1000,
    types: ['centre_culturel', 'laboratoire'],
    tags: ['arts numériques', 'technologie', 'immersif', 'concerts', 'DJ', 'conférences', 'ateliers', 'expositions'],
    phone: '514-844-2033',
    website: 'https://sat.qc.ca',
    neighborhood: 'Quartier des spectacles',
  },
  'sat': {
    description: 'La SAT (Société des arts technologiques) est un organisme à but non lucratif fondé en 1996, dédié au développement de la culture numérique. C\'est un laboratoire créatif hybride et transdisciplinaire reconnu internationalement pour son rôle précurseur dans les technologies immersives, la téléprésence et les réalités mixtes. La SAT occupe un espace de 44 000 pieds carrés et peut accueillir de 20 à 1 000 personnes selon l\'événement. Elle dispose notamment de la Satosphère, un dôme immersif de 18 mètres de diamètre équipé de 8 projecteurs vidéo et 157 haut-parleurs.',
    capacity: 1000,
    types: ['centre_culturel', 'laboratoire'],
    tags: ['arts numériques', 'technologie', 'immersif', 'concerts', 'DJ', 'conférences', 'ateliers', 'expositions'],
    phone: '514-844-2033',
    website: 'https://sat.qc.ca',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Studio TD
  'studio-td': {
    description: 'Le Studio TD est une salle de spectacle située au cœur du Quartier des spectacles à Montréal, au 305 rue Sainte-Catherine Ouest. Cette salle moderne accueille régulièrement des spectacles musicaux et des événements variés dans une ambiance intime et professionnelle.',
    types: ['salle'],
    tags: ['concerts', 'spectacles', 'musique', 'variétés'],
    phone: '514-492-1775',
    website: 'https://lestudiotd.com',
    neighborhood: 'Quartier des spectacles',
  },
  'le-studio-td': {
    description: 'Le Studio TD est une salle de spectacle située au cœur du Quartier des spectacles à Montréal, au 305 rue Sainte-Catherine Ouest. Cette salle moderne accueille régulièrement des spectacles musicaux et des événements variés dans une ambiance intime et professionnelle.',
    types: ['salle'],
    tags: ['concerts', 'spectacles', 'musique', 'variétés'],
    phone: '514-492-1775',
    website: 'https://lestudiotd.com',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Théâtre Fairmount
  'theatre-fairmount': {
    description: 'Le Théâtre Fairmount est une salle multifonctionnelle située au 5240 Avenue du Parc dans le Mile-End. Cette salle historique a une longue histoire musicale montréalaise, ayant accueilli le Club Soda (1980-1999), puis le Kola Note et le Cabaret du Mile-End avant de rouvrir en 2015. La salle peut accueillir jusqu\'à 600 personnes debout ou 300 personnes en places assises, avec une configuration cabaret possible. Elle offre un service de bar et un équipement de sonorisation professionnel.',
    capacity: 600,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'rock', 'indie', 'alternative', 'électronique', 'rap', 'musique live'],
    website: 'https://www.theatrefairmount.com',
    neighborhood: 'Mile-End',
  },
  'fairmount-theatre': {
    description: 'Le Théâtre Fairmount est une salle multifonctionnelle située au 5240 Avenue du Parc dans le Mile-End. Cette salle historique a une longue histoire musicale montréalaise, ayant accueilli le Club Soda (1980-1999), puis le Kola Note et le Cabaret du Mile-End avant de rouvrir en 2015. La salle peut accueillir jusqu\'à 600 personnes debout ou 300 personnes en places assises, avec une configuration cabaret possible. Elle offre un service de bar et un équipement de sonorisation professionnel.',
    capacity: 600,
    types: ['théâtre', 'salle'],
    tags: ['concerts', 'rock', 'indie', 'alternative', 'électronique', 'rap', 'musique live'],
    website: 'https://www.theatrefairmount.com',
    neighborhood: 'Mile-End',
  },
  
  // Foufounes Électriques
  'foufounes-electriques': {
    description: 'Les Foufounes Électriques, connues localement sous le nom de "Foufs", sont un établissement emblématique de la scène alternative montréalaise depuis 1983. Situées au 87 rue Sainte-Catherine Est dans le Quartier Latin, elles constituent le plus ancien lieu de rock alternatif de Montréal. Ce lieu multi-niveaux fonctionne comme un bar, une terrasse et une salle de concerts, avec des murs couverts de graffitis et des sculptures étranges. Le venue peut accueillir jusqu\'à 615 personnes et a accueilli des artistes internationaux majeurs comme Nirvana, Green Day, Queens of the Stone Age, The Smashing Pumpkins, Primus et Nine Inch Nails.',
    capacity: 615,
    types: ['bar', 'club', 'salle'],
    tags: ['rock alternatif', 'punk', 'gothique', 'new wave', 'reggae', 'ska', 'industriel', 'grunge', 'hip-hop', 'concerts'],
    website: 'https://www.foufouneselectriques.com',
    neighborhood: 'Quartier Latin',
  },
  
  // Bar le Ritz PDB
  'bar-le-ritz-pdb': {
    description: 'Le Bar le Ritz PDB (Punks Don\'t Bend) est une salle de concerts et d\'événements polyvalente située au 179 rue Jean-Talon Ouest dans le Mile-End/Mile-Ex. Ouvert en 2014 par Meyer Billurcu en partenariat avec des membres de Godspeed You! Black Emperor, ce lieu intime peut accueillir environ 300 personnes (ou 150 pour les soirées de spectacles). Le venue dispose d\'un bar en bois vintage, d\'un design mural coloré et d\'une petite scène. Il est accessible en fauteuil roulant avec des toilettes non genrées et accueille un mélange éclectique de concerts live, soirées DJ, spectacles d\'humour, projections de films et fêtes thématiques avec une forte atmosphère LGBTQ-friendly.',
    capacity: 300,
    types: ['bar', 'salle'],
    tags: ['concerts', 'rock', 'indie', 'DJ', 'humour', 'cinéma', 'LGBTQ', 'musique live'],
    neighborhood: 'Mile-End',
  },
  'bar-le-ritz-pdb-1': {
    description: 'Le Bar le Ritz PDB (Punks Don\'t Bend) est une salle de concerts et d\'événements polyvalente située au 179 rue Jean-Talon Ouest dans le Mile-End/Mile-Ex. Ouvert en 2014 par Meyer Billurcu en partenariat avec des membres de Godspeed You! Black Emperor, ce lieu intime peut accueillir environ 300 personnes (ou 150 pour les soirées de spectacles). Le venue dispose d\'un bar en bois vintage, d\'un design mural coloré et d\'une petite scène. Il est accessible en fauteuil roulant avec des toilettes non genrées et accueille un mélange éclectique de concerts live, soirées DJ, spectacles d\'humour, projections de films et fêtes thématiques avec une forte atmosphère LGBTQ-friendly.',
    capacity: 300,
    types: ['bar', 'salle'],
    tags: ['concerts', 'rock', 'indie', 'DJ', 'humour', 'cinéma', 'LGBTQ', 'musique live'],
    neighborhood: 'Mile-End',
  },
  
  // La Sala Rossa
  'la-sala-rossa': {
    description: 'La Sala Rossa est une salle de spectacle emblématique située au 4848 Boulevard Saint-Laurent dans le Plateau-Mont-Royal. Construite en 1932 par l\'organisation juive Workmen\'s Circle, elle est devenue un lieu emblématique de la scène culturelle et musicale montréalaise. La salle se caractérise par ses murs rouges distinctifs, son acoustique exceptionnelle et son atmosphère intime. Elle peut accueillir 250 personnes et propose une programmation éclectique incluant du rock indépendant, du jazz, du flamenco, de la musique électronique et des performances expérimentales. Originellement créée comme espace de rassemblement pour la communauté juive montréalaise, elle a ensuite servi de centre social pour les immigrants espagnols.',
    capacity: 250,
    types: ['salle', 'centre_culturel'],
    tags: ['rock indépendant', 'jazz', 'flamenco', 'musique électronique', 'expérimental', 'concerts', 'spectacles'],
    neighborhood: 'Plateau-Mont-Royal',
  },
  
  // Casino de Montréal
  'casino-de-montreal': {
    description: 'Le Casino de Montréal, ouvert en 1993, est installé sur l\'île Notre-Dame dans le parc Jean-Drapeau. Ce bâtiment emblématique était à l\'origine le pavillon de la France lors de l\'Exposition universelle de 1967. Le complexe dispose de plusieurs espaces : le Théâtre Le Qube (jusqu\'à 800 personnes), le Cabaret du Casino (616 places avec 532 places en souper-spectacle et 84 places au balcon), et des salles de réunion (capacité totale de 800 places assises, 300 places debout). Le Cabaret a été rénové avec des équipements modernes : système de son psychoacoustique 3D, 44 coupoles LED au plafond pour projections vidéo, 98 projecteurs robotisés, et système d\'éclairage de 800 000 watts. Le casino reçoit plus de 6 millions de visiteurs annuellement.',
    capacity: 800,
    types: ['casino', 'salle'],
    tags: ['spectacles', 'divertissement', 'événements corporatifs', 'galas', 'tournois', 'poker'],
    website: 'https://www.casinosduquebec.com',
    neighborhood: 'Parc Jean-Drapeau',
  },
  'cabaret-du-casino-de-montreal': {
    description: 'Le Cabaret du Casino de Montréal est une salle de spectacle moderne située dans le Casino de Montréal sur l\'île Notre-Dame. Rénové récemment, le Cabaret peut accueillir 616 places (532 places en souper-spectacle + 84 places au balcon). Il dispose d\'équipements de pointe : système de son psychoacoustique 3D, 44 coupoles LED au plafond pour projections vidéo, 98 projecteurs robotisés, et système d\'éclairage de 800 000 watts. Le Cabaret accueille une programmation diversifiée : spectacles (dont des artistes de renommée comme Tony Bennett), galas de boxe, tournois de poker style WSOP, événements corporatifs et caritatifs.',
    capacity: 616,
    types: ['cabaret', 'salle'],
    tags: ['spectacles', 'divertissement', 'événements corporatifs', 'galas', 'boxe', 'poker'],
    website: 'https://www.casinosduquebec.com',
    neighborhood: 'Parc Jean-Drapeau',
  },
  
  // Stade Saputo
  'stade-saputo': {
    description: 'Le Stade Saputo est le deuxième plus grand stade de soccer spécifique au Canada avec une capacité de 19 619 places. Situé au 4750 rue Sherbrooke Est dans le Parc olympique (arrondissement Mercier–Hochelaga-Maisonneuve), le stade a ouvert le 21 mai 2008. Il présente un design moderne et élégant et se trouve sur l\'ancien site d\'entraînement d\'athlétisme des Jeux olympiques d\'été de 1976. Le côté ouest offre des vues spectaculaires sur la tour inclinée emblématique du Stade olympique. Le stade est la maison du CF Montréal pour les matchs de Major League Soccer, le Championnat canadien et les compétitions Leagues Cup. Il accueille également des événements internationaux.',
    capacity: 19619,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Saputo_Stadium_2012.jpg/1200px-Saputo_Stadium_2012.jpg',
    types: ['stade', 'sport'],
    tags: ['soccer', 'sport', 'football', 'CF Montréal', 'événements sportifs'],
    website: 'https://www.cfmontreal.com',
    neighborhood: 'Parc olympique',
  },
  
  // Musée des Beaux-Arts de Montréal
  'musee-des-beaux-arts-de-montreal': {
    description: 'Le Musée des beaux-arts de Montréal (MBAM) est l\'un des musées les plus importants au Canada. Situé au 1380 rue Sherbrooke Ouest, il propose une programmation variée incluant des expositions majeures, des visites guidées, des conférences, des activités famille et des ateliers. La Salle Bourgie accueille des concerts et événements musicaux. Le musée est ouvert du mardi au dimanche de 10 h à 17 h, ainsi que le mercredi de 10 h à 21 h. Les groupes de plus de 10 personnes doivent réserver. Le MBAM présente des collections permanentes et temporaires d\'art canadien, international et contemporain.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Mus%C3%A9e_des_beaux-arts_de_Montr%C3%A9al_%28MBAM%29.jpg/1200px-Mus%C3%A9e_des_beaux-arts_de_Montr%C3%A9al_%28MBAM%29.jpg',
    types: ['musée', 'centre_culturel'],
    tags: ['art', 'expositions', 'culture', 'concerts', 'conférences', 'ateliers', 'visites guidées'],
    website: 'https://www.mbam.qc.ca',
    neighborhood: 'Centre-ville',
  },
  
  // Basilique Notre-Dame
  'basilique-notre-dame': {
    description: 'La Basilique Notre-Dame de Montréal est un monument néogothique construit entre 1824 et 1829, situé au 110 rue Notre-Dame Ouest dans le Vieux-Montréal. Réputée pour sa riche décoration intérieure sculptée, peinte et dorée à la feuille d\'or, elle propose plusieurs activités : visite touristique autoguidée d\'environ une heure explorant 24 points d\'intérêt (vitraux, sculptures, feuille d\'or et un orgue de 7 000 tuyaux), et l\'expérience AURA, un spectacle immersif de lumière et son créé par Moment Factory. Des travaux de restauration importants sont en cours jusqu\'en 2040.',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Notre-Dame_Basilica_Montreal.jpg/1200px-Notre-Dame_Basilica_Montreal.jpg',
    types: ['église', 'monument', 'centre_culturel'],
    tags: ['patrimoine', 'architecture', 'visites', 'spectacles immersifs', 'AURA', 'culture religieuse'],
    website: 'https://www.basiliquenotredame.ca',
    neighborhood: 'Vieux-Montréal',
  },
  
  // Le Belmont
  'le-belmont': {
    description: 'Le Belmont est un établissement emblématique situé au 4483 Boulevard Saint-Laurent, au coin de Mont-Royal, dans le quartier du Plateau-Mont-Royal. C\'est un lieu au cœur de la vie nocturne montréalaise depuis plus de vingt ans. Il s\'agit d\'un café-bar-restaurant qui accueille des concerts et événements. Le Belmont présente chaque semaine une programmation originale et diversifiée incluant musique électronique, rock, burlesque et arts de la scène. L\'établissement dispose d\'une terrasse, d\'un bar complet, et d\'un vestiaire obligatoire.',
    types: ['bar', 'café', 'salle'],
    tags: ['musique électronique', 'rock', 'burlesque', 'arts de la scène', 'concerts', 'vie nocturne'],
    neighborhood: 'Plateau-Mont-Royal',
  },
  
  // Le Ministère
  'le-ministere': {
    description: 'Le Ministère est une salle de spectacles située dans un immeuble patrimonial du boulevard Saint-Laurent, dans une ancienne banque. Ouverte en 2017, elle s\'est établie comme l\'une des salles les plus en demande de Montréal avec une capacité de 288 places. La salle est parfaitement insonorisée et équipée de matériel audiovisuel de pointe. Elle dispose d\'une régie conçue comme un studio de mixage avec une fenêtre de 10\' par 4\', de 4 caméras Sony A7s II en résolution 4K, et d\'un studio Livestream H550 capable de faire du montage en direct. La salle accueille les spectacles de tous genres, conférences, événements corporatifs et privés, lancements d\'albums, vidéoclips, et autres événements.',
    capacity: 288,
    types: ['salle', 'studio'],
    tags: ['spectacles', 'concerts', 'conférences', 'événements corporatifs', 'livestream', 'vidéo'],
    website: 'https://leministere.ca',
    neighborhood: 'Plateau-Mont-Royal',
  },
  
  // l'Escogriffe Bar Spectacle
  'l-escogriffe-bar-spectacle': {
    description: 'L\'Escogriffe (connu sous le nom de L\'Esco) est un lieu de musique intime situé dans le Plateau-Mont-Royal sur la rue Saint-Denis. Ce bar à l\'éclairage tamisé a évolué d\'un bar country en une institution rock \'n\' roll, accueillant des groupes garage, punk et rock underground. L\'espace est décrit comme intime et bruyant, conçu pour les groupes qui peuvent vraiment jouer. Le venue dispose de prix de boissons raisonnables, d\'une terrasse cachée, et est connu pour son authenticité montréalaise brute. Il propose des promotions spéciales comme des tacos à 1$ le mardi, des transmissions radio en direct et des spectacles d\'humour.',
    types: ['bar', 'salle'],
    tags: ['rock', 'punk', 'garage', 'underground', 'concerts', 'humour', 'vie nocturne'],
    neighborhood: 'Plateau-Mont-Royal',
  },
  
  // Place Bell
  'place-bell': {
    description: 'Place Bell est une aréna polyvalente moderne située à Laval, dans la région métropolitaine de Montréal. Cette installation sportive et de divertissement accueille des événements sportifs, des concerts et des spectacles. Elle dispose d\'équipements modernes et d\'une capacité importante pour accueillir divers types d\'événements.',
    types: ['arène', 'salle'],
    tags: ['sport', 'concerts', 'spectacles', 'événements'],
    neighborhood: 'Laval',
  },
  
  // Vieux-Port de Montréal
  'vieux-port-de-montreal': {
    description: 'Le Vieux-Port de Montréal est un espace public emblématique situé le long du fleuve Saint-Laurent dans le Vieux-Montréal. Cet espace historique accueille de nombreux événements publics, festivals, concerts en plein air et activités culturelles tout au long de l\'année. Le Vieux-Port offre des vues spectaculaires sur le fleuve et la ville, avec des espaces ouverts pour des événements de grande envergure.',
    types: ['espace_public', 'quai'],
    tags: ['festivals', 'concerts en plein air', 'événements publics', 'culture', 'patrimoine'],
    neighborhood: 'Vieux-Montréal',
  },
  
  // Parc du Mont-Royal
  'parc-du-mont-royal': {
    description: 'Le Parc du Mont-Royal est un grand espace vert public situé sur la montagne du même nom au cœur de Montréal. Conçu par Frederick Law Olmsted, le parc accueille de nombreux événements publics, concerts en plein air, festivals et activités culturelles. Il offre des vues panoramiques sur la ville et constitue un lieu de rassemblement populaire pour les Montréalais et les visiteurs.',
    types: ['parc', 'espace_public'],
    tags: ['concerts en plein air', 'festivals', 'événements publics', 'nature', 'culture'],
    neighborhood: 'Mont-Royal',
  },
  
  // Quartier des Spectacles
  'quartier-des-spectacles': {
    description: 'Le Quartier des spectacles est un quartier culturel dynamique au cœur de Montréal, concentrant de nombreux lieux de spectacles, festivals et événements culturels. Cet espace public accueille des centaines d\'événements chaque année, incluant des festivals majeurs comme le Festival international de jazz de Montréal, les Francofolies, Juste pour Rire, et bien d\'autres. Le quartier dispose d\'espaces publics pour des événements en plein air et des installations culturelles de renommée mondiale.',
    types: ['quartier', 'espace_public'],
    tags: ['festivals', 'spectacles', 'culture', 'événements publics', 'quartier culturel'],
    neighborhood: 'Quartier des spectacles',
  },
  'quartier-des-spectacles-1': {
    description: 'Le Quartier des spectacles est un quartier culturel dynamique au cœur de Montréal, concentrant de nombreux lieux de spectacles, festivals et événements culturels. Cet espace public accueille des centaines d\'événements chaque année, incluant des festivals majeurs comme le Festival international de jazz de Montréal, les Francofolies, Juste pour Rire, et bien d\'autres. Le quartier dispose d\'espaces publics pour des événements en plein air et des installations culturelles de renommée mondiale.',
    types: ['quartier', 'espace_public'],
    tags: ['festivals', 'spectacles', 'culture', 'événements publics', 'quartier culturel'],
    neighborhood: 'Quartier des spectacles',
  },
  
  // Bibliothèque et Archives nationales du Québec
  'bibliotheque-et-archives-nationales-du-quebec': {
    description: 'La Bibliothèque et Archives nationales du Québec (BAnQ) est une institution culturelle majeure qui accueille des événements, conférences, expositions et activités culturelles. Située dans le Quartier des spectacles, elle dispose d\'espaces pour accueillir divers types d\'événements éducatifs et culturels.',
    types: ['bibliothèque', 'centre_culturel'],
    tags: ['conférences', 'expositions', 'culture', 'éducation', 'archives'],
    website: 'https://www.banq.qc.ca',
    neighborhood: 'Quartier des spectacles',
  },
  
  // Centre sportif du Parc olympique
  'centre-sportif-du-parc-olympique': {
    description: 'Le Centre sportif du Parc olympique est une installation sportive située dans le Parc olympique de Montréal. Cette installation moderne accueille des événements sportifs, des compétitions et des activités physiques. Elle fait partie du complexe olympique historique de Montréal.',
    types: ['centre_sportif', 'sport'],
    tags: ['sport', 'compétitions', 'activités physiques', 'olympique'],
    neighborhood: 'Parc olympique',
  },
  
  // Esplanade Tranquille / Esplanade de la Place des Arts
  'esplanade-tranquille': {
    description: 'L\'Esplanade Tranquille est un espace public situé dans le Quartier des spectacles, offrant un lieu de rassemblement pour des événements en plein air, des festivals et des activités culturelles. Cet espace fait partie de l\'infrastructure culturelle du quartier.',
    types: ['espace_public', 'esplanade'],
    tags: ['festivals', 'événements publics', 'culture', 'espace ouvert'],
    neighborhood: 'Quartier des spectacles',
  },
  'esplanade-de-la-place-des-arts': {
    description: 'L\'Esplanade de la Place des Arts est un espace public majeur situé devant la Place des Arts dans le Quartier des spectacles. Cet espace accueille de nombreux événements en plein air, des festivals, des concerts et des activités culturelles tout au long de l\'année. C\'est un lieu de rassemblement emblématique pour les Montréalais et les visiteurs.',
    types: ['espace_public', 'esplanade'],
    tags: ['festivals', 'concerts en plein air', 'événements publics', 'culture'],
    neighborhood: 'Quartier des spectacles',
  },
  'esplanade-tranquille-1': {
    description: 'L\'Esplanade Tranquille est un espace public situé dans le Quartier des spectacles, offrant un lieu de rassemblement pour des événements en plein air, des festivals et des activités culturelles. Cet espace fait partie de l\'infrastructure culturelle du quartier.',
    types: ['espace_public', 'esplanade'],
    tags: ['festivals', 'événements publics', 'culture', 'espace ouvert'],
    neighborhood: 'Quartier des spectacles',
  },
};

// Fonction pour normaliser le nom/slug d'une venue
function normalizeVenueName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplacer par des tirets
    .replace(/^-+|-+$/g, ''); // Supprimer les tirets en début/fin
}

// Fonction pour générer des données d'enrichissement génériques basées sur le nom
function generateGenericEnrichment(venue: { name: string; slug: string | null }): typeof venueEnrichmentData[string] | null {
  const name = venue.name.toLowerCase();
  
  // Églises
  if (name.includes('eglise') || name.includes('église') || name.includes('church')) {
    return {
      description: `Cette église historique de Montréal accueille des événements culturels, concerts de musique sacrée, cérémonies et activités communautaires. Lieu de patrimoine architectural et religieux, elle offre un cadre unique pour des événements solennels et culturels.`,
      types: ['église', 'monument'],
      tags: ['patrimoine', 'culture religieuse', 'concerts', 'événements communautaires'],
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop',
    };
  }
  
  // Parcs et espaces publics
  if (name.includes('parc') || name.includes('park') || name.includes('place jacques') || name.includes('esplanade')) {
    return {
      description: `Cet espace public emblématique de Montréal accueille de nombreux événements en plein air, festivals, concerts et activités culturelles tout au long de l'année. Lieu de rassemblement populaire pour les Montréalais et les visiteurs.`,
      types: ['espace_public', 'parc'],
      tags: ['festivals', 'concerts en plein air', 'événements publics', 'culture'],
      imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop',
    };
  }
  
  // Bars et clubs
  if (name.includes('bar') || name.includes('club') || name.includes('rittz') || name.includes('escogriffe') || name.includes('belmont')) {
    return {
      description: `Ce lieu de vie nocturne montréalaise accueille des concerts, spectacles, soirées DJ et événements musicaux dans une ambiance intime et chaleureuse. Un espace dédié à la musique live et à la culture alternative.`,
      types: ['bar', 'club'],
      tags: ['concerts', 'musique live', 'vie nocturne', 'spectacles'],
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
    };
  }
  
  // Théâtres
  if (name.includes('theatre') || name.includes('théâtre') || name.includes('theater')) {
    return {
      description: `Cette salle de spectacle montréalaise accueille des représentations théâtrales, concerts, spectacles et événements culturels dans un cadre intime et professionnel. Un lieu dédié aux arts de la scène.`,
      types: ['théâtre', 'salle'],
      tags: ['théâtre', 'spectacles', 'concerts', 'arts de la scène'],
      imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=600&fit=crop',
    };
  }
  
  // Salles et venues génériques
  if (name.includes('salle') || name.includes('venue') || name.includes('centre') || name.includes('balcon')) {
    return {
      description: `Cette salle polyvalente de Montréal accueille une variété d'événements incluant concerts, spectacles, conférences et événements corporatifs. Un espace moderne et fonctionnel adapté à différents types d'événements.`,
      types: ['salle'],
      tags: ['concerts', 'spectacles', 'événements', 'culture'],
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=600&fit=crop',
    };
  }
  
  // Lieux multiples / divers
  if (name.includes('divers') || name.includes('multiple') || name.includes('lieux')) {
    return {
      description: `Cet espace polyvalent de Montréal accueille une variété d'événements dans différents lieux. Un réseau de salles et d'espaces adaptés à différents types d'événements culturels et artistiques.`,
      types: ['espace_public'],
      tags: ['événements', 'culture', 'spectacles', 'festivals'],
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
    };
  }
  
  // Par défaut, enrichissement générique
  return {
    description: `Ce lieu montréalais accueille des événements culturels, spectacles et activités communautaires. Un espace dédié à la culture et aux arts dans la métropole québécoise.`,
    types: ['salle'],
    tags: ['événements', 'culture', 'spectacles'],
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop',
  };
}

// Fonction pour trouver les données d'enrichissement correspondantes
function findEnrichmentData(venue: { name: string; slug: string | null }): typeof venueEnrichmentData[string] | null {
  const normalizedName = normalizeVenueName(venue.name);
  const slug = venue.slug ? normalizeVenueName(venue.slug) : null;
  
  // Chercher par slug d'abord
  if (slug && venueEnrichmentData[slug]) {
    return venueEnrichmentData[slug];
  }
  
  // Chercher par nom normalisé
  if (venueEnrichmentData[normalizedName]) {
    return venueEnrichmentData[normalizedName];
  }
  
  // Chercher par correspondance partielle (mots-clés)
  const keywords = normalizedName.split('-');
  for (const [key, data] of Object.entries(venueEnrichmentData)) {
    const keyWords = key.split('-');
    // Si au moins 2 mots-clés correspondent
    const matches = keywords.filter(kw => keyWords.some(k => k.includes(kw) || kw.includes(k)));
    if (matches.length >= 2 || (matches.length >= 1 && keywords.length <= 2)) {
      return data;
    }
  }
  
  // Chercher par correspondance partielle simple (fallback)
  for (const [key, data] of Object.entries(venueEnrichmentData)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return data;
    }
  }
  
  // Si aucune correspondance, essayer de générer des données génériques
  return generateGenericEnrichment(venue);
}

async function enrichVenues() {
  console.log('🎨 Début de l\'enrichissement des venues...\n');
  
  try {
    // Récupérer toutes les venues
    const venues = await prisma.venue.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        capacity: true,
        imageUrl: true,
        types: true,
        tags: true,
        phone: true,
        website: true,
        neighborhood: true,
      },
    });
    
    console.log(`📊 ${venues.length} venues trouvées\n`);
    
    let enriched = 0;
    let skipped = 0;
    
    for (const venue of venues) {
      const enrichmentData = findEnrichmentData(venue);
      
      if (!enrichmentData) {
        console.log(`⏭️  ${venue.name} - Aucune donnée d'enrichissement trouvée`);
        skipped++;
        continue;
      }
      
      // Marquer si c'est un enrichissement générique
      const normalizedName = normalizeVenueName(venue.name);
      const normalizedSlug = venue.slug ? normalizeVenueName(venue.slug) : null;
      const isGeneric = !venueEnrichmentData[normalizedName] && 
                        !(normalizedSlug && venueEnrichmentData[normalizedSlug]);
      
      // Préparer les données de mise à jour
      const updateData: any = {};
      
      // Description : toujours mettre à jour si enrichissement générique, sinon seulement si vide
      const isGenericEnrichment = !venueEnrichmentData[normalizedName] && 
                                   !(normalizedSlug && venueEnrichmentData[normalizedSlug]);
      if (enrichmentData.description && (isGenericEnrichment || !venue.description || venue.description.trim().length < 50)) {
        updateData.description = enrichmentData.description;
      }
      
      // Capacité : seulement si elle n'existe pas
      if (enrichmentData.capacity && !venue.capacity) {
        updateData.capacity = enrichmentData.capacity;
      }
      
      // Image : toujours ajouter si disponible, ou ajouter une image générique si aucune n'existe
      if (enrichmentData.imageUrl) {
        // Si on a une image spécifique, l'utiliser
        if (!venue.imageUrl || isGenericEnrichment) {
          updateData.imageUrl = enrichmentData.imageUrl;
        }
      } else if (!venue.imageUrl) {
        // Si aucune image n'existe et qu'on n'a pas d'image spécifique, ajouter une image générique selon le type
        const venueNameLower = venue.name.toLowerCase();
        if (venueNameLower.includes('eglise') || venueNameLower.includes('église') || venueNameLower.includes('church')) {
          updateData.imageUrl = 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop';
        } else if (venueNameLower.includes('parc') || venueNameLower.includes('park') || venueNameLower.includes('place') || venueNameLower.includes('esplanade')) {
          updateData.imageUrl = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=600&fit=crop';
        } else if (venueNameLower.includes('bar') || venueNameLower.includes('club') || venueNameLower.includes('rittz') || venueNameLower.includes('escogriffe') || venueNameLower.includes('belmont')) {
          updateData.imageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop';
        } else if (venueNameLower.includes('theatre') || venueNameLower.includes('théâtre') || venueNameLower.includes('theater')) {
          updateData.imageUrl = 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200&h=600&fit=crop';
        } else {
          // Image générique par défaut
          updateData.imageUrl = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop';
        }
      }
      
      // Types : fusionner avec les types existants, toujours ajouter si enrichissement générique
      if (enrichmentData.types && enrichmentData.types.length > 0) {
        const existingTypes = venue.types || [];
        const newTypes = [...new Set([...existingTypes, ...enrichmentData.types])];
        if (newTypes.length > existingTypes.length || (isGenericEnrichment && existingTypes.length === 0)) {
          updateData.types = newTypes;
        }
      }
      
      // Tags : fusionner avec les tags existants, toujours ajouter si enrichissement générique
      if (enrichmentData.tags && enrichmentData.tags.length > 0) {
        const existingTags = venue.tags || [];
        const newTags = [...new Set([...existingTags, ...enrichmentData.tags])];
        if (newTags.length > existingTags.length || (isGenericEnrichment && existingTags.length === 0)) {
          updateData.tags = newTags;
        }
      }
      
      // Phone : seulement si elle n'existe pas
      if (enrichmentData.phone && !venue.phone) {
        updateData.phone = enrichmentData.phone;
      }
      
      // Website : seulement si elle n'existe pas
      if (enrichmentData.website && !venue.website) {
        updateData.website = enrichmentData.website;
      }
      
      // Neighborhood : seulement si elle n'existe pas
      if (enrichmentData.neighborhood && !venue.neighborhood) {
        updateData.neighborhood = enrichmentData.neighborhood;
      }
      
      // Toujours ajouter l'image si disponible et manquante
      if (enrichmentData.imageUrl && !venue.imageUrl) {
        updateData.imageUrl = enrichmentData.imageUrl;
      }
      
      // Toujours ajouter la capacité si disponible et manquante
      if (enrichmentData.capacity && !venue.capacity) {
        updateData.capacity = enrichmentData.capacity;
      }
      
      // Toujours ajouter le quartier si disponible et manquant
      if (enrichmentData.neighborhood && !venue.neighborhood) {
        updateData.neighborhood = enrichmentData.neighborhood;
      }
      
      // Toujours ajouter le téléphone si disponible et manquant
      if (enrichmentData.phone && !venue.phone) {
        updateData.phone = enrichmentData.phone;
      }
      
      // Toujours ajouter le site web si disponible et manquant
      if (enrichmentData.website && !venue.website) {
        updateData.website = enrichmentData.website;
      }
      
      // Mettre à jour seulement s'il y a des changements
      if (Object.keys(updateData).length > 0) {
        await prisma.venue.update({
          where: { id: venue.id },
          data: updateData,
        });
        
        const prefix = isGeneric ? '🔧' : '✅';
        console.log(`${prefix} ${venue.name} - Enrichi avec:`);
        Object.keys(updateData).forEach(key => {
          if (key === 'types' || key === 'tags') {
            console.log(`   - ${key}: ${updateData[key].join(', ')}`);
          } else if (key === 'description') {
            console.log(`   - ${key}: ${updateData[key].substring(0, 60)}...`);
          } else {
            console.log(`   - ${key}: ${updateData[key]}`);
          }
        });
        enriched++;
      } else {
        console.log(`ℹ️  ${venue.name} - Déjà complet`);
        skipped++;
      }
    }
    
    console.log(`\n✨ Enrichissement terminé !`);
    console.log(`   ✅ ${enriched} venues enrichies`);
    console.log(`   ⏭️  ${skipped} venues ignorées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'enrichissement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
enrichVenues()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
