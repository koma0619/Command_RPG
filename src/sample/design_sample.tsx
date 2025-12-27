import React, { useState, useEffect } from 'react';
import { Sword, Shield, Heart, Skull, RefreshCw, Zap } from 'lucide-react';

// --- 型定義 ---
type CharacterType = 'hero' | 'enemy';

interface Character {
    id: number;
    name: string;
    type: CharacterType;
    maxHp: number;
    hp: number;
    atk: number;
    def: number;
    color: string;
    isDead: boolean;
}

interface DamagePopup {
    id: number;
    value: string;
    targetId: number;
    isCrit: boolean;
}

// --- 初期データ ---
const INITIAL_CHARACTERS: Character[] = [
    { id: 1, name: 'ゴブリン', type: 'enemy', maxHp: 90, hp: 90, atk: 20, def: 5, color: 'bg-amber-800', isDead: false },
    { id: 2, name: 'オーク', type: 'enemy', maxHp: 140, hp: 140, atk: 25, def: 10, color: 'bg-stone-700', isDead: false },
    { id: 3, name: 'ダークエルフ', type: 'enemy', maxHp: 80, hp: 80, atk: 32, def: 5, color: 'bg-purple-900', isDead: false },
    { id: 4, name: '戦士', type: 'hero', maxHp: 130, hp: 130, atk: 28, def: 15, color: 'bg-red-700', isDead: false },
    { id: 5, name: '魔法使い', type: 'hero', maxHp: 75, hp: 75, atk: 38, def: 5, color: 'bg-blue-700', isDead: false },
    { id: 6, name: '僧侶', type: 'hero', maxHp: 95, hp: 95, atk: 18, def: 8, color: 'bg-emerald-700', isDead: false },
];

export default function App() {
    const [characters, setCharacters] = useState<Character[]>(JSON.parse(JSON.stringify(INITIAL_CHARACTERS)));
    const [logs, setLogs] = useState<string[]>(['戦闘開始！']);
    const [turn, setTurn] = useState<CharacterType>('hero');
    const [actingCharId, setActingCharId] = useState<number | null>(null);
    const [damagePopups, setDamagePopups] = useState<DamagePopup[]>([]);
    const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

    // アニメーション用ステート
    // IDではなく、「どのような状態か」を管理する
    const [attackMotionId, setAttackMotionId] = useState<number | null>(null); // 攻撃のために前に出ているID
    const [damagedId, setDamagedId] = useState<number | null>(null); // ダメージを受けてのけぞっているID

    const addLog = (text: string) => {
        setLogs((prev) => [text, ...prev].slice(0, 5));
    };

    const applyDamage = (attacker: Character, defenderId: number) => {
        setCharacters((prev) => {
            return prev.map((char) => {
                if (char.id === defenderId) {
                    let damage = Math.max(1, Math.floor(attacker.atk - char.def / 2) + Math.floor(Math.random() * 5) - 2);
                    const isCrit = Math.random() < 0.15;
                    if (isCrit) damage = Math.floor(damage * 1.5);

                    const newHp = Math.max(0, char.hp - damage);
                    const isDead = newHp === 0;

                    const popupId = Date.now() + Math.random();
                    setDamagePopups((p) => [...p, { id: popupId, value: `${damage}`, targetId: defenderId, isCrit }]);
                    setTimeout(() => setDamagePopups((p) => p.filter((i) => i.id !== popupId)), 800);

                    // ダメージアニメーション（Tailwind Transition用）
                    setDamagedId(defenderId);
                    setTimeout(() => setDamagedId(null), 200); // 0.2秒後に戻す

                    addLog(`${attacker.name}の攻撃！ ${damage}ダメージ！${isCrit ? '(会心)' : ''}`);
                    return { ...char, hp: newHp, isDead };
                }
                return char;
            });
        });
    };

    // 敵AIターン
    useEffect(() => {
        if (turn === 'enemy' && gameStatus === 'playing') {
            const executeEnemyTurn = async () => {
                const enemies = characters.filter((c) => c.type === 'enemy' && !c.isDead);
                if (enemies.length === 0) return;

                for (const enemy of enemies) {
                    await new Promise(r => setTimeout(r, 600));

                    // 攻撃モーション開始
                    setAttackMotionId(enemy.id);
                    // 踏み込みの時間待機
                    await new Promise(r => setTimeout(r, 200));

                    // ターゲット決定とダメージ計算
                    setCharacters(currentChars => {
                        const heroes = currentChars.filter(c => c.type === 'hero' && !c.isDead);
                        if (heroes.length === 0) return currentChars;
                        const target = heroes[Math.floor(Math.random() * heroes.length)];
                        const me = currentChars.find(c => c.id === enemy.id);
                        if (!me || me.isDead) return currentChars;

                        // ダメージ計算と適用
                        let damage = Math.max(1, Math.floor(me.atk - target.def / 2) + Math.floor(Math.random() * 5) - 2);
                        const isCrit = Math.random() < 0.15;
                        if (isCrit) damage = Math.floor(damage * 1.5);
                        const newHp = Math.max(0, target.hp - damage);

                        // エフェクトトリガー
                        setTimeout(() => {
                            setDamagePopups(p => [...p, { id: Date.now(), value: String(damage), targetId: target.id, isCrit }]);
                            setDamagedId(target.id);
                            setTimeout(() => setDamagedId(null), 200);
                        }, 0);

                        return currentChars.map(c => c.id === target.id ? { ...c, hp: newHp, isDead: newHp === 0 } : c);
                    });

                    // モーション戻り
                    setTimeout(() => setAttackMotionId(null), 200);
                }
                setTimeout(() => setTurn('hero'), 500);
            };
            executeEnemyTurn();
        }
    }, [turn, gameStatus]);

    // 勝敗判定
    useEffect(() => {
        const heroesAlive = characters.some((c) => c.type === 'hero' && !c.isDead);
        const enemiesAlive = characters.some((c) => c.type === 'enemy' && !c.isDead);
        if (!heroesAlive) setGameStatus('lost');
        else if (!enemiesAlive) setGameStatus('won');
    }, [characters]);

    // プレイヤー操作
    const handleHeroSelect = (id: number) => {
        if (turn === 'hero' && gameStatus === 'playing') {
            const char = characters.find(c => c.id === id);
            if (char && !char.isDead) setActingCharId(actingCharId === id ? null : id);
        }
    };

    const handleTargetSelect = async (targetId: number) => {
        if (actingCharId === null || turn !== 'hero') return;
        const attacker = characters.find(c => c.id === actingCharId);
        const target = characters.find(c => c.id === targetId);

        if (attacker && target && !target.isDead) {
            // 攻撃モーション開始
            setAttackMotionId(actingCharId);

            // アニメーションに合わせてダメージ発生を少し遅らせる
            setTimeout(() => {
                applyDamage(attacker, targetId);
                setAttackMotionId(null); // モーション戻す
                setActingCharId(null);   // 選択解除
                setTurn('enemy');        // ターン交代
            }, 200);
        }
    };

    return (
        <div className="relative w-full min-h-screen bg-slate-900 text-white font-['Oswald'] flex flex-col overflow-hidden select-none">

            {/* 背景レイヤー */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,180,90,0.15),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(80,200,255,0.12),transparent_30%),linear-gradient(160deg,#0b0d10,#10141a,#0a0b0f)]"></div>
                <div className="absolute inset-0 opacity-30 mix-blend-screen bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:14px_14px]"></div>
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-400/10 blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-sky-400/10 blur-3xl animate-pulse"></div>
            </div>

            {/* コンテンツレイヤー */}
            <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto w-full px-4 pt-6 pb-4 gap-4">

                {/* ヘッダー */}
                <header className="relative text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] tracking-[0.2em] uppercase text-white/60">
                        Command RPG Prototype
                    </div>
                    <h1 className="mt-3 text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 drop-shadow-[0_6px_18px_rgba(0,0,0,0.5)] tracking-tight">
                        SLASH & BURST
                    </h1>
                    <div className="mt-2 text-sm text-white/60 tracking-wide">
                        Turn-Based Clash • Focus, Select, Execute
                    </div>

                    {gameStatus !== 'playing' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 animate-in fade-in duration-500">
                            <div className="bg-slate-800/90 p-8 rounded-2xl border border-orange-400/40 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur">
                                <div className="text-6xl mb-3">{gameStatus === 'won' ? '👑' : '💀'}</div>
                                <h2 className="text-3xl font-black mb-5 tracking-wide">{gameStatus === 'won' ? 'Victory!' : 'Defeated...'}</h2>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                                >
                                    <RefreshCw size={20} /> Play Again
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                {/* バトルフィールド */}
                <div className="flex-1 grid grid-rows-[auto_auto_auto] gap-5">
                    {/* 敵エリア */}
                    <div className="relative bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                        <div className="absolute -top-3 left-5 bg-red-950/80 px-3 py-0.5 rounded-full text-[10px] text-red-300 font-bold border border-red-900 tracking-widest">
                            ENEMIES
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                            {characters.filter(c => c.type === 'enemy').map(char => (
                                <BattleCard
                                    key={char.id}
                                    char={char}
                                    onClick={() => handleTargetSelect(char.id)}
                                    isTargetable={turn === 'hero' && actingCharId !== null}
                                    isAttacking={attackMotionId === char.id}
                                    isDamaged={damagedId === char.id}
                                    damagePopup={damagePopups.find(p => p.targetId === char.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* VS */}
                    <div className="flex justify-center items-center h-6">
                        <span className="text-white/20 font-black text-4xl italic tracking-[0.2em]">VS</span>
                    </div>

                    {/* 味方エリア */}
                    <div className="relative bg-white/5 rounded-2xl p-4 sm:p-5 border border-white/10 backdrop-blur-sm transition-colors duration-300 hover:bg-white/10 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                        <div className="absolute -top-3 left-5 bg-sky-950/80 px-3 py-0.5 rounded-full text-[10px] text-sky-300 font-bold border border-sky-900 tracking-widest">
                            HEROES
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                            {characters.filter(c => c.type === 'hero').map(char => (
                                <BattleCard
                                    key={char.id}
                                    char={char}
                                    onClick={() => handleHeroSelect(char.id)}
                                    isSelectable={turn === 'hero'}
                                    isSelected={actingCharId === char.id}
                                    isAttacking={attackMotionId === char.id}
                                    isDamaged={damagedId === char.id}
                                    damagePopup={damagePopups.find(p => p.targetId === char.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* ログ & ガイド */}
                <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
                    <div className="text-center sm:text-left">
                        {turn === 'hero' && gameStatus === 'playing' ? (
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide ${actingCharId ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'}`}>
                                {actingCharId ? '攻撃対象を選んでください' : '行動するキャラを選んでください'}
                            </span>
                        ) : turn === 'enemy' && gameStatus === 'playing' ? (
                            <span className="inline-flex items-center gap-2 text-red-300 text-xs font-bold tracking-wide">
                                <Zap size={14} className="animate-spin" /> Enemy Turn...
                            </span>
                        ) : null}
                    </div>

                    <div className="flex-1 bg-black/50 rounded-xl p-3 border border-white/5 font-mono text-xs text-gray-400 shadow-inner min-h-[110px]">
                        {logs.map((log, i) => (
                            <div key={i} className={`py-1 ${i === 0 ? 'text-white font-bold' : 'text-white/60'} border-b border-white/5 last:border-b-0`}>{log}</div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- カードコンポーネント (アニメーションロジック修正版) ---
function BattleCard({
    char, onClick, isSelectable, isSelected, isTargetable, isAttacking, isDamaged, damagePopup
}: {
    char: Character, onClick?: () => void, isSelectable?: boolean, isSelected?: boolean, isTargetable?: boolean, isAttacking?: boolean, isDamaged?: boolean, damagePopup?: DamagePopup
}) {

    // --- Tailwindだけのアニメーション実装 ---

    // 1. 位置の移動 (Transform)
    // 攻撃時: 敵なら下に(translate-y-8), 味方なら上に(-translate-y-8) 動く
    // 被弾時: 右に少しズレる (translate-x-2) でノックバック表現
    let transformClass = "translate-y-0 translate-x-0 scale-100";

    if (isAttacking) {
        // 攻撃モーション: 前へ踏み込み + 少し拡大
        const direction = char.type === 'hero' ? '-translate-y-8' : 'translate-y-8';
        transformClass = `${direction} scale-110 z-20`;
    } else if (isDamaged) {
        // 被弾モーション: 横に揺れる + 赤くなる
        transformClass = "translate-x-2 bg-red-600/80 rotate-3";
    } else if (isSelected) {
        // 選択中: 少し浮く
        transformClass = "-translate-y-2 scale-105 z-10";
    }

    // 2. 状態による枠線や効果
    let borderClass = "border-transparent";
    if (isSelected) borderClass = "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]";
    else if (isTargetable && !char.isDead) borderClass = "border-red-500 cursor-pointer animate-pulse";
    else if (isSelectable && !char.isDead) borderClass = "hover:border-blue-400 cursor-pointer";

    // 死亡時はグレーアウト
    const baseColor = char.isDead ? 'bg-slate-700 grayscale opacity-50' : char.color;

    // HPバー計算
    const hpPercent = (char.hp / char.maxHp) * 100;

    return (
        <div
            className={`
        relative h-36 rounded-xl p-3 flex flex-col justify-between
        transition-all duration-200 ease-out 
        border-2 shadow-[0_10px_30px_rgba(0,0,0,0.4)]
        ${baseColor} ${transformClass} ${borderClass}
      `}
            onClick={!char.isDead ? onClick : undefined}
        >
            {/* ダメージ数値（opacityとtranslateで「ふわっ」と消えるアニメーション） */}
            {damagePopup && (
                <div className={`
          absolute -top-12 left-0 right-0 text-center z-50 pointer-events-none
          text-4xl font-black text-white drop-shadow-[0_6px_12px_rgba(0,0,0,0.8)]
          transition-all duration-700 ease-out transform
          translate-y-0 opacity-100 animate-bounce
        `}
                // Reactのkeyが変わると再マウントされるので、初期状態からアニメーションさせるにはCSS Animationの方が楽だが
                // Transitionのみでやるなら、マウント直後にクラスを切り替える必要がある。
                // ここでは簡易的にTailwindのanimate-bounce等を流用するか、
                // 割り切って「出現時はパッと出る」だけにする。
                // もしくは animate-ping を一瞬使う手もある。
                >
                    <span className={damagePopup.isCrit ? "text-yellow-300 scale-150 inline-block" : ""}>
                        {damagePopup.value}
                    </span>
                </div>
            )}

            {/* キャラ情報 */}
            <div>
                <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-white drop-shadow-md truncate">{char.name}</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/60">
                        {char.type === 'hero' ? 'ALLY' : 'FOE'}
                    </div>
                </div>
                <div className="w-full bg-black/40 h-2.5 mt-2 rounded-full overflow-hidden border border-white/10">
                    <div
                        className={`h-full bg-gradient-to-r from-emerald-400 to-green-600 transition-all duration-500 ${isDamaged ? 'brightness-150' : ''}`}
                        style={{ width: `${hpPercent}%` }}
                    />
                </div>
            </div>

            {/* ステータス */}
            <div className="flex justify-between items-end text-xs font-bold text-white/90 border-t border-white/10 pt-2">
                <div className="flex items-center gap-1"><Sword size={12} /> {char.atk}</div>
                <div className="flex items-center gap-1"><Heart size={12} /> {char.hp}</div>
            </div>

            {/* 死亡アイコン */}
            {char.isDead && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Skull size={40} className="text-white/40" />
                </div>
            )}
        </div>
    );
}
