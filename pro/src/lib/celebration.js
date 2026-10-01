import confetti from 'canvas-confetti';

export const fireCelebration = () => {
  confetti({
    particleCount: 140,
    spread: 75,
    origin: { y: 0.65 },
    colors: ['#4f46e5', '#7c3aed', '#0284c7', '#10b981'],
  });
};
