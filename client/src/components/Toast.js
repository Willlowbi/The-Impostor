import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Icons } from './Icons';

const ToastContext = createContext({ showToast: () => {} });

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, { type = 'info', duration = 3500 } = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
  }, [remove]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map((t) => {
          const baseClasses = 'px-4 py-2 rounded shadow-lg text-sm font-medium flex items-center';
          const cls =
            t.type === 'success'
              ? `${baseClasses} bg-green-500 text-black`
              : t.type === 'warning'
              ? `${baseClasses} bg-yellow-500 text-black`
              : t.type === 'danger'
              ? `${baseClasses} bg-red-500 text-white`
              : `${baseClasses} bg-gray-800 text-white`;

          const icon =
            t.type === 'success' ? (
              <Icons.Trophy className="w-4 h-4 mr-2" />
            ) : t.type === 'warning' ? (
              <Icons.Users className="w-4 h-4 mr-2" />
            ) : t.type === 'danger' ? (
              <Icons.Mask className="w-4 h-4 mr-2" />
            ) : (
              <Icons.Soccer className="w-4 h-4 mr-2" />
            );

          return (
            <div key={t.id} className={cls}>
              {icon}
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);


