import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaign } from "../hooks/useCampaign";
import grimoireImg from "../assets/grimoire_candles.gif";

type Props = { onEnter: () => void };

export function WelcomeScreen({ onEnter }: Props) {
  const { campaigns, selectCampaign, createCampaign } = useCampaign();
  const navigate = useNavigate();
  const [newTitle, setNewTitle] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (id: string) => {
    selectCampaign(id);
    setTimeout(() => {
      onEnter();
      navigate("/");
    }, 800);
  };

  const handleCreate = () => {
    const title = newTitle.trim() || `Campagne ${campaigns.length + 1}`;
    const id = createCampaign(title);
    setNewTitle("");
    setShowCreate(false);
    handleSelect(id);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Grimoire */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Image du grimoire en fond */}
        <img
          src={grimoireImg}
          alt="grimoire"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
          }}
        />

        {/* Contenu superposé */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
        }}>
          {/* Titre */}
          <div style={{
            position: 'absolute',
            top: '2%',
            left: 0,
            right: 0,
            textAlign: 'center',
            zIndex: 10,
          }}>
            <h1 style={{
              fontFamily: "'Uncial Antiqua', serif",
              fontSize: 'clamp(1.8rem, 4vw, 3rem)',
              color: '#c9962a',
              textShadow: '2px 2px 12px rgba(0,0,0,0.9)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              Journal du MJ
            </h1>
            <p style={{
              fontFamily: "'Crimson Text', serif",
              fontStyle: 'italic',
              color: '#f5e9c8',
              fontSize: '1.1rem',
              marginTop: '0.4rem',
              textShadow: '1px 1px 6px rgba(0,0,0,0.9)',
            }}>
              Choisissez votre destin, Maître du Jeu...
            </p>
          </div>

          {/* Page gauche - position absolue */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '25%',
            width: '28%',
            bottom: '18%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <h2 style={{
              fontFamily: "'Uncial Antiqua', serif",
              color: '#2c1a08',
              fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
              borderBottom: '1px solid rgba(139,94,42,0.4)',
              paddingBottom: '0.4rem',
              marginBottom: '1rem',
              marginTop: 0,
            }}>
              Vos Univers
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {campaigns.map((campaign, index) => (
                <button
                  key={campaign.id}
                  onClick={() => handleSelect(campaign.id)}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.7rem, 1.5vw, 0.88rem)',
                    background: 'rgba(255,240,200,0.5)',
                    border: '1px solid rgba(139,94,42,0.5)',
                    borderRadius: '2px 6px 2px 6px',
                    padding: '0.5rem 0.75rem',
                    cursor: 'pointer',
                    color: '#2c1a08',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    animation: `fadeInUp 0.4s ease ${index * 0.1}s both`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    width: '75%',
                    backdropFilter: 'blur(2px)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(201,150,42,0.35)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,240,200,0.5)';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateX(0)';
                  }}
                >
                  <span>📜</span>
                  {campaign.title}
                </button>
              ))}
              {campaigns.length === 0 && (
                <p style={{
                  fontFamily: "'Crimson Text', serif",
                  fontStyle: 'italic',
                  color: '#5a3a1a',
                  fontSize: '0.85rem',
                }}>
                  Aucun univers...
                </p>
              )}
            </div>
          </div>

          {/* Page droite - position absolue */}
          <div style={{
            position: 'absolute',
            top: '30%',
            left: '54%',
            width: '28%',
            bottom: '18%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <h2 style={{
                fontFamily: "'Uncial Antiqua', serif",
                color: '#2c1a08',
                fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                borderBottom: '1px solid rgba(139,94,42,0.4)',
                paddingBottom: '0.4rem',
                marginBottom: '1rem',
                marginTop: 0,
              }}>
                Nouvel Univers
              </h2>
              {!showCreate ? (
                <button
                  onClick={() => setShowCreate(true)}
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 'clamp(0.65rem, 1.3vw, 0.82rem)',
                    background: 'rgba(100,20,20,0.75)',
                    color: '#f5e9c8',
                    border: '1px solid rgba(138,96,16,0.6)',
                    borderRadius: '2px 8px 2px 8px',
                    padding: '0.6rem 1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.08em',
                    width: '75%',
                    backdropFilter: 'blur(2px)',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(130,25,25,0.85)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(100,20,20,0.75)';
                  }}
                >
                  ✦ Forger un nouvel univers
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="Nom de l'univers..."
                    style={{
                      fontFamily: "'Crimson Text', serif",
                      fontSize: '0.95rem',
                      background: 'rgba(253,246,227,0.7)',
                      border: '1px solid rgba(139,94,42,0.5)',
                      borderRadius: '2px 6px 2px 6px',
                      padding: '0.5rem 0.75rem',
                      color: '#1e1005',
                      width: '100%',
                      boxSizing: 'border-box' as const,
                    }}
                  />
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={handleCreate}
                      style={{
                        flex: 1,
                        fontFamily: "'Cinzel', serif",
                        fontSize: '0.75rem',
                        background: 'rgba(180,130,20,0.75)',
                        color: '#1e1005',
                        border: '1px solid rgba(138,96,16,0.5)',
                        borderRadius: '2px 6px 2px 6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setShowCreate(false)}
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: '0.75rem',
                        background: 'rgba(255,240,200,0.4)',
                        color: '#5a3a1a',
                        border: '1px solid rgba(139,94,42,0.4)',
                        borderRadius: '2px 6px 2px 6px',
                        padding: '0.5rem',
                        cursor: 'pointer',
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{
              textAlign: 'center',
              color: '#5a3a1a',
              fontSize: '0.6rem',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.2em',
              opacity: 0.5,
            }}>
              ✦ JOURNAL DU MAÎTRE ✦
            </div>
          </div>
        </div>
      </div>
      <div style={{
  position: 'absolute',
  bottom: '0.75rem',
  left: '50%',
  transform: 'translateX(-50%)',
  textAlign: 'center',
  pointerEvents: 'none',
  zIndex: 10,
}}>
  <p style={{
    fontFamily: "'Cinzel', serif",
    fontSize: '0.65rem',
    letterSpacing: '0.15em',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  }}>
    Cette application a été créée et pensée par Quentin.P &amp; Amélie.J
  </p>
</div>
    </div>
  );
}
