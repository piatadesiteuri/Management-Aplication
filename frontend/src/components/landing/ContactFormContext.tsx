import { createContext, useContext, useState } from 'react';

interface ContactFormContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ContactFormContext = createContext<ContactFormContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export function ContactFormProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <ContactFormContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </ContactFormContext.Provider>
  );
}

export function useContactForm() {
  return useContext(ContactFormContext);
}
