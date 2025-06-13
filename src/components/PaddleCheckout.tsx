import React, { useState, useEffect } from 'react';
import { paddle } from '../utils/paddle';
import { CreditCard, Loader, DollarSign } from 'lucide-react';

interface PaddleCheckoutProps {
  planType: 'pro' | 'enterprise' | 'donation';
  billingCycle?: 'monthly' | 'yearly';
  userEmail?: string;
  customAmount?: number;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const PaddleCheckout: React.FC<PaddleCheckoutProps> = ({
  planType,
  billingCycle = 'monthly',
  userEmail,
  customAmount,
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Real Paddle Price IDs from your dashboard
  const priceIds = {
    pro: {
      monthly: 'pri_01jxkfd08h8gwv7mqxw1ah948b', // Professional $29/month
      yearly: 'pri_01jxkfsmdcw6tfx7s0wjkdbazr'   // Professional $288/year
    },
    enterprise: {
      monthly: 'pri_01jxkfk7whgk1q9pjfxdt4kbg6', // Enterprise $99/month
      yearly: 'pri_01jxkfxs04a3gxkrwj32kpzk30'   // Enterprise $984/year
    }
  };

  useEffect(() => {
    initializePaddle();
  }, []);

  const initializePaddle = async () => {
    try {
      await paddle.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Paddle:', error);
      onError?.('Failed to initialize payment system');
    }
  };

  const handleCheckout = async () => {
    if (!isInitialized) {
      onError?.('Payment system not ready');
      return;
    }

    setIsLoading(true);

    try {
      if (planType === 'donation' && customAmount) {
        await paddle.createCustomCheckout(customAmount, 'Donation to Devmint');
      } else {
        const priceId = priceIds[planType][billingCycle];
        if (!priceId) {
          throw new Error('Invalid plan type or billing cycle');
        }

        await paddle.openCheckout({
          items: [{ priceId, quantity: 1 }],
          customer: userEmail ? { email: userEmail } : undefined,
          customData: {
            planType,
            billingCycle,
            userId: userEmail
          },
          successUrl: `${window.location.origin}/dashboard?payment=success&plan=${planType}&billing=${billingCycle}`
        });
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Checkout error:', error);
      onError?.('Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanDetails = () => {
    switch (planType) {
      case 'pro':
        return {
          name: 'Professional Plan',
          price: billingCycle === 'monthly' ? '$29/month' : '$288/year',
          originalPrice: billingCycle === 'yearly' ? '$348/year' : undefined,
          savings: billingCycle === 'yearly' ? '$60/year' : undefined,
          description: '50,000 API calls, premium templates, priority support'
        };
      case 'enterprise':
        return {
          name: 'Enterprise Plan',
          price: billingCycle === 'monthly' ? '$99/month' : '$984/year',
          originalPrice: billingCycle === 'yearly' ? '$1,188/year' : undefined,
          savings: billingCycle === 'yearly' ? '$204/year' : undefined,
          description: 'Unlimited API calls, custom templates, 24/7 support'
        };
      case 'donation':
        return {
          name: 'Donation',
          price: customAmount ? `$${customAmount}` : 'Custom amount',
          description: 'Support Devmint development'
        };
      default:
        return { name: '', price: '', description: '' };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {planType === 'donation' ? (
            <DollarSign className="w-8 h-8 text-white" />
          ) : (
            <CreditCard className="w-8 h-8 text-white" />
          )}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{planDetails.name}</h3>
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {planDetails.price}
          {planDetails.originalPrice && (
            <div className="text-lg text-gray-500 line-through">{planDetails.originalPrice}</div>
          )}
        </div>
        {planDetails.savings && (
          <div className="text-green-600 font-semibold mb-2">Save {planDetails.savings}</div>
        )}
        <p className="text-gray-600">{planDetails.description}</p>
        
        {billingCycle === 'yearly' && planType !== 'donation' && (
          <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            🎉 Best Value - Save {planDetails.savings}
          </div>
        )}
      </div>

      <button
        onClick={handleCheckout}
        disabled={isLoading || !isInitialized}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : !isInitialized ? (
          'Loading...'
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            {planType === 'donation' ? 'Donate Now' : `Subscribe ${billingCycle === 'yearly' ? 'Yearly' : 'Monthly'}`}
          </>
        )}
      </button>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Secure payment processing by{' '}
          <a href="https://paddle.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            Paddle.com
          </a>
        </p>
        {planType !== 'donation' && (
          <p className="text-xs text-gray-500 mt-1">
            Cancel anytime • 30-day money-back guarantee
          </p>
        )}
      </div>
    </div>
  );
};

export default PaddleCheckout;