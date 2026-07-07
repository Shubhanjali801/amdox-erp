import { useNavigate } from 'react-router-dom'
import { firstAccessiblePath, getRoles } from '../utils/permissions'

export default function NoAccess() {
  const navigate = useNavigate()
  const roles = getRoles()
  const home = firstAccessiblePath()

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access restricted</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        Your role{roles.length ? ` (${roles.join(', ')})` : ''} doesn’t have permission to view this
        section. If you need access, ask your administrator to update your role.
      </p>
      {home !== '/no-access' && (
        <button
          onClick={() => navigate(home)}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg"
        >
          Go to my dashboard
        </button>
      )}
    </div>
  )
}
