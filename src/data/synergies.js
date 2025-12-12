// Base de datos de conocimientos de LoL
// Sinergias: Campeones que funcionan bien juntos
export const SYNERGIES = {
    // Sinergias de Yasuo (Knockups)
    "Yasuo": ["Malphite", "Alistar", "Diana", "Janna", "Nautilus", "Gragas", "Yone", "Rakan", "Ornn", "Zac"],
    // Combo Wombo
    "Miss Fortune": ["Amumu", "Leona", "Sona", "Galio", "Rell", "Jarvan IV"],
    "Orianna": ["Malphite", "Amumu", "Zac", "Nocturne", "Rengar"],
    "Katarina": ["Amumu", "Morgana", "Leona"], // CC para asegurar daño
    // Bot Lane Clásicas
    "Lucian": ["Braum", "Nami", "Thresh"],
    "KogMaw": ["Lulu", "Milio", "Janna"],
    "Samira": ["Nautilus", "Leona", "Rell", "Alistar"],
    "Kai'Sa": ["Nautilus", "Leona", "Pyke", "Blitzcrank"],
    "Xayah": ["Rakan"],
    "Jinx": ["Lulu", "Thresh", "Blitzcrank", "Tahm Kench"],
    "Draven": ["Janna", "Nami", "Thresh", "Leona"],
    "Ezreal": ["Karma", "Yuumi", "Lux"],
    "Caitlyn": ["Lux", "Morgana", "Zyra", "Karma"],
    // Jungla + Mid
    "Master Yi": ["Taric", "Kayle", "Zilean"],
};

// Counters: Clave es el enemigo, Valor es qué le gana
export const COUNTERS = {
    // Anti-Tanks
    "Vayne": ["Cho'Gath", "Sion", "Dr. Mundo", "Ornn", "Malphite"],
    "Fiora": ["K'Sante", "Ornn", "Sion"],
    "Trundle": ["Rammus", "Sejuani", "Ornn"], // Roba stats
    // Anti-Asesinos
    "Lissandra": ["Zed", "Fizz", "Leblanc", "Katarina"],
    "Malzahar": ["Yasuo", "Yone", "Katarina", "Zed"], // Supresión
    "Poppy": ["Rengar", "Lee Sin", "Akali", "Yasuo", "Kayn"], // Bloquea dashes
    // Bot Lane Counters
    "Caitlyn": ["Vayne", "Kai'Sa", "Samira"], // Rango vs Corto rango
    "Yasuo": ["Miss Fortune", "Ezreal", "Jinx"], // Muro de viento
    "Samira": ["Miss Fortune", "Jhin", "Kog'Maw"], // Bloquea proyectiles
    "Morgana": ["Blitzcrank", "Thresh", "Nautilus", "Pyke"], // Escudo negro
    "Sivir": ["Blitzcrank", "Caitlyn"],
};

// Tipos de daño para balancear equipo
export const CHAMPION_DAMAGE_TYPE = {
    "Zed": "AD", "Talon": "AD", "Yasuo": "AD", "Yone": "AD", "Darius": "AD", "Draven": "AD",
    "Ahri": "AP", "Lux": "AP", "Syndra": "AP", "Veigar": "AP", "Karthus": "AP", "Xerath": "AP",
    "Malphite": "Tank", "Ornn": "Tank", "Sion": "Tank", "Rammus": "Tank", "Mundo": "Tank",
};
