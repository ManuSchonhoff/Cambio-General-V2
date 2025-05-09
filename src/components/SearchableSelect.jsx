
import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const SearchableSelect = ({ options, value, onValueChange, placeholder = "Selecciona...", emptyText = "No se encontraron opciones." }) => {
  const [open, setOpen] = useState(false);
  const [internalInputValue, setInternalInputValue] = useState(""); // For controlling CommandInput directly

  useEffect(() => {
    if (!open) { // When popover closes, reset internal input value to reflect current selection
      const selectedOption = options.find(option => option.value === value);
      setInternalInputValue(selectedOption ? selectedOption.label : "");
    }
  }, [value, options, open]);
  
  const handleSelect = (currentValue) => {
    const actualValueToSet = currentValue === value ? "" : currentValue; // Allow deselecting by clicking current
    onValueChange(actualValueToSet);
    const selectedOption = options.find(option => option.value === actualValueToSet);
    setInternalInputValue(selectedOption ? selectedOption.label : "");
    setOpen(false);
  };

  // Determine the label to display on the button
  const displayLabel = options.find(option => option.value === value)?.label || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[--radix-popover-content-available-height]">
        <Command shouldFilter={true} filter={(itemValue, search) => {
          if (search === "" && placeholder && itemValue === placeholder) return 0; // Don't match placeholder itself
          return itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0;
        }}>
          <CommandInput 
            placeholder="Buscar opción..."
            value={internalInputValue} // Controlled by internal state
            onValueChange={(search) => setInternalInputValue(search)} // Update internal state on typing
          />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} 
                  onSelect={() => {
                     handleSelect(option.value);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center">
                    {option.icon ? <option.icon className="mr-2 h-4 w-4" /> : null}
                    {option.label}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableSelect;
