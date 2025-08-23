import React, { useState, useEffect } from 'react';

const FlipCard = ({ isImpostor, onAnimationComplete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Inicia la animación después de un breve delay
    const flipTimer = setTimeout(() => {
      setIsFlipped(true);
    }, 1000);

    // Oculta el overlay después de que termine la animación (2 segundos más de tiempo)
    const hideTimer = setTimeout(() => {
      setFadeOut(true);
      // Remueve el overlay completamente después del fade
      setTimeout(() => {
        setShowOverlay(false);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 500);
    }, 4000);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(hideTimer);
    };
  }, [onAnimationComplete]);

  if (!showOverlay) return null;

  return (
    <div className={`card-reveal-overlay ${fadeOut ? 'fade-out' : ''}`}>
      <div className="text-center">
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}>
          <div className="flip-card-inner">
            {/* Carta de reverso (frente) */}
            <div className="flip-card-front">
              <img 
                src="/balón/ReverseCard.webp" 
                alt="Carta de reverso"
                onError={(e) => {
                  // Fallback: usar un gradiente con icono de balón si no encuentra la imagen
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `
                    <div style="
                      width: 100%;
                      height: 100%;
                      background: linear-gradient(145deg, #1e293b, #334155);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-direction: column;
                      border-radius: 0.75rem;
                    ">
                      <div style="
                        width: 120px;
                        height: 120px;
                        background: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 60px;
                        margin-bottom: 20px;
                      ">⚽</div>
                      <h3 style="color: white; font-size: 24px; font-weight: bold;">EL IMPOSTOR</h3>
                    </div>
                  `;
                }}
              />
            </div>
            
            {/* Carta frontal (atrás) - según el rol */}
            <div className="flip-card-back">
              <img 
                src={isImpostor ? "/ImpostorsCard.webp" : "/InocentsCard.webp"}
                alt={isImpostor ? "Carta de Impostor" : "Carta de Inocente"}
                onError={(e) => {
                  // Fallback: usar un gradiente con icono según el rol
                  e.target.style.display = 'none';
                  if (isImpostor) {
                    e.target.parentElement.innerHTML = `
                      <div style="
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(145deg, #dc2626, #991b1b);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        border-radius: 0.75rem;
                      ">
                        <div style="
                          width: 120px;
                          height: 120px;
                          color: white;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 80px;
                          margin-bottom: 20px;
                        ">😈</div>
                        <h3 style="color: white; font-size: 32px; font-weight: bold;">IMPOSTOR</h3>
                        <p style="color: #fca5a5; font-size: 16px; text-align: center; margin-top: 10px;">Engaña a los demás<br/>jugadores y evita que<br/>descubran quién eres.</p>
                      </div>
                    `;
                  } else {
                    e.target.parentElement.innerHTML = `
                      <div style="
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(145deg, #10b981, #047857);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        flex-direction: column;
                        border-radius: 0.75rem;
                      ">
                        <div style="
                          width: 120px;
                          height: 120px;
                          color: white;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          font-size: 80px;
                          margin-bottom: 20px;
                        ">😇</div>
                        <h3 style="color: white; font-size: 32px; font-weight: bold;">INOCENTE</h3>
                        <p style="color: #a7f3d0; font-size: 16px; text-align: center; margin-top: 10px;">Descubre quién es el<br/>impostor y trabaja<br/>con los demás.</p>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Texto informativo */}
        <div className="mt-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            ¡Descubre tu rol!
          </h2>
          <p className="text-gray-300">
            {isFlipped ? 
              (isImpostor ? "¡Eres el impostor! Mantén tu identidad en secreto." : "¡Eres inocente! Encuentra al impostor.") :
              "Revelando tu carta..."
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;