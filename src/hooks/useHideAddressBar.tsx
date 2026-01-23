import { useEffect } from 'react';

export const useHideAddressBar = () => {
    useEffect(() => {
        const hideAddressBar = () => {
            // Scroll mínimo para forzar que se oculte la barra
            window.scrollTo(0, 1);

            // Opcional: volver a 0 después de un breve momento
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 50);
        };

        // Ejecutar al montar el componente
        hideAddressBar();

        // Ejecutar después de un pequeño delay para asegurar que funcione
        setTimeout(hideAddressBar, 100);
        setTimeout(hideAddressBar, 300);
        setTimeout(hideAddressBar, 500);

        // Listeners para cambios de orientación y resize
        const handleOrientationChange = () => {
            setTimeout(hideAddressBar, 100);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);

        // En iOS, también escuchar cuando el usuario hace scroll
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    if (window.scrollY === 0) {
                        window.scrollTo(0, 1);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);
};