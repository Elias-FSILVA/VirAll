import React from 'react';
import styles from './InputField.module.css';

function InputField({ icon: Icon, type, placeholder, value, onChange }) {
  return (
    <div className={styles.inputContainer}>
      {Icon && <Icon className={styles.inputIcon} />}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={styles.inputField}
      />
    </div>
  );
}

export default InputField;