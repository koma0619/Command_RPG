import type { Skill } from '../types/battleTypes';

// 基本スキル（全員が持っている）
const baseSkills: Record<string, Skill> = {
    attack: {
        id: 'attack',
        name: '攻撃',
        type: 'attack_physical',
        mpCost: 0,
        power: 1.0,
        target: 'enemy_single',
        description: '基本攻撃。防御力を考慮したダメージを与える'
    },
    defend: {
        id: 'defend',
        name: '防御',
        type: 'buff',
        mpCost: 0,
        target: 'self',
        effect: {
            kind: 'buff',
            key: 'def',
            value: 2,
            duration: 1
        },
        priority: 2,
        description: 'このターンの被ダメージを半減する。必ず先制する'
    }
};

// 攻撃呪文
const attackMagic: Record<string, Skill> = {
    mera_mi: {
        id: 'mera_mi',
        name: 'メラミ',
        type: 'attack_magic',
        mpCost: 5,
        power: 20,
        target: 'enemy_single',
        description: '敵単体に中ダメージの炎系呪文'
    },
    mera_zoma: {
        id: 'mera_zoma',
        name: 'メラゾーマ',
        type: 'attack_magic',
        mpCost: 20,
        power: 50,
        target: 'enemy_single',
        description: '敵単体に大ダメージの炎系呪文'
    },
    io_ra: {
        id: 'io_ra',
        name: 'イオラ',
        type: 'attack_magic',
        mpCost: 5,
        power: 15,
        target: 'enemy_all',
        description: '敵全体に中ダメージの爆発呪文'
    },
    io_nazun: {
        id: 'io_nazun',
        name: 'イオナズン',
        type: 'attack_magic',
        mpCost: 20,
        power: 40,
        target: 'enemy_all',
        description: '敵全体に大ダメージの爆発呪文'
    }
};

// バフ/デバフ呪文
const buffDebuffMagic: Record<string, Skill> = {
    bike_ruto: {
        id: 'bike_ruto',
        name: 'バイキルト',
        type: 'buff',
        mpCost: 4,
        target: 'ally_single',
        effect: {
            kind: 'buff',
            key: 'atk',
            value: 1.5,
            duration: 3
        },
        stackable: false,
        description: '味方1人の攻撃力を1.5倍にする（3ターン）'
    },
    sca_ra: {
        id: 'sca_ra',
        name: 'スカラ',
        type: 'buff',
        mpCost: 3,
        target: 'ally_single',
        effect: {
            kind: 'buff',
            key: 'def',
            value: 1.5,
            duration: 3
        },
        stackable: false,
        description: '味方1人の防御力を1.5倍にする（3ターン）'
    },
    pio_ra: {
        id: 'pio_ra',
        name: 'ピオラ',
        type: 'buff',
        mpCost: 3,
        target: 'ally_single',
        effect: {
            kind: 'buff',
            key: 'spd',
            value: 1.5,
            duration: 3
        },
        stackable: false,
        description: '味方1人の素早さを1.5倍にする（3ターン）'
    },
    magic_barrier: {
        id: 'magic_barrier',
        name: 'マジックバリア',
        type: 'buff',
        mpCost: 4,
        target: 'ally_all',
        effect: {
            kind: 'buff',
            key: 'magic_resist',
            value: 0.5,
            duration: 3
        },
        stackable: false,
        description: '味方全員の魔法ダメージを半減する（3ターン）'
    },
    ruka_ni: {
        id: 'ruka_ni',
        name: 'ルカニ',
        type: 'debuff',
        mpCost: 3,
        target: 'enemy_single',
        effect: {
            kind: 'debuff',
            key: 'def',
            value: 0.75,
            duration: 3
        },
        chance: 0.75,
        stackable: false,
        description: '敵1体の防御力を0.75倍にする（3ターン、75%）'
    },
    hena_tos: {
        id: 'hena_tos',
        name: 'ヘナトス',
        type: 'debuff',
        mpCost: 4,
        target: 'enemy_single',
        effect: {
            kind: 'debuff',
            key: 'atk',
            value: 0.75,
            duration: 3
        },
        chance: 0.75,
        stackable: false,
        description: '敵1体の攻撃力を0.75倍にする（3ターン、75%）'
    }
};

// 物理攻撃特技
const attackSkills: Record<string, Skill> = {
    kabuto_wari: {
        id: 'kabuto_wari',
        name: '兜割り',
        type: 'attack_debuff',
        mpCost: 4,
        target: 'enemy_single',
        power: 0.8,
        effect: {
            kind: 'debuff',
            key: 'def',
            value: 0.75,
            duration: 3
        },
        chance: 0.5,
        description: '通常の80%ダメージを与え、50%で防御力を0.75倍にする'
    },
    yaiba_kuda: {
        id: 'yaiba_kuda',
        name: '刃砕き',
        type: 'attack_debuff',
        mpCost: 4,
        target: 'enemy_single',
        power: 0.8,
        effect: {
            kind: 'debuff',
            key: 'atk',
            value: 0.75,
            duration: 3
        },
        chance: 0.5,
        description: '通常の80%ダメージを与え、50%で攻撃力を0.75倍にする'
    },
    shippu_tsuki: {
        id: 'shippu_tsuki',
        name: '疾風突き',
        type: 'attack_fast',
        mpCost: 2,
        target: 'enemy_single',
        power: 0.75,
        priority: 1,
        description: '必ず先制する。通常の75%ダメージを与える'
    },
    samidare_giri: {
        id: 'samidare_giri',
        name: '五月雨突き',
        type: 'attack_multi',
        mpCost: 6,
        target: 'enemy_single',
        power: 0.5,
        hits: 4,
        description: '通常の50%ダメージを4回与える'
    },
    majin_giri: {
        id: 'majin_giri',
        name: '魔人斬り',
        type: 'attack_gamble',
        mpCost: 4,
        target: 'enemy_single',
        power: 2.0,
        chance: 0.5,
        description: '50%の確率で通常の2倍ダメージを与える'
    },
    nagi_harai: {
        id: 'nagi_harai',
        name: 'なぎ払い',
        type: 'attack_physical',
        mpCost: 4,
        target: 'enemy_all',
        power: 0.6,
        description: '敵全体に通常の60%ダメージを与える'
    },
    hayabusa_giri: {
        id: 'hayabusa_giri',
        name: 'はやぶさ斬り',
        type: 'attack_multi',
        mpCost: 6,
        target: 'enemy_single',
        power: 0.75,
        hits: 2,
        description: '通常の75%ダメージを2回与える'
    },
    miracle_sword: {
        id: 'miracle_sword',
        name: 'ミラクルソード',
        type: 'attack_drain',
        mpCost: 8,
        target: 'enemy_single',
        power: 1.0,
        drain: 0.5,
        description: '通常ダメージを与え、その50%分のHPを回復する'
    },
    sutemi_kogeki: {
        id: 'sutemi_kogeki',
        name: '捨て身攻撃',
        type: 'attack_reckless',
        mpCost: 8,
        target: 'enemy_single',
        power: 2.0,
        defPenalty: 0.5,
        description: '通常の2倍ダメージを与えるが、防御力が半減する'
    }
};

// 補助特技
const supportSkills: Record<string, Skill> = {
    niou_dachi: {
        id: 'niou_dachi',
        name: '仁王立ち',
        type: 'protect',
        mpCost: 2,
        target: 'self',
        effect: {
            kind: 'status',
            key: 'protect_all',
            value: 1,
            duration: 1
        },
        priority: 2,
        description: '味方へのダメージを全て引き受ける。必ず先制する'
    },
    otakebi: {
        id: 'otakebi',
        name: 'おたけび',
        type: 'stun',
        mpCost: 4,
        target: 'enemy_all',
        effect: {
            kind: 'status',
            key: 'stunned',
            value: 1,
            duration: 1
        },
        chance: 0.33,
        description: '33%の確率で敵全体を1ターン行動不能にする'
    },
    tameru: {
        id: 'tameru',
        name: 'ためる',
        type: 'charge',
        mpCost: 2,
        target: 'self',
        effect: {
            kind: 'buff',
            key: 'next_atk',
            value: 2.5,
            duration: 1
        },
        description: '次のターンに与えるダメージが2.5倍になる'
    }
};

// 回復呪文
const healingMagic: Record<string, Skill> = {
    hoimi: {
        id: 'hoimi',
        name: 'ホイミ',
        type: 'heal',
        mpCost: 4,
        target: 'ally_single',
        power: 50,
        description: '味方1人のHPを50回復する'
    },
    behomarah: {
        id: 'behomarah',
        name: 'ベホマラー',
        type: 'heal',
        mpCost: 8,
        target: 'ally_all',
        power: 40,
        description: '味方全員のHPを40回復する'
    },
    rihoimi: {
        id: 'rihoimi',
        name: 'リホイミ',
        type: 'heal_regen',
        mpCost: 4,
        target: 'ally_single',
        power: 25,
        effect: {
            kind: 'status',
            key: 'regen',
            value: 25,
            duration: 3
        },
        description: '味方1人のHPを毎ターン25ずつ回復する（3ターン）'
    }
};

// 蘇生呪文
const reviveMagic: Record<string, Skill> = {
    zaoral: {
        id: 'zaoral',
        name: 'ザオラル',
        type: 'revive',
        mpCost: 20,
        target: 'ally_single',
        power: 0.5,
        description: '戦闘不能の味方1人をHP半分で蘇生する'
    },
    mega_zaru: {
        id: 'mega_zaru',
        name: 'メガザル',
        type: 'mega_revive',
        mpCost: 30,
        target: 'ally_all',
        power: 1.0,
        description: '戦闘不能の味方全員を全回復で蘇生する'
    }
};

// 全スキルをまとめる
export const SKILLS: Record<string, Skill> = {
    ...baseSkills,
    ...attackMagic,
    ...buffDebuffMagic,
    ...attackSkills,
    ...supportSkills,
    ...healingMagic,
    ...reviveMagic
};