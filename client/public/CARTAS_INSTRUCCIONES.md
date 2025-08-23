# 🃏 Instrucciones para Imágenes de Cartas

## 📍 Ubicación de Archivos

Coloca las siguientes imágenes en los directorios especificados:

### 1. Carta de Reverso (Balón)
- **Ruta**: `/public/balón/ReverseCard.webp`
- **Descripción**: Carta que se muestra inicialmente (lado trasero)
- **Contenido**: Balón de fútbol sobre fondo azul
- **Dimensiones**: 300x400 píxeles

### 2. Carta de Inocente (Ángel)
- **Ruta**: `/public/InocentsCard.webp`
- **Descripción**: Carta que se revela para jugadores inocentes
- **Contenido**: Ángel con halo sobre fondo celeste
- **Dimensiones**: 300x400 píxeles

### 3. Carta de Impostor (Demonio)
- **Ruta**: `/public/ImpostorsCard.webp`
- **Descripción**: Carta que se revela para el impostor
- **Contenido**: Demonio con cuernos sobre fondo rojo/negro
- **Dimensiones**: 300x400 píxeles

## 🎨 Especificaciones Técnicas

- **Formato**: WebP (recomendado) o PNG
- **Resolución**: 300x400 píxeles
- **Proporción**: 3:4 (formato carta)
- **Calidad**: Alta resolución para visualización clara
- **Bordes**: Redondeados (opcional, CSS se encarga)

## 🔄 Fallbacks Automáticos

Si las imágenes no están disponibles, el sistema mostrará automáticamente:
- **Reverso**: Emoji de balón ⚽ con gradiente azul
- **Inocente**: Emoji de ángel 😇 con gradiente verde
- **Impostor**: Emoji de demonio 😈 con gradiente rojo

## ✅ Verificación

Para verificar que las imágenes funcionan correctamente:
1. Inicia el juego
2. Comienza una nueva ronda
3. Observa la animación de carta giratoria
4. Confirma que se muestra la imagen correcta según tu rol

¡Disfruta del nuevo efecto de revelación de cartas! 🎮✨
