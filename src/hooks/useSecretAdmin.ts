import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SECRET_KEY = 'a';
const REQUIRED_PRESSES = 5;
const TIME_WINDOW = 2000; // 2 seconds to complete the sequence

export const useSecretAdmin = () => {
  const navigate = useNavigate();
  const pressTimestamps = useRef<number[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key.toLowerCase() === SECRET_KEY) {
        const now = Date.now();
        
        // Filter out old presses outside the time window
        pressTimestamps.current = pressTimestamps.current.filter(
          (timestamp) => now - timestamp < TIME_WINDOW
        );
        
        // Add current press
        pressTimestamps.current.push(now);

        // Check if we have enough presses
        if (pressTimestamps.current.length >= REQUIRED_PRESSES) {
          pressTimestamps.current = []; // Reset
          navigate('/admin/login');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
};
