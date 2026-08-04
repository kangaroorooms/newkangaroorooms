import { Capacitor } from '@capacitor/core';

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number | string;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
};

export const isCapacitorNativeApp = (): boolean => {
  const platform = Capacitor.getPlatform();
  return platform === 'android' || platform === 'ios';
};

export const openRazorpayCheckout = async (
  options: RazorpayCheckoutOptions,
  webHandler: (response: any) => Promise<void>,
  onCancel: () => void,
): Promise<any | null> => {
  if (isCapacitorNativeApp()) {
    const { Checkout } = await import('capacitor-razorpay');
    const nativeOptions = {
      ...options,
      amount: String(options.amount),
    };
    const data = await Checkout.open(nativeOptions as any);
    const response = data?.response;
    if (!response) {
      throw new Error('Razorpay native checkout returned no response');
    }
    return typeof response === 'string' ? JSON.parse(response) : response;
  }

  const razorpay = new window.Razorpay({
    ...options,
    handler: webHandler,
    modal: {
      ondismiss: onCancel,
    },
  });

  razorpay.open();

  return null;
};
