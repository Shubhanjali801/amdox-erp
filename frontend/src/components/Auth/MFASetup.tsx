import React, { useState } from 'react';

const MFASetup: React.FC = () => {
  const [code, setCode] = useState('');
  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-sm">Enter the 6-digit code from your authenticator app.</p>
      <input value={code} onChange={e => setCode(e.target.value)} maxLength={6}
        placeholder="000000" className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700 text-center text-xl tracking-widest" />
      <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold">Verify</button>
    </div>
  );
};

export default MFASetup;
