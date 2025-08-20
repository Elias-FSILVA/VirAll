
// components/Button/Button.jsx
import React from 'react';
import styles from './Button.module.css';

function Button({ children, onClick, type = 'button', className = '' }) {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} type={type}>
      {children}
    </button>
  );
}

export default Button;