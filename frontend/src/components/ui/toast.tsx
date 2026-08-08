import * as ToastPrimitive from '@radix-ui/react-toast';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '@/features/toast/toastSlice';
import type { RootState } from '@/store/store';

export function Toast() {
  const dispatch = useDispatch();
  const { open, message } = useSelector((state: RootState) => state.toast);
  const [openState, setOpenState] = useState(open);

  useEffect(() => {
    setOpenState(open);
  }, [open]);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        open={openState}
        onOpenChange={(nextOpen) => {
          setOpenState(nextOpen);
          if (!nextOpen) dispatch(hideToast());
        }}
        className="fixed bottom-6 right-6 z-[1000] flex w-[min(360px,calc(100vw-2rem))] text-white items-center justify-between gap-3 rounded-xl border border-slate-700 bg-[#1e293b] py-2 px-4 shadow-xl shadow-slate-950/40 text-white"
      >
        <div className="flex-1 text-sm leading-5">{message}</div>
        <ToastPrimitive.Close asChild>
          <button className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-800 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </ToastPrimitive.Close>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[1000] flex max-w-[100vw] flex-col p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}
