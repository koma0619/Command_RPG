export const SKILL_IDS = [
  'attack',
  'defend',
  'mera_mi',
  'mera_zoma',
  'io_ra',
  'io_nazun',
  'bike_ruto',
  'sca_ra',
  'pio_ra',
  'magic_barrier',
  'ruka_ni',
  'hena_tos',
  'kabuto_wari',
  'yaiba_kuda',
  'shippu_tsuki',
  'samidare_giri',
  'majin_giri',
  'nagi_harai',
  'hayabusa_giri',
  'miracle_sword',
  'sutemi_kogeki',
  'niou_dachi',
  'otakebi',
  'tameru',
  'hoimi',
  'behomarah',
  'rihoimi',
  'zaoral',
  'mega_zaru'
] as const;

export type SkillId = typeof SKILL_IDS[number];

export type SkillDictionary<T> = { [K in SkillId]: T & { id: K } };
