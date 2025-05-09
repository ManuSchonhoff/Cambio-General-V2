
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { formatNumberForDisplay, parseFormattedNumber } from '@/lib/utils';

const FormattedInput = React.forwardRef(({ value: propValue, onChange, onBlur, name, ...props }, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const internalRef = useRef(null); // Use internal ref for cursor management
  const inputRef = ref || internalRef;

  useEffect(() => {
    const formatted = formatNumberForDisplay(propValue);
    if (document.activeElement !== inputRef.current || propValue === null) {
      setDisplayValue(formatted);
    }
  }, [propValue, inputRef]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const originalCursorPosition = e.target.selectionStart;
    
    setDisplayValue(inputValue);

    const parsed = parseFormattedNumber(inputValue);
    
    if (onChange) {
      onChange({
        target: {
          name: name,
          value: parsed,
        },
      });
    }

    // Attempt to maintain cursor position
    // This is tricky with formatting and might need more advanced handling for all cases
    requestAnimationFrame(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
        // Heuristic: if the number of non-digit characters changed, adjust cursor
        const currentNonDigits = (displayValue.match(/[^\d]/g) || []).length;
        const prevNonDigits = (inputValue.match(/[^\d]/g) || []).length;
        const diffNonDigits = currentNonDigits - prevNonDigits;
        const newCursorPosition = originalCursorPosition + diffNonDigits;
        
        // Ensure cursor is within bounds
        const boundedCursorPosition = Math.max(0, Math.min(newCursorPosition, inputRef.current.value.length));
         // Only set if it's a number input that's being actively typed in
        if (props.type !== 'text' && !isNaN(parseFloat(inputValue.replace(',','.')))) {
             // inputRef.current.setSelectionRange(boundedCursorPosition, boundedCursorPosition);
        }
      }
    });
  };

  const handleBlurEvent = (e) => {
    const parsed = parseFormattedNumber(displayValue);
    setDisplayValue(formatNumberForDisplay(parsed)); 
    if (onBlur) {
      onBlur(e); 
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
    />
  );
});

FormattedInput.displayName = "FormattedInput";

export default FormattedInput;
