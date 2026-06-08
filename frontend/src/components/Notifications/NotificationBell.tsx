import React, { useState } from 'react';
const NotificationBell: React.FC = () => {
  const [count] = useState(3);
  return (
    <button className="relative p-2 text-gray-400 hover:text-white">
      🔔
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {count}
        </span>
      )}
    </button>
  );
};
export default NotificationBell;
