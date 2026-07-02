import { useState, useEffect, ReactNode } from "react";

interface GameWrapperProps {
    children: ReactNode;
}

/**
 * Componente contenedor que escala proporcionalmente el contenido del juego
 * para adaptarse a cualquier resolución de pantalla manteniendo la proporción
 * 16:9 sobre una resolución base de 1920x1080 píxeles. Calcula el factor de
 * escala y los desplazamientos necesarios para centrar el contenido en el
 * espacio disponible bajo el header, y se recalcula automáticamente al
 * redimensionar la ventana.
 *
 * @param {ReactNode} children - Contenido del juego a escalar.
 */
export default function GameWrapper({ children }: GameWrapperProps) {
    const [scale, setScale] = useState(1);
    const [offsets, setOffsets] = useState({ x: 0, y: 0 });

    /**
     * Efecto que calcula y actualiza el factor de escala y los desplazamientos
     * del contenido del juego en función del tamaño del contenedor padre.
     * Toma como referencia una resolución base de 1920x1080 y calcula el factor
     * de escala mínimo entre el ancho y el alto disponibles para garantizar que
     * el contenido quepa completamente sin deformación. Los offsets centran el
     * contenido escalado dentro del espacio disponible. Se registra un listener
     * sobre el evento "resize" para recalcular al cambiar el tamaño de la ventana,
     * que se limpia al desmontar el componente.
     */
    useEffect(() => {
        const updateScale = () => {
            const baseWidth = 1920;
            const baseHeight = 1080;

            // Obtener el contenedor padre (el área disponible bajo el header)
            const container = document.getElementById('game-container');
            if (!container) return;

            const screenWidth = container.clientWidth;
            const screenHeight = container.clientHeight;

            // Calcula el factor de escala manteniendo proporción 16:9
            const scaleFactor = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);

            // Calcula los offsets para centrar
            const scaledWidth = baseWidth * scaleFactor;
            const scaledHeight = baseHeight * scaleFactor;
            const offsetX = (screenWidth - scaledWidth) / 2;
            const offsetY = (screenHeight - scaledHeight) / 2;

            setScale(scaleFactor);
            setOffsets({ x: offsetX, y: offsetY });
        };

        updateScale();
        window.addEventListener("resize", updateScale);
        return () => window.removeEventListener("resize", updateScale);
    }, []);

    return (
        <div id="game-container" className="relative w-full h-full overflow-hidden">
            <div
                className="absolute origin-top-left"
                style={{
                    width: "1920px",
                    height: "1080px",
                    transform: `translate(${offsets.x}px, ${offsets.y}px) scale(${scale})`,
                    background: "transparent",
                }}
            >
                {children}
            </div>
        </div>
    );
}