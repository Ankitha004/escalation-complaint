import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ deadline }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(deadline);
      const diff = target - now;

      if (diff <= 0) {
        setIsOverdue(true);
        setTimeLeft('Escalating...');
        return;
      }

      setIsOverdue(false);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    calculateTimeLeft(); // initial calculation
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  if (!deadline || !timeLeft) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '6px',
        background: isOverdue ? '#FEE2E2' : '#F1F5F9',
        color: isOverdue ? '#DC2626' : '#475569',
        fontSize: '0.72rem',
        fontWeight: '700',
        border: `1px solid ${isOverdue ? '#FECACA' : '#E2E8F0'}`,
      }}
    >
      <Clock size={12} />
      <span>
        {isOverdue ? timeLeft : `Escalates in: ${timeLeft}`}
      </span>
    </div>
  );
};

export default CountdownTimer;
