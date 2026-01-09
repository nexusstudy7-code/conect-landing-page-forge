// Padrão de animações consistente para todo o projeto

// Curvas de easing personalizadas
export const EASING = {
    smooth: [0.25, 0.46, 0.45, 0.94] as const,
    spring: [0.34, 1.56, 0.64, 1] as const,
    soft: [0.4, 0, 0.2, 1] as const,
    premium: [0.25, 0.46, 0.45, 0.94] as const,
} as const;

// Durações padrão
export const DURATION = {
    fast: 0.3,
    normal: 0.5,
    slow: 0.7,
} as const;

// Transições pré-configuradas
export const TRANSITIONS = {
    // Transição suave padrão
    smooth: {
        duration: DURATION.normal,
        ease: EASING.smooth,
    },

    // Transição rápida
    fast: {
        duration: DURATION.fast,
        ease: EASING.smooth,
    },

    // Transição lenta
    slow: {
        duration: DURATION.slow,
        ease: EASING.smooth,
    },

    // Transição com efeito spring
    spring: {
        duration: DURATION.normal,
        ease: EASING.spring,
    },

    // Transição suave e lenta
    soft: {
        duration: DURATION.slow,
        ease: EASING.soft,
    },
} as const;

// Variantes de animação comuns
export const VARIANTS = {
    // Fade in/out
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },

    // Slide horizontal
    slideX: {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
    },

    // Slide vertical
    slideY: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },

    // Scale
    scale: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
} as const;

// Classes CSS para transições
export const TRANSITION_CLASSES = {
    smooth: 'transition-all duration-normal ease-premium',
    fast: 'transition-all duration-fast ease-premium',
    slow: 'transition-all duration-slow ease-premium',
    colors: 'transition-colors duration-normal ease-premium',
    transform: 'transition-transform duration-normal ease-premium',
} as const;
