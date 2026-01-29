import React from 'react';
import { Button } from '@/components/ui/button';
import { useCropStore } from '@/stores/cropStore';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useCropStore();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fil' : 'en');
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2"
    >
      <Globe className="h-4 w-4" />
      {language === 'en' ? 'Filipino' : 'English'}
    </Button>
  );
};