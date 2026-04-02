import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, Plus } from 'lucide-react';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  type: 'institution' | 'position' | 'designation';
  placeholder?: string;
  disabled?: boolean;
}

interface Suggestion {
  id: string;
  name?: string;
  title?: string;
  usage_count: number;
}

export default function AutocompleteInput({
  value,
  onChange,
  type,
  placeholder,
  disabled = false
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isAdding, setIsAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSuggestions();
  }, [type]);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function loadSuggestions() {
    try {
      const tableName = type === 'institution' ? 'institutions' : 'positions';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('usage_count', { ascending: false })
        .order('name' in { name: true } ? 'name' : 'title', { ascending: true });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  }

  function handleInputChange(newValue: string) {
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.trim()) {
      const filtered = suggestions.filter(s => {
        const text = type === 'institution' ? s.name : s.title;
        return text?.toLowerCase().includes((newValue || '').toLowerCase());
      });
      setFilteredSuggestions(filtered);
      setShowDropdown(true);
    } else {
      setFilteredSuggestions(suggestions);
      setShowDropdown(true);
    }
  }

  function handleSelectSuggestion(suggestion: Suggestion) {
    const selectedValue = type === 'institution' ? suggestion.name : suggestion.title;
    setInputValue(selectedValue || '');
    onChange(selectedValue || '');
    setShowDropdown(false);
    incrementUsageCount(suggestion.id);
  }

  async function incrementUsageCount(id: string) {
    try {
      const tableName = type === 'institution' ? 'institutions' : 'positions';
      const suggestion = suggestions.find(s => s.id === id);
      if (!suggestion) return;

      await supabase
        .from(tableName)
        .update({ usage_count: suggestion.usage_count + 1 })
        .eq('id', id);
    } catch (error) {
      console.error('Error incrementing usage count:', error);
    }
  }

  async function handleAddNew() {
    if (!inputValue.trim() || isAdding) return;

    const existing = suggestions.find(s => {
      const text = type === 'institution' ? s.name : s.title;
      return text?.toLowerCase() === inputValue.toLowerCase();
    });

    if (existing) {
      handleSelectSuggestion(existing);
      return;
    }

    setIsAdding(true);
    try {
      const tableName = type === 'institution' ? 'institutions' : 'positions';
      const fieldName = type === 'institution' ? 'name' : 'title';

      const { data, error } = await supabase
        .from(tableName)
        .insert([{ [fieldName]: (inputValue || '').trim(), usage_count: 1 }])
        .select()
        .single();

      if (error) throw error;

      setSuggestions([data, ...suggestions]);
      setShowDropdown(false);
    } catch (error) {
      console.error('Error adding new suggestion:', error);
    } finally {
      setIsAdding(false);
    }
  }

  function handleFocus() {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(s => {
        const text = type === 'institution' ? s.name : s.title;
        return text?.toLowerCase().includes(inputValue.toLowerCase());
      });
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions);
    }
    setShowDropdown(true);
  }

  const displaySuggestions = showDropdown && inputValue.trim() ? filteredSuggestions : suggestions;
  const showAddButton = inputValue.trim() && !suggestions.find(s => {
    const text = type === 'institution' ? s.name : s.title;
    return text?.toLowerCase() === inputValue.toLowerCase();
  });

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {showDropdown && !disabled && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {showAddButton && (
            <button
              type="button"
              onClick={handleAddNew}
              disabled={isAdding}
              className="w-full px-4 py-2 text-left hover:bg-teal-50 flex items-center gap-2 text-teal-600 font-medium border-b border-gray-200"
            >
              <Plus className="h-4 w-4" />
              {isAdding ? 'Adding...' : `Add "${inputValue}"`}
            </button>
          )}

          {displaySuggestions.length > 0 ? (
            displaySuggestions.map((suggestion) => {
              const text = type === 'institution' ? suggestion.name : suggestion.title;
              return (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{text}</span>
                  {suggestion.usage_count > 0 && (
                    <span className="text-xs text-gray-400">
                      {suggestion.usage_count} uses
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              No suggestions found. Type to add new.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
