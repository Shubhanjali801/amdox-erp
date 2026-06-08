import React from 'react';

const RegisterForm: React.FC = () => (
  <form className="space-y-4">
    <input type="text"     placeholder="First Name" className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
    <input type="text"     placeholder="Last Name"  className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
    <input type="email"    placeholder="Email"      className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
    <input type="password" placeholder="Password"   className="w-full px-4 py-2 rounded bg-gray-800 text-white border border-gray-700" />
    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold">Register</button>
  </form>
);

export default RegisterForm;
