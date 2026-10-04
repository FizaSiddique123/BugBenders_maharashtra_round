'use client';

import { useEffect } from 'react';

export function ClerkDPDPAOverlay() {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .dpdpa-unverified .cl-formButtonPrimary,
      .dpdpa-unverified .cl-socialButtonsBlockButton {
        pointer-events: none !important;
        opacity: 0.6 !important;
        cursor: not-allowed !important;
      }
      #dpdpa-checkbox-container {
        margin-top: 6px;
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.16);
        padding: 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        justify-content: center;
        width: 100%;
        z-index: 9999;
      }
      #dpdpa-check {
        width: 15px;
        height: 15px;
        cursor: pointer;
        accent-color: #ffffff;
      }
      #dpdpa-label {
        font-size: 12px;
        color: #e5e5e5;
        cursor: pointer;
        user-select: none;
        font-weight: 500;
        font-family: inherit;
      }
    `;
    document.head.appendChild(style);

    const attachCheckbox = () => {
      const clerkCards = document.querySelectorAll('.cl-card');
      clerkCards.forEach((card) => {
        if (!document.getElementById('dpdpa-checkbox-container')) {
          card.classList.add('dpdpa-unverified');
          
          const container = document.createElement('div');
          container.id = 'dpdpa-checkbox-container';
          
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.id = 'dpdpa-check';
          
          const label = document.createElement('label');
          label.htmlFor = 'dpdpa-check';
          label.id = 'dpdpa-label';
          label.innerText = 'I agree to the DPDPA policy (Privacy & Security)';
          
          container.appendChild(checkbox);
          container.appendChild(label);
          
          // Append it as the last element inside the card
          card.appendChild(container);

          checkbox.addEventListener('change', (e) => {
            if ((e.target as HTMLInputElement).checked) {
              card.classList.remove('dpdpa-unverified');
            } else {
              card.classList.add('dpdpa-unverified');
            }
          });
        }
      });
    };

    const observer = new MutationObserver(() => {
      attachCheckbox();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial check in case it's already in the DOM
    attachCheckbox();

    return () => {
      observer.disconnect();
      document.head.removeChild(style);
    };
  }, []);

  return null;
}
