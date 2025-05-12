
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatNumberForDisplay, parseFormattedNumber } from '@/lib/utils';

const FormattedInput = React.forwardRef(({ value: propValue, onChange, onBlur, name, allowNegative = false, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  useEffect(() => {
    const formatted = formatNumberForDisplay(propValue, allowNegative);
    if (document.activeElement !== inputRef.current || propValue === null || propValue === undefined) {
      setDisplayValue(formatted);
    }
  }, [propValue, inputRef, allowNegative]);

  const handleChange = (e) => {
    let inputValue = e.target.value;
    
    // Allow only numbers, one decimal separator (comma or period), and optionally a minus sign at the beginning
    let regex;
    if (allowNegative) {
      regex = /^-?[\d,.]*$/;
    } else {
      regex = /^[\d,.]*$/;
    }

    if (!regex.test(inputValue)) {
      // If invalid char is typed, revert to previous valid displayValue or formatted propValue
      setDisplayValue(formatNumberForDisplay(propValue, allowNegative));
      return;
    }
    
    // If only "-" is typed and negatives are allowed, keep it
    if (allowNegative && inputValue === "-") {
      setDisplayValue(inputValue);
    } else {
       // Prevent multiple decimal separators or leading zeros for non-decimal part
      const parts = inputValue.replace(',', '.').split('.');
      if (parts.length > 2) { // more than one decimal separator
        setDisplayValue(formatNumberForDisplay(propValue, allowNegative));
        return;
      }
      // No specific handling for leading zeros here, parseFormattedNumber should handle it
      setDisplayValue(inputValue);
    }


    const parsed = parseFormattedNumber(inputValue, allowNegative);
    
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: parsed,
        },
      });
    }
  };

  const handleBlurEvent = (e) => {
    const parsed = parseFormattedNumber(displayValue, allowNegative);
    setDisplayValue(formatNumberForDisplay(parsed, allowNegative)); 
    if (onBlur) {
      const eventWithValue = { ...e, target: { ...e.target, name, value: parsed } };
      onBlur(eventWithValue);
    }
  };

  return (
    <Input
      {...props}
      ref={inputRef}
      name={name}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlurEvent}
      autoComplete="off"
      type="text" 
    />
  );
});

FormattedInput.displayName = "FormattedInput";

export default FormattedInput;
