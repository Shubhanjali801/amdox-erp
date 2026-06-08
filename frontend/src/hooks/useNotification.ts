import toast from 'react-hot-toast';
export const useNotification = () => ({
  success: (msg: string) => toast.success(msg),
  error:   (msg: string) => toast.error(msg),
  info:    (msg: string) => toast(msg, { icon: 'ℹ️' }),
  warning: (msg: string) => toast(msg, { icon: '⚠️' }),
});
