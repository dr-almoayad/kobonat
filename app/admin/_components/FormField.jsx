// app/admin/_components/FormField.jsx
'use client';

import styles from '../admin.module.css';

// Update the checkbox handling
export function FormField({ 
  label, 
  name, 
  type = 'text',
  defaultValue = '',
  required = false,
  placeholder = '',
  helpText = '',
  options = [],
  rows = 4,
  dir = 'ltr',
  ...props
}) {
  const inputId = `field-${name}`;
  
  // Handle checkbox default value
  const isChecked = type === 'checkbox' 
    ? defaultValue === true || defaultValue === 'true' || defaultValue === 'on'
    : false;

  return (
    <div className={styles.formGroup}>
      <label htmlFor={inputId}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={inputId}
          name={name}
          defaultValue={defaultValue || ''}
          required={required}
          placeholder={placeholder}
          rows={rows}
          dir={dir}
          className={styles.formTextarea}
          {...props}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          defaultValue={defaultValue || ''}
          required={required}
          className={styles.formSelect}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'checkbox' ? (
        <div className={styles.checkboxWrapper}>
          <input
            type="checkbox"
            id={inputId}
            name={name}
            defaultChecked={isChecked}
            className={styles.formCheckbox}
            {...props}
          />
          {helpText && <span className={styles.checkboxHelp}>{helpText}</span>}
        </div>
      ) : type === 'color' ? (
        <input
          type="color"
          id={inputId}
          name={name}
          defaultValue={defaultValue || '#2563eb'}
          className={styles.formColor}
          {...props}
        />
      ) : (
        <input
          type={type}
          id={inputId}
          name={name}
          defaultValue={defaultValue || ''}
          required={required}
          placeholder={placeholder}
          dir={dir}
          className={styles.formInput}
          {...props}
        />
      )}
      
      {helpText && type !== 'checkbox' && (
        <p className={styles.helpText}>{helpText}</p>
      )}
    </div>
  );
}

export function FormRow({ children }) {
  return <div className={styles.formRow}>{children}</div>;
}

export function FormSection({ title, children }) {
  return (
    <div className={styles.formSection}>
      {title && <h3 className={styles.formSectionTitle}>{title}</h3>}
      {children}
    </div>
  );
}