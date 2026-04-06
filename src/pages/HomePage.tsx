import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../state/AppDataContext";
import type { Campaign } from "../storage/campaignStorage";

/* ORACLE */
const ORACLE_PHRASES = [
  "Les dés ont parlé… une nouvelle menace s'éveille dans les ténèbres.",
  "Le feu crépite. Les aventuriers attendent votre récit.",
  "Une rumeur court dans la taverne… des ombres dans le Nord.",
  "Le parchemin est prêt. L'encre attend votre volonté.",
  "Au-delà des portes de pierre, le destin se tisse.",
  "Vos héros dorment. Pas vous. C'est votre heure, Maître.",
  "La carte est déroulée. Quel chemin allez-vous tracer ?",
  "Les monstres se réveillent quand le MJ ouvre son grimoire.",
];

/* MÉTÉO NARRATIVE */

/* CSS INJECTÉ */


const INJECTED_CSS = `
/* ── Bibliothèque ── */
@keyframes lib-zoom {
  0%   { transform: perspective(600px) translateZ(0px)   scale(1);    }
  100% { transform: perspective(600px) translateZ(160px) scale(1.05); }
}
@keyframes lib-zoom-shelf {
  0%   { transform: perspective(600px) translateZ(0px);   opacity:1; }
  85%  { transform: perspective(600px) translateZ(220px); opacity:1; }
  100% { transform: perspective(600px) translateZ(260px); opacity:0; }
}
@keyframes lib-dust {
  0%   { transform:translateY(0)    translateX(0)   scale(1);   opacity:0;    }
  15%  { opacity:0.6; }
  80%  { opacity:0.2; }
  100% { transform:translateY(-80px) translateX(var(--dx,12px)) scale(0.4); opacity:0; }
}
@keyframes lib-flicker {
  0%,100% { opacity:1;   transform:scaleY(1)   rotate(-0.5deg); }
  25%      { opacity:0.9; transform:scaleY(1.07) rotate(1deg);   }
  60%      { opacity:1;   transform:scaleY(0.96) rotate(-0.3deg);}
  80%      { opacity:0.95;transform:scaleY(1.04) rotate(0.7deg); }
}
@keyframes lib-glow-pulse {
  0%,100% { opacity:0.45; transform:scale(1);    }
  50%      { opacity:0.85; transform:scale(1.1);  }
}
@keyframes lib-smoke {
  0%   { transform:translateY(0)    translateX(0)   scale(1);   opacity:0.12; }
  50%  { transform:translateY(-20px) translateX(4px) scale(1.3); opacity:0.06; }
  100% { transform:translateY(-42px) translateX(-2px) scale(1.7); opacity:0;  }
}
@keyframes lib-shimmer {
  0%   { background-position:-250% center; }
  100% { background-position: 250% center; }
}
@keyframes lib-oracle-in {
  from { opacity:0; transform:translateY(7px); }
  to   { opacity:1; transform:translateY(0);   }
}
@keyframes lib-slide-right {
  from { transform:scaleX(0); }
  to   { transform:scaleX(1); }
}
@keyframes lib-rune-spin {
  from { transform:rotate(0deg);   }
  to   { transform:rotate(360deg); }
}
@keyframes lib-badge-pulse {
  0%,100% { box-shadow:0 0 6px rgba(201,150,42,0.4);  }
  50%      { box-shadow:0 0 18px rgba(201,150,42,0.85); }
}
@keyframes lib-float-in {
  from { opacity:0; transform:translateY(14px); }
  to   { opacity:1; transform:translateY(0);    }
}
@keyframes lib-bar-pulse {
  0%,100% { opacity:0.65; }
  50%      { opacity:1;    }
}
@keyframes lib-border-glow {
  0%,100% { box-shadow:0 0 8px rgba(201,150,42,0.1),  0 4px 22px rgba(0,0,0,0.35); }
  50%      { box-shadow:0 0 20px rgba(201,150,42,0.22), 0 4px 28px rgba(0,0,0,0.35); }
}
@keyframes lib-web-sway {
  0%,100% { transform: rotate(-1.5deg) skewX(0.5deg);  }
  50%      { transform: rotate(1.5deg)  skewX(-0.5deg); }
}
@keyframes lib-web-sway2 {
  0%,100% { transform: rotate(2deg)  skewX(-0.8deg); }
  50%      { transform: rotate(-2deg) skewX(0.8deg);  }
}
@keyframes lib-mote-float {
  0%   { transform:translateY(0)    translateX(0);   opacity:0;   }
  10%  { opacity:0.55; }
  85%  { opacity:0.15; }
  100% { transform:translateY(-60px) translateX(var(--mdx,6px)); opacity:0; }
}
@keyframes lib-meteo-in {
  from { opacity:0; transform:translateY(-6px) scale(0.97); }
  to   { opacity:1; transform:translateY(0)    scale(1);    }
}
@keyframes lib-suggestion-pop {
  0%   { opacity:0; transform:translateY(5px) scale(0.96); }
  100% { opacity:1; transform:translateY(0)   scale(1);    }
}
@keyframes lib-typing-dot {
  0%,80%,100% { transform:scale(0.5); opacity:0.3; }
  40%          { transform:scale(1.2); opacity:1;   }
}
@keyframes lib-mood-glow {
  0%,100% { opacity:0.7; }
  50%      { opacity:1;   }
}
`;

/* BIBLIOTHÈQUE SVG ANIMÉE */


function LibraryBackground() {
  // couleurs livres — rangées variées
  const SPINE_COLORS = [
    ["#8B1A1A","#6B3A2A","#2A4A6B","#4A3A1A","#1A4A2A","#6B2A4A","#4A2A1A","#3A5A2A","#8B5A1A","#2A3A6B","#6B4A1A","#1A3A4A"],
    ["#5A1A1A","#3A2A4A","#1A5A3A","#6B4A2A","#2A1A5A","#4A5A1A","#8B3A1A","#1A4A5A","#5A3A2A","#2A5A1A","#6B1A3A","#3A4A5A"],
    ["#3A0A0A","#5A3A1A","#0A3A5A","#4A2A0A","#0A5A2A","#5A0A3A","#3A1A0A","#2A4A1A","#6B3A0A","#0A2A4A","#4A3A0A","#0A2A3A"],
  ];

  const renderShelf = (yBase: number, rowIdx: number, scale = 1) => {
    const colors = SPINE_COLORS[rowIdx % SPINE_COLORS.length];
    const books = [];
    let x = 40;
    for (let i = 0; i < 18; i++) {
      const w = (8 + Math.sin(i * 2.3 + rowIdx) * 3) * scale;
      const h = (52 + Math.sin(i * 1.7 + rowIdx * 0.5) * 14) * scale;
      const col = colors[i % colors.length];
      const tilt = (Math.random() - 0.5) * 0.04;
      books.push(
        <g key={i} transform={`translate(${x}, ${yBase - h}) rotate(${tilt * 57}, ${x + w/2}, ${yBase})`}>
          {/* Corps livre */}
          <rect x={0} y={0} width={w} height={h} fill={col} rx="1"/>
          {/* Tranche */}
          <rect x={0} y={0} width={2} height={h} fill={`rgba(255,255,255,0.07)`}/>
          {/* Reflet haut */}
          <rect x={0} y={0} width={w} height={3} fill={`rgba(255,255,255,0.12)`} rx="1"/>
          {/* Ligne déco */}
          <rect x={2} y={Math.floor(h*0.15)} width={w-4} height={1} fill={`rgba(255,255,255,0.1)`}/>
          <rect x={2} y={Math.floor(h*0.85)} width={w-4} height={1} fill={`rgba(255,255,255,0.1)`}/>
          {/* Titre simulé */}
          <rect x={Math.floor(w*0.2)} y={Math.floor(h*0.25)} width={Math.floor(w*0.6)} height={Math.floor(h*0.5)} fill={`rgba(255,255,255,0.04)`} rx="0.5"/>
        </g>
      );
      x += w + 1.5 * scale;
    }
    return books;
  };

  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", borderRadius:"inherit" }}>
      {/* SVG bibliothèque en zoom */}
      <svg
        viewBox="0 0 800 320"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position:"absolute", inset:0, width:"100%", height:"100%",
          animation:"lib-zoom-shelf 18s ease-in-out infinite alternate",
          transformOrigin:"50% 60%",
        }}
      >
        <defs>
          {/* Gradient plafond */}
          <linearGradient id="libCeil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0a0400" stopOpacity="1"/>
            <stop offset="100%" stopColor="#1a0a02" stopOpacity="1"/>
          </linearGradient>
          {/* Gradient sol */}
          <linearGradient id="libFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1a0a02"/>
            <stop offset="100%" stopColor="#0a0400"/>
          </linearGradient>
          {/* Gradient murs latéraux */}
          <linearGradient id="libWallL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0d0600" stopOpacity="1"/>
            <stop offset="100%" stopColor="#1e0e02" stopOpacity="1"/>
          </linearGradient>
          <linearGradient id="libWallR" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1e0e02" stopOpacity="1"/>
            <stop offset="100%" stopColor="#0d0600" stopOpacity="1"/>
          </linearGradient>
          {/* Vignette */}
          <radialGradient id="libVig" cx="50%" cy="50%" r="55%">
            <stop offset="0%"   stopColor="transparent"/>
            <stop offset="100%" stopColor="rgba(0,0,0,0.88)"/>
          </radialGradient>
          {/* Lumière bougie centre */}
          <radialGradient id="libLight" cx="50%" cy="45%" r="45%">
            <stop offset="0%"   stopColor="rgba(201,150,42,0.18)"/>
            <stop offset="60%"  stopColor="rgba(140,80,10,0.06)"/>
            <stop offset="100%" stopColor="transparent"/>
          </radialGradient>
          {/* Clip */}
          <clipPath id="libClip">
            <rect width="800" height="320"/>
          </clipPath>
        </defs>

        <g clipPath="url(#libClip)">
          {/* Fond sombre */}
          <rect width="800" height="320" fill="#0d0600"/>

          {/* Couloir en perspective — point de fuite central */}
          {/* Sol dallé */}
          {[0,1,2,3,4].map(i => {
            const y1 = 200 + i * 24;
            const y2 = y1 + 22;
            const cx = 400;
            const spread1 = 10 + i * 55;
            const spread2 = 10 + (i+1) * 55;
            return (
              <polygon key={`floor${i}`}
                points={`${cx-spread1},${y1} ${cx+spread1},${y1} ${cx+spread2},${y2} ${cx-spread2},${y2}`}
                fill={i%2===0 ? "#1a0c04" : "#150a02"}
                stroke="rgba(201,150,42,0.06)" strokeWidth="0.5"
              />
            );
          })}

          {/* Plafond à caissons */}
          {[0,1,2,3].map(i => {
            const y2 = 80 - i * 20;
            const y1 = y2 - 18;
            const cx = 400;
            const spread1 = 8 + i * 50;
            const spread2 = 8 + (i+1) * 50;
            return (
              <polygon key={`ceil${i}`}
                points={`${cx-spread1},${y2} ${cx+spread1},${y2} ${cx+spread2},${y1} ${cx-spread2},${y1}`}
                fill={i%2===0 ? "#100800" : "#0d0600"}
                stroke="rgba(201,150,42,0.05)" strokeWidth="0.5"
              />
            );
          })}

          {/* Mur fond */}
          <rect x="260" y="95" width="280" height="130" fill="#0f0800" rx="2"/>
          <rect x="260" y="95" width="280" height="130" fill="url(#libLight)"/>

          {/* Étagères mur gauche — rangées */}
          {[0,1,2].map(rowIdx => {
            const y = 130 + rowIdx * 56;
            return (
              <g key={`shelfL${rowIdx}`}>
                {/* Planche */}
                <rect x="0" y={y} width="260" height="5"
                  fill="#3a1e06"
                  style={{ filter:"drop-shadow(0 2px 3px rgba(0,0,0,0.6))" }}
                />
                <rect x="0" y={y+4} width="260" height="2" fill="rgba(0,0,0,0.4)"/>
                {/* Livres */}
                <g transform={`translate(0, ${y})`} style={{ transform:`translate(0px, ${y}px)` }}>
                  {renderShelf(0, rowIdx, 0.78 - rowIdx * 0.04)}
                </g>
              </g>
            );
          })}

          {/* Étagères mur droit */}
          {[0,1,2].map(rowIdx => {
            const y = 130 + rowIdx * 56;
            return (
              <g key={`shelfR${rowIdx}`} transform="translate(540, 0)">
                <rect x="0" y={y} width="260" height="5" fill="#3a1e06"/>
                <rect x="0" y={y+4} width="260" height="2" fill="rgba(0,0,0,0.4)"/>
                <g transform={`translate(0, ${y})`}>
                  {renderShelf(0, rowIdx + 1, 0.78 - rowIdx * 0.04)}
                </g>
              </g>
            );
          })}

          {/* Colonnes latérales */}
          {/* Gauche */}
          <rect x="238" y="80" width="22" height="200" fill="#2a1206"/>
          <rect x="238" y="80" width="3"  height="200" fill="rgba(201,150,42,0.12)"/>
          <rect x="257" y="80" width="3"  height="200" fill="rgba(0,0,0,0.3)"/>
          {/* Droite */}
          <rect x="540" y="80" width="22" height="200" fill="#2a1206"/>
          <rect x="540" y="80" width="3"  height="200" fill="rgba(201,150,42,0.12)"/>
          <rect x="559" y="80" width="3"  height="200" fill="rgba(0,0,0,0.3)"/>

          {/* Arche du couloir */}
          <path d="M 240,80 Q 400,40 560,80 L 560,230 Q 400,250 240,230 Z"
            fill="none" stroke="rgba(201,150,42,0.15)" strokeWidth="2"/>

          {/* Chandelier central suspendu */}
          {/* Tige */}
          <line x1="400" y1="60" x2="400" y2="95" stroke="#3a1e06" strokeWidth="2"/>
          {/* Anneau */}
          <ellipse cx="400" cy="96" rx="18" ry="4" fill="none" stroke="#5a3010" strokeWidth="1.5"/>
          {/* 3 bougies du chandelier */}
          {[-14, 0, 14].map((dx, ci) => (
            <g key={`chand${ci}`} transform={`translate(${400+dx}, 88)`}>
              {/* Flamme */}
              <ellipse cx="0" cy="-6" rx="2.5" ry="4"
                fill="rgba(255,200,50,0.9)"
                style={{
                  animation:`lib-flicker ${1.4+ci*0.3}s ease-in-out infinite alternate`,
                  animationDelay:`${ci*0.2}s`,
                  transformOrigin:"0px 0px",
                  filter:"blur(0.3px)",
                }}
              />
              {/* Halo */}
              <circle cx="0" cy="-4" r="6"
                fill="rgba(255,160,0,0)"
                style={{
                  filter:"blur(4px)",
                  animation:`lib-glow-pulse ${1.6+ci*0.25}s ease-in-out infinite`,
                }}
              />
              {/* Corps */}
              <rect x="-2" y="-2" width="4" height="10" fill="#e8d5a0" rx="0.5"/>
            </g>
          ))}

          {/* Halo de lumière chandelier */}
          <circle cx="400" cy="100" r="100"
            fill="radial-gradient"
            style={{ fill:"url(#libLight)" }}
          />

          {/* TOILES D'ARAIGNÉE */}

          {/* Toile 1 — coin haut gauche étagère */}
          <g style={{ animation:"lib-web-sway 7s ease-in-out infinite", transformOrigin:"30px 82px" }}>
            {/* Fils rayonnants */}
            {[0,18,36,54,72,90].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const r = 28;
              return <line key={`w1r${i}`} x1="30" y1="82" x2={30 + Math.cos(rad)*r} y2={82 + Math.sin(rad)*r} stroke="rgba(200,190,170,0.22)" strokeWidth="0.4"/>;
            })}
            {/* Arcs concentriques */}
            {[8,16,24].map((r, i) => (
              <path key={`w1c${i}`}
                d={`M ${30+r} 82 A ${r} ${r} 0 0 1 ${30} ${82+r} A ${r} ${r} 0 0 1 ${30-r} 82`}
                fill="none" stroke="rgba(200,190,170,0.18)" strokeWidth="0.5"
              />
            ))}
            {/* Fil suspendu depuis le plafond */}
            <line x1="30" y1="60" x2="30" y2="82" stroke="rgba(200,190,170,0.3)" strokeWidth="0.5"/>
          </g>

          {/* Toile 2 — coin haut droit, sur colonne droite */}
          <g style={{ animation:"lib-web-sway2 8.5s ease-in-out infinite", transformOrigin:"558px 90px" }}>
            {[0,20,40,60,80,100].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const r = 22;
              return <line key={`w2r${i}`} x1="558" y1="90" x2={558 + Math.cos(rad)*r} y2={90 + Math.sin(rad)*r} stroke="rgba(200,190,170,0.2)" strokeWidth="0.4"/>;
            })}
            {[7,14,20].map((r, i) => (
              <path key={`w2c${i}`}
                d={`M ${558+r} 90 A ${r} ${r} 0 0 0 ${558} ${90+r} A ${r} ${r} 0 0 0 ${558-r} 90`}
                fill="none" stroke="rgba(200,190,170,0.16)" strokeWidth="0.45"
              />
            ))}
            <line x1="558" y1="70" x2="558" y2="90" stroke="rgba(200,190,170,0.28)" strokeWidth="0.5"/>
          </g>

          {/* Toile 3 — petite, entre deux livres étagère droite bas */}
          <g style={{ animation:"lib-web-sway 11s ease-in-out infinite", transformOrigin:"620px 175px" }}>
            {[0,30,60,90,120,150].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const r = 14;
              return <line key={`w3r${i}`} x1="620" y1="175" x2={620 + Math.cos(rad)*r} y2={175 + Math.sin(rad)*r} stroke="rgba(200,190,170,0.17)" strokeWidth="0.35"/>;
            })}
            {[5,10,13].map((r, i) => (
              <path key={`w3c${i}`}
                d={`M ${620-r} 175 A ${r} ${r} 0 0 1 ${620} ${175-r} A ${r} ${r} 0 0 1 ${620+r} 175`}
                fill="none" stroke="rgba(200,190,170,0.14)" strokeWidth="0.4"
              />
            ))}
          </g>

          {/* Fil pendant — chandelier */}
          <line x1="386" y1="96" x2="374" y2="130" stroke="rgba(200,190,170,0.2)" strokeWidth="0.4"
            style={{ animation:"lib-web-sway2 9s ease-in-out infinite", transformOrigin:"386px 96px" }}/>
          <line x1="414" y1="96" x2="428" y2="128" stroke="rgba(200,190,170,0.18)" strokeWidth="0.4"
            style={{ animation:"lib-web-sway 10s ease-in-out infinite", transformOrigin:"414px 96px" }}/>

          {/* POUSSIÈRE FLOTTANTE (grain + motes) */}
          {/* Grosses motes dorées */}
          {[
            {cx:320,cy:140,r:1.0,delay:0},
            {cx:480,cy:120,r:0.9,delay:1.2},
            {cx:360,cy:180,r:1.2,delay:2.4},
            {cx:440,cy:155,r:0.8,delay:0.7},
            {cx:290,cy:160,r:1.1,delay:3.1},
            {cx:510,cy:170,r:0.85,delay:1.9},
            {cx:400,cy:200,r:0.7,delay:2.8},
            {cx:350,cy:130,r:0.95,delay:4.2},
          ].map((m,i) => (
            <circle key={`mote${i}`} cx={m.cx} cy={m.cy} r={m.r}
              fill="rgba(220,180,80,0.65)"
              style={{
                "--mdx": `${((i%5)-2)*9}px`,
                animation:`lib-mote-float ${3.5+(i%4)*0.8}s ease-out infinite`,
                animationDelay:`${m.delay}s`,
              } as React.CSSProperties}
            />
          ))}
          {/* Micro-grains blancs */}
          {[...Array(18)].map((_,i)=>(
            <circle key={`grain${i}`}
              cx={160+(i*38)%480} cy={95+(i*27)%140} r={0.35}
              fill="rgba(255,240,200,0.4)"
              style={{
                "--mdx":`${((i%7)-3)*6}px`,
                animation:`lib-mote-float ${2.5+(i%5)*0.6}s ease-out infinite`,
                animationDelay:`${i*0.38}s`,
              } as React.CSSProperties}
            />
          ))}

          {/* Vignette finale */}
          <rect width="800" height="320" fill="url(#libVig)"/>
        </g>
      </svg>

      {/* Couche de fumée atmosphérique */}
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 45%, rgba(201,150,42,0.07) 0%, transparent 60%)", pointerEvents:"none" }}/>
    </div>
  );
}

/* BOUGIE */
function Candle({ delay=0, size=1 }: { delay?:number; size?:number }) {
  const fH=Math.round(18*size), fW=Math.round(10*size);
  const bH=Math.round(42*size), bW=Math.round(10*size);
  const baseW=Math.round(14*size);
  return (
    <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
      {[0,1,2].map(i=>(
        <div key={i} style={{
          position:"absolute", top:`${-8-i*6}px`, left:`${fW/2-3+(i-1)*4}px`,
          width:"6px", height:"6px", borderRadius:"50%",
          background:"rgba(220,200,160,0.3)",
          animation:`lib-smoke ${2+i*0.5}s ease-out infinite`,
          animationDelay:`${delay+i*0.4}s`,
        }}/>
      ))}
      <div style={{
        width:`${fW}px`, height:`${fH}px`,
        background:"radial-gradient(ellipse at 50% 80%, #fff8e1 0%, #ffe082 20%, #ffb300 45%, #ff6f00 70%, #bf360c 90%, transparent 100%)",
        borderRadius:"50% 50% 30% 30%",
        animation:`lib-flicker ${1.6+delay*0.25}s ease-in-out infinite alternate`,
        animationDelay:`${delay}s`,
        transformOrigin:"bottom center",
        boxShadow:`0 0 6px 2px rgba(255,200,50,0.6), 0 0 14px 4px rgba(255,120,0,0.35), 0 0 28px 8px rgba(255,80,0,0.18)`,
        position:"relative", zIndex:2,
      }}/>
      <div style={{
        width:`${fW*2.4}px`, height:`${fW*0.8}px`, borderRadius:"50%",
        background:"radial-gradient(ellipse, rgba(255,160,0,0.5) 0%, transparent 70%)",
        marginTop:`${-fW*0.35}px`,
        animation:`lib-glow-pulse ${1.8+delay*0.2}s ease-in-out infinite`,
        animationDelay:`${delay+0.3}s`, zIndex:1,
      }}/>
      <div style={{
        width:`${bW}px`, height:`${bH}px`,
        background:"linear-gradient(180deg,#fdf6e3 0%,#f5e6c0 30%,#d4b896 60%,#b8976a 80%,#9a7850 100%)",
        borderRadius:"1px 1px 0 0",
        boxShadow:"inset -2px 0 4px rgba(0,0,0,0.2)", position:"relative",
      }}>
        <div style={{ position:"absolute", left:"2px", top:"4px", width:"3px", height:"10px", background:"rgba(245,230,192,0.6)", borderRadius:"0 0 3px 3px"}}/>
      </div>
      <div style={{ width:`${baseW}px`, height:"4px", background:"linear-gradient(180deg,#8b6010,#5a3a05)", borderRadius:"2px"}}/>
    </div>
  );
}

/* SÉPARATEUR */
function RuneSep({ rune="◆", animate=false }: { rune?:string; animate?:boolean }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", margin:"0.8rem 0 1rem" }}>
      <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,transparent,#8b5e2a,#c9962a,#8b5e2a,transparent)", transformOrigin:"left", animation:animate?"lib-slide-right 0.8s ease both":"none" }}/>
      <span style={{ color:"#c9962a", fontSize:"0.75rem", textShadow:"0 0 8px rgba(201,150,42,0.6)", animation:animate?"lib-rune-spin 8s linear infinite":"none", display:"inline-block" }}>{rune}</span>
      <div style={{ flex:1, height:"1px", background:"linear-gradient(90deg,transparent,#8b5e2a,#c9962a,#8b5e2a,transparent)", transformOrigin:"right", animation:animate?"lib-slide-right 0.8s ease both":"none" }}/>
    </div>
  );
}

/* CARTE GRIMOIRE */


function GrimoireCard({ campaign, isActive, index, onSelect, onDelete }: {
  campaign:Campaign; isActive:boolean; index:number;
  onSelect:(id:string)=>void; onDelete:(id:string)=>void;
}) {
  const [hov,setHov]=useState(false);
  return (
    <div
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>onSelect(campaign.id)}
      style={{
        position:"relative", cursor:"pointer",
        borderRadius:"3px 16px 3px 16px", padding:isActive?"1.2rem 1.4rem 1rem":"1rem 1.4rem",
        transition:"all 0.3s ease",
        background:isActive
          ?"linear-gradient(160deg,#fdf0c0 0%,#f0d060 40%,#faf0c0 100%)"
          :hov?"linear-gradient(160deg,#fdf6e3 0%,#f0d9a0 60%,#faf0d7 100%)"
          :"linear-gradient(160deg,#f8f0d8 0%,#eddba8 50%,#f5ecca 100%)",
        border:isActive?"2px solid #c9962a":hov?"1px solid #c9962a":"1px solid #8b5e2a",
        boxShadow:isActive
          ?"0 0 0 1px rgba(201,150,42,0.2), 0 0 24px rgba(201,150,42,0.18), 0 6px 28px rgba(0,0,0,0.35)"
          :hov?"0 0 16px rgba(201,150,42,0.15), 0 4px 18px rgba(0,0,0,0.25)"
          :"0 2px 10px rgba(0,0,0,0.2)",
        animation:`lib-float-in 0.45s ease both`, animationDelay:`${index*0.09}s`,
      }}
    >
      {hov&&<div style={{ position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none",background:"radial-gradient(ellipse at 50% 0%,rgba(201,150,42,0.1) 0%,transparent 65%)" }}/>}
      <div style={{ position:"absolute",right:"1rem",bottom:"0.5rem",fontSize:"3rem",color:"rgba(201,150,42,0.05)",pointerEvents:"none" }}>?s"</div>
      {[["3px","6px"],["3px","auto"],["auto","6px"],["auto","auto"]].map(([t,l],i)=>(
        <span key={i} style={{ position:"absolute",...(t!=="auto"?{top:t}:{bottom:"4px"}),...(l!=="auto"?{left:l}:{right:"6px"}),color:isActive?"#c9962a":"#8b5e2a",fontSize:"0.5rem",opacity:isActive?0.8:0.4 }}>?-?</span>
      ))}
      {isActive&&(
        <div style={{ position:"absolute",top:"-1px",left:"50%",transform:"translateX(-50%)",background:"linear-gradient(90deg,#6b3a05,#c9962a,#f0c060,#c9962a,#6b3a05)",backgroundSize:"200% auto",animation:"lib-shimmer 3s linear infinite, lib-badge-pulse 2s ease-in-out infinite",color:"#1e0800",fontFamily:"'Cinzel',serif",fontSize:"0.55rem",letterSpacing:"0.22em",textTransform:"uppercase",padding:"0.18rem 1.1rem",borderRadius:"0 0 8px 8px",fontWeight:700,whiteSpace:"nowrap" }}>
        </div>
      )}
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"0.75rem",marginTop:isActive?"0.5rem":0 }}>
        <div style={{ flex:1 }}>
          <h3 style={{ fontFamily:"'Uncial Antiqua',serif",color:isActive?"#7a1a1a":hov?"#1e0e00":"#2c1a08",fontSize:"1.05rem",margin:"0 0 0.35rem 0",transition:"all 0.3s" }}>{campaign.title}</h3>
          {campaign.summary&&<p style={{ fontFamily:"'Crimson Text',serif",fontStyle:"italic",color:"#7a5c2a",fontSize:"0.9rem",lineHeight:1.5,margin:"0 0 0.75rem 0" }}>« {campaign.summary} »</p>}
          <div style={{ display:"flex",alignItems:"center",gap:"1rem",flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'Cinzel',serif",fontSize:"0.65rem",color:"#8a6030",letterSpacing:"0.1em",textTransform:"uppercase" }}>?s" {campaign.scenes.length} sess.</span>
            <span style={{ fontFamily:"'Cinzel',serif",fontSize:"0.65rem",color:"#8a6030",letterSpacing:"0.1em",textTransform:"uppercase" }}>?YZ? {campaign.npcs.length} PNJ</span>
            <span style={{ fontFamily:"'Crimson Text',serif",fontSize:"0.76rem",color:"#9a7040",fontStyle:"italic",marginLeft:"auto" }}>{new Date(campaign.updatedAt??campaign.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"})}</span>
          </div>
        </div>
        <button onClick={(e)=>{e.stopPropagation();onDelete(campaign.id);}} style={{ background:"transparent",border:"none",color:"#7a1a1a",opacity:hov?0.5:0.18,cursor:"pointer",fontSize:"0.78rem",padding:"0.2rem 0.4rem",transition:"all 0.2s",flexShrink:0 }}
          onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.opacity="1";}}
          onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.opacity=hov?"0.5":"0.18";}}
        >?o.</button>
      </div>
    </div>
  );
}

/* ARCHIVE ROW */


function ArchiveRow({ icon,label,title,sub,date,onClick,accentColor="#c9962a" }: {
  icon:string; label:string; title:string; sub?:string; date:string; onClick:()=>void; accentColor?:string;
}) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ display:"flex",alignItems:"center",gap:"0.85rem",padding:"0.75rem 1rem",background:hov?"linear-gradient(135deg,#fdf6e3,#f5e6c0)":"linear-gradient(135deg,#f8f0d8,#f0e4c0)",border:`1px solid ${hov?"#c9962a":"#8b5e2a"}`,borderRadius:"2px 10px 2px 10px",cursor:"pointer",transition:"all 0.22s ease",boxShadow:hov?"0 3px 14px rgba(0,0,0,0.18)":"0 1px 6px rgba(0,0,0,0.1)" }}>
      <div style={{ width:"6px",height:"6px",borderRadius:"50%",flexShrink:0,background:accentColor,boxShadow:hov?`0 0 8px ${accentColor}`:`0 0 3px ${accentColor}55`,transition:"all 0.22s" }}/>
      <span style={{ fontSize:"1rem",flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1 }}>
        <span style={{ fontFamily:"'Cinzel',serif",fontSize:"0.58rem",color:"#8a6030",letterSpacing:"0.15em",textTransform:"uppercase",display:"block",marginBottom:"0.1rem" }}>{label}</span>
        <span style={{ fontFamily:"'Crimson Text',serif",color:hov?"#1e0e00":"#3c2410",fontSize:"0.93rem",transition:"color 0.22s" }}>
          {title}{sub&&<span style={{ color:"#7a5c2a",fontStyle:"italic",marginLeft:"0.4rem" }}>— {sub}</span>}
        </span>
      </div>
      <span style={{ fontFamily:"'Crimson Text',serif",fontSize:"0.73rem",color:"#8a6030",fontStyle:"italic",flexShrink:0 }}>{date}</span>
    </div>
  );
}

/* MÉTÉO NARRATIVE */

/* SUGGESTIONS DE NOMS IA */



/* PAGE PRINCIPALE */


export function HomePage() {
  const { data, campaigns, currentCampaign, selectCampaign, deleteCampaign } = useAppData();
  const navigate = useNavigate();
  const styleRef = useRef<HTMLStyleElement|null>(null);

  const [phraseIdx,setPhraseIdx]=useState(0);
  const [phraseVis,setPhraseVis]=useState(true);
  const [mounted,setMounted]=useState(false);

  useEffect(()=>{
    if(!styleRef.current){
      const el=document.createElement("style");
      el.textContent=INJECTED_CSS;
      document.head.appendChild(el);
      styleRef.current=el;
    }
    setTimeout(()=>setMounted(true),60);
    return ()=>{ styleRef.current?.remove(); styleRef.current=null; };
  },[]);

  useEffect(()=>{
    const id=setInterval(()=>{
      setPhraseVis(false);
      setTimeout(()=>{ setPhraseIdx(i=>(i+1)%ORACLE_PHRASES.length); setPhraseVis(true); },600);
    },5500);
    return ()=>clearInterval(id);
  },[]);

  const lastSession=[...(data.sessions??[])].sort((a,b)=>new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime()).at(0);
  const recentNpcs=data.npcs?[...data.npcs].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).slice(0,3):[];

  const handleSelect=(id:string)=>{ selectCampaign(id); navigate("/"); };
  const handleDelete=(id:string)=>{
    if(campaigns.length<=1){ alert("Impossible de supprimer la dernière chronique."); return; }
    if(window.confirm("Supprimer cette chronique ? Action irréversible.")) deleteCampaign(id);
  };

  const parchCard=(extra?:React.CSSProperties):React.CSSProperties=>({
    position:"relative",
    background:"linear-gradient(160deg,#fdf6e3 0%,#f5e6c0 45%,#faf0d7 100%)",
    border:"1px solid #8b5e2a",
    borderRadius:"3px 16px 3px 16px",
    padding:"1.5rem",
    marginBottom:"1.1rem",
    boxShadow:"0 4px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.5)",
    overflow:"hidden",
    animation:mounted?"lib-border-glow 4s ease-in-out infinite":"none",
    ...extra,
  });

  const sectionTitle=(icon:string,label:string,sub?:string)=>(
    <div style={{ display:"flex",alignItems:"center",gap:"0.7rem",marginBottom:"0.1rem" }}>
      <span style={{ fontSize:"1.15rem" }}>{icon}</span>
      <h2 style={{ fontFamily:"'Uncial Antiqua',serif",color:"#1e1005",fontSize:"1.15rem",margin:0,textShadow:"1px 1px 0 rgba(255,255,255,0.4)" }}>{label}</h2>
      {sub&&<span style={{ fontFamily:"'Cinzel',serif",fontSize:"0.6rem",color:"#8a6030",letterSpacing:"0.15em",textTransform:"uppercase",marginLeft:"auto" }}>{sub}</span>}
    </div>
  );

  return (
    <div style={{ maxWidth:"830px",margin:"0 auto",paddingBottom:"3rem" }}>

      {/* AUTEL — BIBLIOTHÈQUE EN FOND ANIMÉE */}
      <div style={{
        position:"relative",
        borderRadius:"3px 16px 3px 16px",
        overflow:"hidden",
        marginBottom:"1.1rem",
        minHeight:"280px",
        border:"1px solid #5a2e08",
        boxShadow:"0 6px 32px rgba(0,0,0,0.6)",
      }}>
        {/* BIBLIOTHÈQUE ANIMÉE EN FOND */}
        <LibraryBackground/>

        {/* Contenu par-dessus */}
        <div style={{
          position:"relative", zIndex:10,
          padding:"2.5rem 2rem 2rem",
          textAlign:"center",
        }}>
          {/* Bougies */}
          <div style={{ display:"flex",justifyContent:"center",gap:"3rem",marginBottom:"1.6rem" }}>
            <Candle delay={0}   size={0.9}/>
            <Candle delay={0.5} size={1.15}/>
            <Candle delay={0.9} size={0.9}/>
          </div>

          <p style={{ fontFamily:"'Cinzel',serif",fontSize:"0.6rem",letterSpacing:"0.45em",textTransform:"uppercase",color:"#6b3a10",margin:"0 0 0.55rem 0" }}>✦ &nbsp; Grimoire du Maître &nbsp; ✦</p>

          <h1 style={{
            fontFamily:"'Uncial Antiqua',serif",
            background:"linear-gradient(90deg,#8a5010 0%,#c9962a 25%,#f0c060 50%,#c9962a 75%,#8a5010 100%)",
            backgroundSize:"200% auto",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text",
            animation:"lib-shimmer 5s linear infinite",
            fontSize:"2.1rem", margin:"0 0 0.2rem 0", lineHeight:1.15,
            filter:"drop-shadow(0 2px 8px rgba(201,150,42,0.35))",
          }}>
            Taverne du Maître du Jeu
          </h1>

          <RuneSep rune="⚜" animate/>

          <div style={{ minHeight:"2rem",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <p style={{
              fontFamily:"'Crimson Text',serif", fontStyle:"italic",
              color:"#c8a060", fontSize:"1.05rem", margin:0,
              transition:"opacity 0.6s ease, transform 0.6s ease",
              opacity:phraseVis?1:0,
              transform:phraseVis?"translateY(0)":"translateY(5px)",
              animation:phraseVis?"lib-oracle-in 0.6s ease both":"none",
              maxWidth:"560px", lineHeight:1.55,
              textShadow:"0 1px 4px rgba(0,0,0,0.7)",
            }}>
              {ORACLE_PHRASES[phraseIdx]}
            </p>
          </div>
        </div>
      </div>

      {/* REPRISE RAPIDE */}
      {lastSession&&(
        <div style={{ ...parchCard({ display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap",padding:"1.1rem 1.5rem",border:"1px solid #c9962a" }) }}>
          <div style={{ position:"absolute",left:0,top:0,bottom:0,width:"3px",background:"linear-gradient(180deg,transparent,#c9962a,#f0c060,#c9962a,transparent)",borderRadius:"3px 0 0 3px",animation:"lib-bar-pulse 2.5s ease-in-out infinite" }}/>
          <div style={{ paddingLeft:"0.6rem" }}><p style={{ fontFamily:"'Cinzel',serif",fontSize:"0.6rem",letterSpacing:"0.22em",textTransform:"uppercase",color:"#8a6030",margin:"0 0 0.3rem 0" }}>⚡ &nbsp; Reprendre la dernière session</p>
            <h3 style={{ fontFamily:"'Uncial Antiqua',serif",color:"#1e1005",fontSize:"1rem",margin:"0 0 0.2rem 0" }}>{lastSession.title}</h3>
            {currentCampaign&&<p style={{ fontFamily:"'Crimson Text',serif",color:"#7a5c2a",fontStyle:"italic",fontSize:"0.85rem",margin:0 }}>{currentCampaign.title}</p>}
          </div>
          <button onClick={()=>navigate(`/sessions/${lastSession.id}`)} style={{ fontFamily:"'Cinzel',serif",fontSize:"0.82rem",letterSpacing:"0.09em",padding:"0.65rem 1.6rem",background:"linear-gradient(135deg,#7a1a1a,#5a1010)",color:"#f5e9c8",border:"1px solid #a02020",borderRadius:"2px 12px 2px 12px",cursor:"pointer",boxShadow:"0 3px 14px rgba(0,0,0,0.3)",transition:"all 0.22s ease",whiteSpace:"nowrap" }}
            onMouseEnter={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="linear-gradient(135deg,#a02020,#7a1a1a)";b.style.transform="translateY(-2px)";b.style.boxShadow="0 6px 20px rgba(0,0,0,0.35)";}}
            onMouseLeave={e=>{const b=e.currentTarget as HTMLButtonElement;b.style.background="linear-gradient(135deg,#7a1a1a,#5a1010)";b.style.transform="translateY(0)";b.style.boxShadow="0 3px 14px rgba(0,0,0,0.3)";}}
          >Continuer l'aventure →</button>
        </div>
      )}

      {/* VOS CHRONIQUES */}
      <div style={parchCard()}>
        {sectionTitle("📜","Vos Chroniques",`${campaigns.length} grimoire${campaigns.length!==1?"s":""}`)}
        <RuneSep rune="◆"/>
        {campaigns.length===0
          ?<p style={{ fontFamily:"'Crimson Text',serif",fontStyle:"italic",color:"#8a6030",textAlign:"center",padding:"2rem" }}>Les étagères sont vides… aucune chronique ne sommeille ici encore.</p>
          :<div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>{campaigns.map((c,i)=><GrimoireCard key={c.id} campaign={c} isActive={c.id===currentCampaign?.id} index={i} onSelect={handleSelect} onDelete={handleDelete}/>)}</div>
        }
      </div>

      {/* ARCHIVES VIVANTES */}
      {(lastSession||recentNpcs.length>0)&&(
        <div style={parchCard({marginBottom:0})}>
          {sectionTitle("🕯️","Archives Vivantes")}
          <RuneSep rune="◆"/>
          <div style={{ display:"flex",flexDirection:"column",gap:"0.5rem" }}>
            {lastSession&&<ArchiveRow icon="⚔️" label="Dernière session" title={lastSession.title} date={new Date(lastSession.updatedAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} onClick={()=>navigate(`/sessions/${lastSession.id}`)} accentColor="#c9962a"/>}
            {recentNpcs.map(npc=>(
              <ArchiveRow key={npc.id} icon={npc.attitude==="hostile"?"💀":npc.attitude==="friendly"?"🤝":"🎭"} label="Personnage" title={npc.name} sub={npc.role} date={new Date(npc.createdAt).toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} onClick={()=>navigate(`/npcs/${npc.id}`)} accentColor={npc.attitude==="hostile"?"#a02020":npc.attitude==="friendly"?"#4a8040":"#c9962a"}/>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
