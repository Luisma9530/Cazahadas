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
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            // Calcula el factor de escala manteniendo proporción 16:9
            const scaleFactor = Math.min(screenWidth / baseWidth, screenHeight / baseHeight);

            // Calcula las barras negras (offsets) necesarias para centrar correctamente
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
        <div className="fixed inset-0 z-[20]">
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
