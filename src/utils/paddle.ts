// Paddle.js integration utility
declare global {
  interface Window {
    Paddle: any;
  }
}

export interface PaddleCheckoutOptions {
  items: Array<{
    priceId: string;
    quantity?: number;
  }>;
  customData?: {
    userId?: string;
    planType?: string;
  };
  customer?: {
    email?: string;
  };
  successUrl?: string;
  settings?: {
    displayMode?: 'inline' | 'overlay';
    theme?: 'light' | 'dark';
    locale?: string;
  };
}

export class PaddleService {
  private static instance: PaddleService;
  private isInitialized = false;
  private readonly sellerId = '233505';
  private readonly environment = 'production'; // Use 'sandbox' for testing

  private constructor() {}

  static getInstance(): PaddleService {
    if (!PaddleService.instance) {
      PaddleService.instance = new PaddleService();
    }
    return PaddleService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Paddle.js script
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.async = true;
      
      script.onload = () => {
        try {
          window.Paddle.Environment.set(this.environment);
          window.Paddle.Setup({ 
            seller: parseInt(this.sellerId),
            eventCallback: this.handlePaddleEvent.bind(this)
          });
          this.isInitialized = true;
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error('Failed to load Paddle.js'));
      };

      document.head.appendChild(script);
    });
  }

  private handlePaddleEvent(data: any) {
    console.log('Paddle Event:', data);
    
    switch (data.name) {
      case 'checkout.completed':
        this.handleCheckoutCompleted(data);
        break;
      case 'checkout.closed':
        this.handleCheckoutClosed(data);
        break;
      case 'checkout.error':
        this.handleCheckoutError(data);
        break;
    }
  }

  private handleCheckoutCompleted(data: any) {
    console.log('Payment completed:', data);
    // Redirect to success page or show success message
    window.location.href = '/dashboard?payment=success';
  }

  private handleCheckoutClosed(data: any) {
    console.log('Checkout closed:', data);
  }

  private handleCheckoutError(data: any) {
    console.error('Checkout error:', data);
    alert('Payment failed. Please try again.');
  }

  async openCheckout(options: PaddleCheckoutOptions): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const checkoutOptions = {
      items: options.items,
      customer: options.customer,
      customData: options.customData,
      successUrl: options.successUrl || `${window.location.origin}/dashboard?payment=success`,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en',
        ...options.settings
      }
    };

    window.Paddle.Checkout.open(checkoutOptions);
  }

  // Create a custom amount checkout (for donations)
  async createCustomCheckout(amount: number, description: string = 'Donation'): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // For custom amounts, we'll use Paddle's custom checkout
    const checkoutOptions = {
      method: 'inline',
      product: 'custom',
      title: description,
      message: `Support Devmint with a $${amount} donation`,
      currency: 'USD',
      amount: amount,
      successCallback: (data: any) => {
        console.log('Custom payment completed:', data);
        window.location.href = '/dashboard?payment=success&type=donation';
      },
      closeCallback: () => {
        console.log('Custom checkout closed');
      }
    };

    window.Paddle.Checkout.open(checkoutOptions);
  }
}

export const paddle = PaddleService.getInstance();