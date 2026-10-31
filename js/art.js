/* Procedural holographic card art — every illustration is generated SVG. */

import { ATTRIBUTES } from './cards.js';

let artSeq = 0;

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function starField(rng, color, count = 18) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = 8 + rng() * 184;
    const y = 8 + rng() * 184;
    const r = 0.4 + rng() * 1.5;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="${color}" opacity="${(0.15 + rng() * 0.6).toFixed(2)}"/>`;
  }
  return out;
}

function ringSet(color, opacity = 0.22) {
  return `
    <circle cx="100" cy="98" r="79" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="0.8" stroke-dasharray="1 6"/>
    <circle cx="100" cy="98" r="66" fill="none" stroke="${color}" stroke-opacity="${opacity * 0.6}" stroke-width="0.6"/>
    <path d="M100 14 L106 24 L100 34 L94 24 Z" fill="${color}" opacity="${opacity + 0.16}"/>
    <path d="M100 162 L106 172 L100 182 L94 172 Z" fill="${color}" opacity="${opacity + 0.16}"/>
    <path d="M14 98 L24 92 L34 98 L24 104 Z" fill="${color}" opacity="${opacity + 0.12}"/>
    <path d="M166 98 L176 92 L186 98 L176 104 Z" fill="${color}" opacity="${opacity + 0.12}"/>
  `;
}

function aura(p) {
  return `
    <ellipse cx="100" cy="98" rx="62" ry="62" fill="url(#--glow)" opacity="0.7"/>
    <ellipse cx="100" cy="165" rx="54" ry="13" fill="${p.b}" opacity="0.24"/>
    <ellipse cx="100" cy="168" rx="36" ry="7" fill="${p.a}" opacity="0.24"/>
  `;
}

function dragonBody(p, variant = 'dragon') {
  const eyes = p.a;
  if (variant === 'wyrm') {
    return `
      <path d="M108 172 C74 156 132 138 96 120 C62 103 130 88 104 66" fill="none" stroke="url(#--body)" stroke-width="17" stroke-linecap="round" opacity="0.96"/>
      <path d="M108 172 C74 156 132 138 96 120 C62 103 130 88 104 66" fill="none" stroke="${p.a}" stroke-width="1.1" stroke-linecap="round" opacity="0.45"/>
      <path d="M86 144 L70 134 L88 132 Z" fill="${p.b}" opacity="0.7"/>
      <path d="M112 124 L130 113 L112 112 Z" fill="${p.b}" opacity="0.7"/>
      <path d="M88 102 L70 94 L88 90 Z" fill="${p.b}" opacity="0.7"/>
      <path d="M100 62 L114 46 L120 66 L112 84 L100 92 L88 84 L80 66 L86 46 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="1"/>
      <path d="M88 62 L68 36 L84 44 L96 58 Z" fill="${p.a}" opacity="0.85"/>
      <path d="M112 62 L132 36 L116 44 L104 58 Z" fill="${p.a}" opacity="0.85"/>
      <path d="M93 68 L99 69 L96 73 Z" fill="${eyes}"/>
      <path d="M107 68 L101 69 L104 73 Z" fill="${eyes}"/>
    `;
  }
  if (variant === 'leviathan') {
    return `
      <path d="M34 142 C58 118 88 132 96 112 C104 92 74 86 82 68" fill="none" stroke="url(#--body)" stroke-width="15" stroke-linecap="round"/>
      <path d="M166 142 C142 118 112 132 104 112 C96 92 126 86 118 68" fill="none" stroke="url(#--body)" stroke-width="15" stroke-linecap="round"/>
      <path d="M56 154 C76 166 124 166 144 154" fill="none" stroke="${p.b}" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
      <path d="M100 54 L118 66 L114 92 L100 106 L86 92 L82 66 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="1"/>
      <path d="M84 62 L60 40 L76 56 L68 70 L88 72 Z" fill="${p.a}" opacity="0.8"/>
      <path d="M116 62 L140 40 L124 56 L132 70 L112 72 Z" fill="${p.a}" opacity="0.8"/>
      <path d="M92 74 L99 76 L95 80 Z" fill="${eyes}"/>
      <path d="M108 74 L101 76 L105 80 Z" fill="${eyes}"/>
      <path d="M34 142 L24 156 L46 148 Z" fill="${p.a}" opacity="0.65"/>
      <path d="M166 142 L176 156 L154 148 Z" fill="${p.a}" opacity="0.65"/>
    `;
  }
  if (variant === 'serpent') {
    return `
      <path d="M61 168 C86 150 64 126 90 110 C116 94 88 72 106 52" fill="none" stroke="url(#--body)" stroke-width="14" stroke-linecap="round"/>
      <path d="M139 168 C114 150 136 126 110 110 C84 94 112 72 94 52" fill="none" stroke="${p.b}" stroke-width="7" stroke-linecap="round" opacity="0.55"/>
      <path d="M100 40 L115 52 L112 76 L100 88 L88 76 L85 52 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="1"/>
      <path d="M88 54 L70 34 L84 48 L88 58 Z" fill="${p.a}" opacity="0.8"/>
      <path d="M112 54 L130 34 L116 48 L112 58 Z" fill="${p.a}" opacity="0.8"/>
      <circle cx="94" cy="62" r="2.1" fill="${eyes}"/>
      <circle cx="106" cy="62" r="2.1" fill="${eyes}"/>
      <path d="M61 168 L48 178 L70 174 Z" fill="${p.a}" opacity="0.55"/>
    `;
  }
  return `
    <path d="M92 92 C64 58 30 55 13 70 C38 75 42 92 33 105 C56 100 74 107 94 117 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.45" stroke-width="0.8"/>
    <path d="M108 92 C136 58 170 55 187 70 C162 75 158 92 167 105 C144 100 126 107 106 117 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.45" stroke-width="0.8"/>
    <path d="M92 92 C68 72 48 70 36 78 C58 81 68 92 76 100 Z" fill="${p.a}" opacity="0.16"/>
    <path d="M108 92 C132 72 152 70 164 78 C142 81 132 92 124 100 Z" fill="${p.a}" opacity="0.16"/>
    <path d="M100 86 C88 110 86 140 100 170 C114 140 112 110 100 86 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="0.9"/>
    <path d="M100 42 L114 62 L110 86 L100 96 L90 86 L86 62 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="1"/>
    <path d="M90 58 L70 30 L86 40 L97 56 Z" fill="${p.a}" opacity="0.9"/>
    <path d="M110 58 L130 30 L114 40 L103 56 Z" fill="${p.a}" opacity="0.9"/>
    <path d="M92 68 L99 70 L95 75 Z" fill="${eyes}"/>
    <path d="M108 68 L101 70 L105 75 Z" fill="${eyes}"/>
    <path d="M94 122 L100 132 L106 122" fill="none" stroke="${p.a}" stroke-width="1" opacity="0.5"/>
    <path d="M88 142 L100 154 L112 142" fill="none" stroke="${p.a}" stroke-width="0.8" opacity="0.4"/>
  `;
}

function falconBody(p, phoenix = false) {
  return `
    <path d="M94 100 C74 74 40 54 12 66 C38 72 52 84 60 102 C42 96 26 102 16 114 C48 110 76 116 96 126 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.4" stroke-width="0.8"/>
    <path d="M106 100 C126 74 160 54 188 66 C162 72 148 84 140 102 C158 96 174 102 184 114 C152 110 124 116 104 126 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.4" stroke-width="0.8"/>
    <path d="M94 100 C76 84 50 78 32 86 M106 100 C124 84 150 78 168 86" stroke="${p.a}" stroke-width="0.8" opacity="0.55" fill="none"/>
    <path d="M100 78 C91 102 92 132 100 162 C108 132 109 102 100 78 Z" fill="url(#--body)" stroke="${p.a}" stroke-width="0.8"/>
    <circle cx="100" cy="70" r="13" fill="url(#--body)" stroke="${p.a}" stroke-width="0.9"/>
    <path d="M88 68 L98 72 L88 77 Z" fill="${p.a}"/>
    <path d="M112 68 L102 72 L112 77 Z" fill="${p.a}"/>
    <path d="M113 70 L126 76 L112 78 Z" fill="${p.a}" opacity="0.9"/>
    <circle cx="96" cy="68" r="1.7" fill="#fff"/>
    <circle cx="105" cy="68" r="1.7" fill="#fff"/>
    ${phoenix ? `
      <path d="M92 134 C72 148 78 168 62 180 C82 174 92 160 100 146 C108 160 118 174 138 180 C122 168 128 148 108 134 Z" fill="${p.a}" opacity="0.55"/>
      <path d="M96 130 C84 146 88 160 80 170 C94 164 100 152 100 142 C100 152 106 164 120 170 C112 160 116 146 104 130 Z" fill="${p.b}" opacity="0.65"/>
    ` : `
      <path d="M100 144 L88 164 L100 158 L112 164 Z" fill="${p.a}" opacity="0.55"/>
    `}
  `;
}

function golemBody(p) {
  return `
    <path d="M73 174 L77 132 L123 132 L127 174 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.5" stroke-width="0.8"/>
    <path d="M58 132 L58 96 L82 78 L118 78 L142 96 L142 132 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.55" stroke-width="0.9"/>
    <path d="M44 102 L58 92 L66 118 L52 132 Z" fill="${p.b}" opacity="0.95"/>
    <path d="M156 102 L142 92 L134 118 L148 132 Z" fill="${p.b}" opacity="0.95"/>
    <path d="M82 54 L118 54 L128 78 L72 78 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.55"/>
    <path d="M84 62 L98 62 L94 70 L84 70 Z" fill="${p.a}" opacity="0.9"/>
    <path d="M116 62 L102 62 L106 70 L116 70 Z" fill="${p.a}" opacity="0.9"/>
    <circle cx="100" cy="108" r="13" fill="${p.a}" opacity="0.18" filter="url(#--blur)"/>
    <circle cx="100" cy="108" r="7" fill="${p.a}" opacity="0.9"/>
    <circle cx="100" cy="108" r="3" fill="#fff"/>
    <path d="M76 140 L88 154 M124 140 L112 154" stroke="${p.a}" stroke-width="1" opacity="0.5"/>
    <path d="M84 84 L76 96 M116 84 L124 96" stroke="${p.a}" stroke-width="0.8" opacity="0.4"/>
  `;
}

function mageBody(p) {
  return `
    <path d="M100 66 C74 68 64 88 72 110 L100 96 L128 110 C136 88 126 68 100 66 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.55" stroke-width="0.9"/>
    <path d="M82 106 L68 176 Q100 186 132 176 L118 106 L100 120 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4" stroke-width="0.8"/>
    <path d="M88 104 C92 116 108 116 112 104 L108 90 L92 90 Z" fill="${p.deep}" opacity="0.9"/>
    <path d="M93 99 L98 100 L95 103 Z" fill="${p.a}"/>
    <path d="M107 99 L102 100 L105 103 Z" fill="${p.a}"/>
    <path d="M86 78 L100 60 L114 78 L100 74 Z" fill="${p.a}" opacity="0.22"/>
    <circle cx="146" cy="112" r="12" fill="${p.a}" opacity="0.18" filter="url(#--blur)"/>
    <circle cx="146" cy="112" r="6" fill="${p.a}" opacity="0.85"/>
    <circle cx="146" cy="112" r="2" fill="#fff"/>
    <path d="M146 84 L148 100 L146 120 L144 100 Z" fill="${p.a}" opacity="0.35"/>
    <path d="M80 132 L88 132 M112 132 L120 132 M78 150 L88 150 M112 150 L122 150" stroke="${p.a}" stroke-width="0.8" opacity="0.4"/>
    <circle cx="100" cy="140" r="3" fill="${p.a}" opacity="0.5"/>
  `;
}

function knightBody(p, paladin = false) {
  return `
    <path d="M72 176 L78 120 L122 120 L128 176 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4" stroke-width="0.8"/>
    <path d="M60 124 L72 108 L94 104 L106 104 L128 108 L140 124 L130 140 L70 140 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.45"/>
    <path d="M100 44 L122 60 L118 92 L100 106 L82 92 L78 60 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7" stroke-width="1"/>
    <path d="M100 48 L100 96 M88 72 L112 72" stroke="${p.a}" stroke-width="1" opacity="0.55"/>
    <path d="M84 74 L94 76 L86 82 Z" fill="${p.a}"/>
    <path d="M116 74 L106 76 L114 82 Z" fill="${p.a}"/>
    <path d="M100 36 C96 20 104 32 116 20 C114 36 108 42 100 44 C92 42 86 36 84 20 C96 32 104 20 100 36 Z" fill="${p.a}" opacity="0.65"/>
    <path d="M52 116 L34 126 L38 154 L58 160 L70 138 Z" fill="${p.b}" opacity="0.95" stroke="${p.a}" stroke-opacity="0.55"/>
    <path d="M50 130 L58 138 L50 146 L42 138 Z" fill="${p.a}" opacity="0.5"/>
    <path d="M144 128 L152 104 L160 128 Z" fill="${p.a}" opacity="0.7"/>
    <path d="M80 162 L120 162" stroke="${p.a}" stroke-width="1" opacity="0.4"/>
    ${paladin ? `
      <circle cx="100" cy="34" r="24" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.55"/>
      <path d="M100 10 L104 26 L120 30 L104 34 L100 50 L96 34 L80 30 L96 26 Z" fill="${p.a}" opacity="0.4"/>
      <path d="M56 170 L144 170" stroke="${p.a}" stroke-width="1.2" opacity="0.3"/>
    ` : ''}
  `;
}

function sentinelBody(p, bigShield = false) {
  const shieldScale = bigShield ? 1.18 : 1;
  return `
    <path d="M78 176 L82 118 L118 118 L122 176 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4"/>
    <path d="M64 122 L80 106 L120 106 L136 122 L128 146 L72 146 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4"/>
    <path d="M100 42 L120 56 L116 88 L100 102 L84 88 L80 56 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7"/>
    <path d="M90 66 L98 68 L92 72 Z" fill="${p.a}"/>
    <path d="M110 66 L102 68 L108 72 Z" fill="${p.a}"/>
    <path d="M100 34 L104 46 L116 50 L104 54 L100 66 L96 54 L84 50 L96 46 Z" fill="${p.a}" opacity="0.4"/>
    <g transform="translate(100 138) scale(${shieldScale}) translate(-100 -138)">
      <path d="M68 108 L100 98 L132 108 L128 146 L100 168 L72 146 Z" fill="${p.b}" opacity="0.92" stroke="${p.a}" stroke-opacity="0.65" stroke-width="1.1"/>
      <path d="M100 108 L100 158 M78 126 L122 126" stroke="${p.a}" stroke-width="1.1" opacity="0.55"/>
      <circle cx="100" cy="134" r="7" fill="none" stroke="${p.a}" opacity="0.6"/>
      <circle cx="100" cy="134" r="2.5" fill="${p.a}"/>
    </g>
  `;
}

function beastBody(p) {
  return `
    <path d="M100 66 L130 52 L146 72 L136 104 L116 124 L100 132 L84 124 L64 104 L54 72 L70 52 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.55" stroke-width="0.9"/>
    <path d="M70 52 L54 30 L78 38 L84 56 Z" fill="${p.b}" opacity="0.95"/>
    <path d="M130 52 L146 30 L122 38 L116 56 Z" fill="${p.b}" opacity="0.95"/>
    <path d="M78 84 L96 88 L90 94 L80 91 Z" fill="${p.a}"/>
    <path d="M122 84 L104 88 L110 94 L120 91 Z" fill="${p.a}"/>
    <path d="M94 104 L100 116 L106 104 L100 108 Z" fill="${p.a}" opacity="0.8"/>
    <path d="M88 112 L92 122 L96 112 M104 112 L108 122 L112 112" fill="none" stroke="${p.a}" stroke-width="1.2" opacity="0.7"/>
    <path d="M100 56 L100 80" stroke="${p.a}" stroke-width="0.8" opacity="0.3"/>
    <path d="M66 132 L52 146 L76 140 M134 132 L148 146 L124 140" fill="${p.a}" opacity="0.4"/>
  `;
}

function phantomBody(p) {
  return `
    <path d="M100 54 C74 54 62 76 66 102 L58 164 L76 150 L86 172 L100 154 L114 172 L124 150 L142 164 L134 102 C138 76 126 54 100 54 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4" stroke-width="0.8"/>
    <path d="M100 58 C84 58 76 72 78 90 L100 82 L122 90 C124 72 116 58 100 58 Z" fill="${p.deep}" opacity="0.9"/>
    <path d="M86 82 L96 86 L90 91 Z" fill="${p.a}"/>
    <path d="M114 82 L104 86 L110 91 Z" fill="${p.a}"/>
    <path d="M92 104 C98 110 102 110 108 104" fill="none" stroke="${p.a}" stroke-width="1" opacity="0.4"/>
    <path d="M78 120 C70 138 76 152 64 168 M122 120 C130 138 124 152 136 168" stroke="${p.a}" stroke-width="1" opacity="0.25" fill="none"/>
    <path d="M60 74 C50 66 44 72 40 84 C52 80 58 84 64 92 M140 74 C150 66 156 72 160 84 C148 80 142 84 136 92" fill="none" stroke="${p.a}" stroke-width="1" opacity="0.35"/>
  `;
}

function seraphBody(p) {
  return `
    <path d="M92 92 C66 62 32 56 14 72 C40 76 48 92 40 106 C64 100 80 108 96 122 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.45" stroke-width="0.8"/>
    <path d="M108 92 C134 62 168 56 186 72 C160 76 152 92 160 106 C136 100 120 108 104 122 Z" fill="url(#--wing)" stroke="${p.a}" stroke-opacity="0.45" stroke-width="0.8"/>
    <path d="M92 92 C72 76 52 74 40 82 M108 92 C128 76 148 74 160 82" stroke="${p.a}" stroke-width="0.8" opacity="0.5" fill="none"/>
    <circle cx="100" cy="46" r="25" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.6"/>
    <circle cx="100" cy="46" r="21" fill="none" stroke="${p.a}" stroke-width="0.7" opacity="0.3" stroke-dasharray="2 4"/>
    <path d="M100 70 C86 78 82 100 86 120 L100 128 L114 120 C118 100 114 78 100 70 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.45"/>
    <path d="M88 120 L70 176 L100 156 L130 176 L112 120 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.35"/>
    <path d="M92 84 L98 86 L94 90 Z" fill="${p.a}"/>
    <path d="M108 84 L102 86 L106 90 Z" fill="${p.a}"/>
    <path d="M100 100 L100 128 M90 110 L110 110" stroke="${p.a}" stroke-width="0.8" opacity="0.35"/>
    <path d="M100 148 L104 160 L100 172 L96 160 Z" fill="${p.a}" opacity="0.5"/>
  `;
}

function dancerBody(p) {
  return `
    <path d="M100 58 C94 70 94 82 100 92 C106 82 106 70 100 58 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.5"/>
    <path d="M100 88 C92 106 92 124 100 140 C108 124 108 106 100 88 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.4"/>
    <path d="M82 96 C64 104 58 122 66 140 C74 126 82 120 92 118 Z" fill="${p.b}" opacity="0.75"/>
    <path d="M118 96 C136 104 142 122 134 140 C126 126 118 120 108 118 Z" fill="${p.b}" opacity="0.75"/>
    <path d="M100 138 C84 154 86 172 70 184 C90 180 102 164 100 150 C98 164 110 180 130 184 C114 172 116 154 100 138 Z" fill="${p.a}" opacity="0.55"/>
    <path d="M100 138 C94 152 96 166 88 176 C98 172 102 162 102 154 C102 162 106 172 116 176 C108 166 110 152 100 138 Z" fill="${p.b}" opacity="0.7"/>
    <circle cx="94" cy="60" r="1.6" fill="${p.a}"/>
    <circle cx="106" cy="60" r="1.6" fill="${p.a}"/>
    <path d="M76 98 C68 76 80 62 94 54 M124 98 C132 76 120 62 106 54" fill="none" stroke="${p.a}" stroke-width="1" opacity="0.45"/>
  `;
}

function spellSigil(p, type, rng) {
  if (type === 'spell_buff') {
    return `
      <circle cx="100" cy="102" r="62" fill="none" stroke="${p.a}" stroke-opacity="0.35" stroke-width="1"/>
      <circle cx="100" cy="102" r="49" fill="none" stroke="${p.a}" stroke-opacity="0.18" stroke-dasharray="3 7"/>
      <path d="M100 34 L120 68 L108 68 L108 132 L92 132 L92 68 L80 68 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7"/>
      <path d="M100 34 L100 150" stroke="${p.a}" stroke-width="1.4" opacity="0.9"/>
      <path d="M72 150 L100 164 L128 150" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.6"/>
      <path d="M60 120 L78 100 M140 120 L122 100" stroke="${p.a}" stroke-width="1" opacity="0.5"/>
      <path d="M54 82 L70 70 M146 82 L130 70" stroke="${p.a}" stroke-width="1" opacity="0.35"/>
      <circle cx="100" cy="102" r="4" fill="${p.a}"/>
    `;
  }
  if (type === 'spell_heal') {
    return `
      <circle cx="100" cy="100" r="60" fill="none" stroke="${p.a}" stroke-opacity="0.34"/>
      <circle cx="100" cy="100" r="46" fill="none" stroke="${p.a}" stroke-opacity="0.18" stroke-dasharray="2 6"/>
      <path d="M100 46 L116 70 L108 70 L108 126 L92 126 L92 70 L84 70 Z" fill="${p.a}" opacity="0.75"/>
      <path d="M74 100 L126 100" stroke="${p.a}" stroke-width="12" opacity="0.55"/>
      <path d="M78 142 C86 156 114 156 122 142" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.5"/>
      <path d="M100 150 L100 168 M92 158 L108 158" stroke="${p.a}" stroke-width="1.4" opacity="0.5"/>
      <circle cx="100" cy="150" r="3" fill="${p.a}"/>
    `;
  }
  if (type === 'spell_draw') {
    return `
      <path d="M62 68 L128 56 L144 128 L78 140 Z" fill="${p.b}" opacity="0.28" stroke="${p.a}" stroke-opacity="0.5"/>
      <path d="M54 76 L120 64 L136 136 L70 148 Z" fill="${p.deep}" opacity="0.9" stroke="${p.a}" stroke-opacity="0.55"/>
      <path d="M60 130 L112 120 L126 146 L74 156 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7"/>
      <circle cx="100" cy="92" r="20" fill="none" stroke="${p.a}" stroke-width="1.2" opacity="0.7"/>
      <circle cx="100" cy="92" r="8" fill="${p.a}" opacity="0.55"/>
      <circle cx="100" cy="92" r="3" fill="#fff"/>
      <path d="M100 64 L100 72 M100 112 L100 120 M72 92 L80 92 M120 92 L128 92" stroke="${p.a}" stroke-width="1.3" opacity="0.7"/>
      <path d="M84 76 L92 84 M116 76 L108 84 M84 108 L92 100 M116 108 L108 100" stroke="${p.a}" stroke-width="0.8" opacity="0.4"/>
    `;
  }
  if (type === 'spell_destroy') {
    return `
      <circle cx="100" cy="100" r="62" fill="none" stroke="${p.a}" stroke-opacity="0.3" stroke-dasharray="4 8" transform="rotate(12 100 100)"/>
      <path d="M100 40 L112 72 L144 62 L124 90 L156 108 L120 112 L126 150 L100 122 L74 150 L80 112 L44 108 L76 90 L56 62 L88 72 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.6" stroke-width="0.9"/>
      <path d="M100 58 L96 92 L112 104 L92 116 L104 144 M100 58 L108 86 L92 98 L110 110" fill="none" stroke="${p.a}" stroke-width="1.4" opacity="0.8"/>
      <path d="M54 160 L88 132 M146 160 L112 132" stroke="${p.a}" stroke-width="1" opacity="0.4"/>
      <circle cx="100" cy="100" r="78" fill="none" stroke="${p.a}" stroke-opacity="0.12"/>
    `;
  }
  // revive
  return `
    <circle cx="100" cy="104" r="66" fill="none" stroke="${p.a}" stroke-opacity="0.3"/>
    <path d="M58 158 C72 148 76 128 92 120 C108 112 92 94 104 78 C112 68 108 56 100 48" fill="none" stroke="url(#--body)" stroke-width="8" stroke-linecap="round"/>
    <path d="M100 48 L114 58 L110 76 L100 86 L90 76 L86 58 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7"/>
    <path d="M90 58 L76 40 L88 48 L96 58 Z" fill="${p.a}" opacity="0.7"/>
    <path d="M110 58 L124 40 L112 48 L104 58 Z" fill="${p.a}" opacity="0.7"/>
    <circle cx="94" cy="64" r="1.7" fill="${p.a}"/>
    <circle cx="106" cy="64" r="1.7" fill="${p.a}"/>
    <path d="M56 160 L100 174 L144 160" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.5"/>
    <path d="M70 150 L86 162 M130 150 L114 162" stroke="${p.a}" stroke-width="1" opacity="0.35"/>
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${(52 + i * 20)}" cy="${(110 + Math.sin(i) * 26).toFixed(1)}" r="1.4" fill="${p.a}" opacity="0.45"/>`).join('')}
  `;
}

function trapSigil(p, type) {
  if (type === 'trap_mirror') {
    return `
      <path d="M100 40 L148 60 L142 124 L100 166 L58 124 L52 60 Z" fill="${p.b}" opacity="0.34" stroke="${p.a}" stroke-opacity="0.55" stroke-width="1"/>
      <path d="M100 52 L136 66 L132 116 L100 150 L68 116 L64 66 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.7"/>
      <path d="M100 66 L120 84 L116 118 L100 134 L84 118 L80 84 Z" fill="${p.deep}" opacity="0.75"/>
      <path d="M82 104 C92 92 108 92 118 104" fill="none" stroke="${p.a}" stroke-width="1.2" opacity="0.8"/>
      <circle cx="94" cy="96" r="2" fill="${p.a}"/>
      <circle cx="106" cy="96" r="2" fill="${p.a}"/>
      <path d="M100 34 L100 22 M76 44 L66 34 M124 44 L134 34" stroke="${p.a}" stroke-width="1" opacity="0.4"/>
    `;
  }
  if (type === 'trap_pit') {
    return `
      <ellipse cx="100" cy="118" rx="62" ry="30" fill="${p.deep}" stroke="${p.a}" stroke-opacity="0.5"/>
      <path d="M38 118 C58 142 78 150 100 150 C122 150 142 142 162 118" fill="${p.deep}" opacity="0.9" stroke="${p.a}" stroke-opacity="0.35"/>
      <path d="M54 122 L62 94 L70 122 Z M74 130 L84 98 L94 132 Z M100 134 L112 102 L122 134 Z M128 128 L138 98 L146 126 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.5"/>
      <path d="M48 88 L60 80 L64 92 L52 100 Z M136 84 L150 76 L154 90 L140 98 Z" fill="${p.b}" opacity="0.6"/>
      <path d="M80 166 L100 154 L120 166" fill="none" stroke="${p.a}" stroke-width="1.2" opacity="0.4"/>
      <circle cx="100" cy="68" r="24" fill="none" stroke="${p.a}" stroke-opacity="0.2" stroke-dasharray="3 6"/>
    `;
  }
  return `
    <path d="M100 46 L146 72 C148 118 130 148 100 166 C70 148 52 118 54 72 Z" fill="${p.b}" opacity="0.28" stroke="${p.a}" stroke-opacity="0.55" stroke-width="1.2"/>
    <path d="M100 60 L134 80 C136 116 122 138 100 152 C78 138 64 116 66 80 Z" fill="url(#--body)" stroke="${p.a}" stroke-opacity="0.6"/>
    <path d="M88 102 L96 88 L104 104 L112 82" fill="none" stroke="${p.a}" stroke-width="2" opacity="0.75"/>
    <path d="M86 120 C94 128 106 128 114 120" fill="none" stroke="${p.a}" stroke-width="1.4" opacity="0.6"/>
    <circle cx="100" cy="72" r="4" fill="${p.a}"/>
    <path d="M64 104 L48 96 M136 104 L152 96 M70 128 L52 132 M130 128 L148 132" stroke="${p.a}" stroke-width="1" opacity="0.4"/>
  `;
}

function monsterArt(def, p) {
  switch (def.art) {
    case 'dragon': return dragonBody(p, 'dragon');
    case 'wyrm': return dragonBody(p, 'wyrm');
    case 'leviathan': return dragonBody(p, 'leviathan');
    case 'serpent': return dragonBody(p, 'serpent');
    case 'falcon': return falconBody(p, false);
    case 'phoenix': return falconBody(p, true);
    case 'golem': return golemBody(p);
    case 'mage': return mageBody(p);
    case 'knight': return knightBody(p, false);
    case 'paladin': return knightBody(p, true);
    case 'sentinel': return sentinelBody(p, false);
    case 'warden': return sentinelBody(p, true);
    case 'beast': return beastBody(p);
    case 'phantom': return phantomBody(p);
    case 'seraph': return seraphBody(p);
    case 'dancer': return dancerBody(p);
    default: return dragonBody(p, 'dragon');
  }
}

export function cardArt(def) {
  const p = ATTRIBUTES[def.attribute] || ATTRIBUTES.void;
  const id = `art${++artSeq}`;
  const seed = hashString(def.id);
  const rng = mulberry32(seed);
  const isMonster = def.type === 'monster';
  const body = isMonster
    ? monsterArt(def, p)
    : (def.type === 'trap' ? trapSigil(p, def.art) : spellSigil(p, def.art, rng));
  const stars = starField(rng, p.a, isMonster ? 20 : 14);
  const beams = Array.from({ length: 5 }, (_, i) => {
    const x = 18 + rng() * 164;
    const w = 1 + rng() * 3;
    return `<path d="M${x} 0 L${x + w} 0 L${x - 34} 200 L${x - 34 - w} 200 Z" fill="${p.a}" opacity="${(0.012 + rng() * 0.025).toFixed(3)}"/>`;
  }).join('');
  const inner = `${ringSet(p.a, isMonster ? 0.2 : 0.26)}${aura(p)}${body}`.replaceAll('#--', `#${id}-`);

  return `<svg class="card-art-svg" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="${id}-bg" cx="50%" cy="34%" r="78%">
        <stop offset="0" stop-color="${p.b}" stop-opacity="0.52"/>
        <stop offset="0.48" stop-color="${p.deep}" stop-opacity="0.94"/>
        <stop offset="1" stop-color="#04050c"/>
      </radialGradient>
      <linearGradient id="${id}-body" x1="0.15" y1="0" x2="0.85" y2="1">
        <stop offset="0" stop-color="${p.a}"/>
        <stop offset="0.42" stop-color="${p.b}"/>
        <stop offset="1" stop-color="${p.deep}"/>
      </linearGradient>
      <linearGradient id="${id}-wing" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${p.a}" stop-opacity="0.65"/>
        <stop offset="0.7" stop-color="${p.b}" stop-opacity="0.3"/>
        <stop offset="1" stop-color="${p.deep}" stop-opacity="0.1"/>
      </linearGradient>
      <radialGradient id="${id}-glow">
        <stop offset="0" stop-color="${p.a}" stop-opacity="0.5"/>
        <stop offset="1" stop-color="${p.a}" stop-opacity="0"/>
      </radialGradient>
      <filter id="${id}-blur" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="6"/>
      </filter>
      <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
    </defs>
    <rect width="200" height="200" fill="url(#${id}-bg)"/>
    ${beams}
    ${stars}
    <g filter="url(#${id}-soft)">
      ${inner}
    </g>
    <rect x="1" y="1" width="198" height="198" fill="none" stroke="${p.a}" stroke-opacity="0.16"/>
  </svg>`;
}

export function cardBack() {
  return `<svg class="card-back-svg" viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="back-bg" cx="50%" cy="42%" r="72%">
        <stop offset="0" stop-color="#16264d"/>
        <stop offset="0.55" stop-color="#080d1c"/>
        <stop offset="1" stop-color="#03040a"/>
      </radialGradient>
      <linearGradient id="back-line" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4fe5ff"/>
        <stop offset="0.5" stop-color="#8d6bff"/>
        <stop offset="1" stop-color="#ff4fd8"/>
      </linearGradient>
    </defs>
    <rect width="200" height="260" fill="url(#back-bg)"/>
    <circle cx="100" cy="130" r="66" fill="none" stroke="url(#back-line)" stroke-opacity="0.55" stroke-width="1.2"/>
    <circle cx="100" cy="130" r="54" fill="none" stroke="url(#back-line)" stroke-opacity="0.28" stroke-dasharray="2 6"/>
    <path d="M100 74 L118 104 L106 104 L106 156 L94 156 L94 104 L82 104 Z" fill="url(#back-line)" opacity="0.65"/>
    <path d="M100 60 L106 72 L100 84 L94 72 Z" fill="url(#back-line)" opacity="0.5"/>
    <path d="M100 176 L106 188 L100 200 L94 188 Z" fill="url(#back-line)" opacity="0.5"/>
    <path d="M44 130 L56 124 L68 130 L56 136 Z" fill="url(#back-line)" opacity="0.4"/>
    <path d="M132 130 L144 124 L156 130 L144 136 Z" fill="url(#back-line)" opacity="0.4"/>
    <rect x="5" y="5" width="190" height="250" fill="none" stroke="url(#back-line)" stroke-opacity="0.35"/>
  </svg>`;
}

export function avatarArt(side) {
  if (side === 'player') {
    return `<svg viewBox="0 0 80 80" class="avatar-svg" aria-hidden="true">
      <defs><radialGradient id="avp" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#ffd35e"/><stop offset="0.55" stop-color="#ff8a3d"/><stop offset="1" stop-color="#2a0c06"/></radialGradient></defs>
      <circle cx="40" cy="40" r="37" fill="url(#avp)"/>
      <circle cx="40" cy="40" r="34" fill="#090a12" opacity="0.78"/>
      <circle cx="40" cy="40" r="30" fill="none" stroke="#ffd35e" stroke-opacity="0.5"/>
      <path d="M40 12 L44 30 L62 34 L48 40 L54 58 L40 46 L26 58 L32 40 L18 34 L36 30 Z" fill="#ffd35e" opacity="0.9"/>
      <circle cx="40" cy="38" r="7" fill="#2a0c06"/>
      <path d="M40 66 L40 54" stroke="#ffd35e" stroke-width="2" opacity="0.6"/>
    </svg>`;
  }
  return `<svg viewBox="0 0 80 80" class="avatar-svg" aria-hidden="true">
    <defs><radialGradient id="ava" cx="50%" cy="42%" r="65%"><stop offset="0" stop-color="#d59bff"/><stop offset="0.55" stop-color="#6d36ff"/><stop offset="1" stop-color="#100522"/></radialGradient></defs>
    <circle cx="40" cy="40" r="37" fill="url(#ava)"/>
    <circle cx="40" cy="40" r="34" fill="#090812" opacity="0.8"/>
    <circle cx="40" cy="40" r="30" fill="none" stroke="#c58bff" stroke-opacity="0.5"/>
    <path d="M40 14 L46 34 L64 38 L50 46 L54 64 L40 52 L26 64 L30 46 L16 38 L34 34 Z" fill="#c58bff" opacity="0.85"/>
    <path d="M40 26 L48 38 L40 50 L32 38 Z" fill="#16082e"/>
    <circle cx="40" cy="38" r="4" fill="#e7c8ff"/>
  </svg>`;
}
