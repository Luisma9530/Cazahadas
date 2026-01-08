import { useState, useEffect, ReactNode } from "react";

interface GameWrapperProps {
    children: ReactNode;
}

export default function GameWrapper({ children }: GameWrapperProps) {
    const [scale, setScale] = useState(1);
    const [offsets, setOffsets] = useState({ x: 0, y: 0 });

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