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
        gap: '0.45rem',
        padding: '0.28rem 0.65rem',
        borderRadius: '8px',
        background: isOverdue ? '#FEF2F2' : '#EFF6FF',
        color: isOverdue ? '#DC2626' : '#2563EB',
        fontSize: '0.74rem',
        fontWeight: '700',
        border: `1px solid ${isOverdue ? '#FECACA' : '#BFDBFE'}`,
        boxShadow: isOverdue ? '0 1px 4px rgba(220, 38, 38, 0.1)' : '0 1px 3px rgba(37, 99, 235, 0.08)',
        letterSpacing: '0.01em'
      }}
    >
      <Clock size={13} style={{ flexShrink: 0, color: isOverdue ? '#DC2626' : '#2563EB' }} />
      <span>
        {isOverdue ? timeLeft : `Escalates in: ${timeLeft}`}
      </span>
    </div>
  );
};

export default CountdownTimer;
