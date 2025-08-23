import React from 'react';

// Componente de iconos SVG con estilo outline
export const Icons = {
  // Fútbol
  Soccer: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
      <path d="M12 2a14.5 14.5 0 0 1 0 20" />
    </svg>
  ),

  // Estadio
  Stadium: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 12h18" />
      <path d="M6 6V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2" />
      <path d="M6 18v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
    </svg>
  ),

  // Puerta
  Door: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <circle cx="16" cy="12" r="1" />
    </svg>
  ),

  // Usuario
  User: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),

  // Usuarios (grupo)
  Users: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),

  // Juego/Cartas
  Cards: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21l-2-6h12l-2 6" />
      <path d="M12 17v4" />
    </svg>
  ),

  // Votación
  Vote: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10" />
      <path d="M7 12h6" />
      <path d="M17 12l2 2-2 2" />
    </svg>
  ),

  // Cohete (inicio)
  Rocket: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),

  // Copiar
  Copy: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),

  // Salir
  Exit: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),

  // Eliminar/X
  X: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="15 9l-6 6" />
      <path d="9 9l6 6" />
    </svg>
  ),

  // Saltar
  Skip: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="5,4 15,12 5,20" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  ),

  // Compartir
  Share: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="8.59 13.51l6.83 3.98" />
      <path d="15.41 6.51l-6.82 3.98" />
    </svg>
  ),

  // Corona/Trofeo
  Trophy: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55.47.98.97 1.21C11.25 18.48 11.61 18.5 12 18.5s.75-.02 1.03-.29c.5-.23.97-.66.97-1.21v-2.34" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
    </svg>
  ),

  // Máscara (Impostor)
  Mask: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.63 3.34 1.68 4.58L12 20l5.32-6.42C18.37 12.34 19 10.74 19 9c0-3.87-3.13-7-7-7z" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="9" r="1" />
      <path d="M8 13s1 1 4 1 4-1 4-1" />
    </svg>
  ),

  // Robot (Bot)
  Robot: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <circle cx="12" cy="2" r="1" />
      <path d="M12 3v3" />
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <path d="M8 14h8" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  ),

  // Configuración
  Settings: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6" />
      <path d="M21 12h-6m-6 0H3" />
    </svg>
  ),

  // Flecha atrás
  ArrowLeft: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  ),

  // Check
  Check: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  ),

  // Calavera
  Skull: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M8 20v2h8v-2" />
      <path d="M12.5 17.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-.67.67-.67 1.5.67 1.5 1.5 1.5z" />
      <path d="M7 8s-1.5-2-4-2c-1.5 0-3 1-3 3s1.5 3 3 3c2.5 0 4-2 4-2" />
      <path d="M17 8s1.5-2 4-2c1.5 0 3 1 3 3s-1.5 3-3 3c-2.5 0-4-2-4-2" />
      <path d="M12 4s-2-2-6 0c-2 1-3 3-3 5 0 4 2 8 9 8s9-4 9-8c0-2-1-4-3-5-4-2-6 0-6 0z" />
    </svg>
  ),

  // Refrescar
  Refresh: ({ className = "w-6 h-6", ...props }) => (
    <svg className={className} {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4v6h6M20 20v-6h-6" />
      <path d="M20 9A9 9 0 0 0 5 5l-1 1" />
      <path d="M4 15a9 9 0 0 0 15 4l1-1" />
    </svg>
  )
};

export default Icons;